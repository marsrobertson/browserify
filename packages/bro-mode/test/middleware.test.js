const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const bro = require('../index.js');

// Serve one handler behind the middleware and fetch it.
// Plain http.get, so nothing gets decompressed or decoded on the way.
async function serve(handler, options) {
  const mw = bro(options);
  const server = http.createServer((req, res) => mw(req, res, () => handler(req, res)));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    return await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${server.address().port}/`, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ res, body: Buffer.concat(chunks).toString() }));
      }).on('error', reject);
    });
  } finally {
    server.close();
  }
}

const B = ', bro';

test('bros HTML and fixes Content-Length', async () => {
  const html = '<p>This is a sentence.</p>';
  const { res, body } = await serve((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Length', Buffer.byteLength(html));
    res.end(html);
  });
  assert.equal(body, `<p>This is a sentence${B}.</p>`);
  assert.equal(Number(res.headers['content-length']), Buffer.byteLength(body));
});

test('handles writeHead and several writes', async () => {
  const { res, body } = await serve((req, res) => {
    res.writeHead(201, { 'Content-Type': 'text/html', 'Content-Length': 999 });
    res.write('<p>Split across ');
    res.write(Buffer.from('two writes.</p>'));
    res.end();
  });
  assert.equal(res.statusCode, 201);
  assert.equal(body, `<p>Split across two writes${B}.</p>`);
});

test('passes options through', async () => {
  const { body } = await serve((req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end('<button>Sign in</button>');
  }, { level: 'hyper' });
  assert.equal(body, '<button>Sign in, bro</button>');
});

test('passes plain text through untouched', async () => {
  const { res, body } = await serve((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('This is a sentence. ');
    res.end('So is this one.');
  });
  assert.equal(res.statusCode, 200);
  assert.equal(body, 'This is a sentence. So is this one.');
});

test('leaves JSON, compressed HTML and other charsets alone', async () => {
  const cases = [
    { 'Content-Type': 'application/json' },
    { 'Content-Type': 'text/html', 'Content-Encoding': 'br' },
    { 'Content-Type': 'text/html; charset=iso-8859-1' },
  ];
  for (const headers of cases) {
    const text = '<p>This is a sentence.</p>';
    const { body } = await serve((req, res) => {
      res.writeHead(200, headers);
      res.end(text);
    });
    assert.equal(body, text, JSON.stringify(headers));
  }
});

test('rejects unknown levels up front', () => {
  assert.throws(() => bro({ level: 'mega' }), /Unknown bro level/);
});
