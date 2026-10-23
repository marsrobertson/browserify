# Bro

A Chrome extension that ends every full sentence on every page you visit with ", bro."

> Chrome extensions rewrite pages in place, bro.

## Install

1. Download or clone this repo.
2. Open `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and pick this folder.
5. Reload any open tab.

Works in any Chromium browser (Chrome, Edge, Brave, Arc).

## Levels

Click the Bro icon in the toolbar to pick one. The setting syncs across your Chrome profile.

| Level | What gets a bro | Example |
| --- | --- | --- |
| **Normal bro** | Full sentences ending in `.` | `This is a sentence, bro.` |
| **Ultra bro** (default) | Also full sentences ending in `?` or `!` | `Are you serious, bro?!` |
| **Super duper hyper cyber bro** | Everything: short sentences, `...`, buttons, nav links, headings | `Sign in, bro` · `Home, bro` · `OK, BRO` |

Turning the level up re-bros the open page straight away. Turning it down takes effect when you reload the tab.

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
npm test
```

- `bro.js` holds the sentence rules for each level (no DOM, so it can be tested in Node).
- `content.js` walks the page, joins up text split across tags like `<b>` and `<a>`, and inserts ", bro" in place.
- `popup.html` / `popup.js` is the level picker. The level lives in `chrome.storage.sync`.
