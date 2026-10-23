// Sentence logic, kept free of the DOM so it can be tested in Node.
// Given a run of text, findBroSpots returns the offsets of the full stops
// that end a full sentence, i.e. where ", bro" should be inserted.
(function (root) {
  'use strict';

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

  function findBroSpots(text) {
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
        m[0] === '.' &&
        /[\p{L}\p{N}]/u.test(lastWord) &&
        lastWord.toLowerCase() !== 'bro' && // the double-bro rule
        isFullSentence(sentence)
      ) {
        // ALL-CAPS SENTENCES GET AN ALL-CAPS BRO.
        const shout = /\p{Lu}/u.test(sentence) && !/\p{Ll}/u.test(sentence);
        spots.push({ index: m.index, shout });
      }
      start = after;
    }
    return spots;
  }

  function broify(text) {
    const spots = findBroSpots(text);
    for (let i = spots.length - 1; i >= 0; i--) {
      const { index, shout } = spots[i];
      text = text.slice(0, index) + (shout ? ', BRO' : ', bro') + text.slice(index);
    }
    return text;
  }

  const api = { findBroSpots, broify };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Bro = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
