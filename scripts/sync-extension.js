// Chrome loads an unpacked extension from its own folder, so each one gets a
// copy of the sentence rules. Run `npm run sync` after editing packages/bro-mode/bro.js.
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
for (const ext of ['bro', 'unbro']) {
  fs.copyFileSync(
    path.join(root, 'packages/bro-mode/bro.js'),
    path.join(root, `extensions/${ext}/bro.js`)
  );
  console.log(`Copied packages/bro-mode/bro.js -> extensions/${ext}/bro.js`);
}
