// Loads the real unpacked extensions into Chromium and checks what they do to
// real pages. Run with `npm run test:e2e` (first time: `npx playwright install chromium`).
// To test a store zip instead, unzip it and set BRO_EXTENSION_DIR to that folder.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');
const extensionId = require('../../scripts/extension-id.js');

const root = path.join(__dirname, '../..');
const EXT = {
  bro: process.env.BRO_EXTENSION_DIR || path.join(root, 'extensions/bro'),
  unbro: path.join(root, 'extensions/unbro'),
};

// A big page: 2,000 paragraphs, 6,000 sentences.
const BIG = '<!doctype html><body>' + Array.from({ length: 2000 }, (_, i) =>
  `<p>Paragraph number ${i} starts here. It has <b>three</b> sentences in it. Is this the end?</p>`
).join('') + '</body>';

let server;
let base;

test.before(async () => {
  server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (req.url === '/big.html') return res.end(BIG);
    const file = path.join(__dirname, 'fixtures', path.basename(req.url) || 'article.html');
    res.end(fs.existsSync(file) ? fs.readFileSync(file) : '<p>Not found.</p>');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

async function launch(...names) {
  const dirs = names.map((n) => EXT[n]).join(',');
  const args = ['--headless=new'];
  if (dirs) args.push(`--disable-extensions-except=${dirs}`, `--load-extension=${dirs}`);
  return chromium.launchPersistentContext('', { headless: false, args });
}

async function openArticle(context) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/article.html`);
  await page.waitForSelector('#later');
  await page.waitForTimeout(600); // the extension batches page changes every 250ms
  return { page, errors };
}

const text = (page, id) => page.$eval(`#${id}`, (el) => el.textContent);
const value = (page, id) => page.$eval(`#${id}`, (el) => el.value);

test('Bro: default level (ultra) on a real page', async () => {
  const context = await launch('bro');
  try {
    const { page, errors } = await openArticle(context);
    assert.equal(await text(page, 'plain'), 'We went to the beach today, bro. The water was cold, bro.');
    assert.equal(await text(page, 'split'), 'It was really good fun, bro.');
    assert.equal(await text(page, 'question'), 'Was it worth the drive, bro? What a day it was, bro!');
    assert.equal(await text(page, 'abbr'), 'Dr. Smith met us at 3.50 on Jan. 5 this year, bro.');
    assert.equal(await text(page, 'short'), 'Sign in.');
    assert.equal(await text(page, 'human'), 'Thanks, bro.');
    assert.equal(await text(page, 'h1'), 'A day at the beach');

    // Hands off: buttons and menus (below hyper), code, form fields, editors, the tab title.
    assert.equal(await text(page, 'button'), 'Subscribe to the newsletter now.');
    assert.equal(await text(page, 'nav-home'), 'Home');
    assert.equal(await text(page, 'nav-about'), 'About this site here.');
    assert.equal(await text(page, 'pre'), 'Code stays exactly the same.');
    assert.equal(await text(page, 'code'), 'console.log("Not a sentence either.")');
    assert.equal(await value(page, 'input'), 'Typed text stays put.');
    assert.equal(await value(page, 'textarea'), 'Draft text stays put.');
    assert.equal(await text(page, 'editable'), 'You are writing an email here.');
    assert.equal(await page.title(), 'Test article. With a full stop.');

    // Text the page adds or changes after loading, and iframes.
    assert.equal(await text(page, 'later'), 'This paragraph was added later, bro.');
    assert.equal(await text(page, 'changing'), 'The page changed this text, bro.');
    const frame = page.frames().find((f) => f.url().endsWith('/frame.html'));
    assert.equal(await frame.$eval('#inframe', (el) => el.textContent), 'Text inside the frame works too, bro.');

    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
});

test('Bro: the popup changes the level live, up and down, and remembers it', async () => {
  const context = await launch('bro');
  try {
    const { page } = await openArticle(context);
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId(EXT.bro)}/popup.html`);
    assert.equal(await popup.isChecked('input[value="ultra"]'), true, 'ultra is the default');

    await popup.check('input[value="hyper"]');
    await page.waitForTimeout(300);
    assert.equal(await text(page, 'button'), 'Subscribe to the newsletter now, bro.');
    assert.equal(await text(page, 'short'), 'Sign in, bro.');
    assert.equal(await text(page, 'h1'), 'A day at the beach, bro');
    assert.equal(await text(page, 'nav-home'), 'Home, bro');
    assert.equal(await text(page, 'nav-about'), 'About this site here, bro.');

    await popup.check('input[value="normal"]');
    await page.waitForTimeout(300);
    assert.equal(await text(page, 'question'), 'Was it worth the drive? What a day it was!');
    assert.equal(await text(page, 'button'), 'Subscribe to the newsletter now.');
    assert.equal(await text(page, 'plain'), 'We went to the beach today, bro. The water was cold, bro.');
    assert.equal(await text(page, 'human'), 'Thanks, bro.', 'human bros survive a level change');

    const { page: fresh } = await openArticle(context);
    assert.equal(await text(fresh, 'question'), 'Was it worth the drive? What a day it was!', 'level persists');
    await popup.reload();
    assert.equal(await popup.isChecked('input[value="normal"]'), true);
  } finally {
    await context.close();
  }
});

test('Unbro strips bros, and running both extensions does not loop', async () => {
  for (const names of [['unbro'], ['bro', 'unbro']]) {
    const context = await launch(...names);
    try {
      const { page } = await openArticle(context);
      assert.equal(await text(page, 'human'), 'Thanks.', names.join('+'));
      assert.equal(await text(page, 'plain'), 'We went to the beach today. The water was cold.', names.join('+'));
      assert.equal(await value(page, 'input'), 'Typed text stays put.');
      // If the two fought, the text would keep changing.
      const changes = await page.evaluate(() => new Promise((resolve) => {
        let n = 0;
        new MutationObserver((m) => { n += m.length; })
          .observe(document.body, { subtree: true, characterData: true, childList: true });
        setTimeout(() => resolve(n), 1500);
      }));
      assert.equal(changes, 0, `${names.join('+')}: page kept changing`);
    } finally {
      await context.close();
    }
  }
});

test('Bro: a 6,000-sentence page is done quickly', async () => {
  const context = await launch('bro');
  try {
    const page = await context.newPage();
    const start = Date.now();
    await page.goto(`${base}/big.html`);
    await page.waitForFunction(() => document.body.lastElementChild.textContent.endsWith('end, bro?'));
    const ms = Date.now() - start;
    const bros = await page.evaluate(() => document.body.textContent.match(/, bro/g).length);
    assert.equal(bros, 6000);
    console.log(`# big page: 6,000 bros in ${ms} ms including page load`);
    assert.ok(ms < 5000, `${ms} ms`);
  } finally {
    await context.close();
  }
});
