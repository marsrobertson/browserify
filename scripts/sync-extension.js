// Chrome loads an unpacked extension from its own folder, so it gets a copy
// of the sentence rules. Run `npm run sync` after editing packages/bro-mode/bro.js.
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
fs.copyFileSync(
  path.join(root, 'packages/bro-mode/bro.js'),
  path.join(root, 'extensions/bro/bro.js')
);
console.log('Copied packages/bro-mode/bro.js -> extensions/bro/bro.js');
