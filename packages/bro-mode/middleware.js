// Connect/Express middleware: buffers HTML responses and bros them on the way
// out. Works with plain node:http too, as (req, res, next).
'use strict';

const { DEFAULT_LEVEL, LEVELS } = require('./bro.js');
const { broifyHTML } = require('./html.js');

function isBroable(req, res) {
  if (req.method === 'HEAD') return false;
  if (res.statusCode === 204 || res.statusCode === 304) return false;
  const type = String(res.getHeader('content-type') || '');
  if (!/^text\/html\b/i.test(type)) return false;
  const charset = /charset=["']?([\w-]+)/i.exec(type);
  if (charset && !/^utf-?8$/i.test(charset[1])) return false;
  // Already compressed: put bro() before compression() to bro these.
  const encoding = res.getHeader('content-encoding');
  return !encoding || encoding === 'identity';
}

function middleware({ level = DEFAULT_LEVEL } = {}) {
  if (!LEVELS.includes(level)) throw new Error(`Unknown bro level: ${level}`);

  return function bro(req, res, next) {
    const { writeHead, write, end } = res;
    const chunks = [];
    let broable = null; // decided on the first write, once headers are known

    // Node's own end() calls writeHead() to send the headers, so the real
    // methods go back in place before anything is actually written.
    function restore() {
      Object.assign(res, { writeHead, write, end });
    }

    function decide() {
      if (broable === null) broable = isBroable(req, res);
      if (!broable) restore();
      return broable;
    }

    // Hold explicit writeHead() calls back so Content-Length can be fixed.
    res.writeHead = function (status, reason, headers) {
      if (typeof reason !== 'string') [reason, headers] = [undefined, reason];
      res.statusCode = status;
      if (reason) res.statusMessage = reason;
      if (Array.isArray(headers)) {
        const pairs = Array.isArray(headers[0]) ? headers : [];
        for (let i = 0; !pairs.length && i < headers.length; i += 2) pairs.push([headers[i], headers[i + 1]]);
        for (const [name, value] of pairs) res.setHeader(name, value);
      } else if (headers) {
        for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
      }
      return res;
    };

    res.write = function (chunk, encoding, cb) {
      if (!decide()) return res.write.apply(res, arguments);
      if (typeof encoding === 'function') [encoding, cb] = [undefined, encoding];
      if (chunk != null) chunks.push(Buffer.from(chunk, encoding));
      if (cb) process.nextTick(cb);
      return true;
    };

    res.end = function (chunk, encoding, cb) {
      if (typeof chunk === 'function') [chunk, cb] = [undefined, chunk];
      if (typeof encoding === 'function') [encoding, cb] = [undefined, encoding];
      if (!decide()) return res.end(chunk, encoding, cb);
      if (chunk != null) chunks.push(Buffer.from(chunk, encoding));
      const body = Buffer.from(broifyHTML(Buffer.concat(chunks).toString('utf8'), { level }));
      res.setHeader('Content-Length', body.length);
      restore();
      return res.end(body, cb);
    };

    next();
  };
}

module.exports = { middleware };
