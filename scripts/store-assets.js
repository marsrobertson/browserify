// Makes the Chrome Web Store images in store/: three 1280x800 screenshots and
// the 440x280 small promo tile. Uses the real extension in Chromium, so the
// screenshots show what it actually does. `npm run store-assets`
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');
const extensionId = require('./extension-id.js');

const root = path.join(__dirname, '..');
const extension = path.join(root, 'extensions/bro');
const out = path.join(root, 'store');
const ORANGE = '#ff6a00';

const BLOG = `<!doctype html><html><head><meta charset="utf-8"><title>Weekend notes</title><style>
  body { margin: 0; font: 19px/1.65 Georgia, serif; color: #222; background: #fff; }
  header { display: flex; justify-content: space-between; align-items: center; padding: 18px 48px; border-bottom: 1px solid #eee; font: 15px system-ui, sans-serif; }
  header ul { display: flex; gap: 22px; list-style: none; margin: 0; padding: 0; }
  header a { color: #444; text-decoration: none; }
  header button { font: 600 14px system-ui, sans-serif; padding: 8px 14px; border: 0; border-radius: 6px; background: #222; color: #fff; }
  main { padding: 36px 48px; }
  h1 { font-size: 38px; line-height: 1.2; margin: 0 0 6px; }
  .meta { color: #888; font: 15px system-ui, sans-serif; margin-bottom: 18px; }
  p { margin: 0 0 18px; }
</style></head><body>
<header><strong>Weekend notes</strong><ul><li><a href="#">Home</a></li><li><a href="#">Archive</a></li><li><a href="#">About</a></li></ul><button>Sign in</button></header>
<main>
<h1>How I learned to make sourdough</h1>
<div class="meta">Posted on Sunday</div>
<p>It took me three months to get a loaf I was proud of. The first ten were flat as a pancake.</p>
<p>The trick is patience. Feed the starter every day and keep it somewhere warm.</p>
<p>Was it worth it? Every single crumb was worth it! Next week I am trying rye.</p>
</main></body></html>`;

// Two screenshots side by side, or one picture with a caption, as a store image.
function frame({ caption, body }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    body { margin: 0; width: 1280px; height: 800px; background: ${ORANGE}; font-family: system-ui, sans-serif; display: flex; flex-direction: column; }
    h2 { margin: 0; padding: 30px 48px 0; height: 104px; color: #fff; font-size: 38px; font-weight: 800; letter-spacing: -0.5px; }
    .stage { flex: 1; display: flex; gap: 24px; padding: 0 48px; position: relative; }
    .shot { flex: 1; position: relative; border-radius: 12px 12px 0 0; overflow: hidden; background: #fff; box-shadow: 0 8px 30px rgb(0 0 0 / 0.25); }
    .shot img { display: block; width: 100%; }
    .tag { position: absolute; bottom: 24px; left: 47px; font: 700 18px system-ui; padding: 8px 16px; border-radius: 999px; background: #222; color: #fff; }
    .popup { position: absolute; top: 330px; right: 90px; border-radius: 10px; overflow: hidden; box-shadow: 0 10px 40px rgb(0 0 0 / 0.35); }
    .popup img { display: block; }
  </style></head><body><h2>${caption}</h2><div class="stage">${body}</div></body></html>`;
}

const img = (png) => `<img src="data:image/png;base64,${png.toString('base64')}">`;

async function main() {
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(BLOG);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;

  const plain = await chromium.launch();
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: ['--headless=new', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });

  async function shoot(browserContext, width, height, setup) {
    const page = await browserContext.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setViewportSize({ width, height });
    await page.goto(url);
    await page.waitForTimeout(500);
    if (setup) await setup(page);
    const png = await page.screenshot();
    await page.close();
    return png;
  }

  // Pick the level in the real popup, and keep a picture of it.
  const popupUrl = `chrome-extension://${extensionId(extension)}/popup.html`;
  async function setLevel(level) {
    const ext = await context.newPage();
    await ext.goto(popupUrl);
    await ext.check(`input[value="${level}"]`);
    const shot = await ext.locator('body').screenshot();
    await ext.close();
    return shot;
  }

  const before = await shoot(await plain.newContext(), 592, 696);
  await setLevel('ultra');
  const after = await shoot(context, 592, 696);
  const popupShot = await setLevel('hyper');
  const hyper = await shoot(context, 1184, 696);
  await setLevel('ultra');

  const render = await plain.newPage({ viewport: { width: 1280, height: 800 } });
  fs.mkdirSync(out, { recursive: true });
  async function save(name, html, size = { width: 1280, height: 800 }) {
    await render.setViewportSize(size);
    await render.setContent(html);
    await render.screenshot({ path: path.join(out, name) });
    console.log(`store/${name}`);
  }

  await save('screenshot-1.png', frame({
    caption: 'Every sentence on every page ends with, bro.',
    body: `<div class="shot">${img(before)}<span class="tag">Before</span></div><div class="shot">${img(after)}<span class="tag">After</span></div>`,
  }));
  await save('screenshot-2.png', frame({
    caption: 'Pick your level, up to super duper hyper cyber bro.',
    body: `<div class="shot">${img(hyper)}</div><div class="popup">${img(popupShot)}</div>`,
  }));
  await save('promo-small.png', `<!doctype html><html><body style="margin:0;width:440px;height:280px;background:${ORANGE};
    display:flex;flex-direction:column;justify-content:center;padding:0 36px;box-sizing:border-box;font-family:system-ui,sans-serif;color:#fff">
    <div style="font:italic 800 96px/1 system-ui,sans-serif;letter-spacing:-3px">bro</div>
    <div style="font-size:22px;font-weight:600;margin-top:14px">Every sentence on the web,<br>now ending with, bro.</div>
    </body></html>`, { width: 440, height: 280 });

  await context.close();
  await plain.close();
  server.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
