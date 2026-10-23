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

## Rules

- **Only full sentences.** A sentence needs a full stop, at least 3 words, and a capital (or digit) at the start. So "Sign in." and "Read more." stay as they are.
- **Comma, then bro.** `This is a sentence.` → `This is a sentence, bro.`
- **The double-bro rule.** If a sentence already ends in "bro", it is left alone. No "bro, bro."
- **Only full stops.** `?` and `!` sentences are left alone.
- **Shouting gets shouted back.** `THIS IS LOUD.` → `THIS IS LOUD, BRO.`
- **Leaves alone:** buttons, nav menus, form fields, code blocks and anything you can type into (Gmail compose, Google Docs, comment boxes).
- **Not fooled by:** `Dr. Smith`, `e.g. this`, `J. R. R. Tolkien`, `Jan. 5`, `3.50`, `example.com.`, `...`
- Text a page adds after it loads (feeds, infinite scroll) gets bro'd too.

## Development

```sh
npm test
```

- `bro.js` holds the sentence rules (no DOM, so it can be tested in Node).
- `content.js` walks the page, joins up text split across tags like `<b>` and `<a>`, and inserts ", bro" in place.
