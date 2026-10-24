# Bro

Ends every full sentence with ", bro." In your browser, on your server, or both.

> Chrome extensions rewrite pages in place, bro.

| Folder | What it is |
| --- | --- |
| [`packages/bro-mode`](packages/bro-mode) | npm package: `npm install bro-mode`. Bro plain text, HTML, or every page an Express/Connect server sends. |
| [`extensions/bro`](extensions/bro) | Chrome extension that bros every page you visit. |
| [`extensions/unbro`](extensions/unbro) | Chrome extension that strips the bros back out. |

## Install the extensions

1. Download or clone this repo.
2. Open `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and pick `extensions/bro` (or `extensions/unbro`).
5. Reload any open tab.

Works in any Chromium browser (Chrome, Edge, Brave, Arc).

## Use it on a server

```js
const express = require('express');
const bro = require('bro-mode');

const app = express();
app.use(bro()); // every HTML response, bro'd
```

More in [`packages/bro-mode/README.md`](packages/bro-mode/README.md).

## Bro vs. Unbro

Server bros are bro native: plain text, no wrapper elements, so a site's CSS can't tell they're there. The flip side is that nobody can tell who wrote a bro, so Unbro strips every `, bro` that ends a sentence, human ones included. `Thanks, bro.` becomes `Thanks.` Bros without the comma (`Thanks bro.`) and capital-B ones (`Calm down, Bro.`) stay, because bro-mode never writes those.

Unbro runs before the page paints and keeps stripping as the page changes. Like Bro, it leaves form fields, code and anything you can type into alone.

The Bro extension never double-bros a server bro. If you run both extensions, Unbro wins everywhere: it flags the page and Bro stands down, so the two don't fight.

## Levels

In the extension, click the Bro icon in the toolbar to pick one (the setting syncs across your Chrome profile). On the server, pass `{ level }`.

| Level | What gets a bro | Example |
| --- | --- | --- |
| **Normal bro** | Full sentences ending in `.` | `This is a sentence, bro.` |
| **Ultra bro** (default) | Also full sentences ending in `?` or `!` | `Are you serious, bro?!` |
| **Super duper hyper cyber bro** | Everything: short sentences, `...`, buttons, nav links, headings | `Sign in, bro` · `Home, bro` · `OK, BRO` |

In the extension, turning the level up re-bros the open page straight away. Turning it down takes effect when you reload the tab.

## Rules

These are the Normal and Ultra rules. Super duper hyper cyber bro drops the word count and capital rules, and also bros buttons and menus.

- **Only full sentences.** A sentence needs a terminator, at least 3 words, and a capital (or digit) at the start. So "Sign in." and "Read more." stay as they are.
- **Comma, then bro.** `This is a sentence.` → `This is a sentence, bro.`
- **The double-bro rule.** If a sentence already ends in "bro", it is left alone. No "bro, bro."
- **Full stops only in Normal.** `?` and `!` sentences get a bro from Ultra up: `Why is it so loud, bro?`
- **Shouting gets shouted back.** `THIS IS LOUD.` → `THIS IS LOUD, BRO.`
- **Leaves alone:** buttons and nav menus (below hyper), form fields, code blocks and anything you can type into (Gmail compose, Google Docs, comment boxes).
- **Not fooled by:** `Dr. Smith`, `e.g. this`, `J. R. R. Tolkien`, `Jan. 5`, `3.50`, `example.com.`, `...`
- Text a page adds after it loads (feeds, infinite scroll) gets bro'd too.

## Development

```sh
npm install
npm test
```

- `packages/bro-mode/bro.js` holds the sentence rules for each level, plus which tags to skip. It's the single source of truth.
- `extensions/bro/bro.js` and `extensions/unbro/bro.js` are copies, because Chrome loads an unpacked extension from its own folder. Run `npm run sync` after editing the original. A test fails if they drift.
- `extensions/bro/content.js` walks the live page, joins up text split across tags like `<b>` and `<a>`, and inserts ", bro" in place.
- `packages/bro-mode/html.js` does the same on the server with [parse5](https://github.com/inikulin/parse5), inserting into the original HTML so everything else comes out byte for byte as it went in.
- `extensions/bro/popup.html` / `popup.js` is the level picker. The level lives in `chrome.storage.sync`.
