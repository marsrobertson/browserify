// Walks the page's text, groups it by block element (so a sentence split
// across <b>, <a>, etc. is still seen whole) and inserts ", bro" in place.
(function () {
  'use strict';

  const { findBroSpots } = globalThis.Bro;

  // Never touch code, form controls, buttons, menus or anything the user can edit.
  const SKIP_SELECTOR = [
    'script', 'style', 'noscript', 'template', 'head', 'title',
    'textarea', 'input', 'select', 'option', 'button', '[role="button"]',
    'nav', 'menu', '[role="navigation"]', '[role="menu"]',
    'code', 'pre', 'kbd', 'samp', 'var', 'svg', 'math', 'canvas',
    '[contenteditable]:not([contenteditable="false"])',
  ].join(',');

  const INLINE = new Set([
    'A', 'ABBR', 'B', 'BDI', 'BDO', 'CITE', 'DATA', 'DEL', 'DFN', 'EM', 'FONT',
    'I', 'INS', 'LABEL', 'MARK', 'Q', 'S', 'SMALL', 'SPAN', 'STRONG', 'SUB',
    'SUP', 'TIME', 'U',
  ]);

  function blockOf(node) {
    let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    while (el && INLINE.has(el.tagName) && el.parentElement) el = el.parentElement;
    return el;
  }

  function isSkipped(el) {
    return !el || el.closest(SKIP_SELECTOR) !== null || el.isContentEditable;
  }

  function collectGroups(root) {
    const groups = new Map();
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
          return node.matches(SKIP_SELECTOR) || node.isContentEditable
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
    if (!text.includes('.')) return;

    const spots = findBroSpots(text);
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

  if (document.body) {
    broifyTree(document.body);
    observe();
  }
})();
