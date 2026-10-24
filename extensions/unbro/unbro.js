// Strips ", bro" from the page as it loads, and from anything added later.
// Runs at document_start so the bros are gone before the page paints.
(function () {
  'use strict';

  const { SKIP_TAGS, unbroify } = globalThis.Bro;

  // Never touch code or anything the user can edit, including inline scripts
  // that haven't run yet.
  const SKIP_SELECTOR = SKIP_TAGS.concat('[contenteditable]:not([contenteditable="false"])').join(',');

  // Tells the Bro extension to stand down here, or the two would undo each
  // other forever.
  document.documentElement.setAttribute('data-unbro', '');

  function unbroText(node) {
    const parent = node.parentElement;
    if (!parent || parent.closest(SKIP_SELECTOR) || parent.isContentEditable) return;
    const text = unbroify(node.data);
    if (text !== node.data) node.data = text;
  }

  function unbroTree(root) {
    if (root.nodeType === Node.TEXT_NODE) return unbroText(root);
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) unbroText(node);
  }

  // No debounce: catch text as the parser adds it, before it is painted.
  // Our own edits come back as mutations too, but have no bros left to strip.
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'characterData') unbroText(m.target);
      else m.addedNodes.forEach(unbroTree);
    }
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  unbroTree(document.documentElement);
})();
