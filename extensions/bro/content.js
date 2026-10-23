// Walks the page's text, groups it by block element (so a sentence split
// across <b>, <a>, etc. is still seen whole) and inserts ", bro" in place.
(function () {
  'use strict';

  const {
    LEVELS, DEFAULT_LEVEL, SKIP_TAGS, UI_TAGS, UI_ROLES, INLINE_TAGS, findBroSpots,
  } = globalThis.Bro;

  const ALWAYS_SKIP = SKIP_TAGS.concat('[contenteditable]:not([contenteditable="false"])');
  const UI_SKIP = UI_TAGS.concat(UI_ROLES.map((role) => `[role="${role}"]`));
  const INLINE = new Set(INLINE_TAGS);

  let level = DEFAULT_LEVEL;
  let skipSelector = '';

  function setLevel(value) {
    level = LEVELS.includes(value) ? value : DEFAULT_LEVEL;
    skipSelector = (level === 'hyper' ? ALWAYS_SKIP : ALWAYS_SKIP.concat(UI_SKIP)).join(',');
  }

  function blockOf(node) {
    let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    while (el && INLINE.has(el.localName) && el.parentElement) el = el.parentElement;
    return el;
  }

  function isSkipped(el) {
    return !el || el.closest(skipSelector) !== null || el.isContentEditable;
  }

  function collectGroups(root) {
    const groups = new Map();
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
          return node.matches(skipSelector) || node.isContentEditable
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_SKIP;
        },
      }
    );
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const block = blockOf(node);
      if (!groups.has(block)) groups.set(block, []);
      groups.get(block).push(node);
    }
    return groups.values();
  }

  function broifyGroup(nodes) {
    let text = '';
    const starts = nodes.map((n) => {
      const start = text.length;
      text += n.data;
      return start;
    });
    const spots = findBroSpots(text, level);
    // Back to front, so earlier offsets stay valid.
    for (let i = spots.length - 1; i >= 0; i--) {
      const { index, shout } = spots[i];
      let k = nodes.length - 1;
      while (starts[k] > index || starts[k] === starts[k + 1]) k--;
      nodes[k].insertData(index - starts[k], shout ? ', BRO' : ', bro');
    }
  }

  function broifyTree(root) {
    const block = blockOf(root);
    if (isSkipped(block)) return;
    for (const nodes of collectGroups(block)) broifyGroup(nodes);
  }

  // Pages keep changing (feeds, SPAs), so watch for new text too.
  // Already-broified sentences end in "bro", so re-scanning is harmless.
  const pending = new Set();
  let timer = null;

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'characterData') pending.add(m.target);
      else m.addedNodes.forEach((n) => pending.add(n));
    }
    if (!timer) timer = setTimeout(flush, 250);
  });

  function observe() {
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function flush() {
    timer = null;
    observer.disconnect();
    const blocks = new Set();
    for (const n of pending) if (n.isConnected) blocks.add(blockOf(n));
    pending.clear();
    for (const b of blocks) if (b) broifyTree(b);
    observe();
  }

  function start() {
    if (!document.body) return;
    observer.disconnect();
    broifyTree(document.body);
    observe();
  }

  // The level is set from the toolbar popup. Raising it re-scans the page;
  // lowering it applies from the next page load.
  const storage = globalThis.chrome && chrome.storage && chrome.storage.sync;
  if (storage) {
    storage.get({ level: DEFAULT_LEVEL }, (items) => {
      setLevel(items && items.level);
      start();
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync' || !changes.level) return;
      setLevel(changes.level.newValue);
      start();
    });
  } else {
    setLevel(DEFAULT_LEVEL);
    start();
  }
})();
