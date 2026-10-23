# bro-mode

Ends every full sentence with ", bro."

```sh
npm install bro-mode
```

Needs Node 20.19 or newer.

## Every page on your server

```js
const express = require('express');
const bro = require('bro-mode');

const app = express();
app.use(bro());
```

Works with Connect, Express, or plain `node:http` as `(req, res, next)`.

- Only `text/html` responses in UTF-8 are touched. JSON, images, `HEAD` requests and the rest pass straight through.
- HTML is buffered and bro'd when the response ends, and `Content-Length` is fixed up.
- If you use `compression()`, register it **before** `bro()` so bro sees the HTML before it gets gzipped. An already-compressed response is left alone.

## Options

```js
app.use(bro({ level: 'hyper', mark: false }));
```

| Option | Default | |
| --- | --- | --- |
| `level` | `'ultra'` | `'normal'`, `'ultra'` or `'hyper'`. See below. |
| `mark` | `true` | Wrap each bro in `<span data-bro>`, so the Unbro extension (or your own CSS) can hide them. |

| Level | What gets a bro | Example |
| --- | --- | --- |
| `normal` | Full sentences ending in `.` | `This is a sentence, bro.` |
| `ultra` | Also full sentences ending in `?` or `!` | `Are you serious, bro?!` |
| `hyper` | Everything: short sentences, `...`, buttons, nav links, headings | `Sign in, bro` · `Home, bro` · `OK, BRO` |

At every level, `<script>`, `<style>`, `<pre>`, `<code>`, form fields, `<title>` and anything `contenteditable` are left alone.

## Text and HTML

```js
const { broify, broifyHTML } = require('bro-mode');

broify('What a day it was!');
// 'What a day it was, bro!'

broify('Sign in', 'hyper');
// 'Sign in, bro'

broifyHTML('<p>Hello <b>there</b> my friend.</p>');
// '<p>Hello <b>there</b> my friend<span data-bro>, bro</span>.</p>'
```

`broifyHTML` inserts into your original HTML rather than re-writing it, so everything except the bros comes out exactly as it went in.

## Rules

- **Full sentences only** (below `hyper`): at least 3 words, starting with a capital or a digit. "Sign in." stays as it is.
- **The double-bro rule.** A sentence that already ends in "bro" is left alone. Running it twice never gives "bro, bro".
- **Shouting gets shouted back.** `THIS IS LOUD.` → `THIS IS LOUD, BRO.`
- **Not fooled by** `Dr. Smith`, `e.g. this`, `J. R. R. Tolkien`, `Jan. 5`, `3.50`, `example.com.`
