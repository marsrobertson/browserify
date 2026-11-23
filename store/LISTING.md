# Chrome Web Store listing: Bro

Copy and paste these into the developer dashboard. The images are in this folder; regenerate them with `npm run store-assets`.

## Package

Upload `dist/bro-<version>.zip`, made by `npm run package`.

## Store listing tab

**Name** (from the manifest): Bro

**Summary** (from the manifest): Ends sentences on every page with ", bro." Three levels, up to super duper hyper cyber bro.

**Category:** Pick the closest fun or entertainment category the dashboard offers.

**Language:** English

**Description:**

> Every sentence on the web, now ending with, bro.
>
> Bro rewrites the pages you visit so full sentences end with ", bro." News, docs, your bank's terms and conditions: all of it, bro.
>
> Pick your level from the toolbar:
> • Normal bro: full sentences ending in a full stop.
> • Ultra bro (default): questions and exclamations too, bro?!
> • Super duper hyper cyber bro: everything. Buttons, menus, headings. "Sign in, bro."
>
> House rules:
> • No double bros. A sentence that already ends in "bro" is left alone.
> • SHOUTING GETS SHOUTED BACK, BRO.
> • Not fooled by "Dr. Smith", "e.g.", "3.50" or "example.com".
> • Hands off anything you type into: Gmail, Google Docs, comment boxes and form fields stay exactly as they are. Code blocks too.
>
> Everything happens in your browser. Bro has no server and sends nothing anywhere.
>
> Open source: https://github.com/marsrobertson/browserify

**Images:**
- Icon: comes from the package (`icons/icon128.png`).
- Screenshots: `screenshot-1.png`, `screenshot-2.png` (1280x800).
- Small promo tile: `promo-small.png` (440x280). Optional, but extensions without one are shown after those with one.

## Privacy tab

**Single purpose:**

> Rewrites the text of web pages so that sentences end with ", bro", as a joke. The user picks how much text is rewritten.

**Permission justification, `storage`:**

> Remembers the bro level the user picks in the popup (one setting).

**Permission justification, host permissions (content script on all URLs):**

> Rewriting page text is the whole extension, and users expect it on every site they visit, so the content script has to run on all pages. It only changes text in the page. It reads nothing else and sends nothing anywhere.

**Remote code:** No, I am not using remote code.

**Data usage:** Google's User Data FAQ says local processing still counts as handling data. So tick **Website content**, since the extension reads page text in order to rewrite it. Then certify the three statements: not sold, not used for unrelated purposes, not used for creditworthiness.

**Privacy policy URL:** the public link to `store/PRIVACY.md` on GitHub, from the branch you publish from.

## Distribution tab

Public, all regions, free.
