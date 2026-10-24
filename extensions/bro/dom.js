// Bro for a live page. Walks the DOM, groups text by block element (so a
// sentence split across <b>, <a>, etc. is still seen whole) and inserts
// ", bro" in place, then keeps watching as the page changes. Remembers every
// text node it changed, so stop() puts the page back exactly as it was.
// Shared by the Bro extension and the drop-in browser.js. Needs bro.js first.
(function (root) {
  'use strict';

  const {
    LEVELS, DEFAULT_LEVEL, SKIP_TAGS, UI_TAGS, UI_ROLES, INLINE_TAGS, findBroSpots,
  } = root.Bro;

  const ALWAYS_SKIP = SKIP_TAGS.concat('[contenteditable]:not([contenteditable="false"])');
  const UI_SKIP = UI_TAGS.concat(UI_ROLES.map((role) => `[role="${role}"]`));
  const INLINE = new Set(INLINE_TAGS);

  function blockOf(node) {
    let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    while (el && INLINE.has(el.localName) && el.parentElement) el = el.parentElement;
    return el;
  }

  function createPage(initialLevel = DEFAULT_LEVEL) {
    let level;
    let skipSelector;
    let running = false;
    // Text node -> { original, broed }: what it said before us, and after.
    const changed = new Map();
    const pending = new Set();
    let timer = null;

    function setSkip(value) {
      level = LEVELS.includes(value) ? value : DEFAULT_LEVEL;
      skipSelector = (level === 'hyper' ? ALWAYS_SKIP : ALWAYS_SKIP.concat(UI_SKIP)).join(',');
    }
    setSkip(initialLevel);

    function isSkipped(el) {
      return !el || el.closest(skipSelector) !== null || el.isContentEditable;
    }

    function collectGroups(block) {
      const groups = new Map();
      const walker = document.createTreeWalker(
        block,
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
        const b = blockOf(node);
        if (!groups.has(b)) groups.set(b, []);
        groups.get(b).push(node);
      }
      return groups.values();
    }

    function insertBro(node, offset, bro) {
      let record = changed.get(node);
      // New to us, or the page rewrote it since: start a fresh record.
      if (!record || record.broed !== node.data) {
        record = { original: node.data };
        changed.set(node, record);
      }
      node.insertData(offset, bro);
      record.broed = node.data;
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
        insertBro(nodes[k], index - starts[k], shout ? ', BRO' : ', bro');
      }
    }

    function broifyTree(node) {
      const block = blockOf(node);
      if (isSkipped(block)) return;
      for (const nodes of collectGroups(block)) broifyGroup(nodes);
    }

    // Pages keep changing (feeds, SPAs), so watch for new text too.
    // Already-broified sentences end in "bro", so re-scanning is harmless.
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
      for (const node of changed.keys()) if (!node.isConnected) changed.delete(node);
      observe();
    }

    function start() {
      // The Unbro extension is running here and wins, or the two would undo
      // each other forever.
      if (!document.body || document.documentElement.hasAttribute('data-unbro')) return false;
      observer.disconnect();
      broifyTree(document.body);
      observe();
      running = true;
      return true;
    }

    function stop() {
      observer.disconnect();
      clearTimeout(timer);
      timer = null;
      pending.clear();
      // Only undo text the page hasn't rewritten since. If it has, the page's
      // version wins.
      for (const [node, { original, broed }] of changed) {
        if (node.data === broed) node.data = original;
      }
      changed.clear();
      running = false;
    }

    function setLevel(value) {
      const wasRunning = running;
      if (wasRunning) stop();
      setSkip(value);
      if (wasRunning) start();
    }

    return {
      start,
      stop,
      setLevel,
      get level() { return level; },
      get running() { return running; },
    };
  }

  root.Bro.createPage = createPage;
})(globalThis);
