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

  const api = {
    LEVELS, DEFAULT_LEVEL, SKIP_TAGS, UI_TAGS, UI_ROLES, INLINE_TAGS,
    findBroSpots, broify,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Bro = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
