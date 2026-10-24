// Bro for HTML strings, on the server. Parses with parse5 to find the text,
// then inserts ", bro" into the original HTML at the right offsets, so the
// rest of the markup comes out byte for byte as it went in.
'use strict';

const { parse } = require('parse5');
const { decodeHTML } = require('entities');
const {
  DEFAULT_LEVEL, LEVELS, SKIP_TAGS, UI_TAGS, UI_ROLES, INLINE_TAGS, findBroSpots,
} = require('./bro.js');

const INLINE = new Set(INLINE_TAGS);
// An entity, a CRLF, or any single character: the units parse5 decodes.
const RAW_UNIT = /&(?:#\d+;?|#[xX][\da-fA-F]+;?|[A-Za-z][A-Za-z\d]*;?)|\r\n|[\s\S]/g;

function attr(el, name) {
  const found = el.attrs.find((a) => a.name === name);
  return found ? found.value : null;
}

function isSkipped(el, level) {
  if (SKIP_TAGS.includes(el.nodeName)) return true;
  const editable = attr(el, 'contenteditable');
  if (editable !== null && editable !== 'false') return true;
  if (level === 'hyper') return false;
  return UI_TAGS.includes(el.nodeName) || UI_ROLES.includes(attr(el, 'role'));
}

// Group text nodes by their nearest non-inline ancestor, like the extension.
function collectGroups(node, block, level, groups) {
  for (const child of node.childNodes || []) {
    if (child.nodeName === '#text') {
      if (!groups.has(block)) groups.set(block, []);
      groups.get(block).push(child);
    } else if (child.tagName && !isSkipped(child, level)) {
      collectGroups(child, INLINE.has(child.tagName) ? block : child, level, groups);
    }
  }
  return groups;
}

// Turn an offset in a text node's decoded value into an offset in the raw
// HTML ("&amp;" is one character decoded, five raw). -1 if it lands inside
// an entity.
function rawOffset(raw, decodedIndex) {
  let decoded = 0;
  for (const m of raw.matchAll(RAW_UNIT)) {
    if (decoded === decodedIndex) return m.index;
    if (decoded > decodedIndex) return -1;
    decoded += m[0].length === 1 || m[0] === '\r\n' ? 1 : decodeHTML(m[0]).length;
  }
  return decoded === decodedIndex ? raw.length : -1;
}

function broifyHTML(html, { level = DEFAULT_LEVEL } = {}) {
  if (!LEVELS.includes(level)) throw new Error(`Unknown bro level: ${level}`);
  const doc = parse(html, { sourceCodeLocationInfo: true });
  const inserts = [];

  for (const nodes of collectGroups(doc, doc, level, new Map()).values()) {
    let text = '';
    const starts = nodes.map((n) => {
      const start = text.length;
      text += n.value;
      return start;
    });
    for (const { index, shout } of findBroSpots(text, level)) {
      let k = nodes.length - 1;
      while (starts[k] > index || starts[k] === starts[k + 1]) k--;
      const loc = nodes[k].sourceCodeLocation;
      if (!loc) continue;
      const offset = rawOffset(html.slice(loc.startOffset, loc.endOffset), index - starts[k]);
      if (offset === -1) continue;
      inserts.push({ at: loc.startOffset + offset, bro: shout ? ', BRO' : ', bro' });
    }
  }

  // Stitch together in one pass; splicing one at a time is quadratic.
  inserts.sort((a, b) => a.at - b.at);
  const parts = [];
  let last = 0;
  for (const { at, bro } of inserts) {
    parts.push(html.slice(last, at), bro);
    last = at;
  }
  parts.push(html.slice(last));
  return parts.join('');
}

module.exports = { broifyHTML };
