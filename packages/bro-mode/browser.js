/*! bro-mode 1.0.0 | browser.js, built by scripts/build.js from bro.js, dom.js and snippet.js. Edit those, not this. */
// Sentence logic, kept free of the DOM so it can be tested in Node.
// Given a run of text, findBroSpots returns the offsets where ", bro" should
// be inserted. How much gets bro'd depends on the level:
//   normal - full sentences ending in a full stop
//   ultra  - full sentences ending in ".", "?" or "!"
//   hyper  - everything: short sentences, "...", and text with no
//            punctuation at all ("Sign in" -> "Sign in, bro")
(function (root) {
  'use strict';

  const LEVELS = ['normal', 'ultra', 'hyper'];
  const DEFAULT_LEVEL = 'ultra';

  // Page structure, shared by the browser extension and the server.
  // Never touch code, form controls or anything the user can edit.
  const SKIP_TAGS = [
    'script', 'style', 'noscript', 'template', 'head', 'title',
    'textarea', 'input', 'select', 'option',
    'code', 'pre', 'kbd', 'samp', 'var', 'svg', 'math', 'canvas',
  ];
  // Buttons and menus are only fair game in hyper bro.
  const UI_TAGS = ['button', 'nav', 'menu'];
  const UI_ROLES = ['button', 'navigation', 'menu'];
  // Tags that sit inside a sentence, so "Hello <b>there</b>." is one sentence.
  const INLINE_TAGS = [
    'a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'data', 'del', 'dfn', 'em', 'font',
    'i', 'ins', 'label', 'mark', 'q', 's', 'small', 'span', 'strong', 'sub',
    'sup', 'time', 'u',
  ];

  const MIN_WORDS = 3;

  // Words that end with a period without ending the sentence ("Dr. Smith").
  const ABBREVIATIONS = new Set([
    'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'mt', 'vs', 'etc',
    'inc', 'ltd', 'co', 'corp', 'fig', 'approx', 'dept', 'vol',
  ]);

  // A run of terminators followed by optional closing quotes/brackets and
  // then whitespace or the end of the text.
  const END = /[.!?]+(?=["'”’)\]]*(?:\s|$))/g;
  // After a terminator: lowercase or a digit means the sentence goes on
  // ("e.g. this", "Jan. 5").
  const CONTINUES = /["'”’)\]]*\s+[\p{Ll}\p{N}]/uy;
  const OPENERS = /^[("'“‘[]+/;
  const CLOSERS = /["'”’)\]]+$/;
  // Unpunctuated text that ends in a word, maybe inside quotes or brackets.
  const ENDS_IN_WORD = /[\p{L}\p{N}]["'”’)\]]*$/u;

  function lastWordOf(sentence) {
    const words = sentence.trim().split(/\s+/);
    return words[words.length - 1].replace(OPENERS, '').replace(CLOSERS, '');
  }

  function isAbbreviation(word) {
    if (word.includes('.')) return true; // e.g, U.S, example.com, v1.2
    if (/^\p{L}$/u.test(word)) return true; // initials: "J. R. R. Tolkien"
    return ABBREVIATIONS.has(word.toLowerCase());
  }

  function isFullSentence(sentence) {
    const words = sentence.split(/\s+/).filter((w) => /\p{L}/u.test(w));
    if (words.length < MIN_WORDS) return false;
    // Fragments like "and more." start lowercase; real sentences don't.
    const first = sentence.match(/[\p{L}\p{N}]/u);
    return !first || !/\p{Ll}/u.test(first[0]);
  }

  function takesTerminator(terminator, level) {
    if (level === 'hyper') return true;
    if (level === 'ultra' && /^[!?]+$/.test(terminator)) return true;
    return terminator === '.';
  }

  // ALL-CAPS SENTENCES GET AN ALL-CAPS BRO.
  function isShouting(sentence) {
    return /\p{Lu}/u.test(sentence) && !/\p{Ll}/u.test(sentence);
  }

  function findBroSpots(text, level = DEFAULT_LEVEL) {
    const spots = [];
    let start = 0;
    for (const m of text.matchAll(END)) {
      const sentence = text.slice(start, m.index);
      const lastWord = lastWordOf(sentence);
      const after = m.index + m[0].length;
      CONTINUES.lastIndex = after;
      if (CONTINUES.test(text)) continue;
      if (m[0] === '.' && isAbbreviation(lastWord)) continue;

      if (
        takesTerminator(m[0], level) &&
        /[\p{L}\p{N}]/u.test(lastWord) &&
        lastWord.toLowerCase() !== 'bro' && // the double-bro rule
        (level === 'hyper' ? /\p{L}/u.test(sentence) : isFullSentence(sentence))
      ) {
        spots.push({ index: m.index, shout: isShouting(sentence) });
      }
      start = after;
    }

    // Hyper bro also gets the text with no punctuation: buttons, links, headings.
    if (level === 'hyper') {
      const tail = text.slice(start).trimEnd();
      if (
        ENDS_IN_WORD.test(tail) &&
        /\p{L}/u.test(tail) &&
        lastWordOf(tail).toLowerCase() !== 'bro'
      ) {
        spots.push({ index: start + tail.length, shout: isShouting(tail) });
      }
    }
    return spots;
  }

  function broify(text, level = DEFAULT_LEVEL) {
    const spots = findBroSpots(text, level);
    for (let i = spots.length - 1; i >= 0; i--) {
      const { index, shout } = spots[i];
      text = text.slice(0, index) + (shout ? ', BRO' : ', bro') + text.slice(index);
    }
    return text;
  }

  // The undo. Bros are plain text, so this can't tell one bro-mode added from
  // one a person typed: every ", bro" that ends a sentence or a bit of text goes.
  const UNBRO = /, (?:bro|BRO)(?=[.!?]|\s*$)/g;

  function unbroify(text) {
    return text.replace(UNBRO, '');
  }

  const api = {
    LEVELS, DEFAULT_LEVEL, SKIP_TAGS, UI_TAGS, UI_ROLES, INLINE_TAGS,
    findBroSpots, broify, unbroify,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Bro = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

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

// The drop-in for sites with no build step:
//   <script src=".../browser.js" data-toggle data-level="ultra"></script>
// Bros the page, and with data-toggle adds an on/off switch in the top right.
// Also exposes window.BroMode: on(), off(), toggle(), setLevel(level).
(function () {
  'use strict';

  const { LEVELS, DEFAULT_LEVEL, createPage } = globalThis.Bro;

  // Only readable now, while the script tag is running.
  const data = (document.currentScript && document.currentScript.dataset) || {};
  const wantsToggle = data.toggle !== undefined && data.toggle !== 'false';
  const page = createPage(LEVELS.includes(data.level) ? data.level : DEFAULT_LEVEL);

  // The visitor's last choice, if their browser lets us keep it.
  const KEY = 'bro-mode';
  function remembered() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function remember(on) {
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* private mode */ }
  }

  let button = null;

  function set(on) {
    if (on) page.start();
    else page.stop();
    if (button) button.setAttribute('aria-checked', String(page.running));
  }

  const TOGGLE_CSS = `
    :host { all: initial; }
    button {
      --bg: #ffffff; --fg: #1a1a1a; --border: #d0d0d0; --track: #c4c4c4; --on: #1f7a4d;
      display: flex; align-items: center; gap: 8px; margin: 0;
      padding: 6px 12px 6px 8px; border: 1px solid var(--border); border-radius: 999px;
      background: var(--bg); color: var(--fg); cursor: pointer;
      font: 600 13px/1 system-ui, -apple-system, sans-serif;
      box-shadow: 0 1px 4px rgb(0 0 0 / 0.15);
    }
    @media (prefers-color-scheme: dark) {
      button { --bg: #222222; --fg: #f0f0f0; --border: #444444; --track: #555555; --on: #3fbf7f; }
    }
    button:focus-visible { outline: 2px solid var(--on); outline-offset: 2px; }
    .track {
      position: relative; width: 30px; height: 18px; border-radius: 999px;
      background: var(--track); transition: background 0.15s;
    }
    .thumb {
      position: absolute; top: 2px; left: 2px; width: 14px; height: 14px;
      border-radius: 50%; background: #ffffff; transition: transform 0.15s;
    }
    [aria-checked="true"] .track { background: var(--on); }
    [aria-checked="true"] .thumb { transform: translateX(12px); }
    @media (prefers-reduced-motion: reduce) { .track, .thumb { transition: none; } }
  `;

  function addToggle() {
    const host = document.createElement('bro-mode-toggle');
    // Inline !important so the page's own CSS can't move it.
    host.style.cssText =
      'position:fixed!important;top:12px!important;right:12px!important;' +
      'z-index:2147483647!important;display:block!important;';
    // A shadow root keeps the page's CSS out, and keeps the bros off the label.
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML =
      `<style>${TOGGLE_CSS}</style>` +
      '<button type="button" role="switch" aria-label="Bro mode" title="Bro mode">' +
      '<span class="track"><span class="thumb"></span></span>bro</button>';
    button = shadow.querySelector('button');
    button.setAttribute('aria-checked', String(page.running));
    button.addEventListener('click', () => {
      set(!page.running);
      remember(page.running);
    });
    document.body.append(host);
  }

  function init() {
    // The Unbro extension is running here: no bros, so no switch either.
    if (document.documentElement.hasAttribute('data-unbro')) return;
    set(remembered() !== 'off');
    if (wantsToggle) addToggle();
  }

  globalThis.BroMode = {
    on() { set(true); remember(true); },
    off() { set(false); remember(false); },
    toggle() { this[page.running ? 'off' : 'on'](); },
    setLevel(level) { page.setLevel(level); },
    get level() { return page.level; },
    get isOn() { return page.running; },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
