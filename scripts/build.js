// Copies the shared code to where it's needed. Run `npm run build` after
// editing anything in packages/bro-mode.
// - Chrome loads an unpacked extension from its own folder, so each extension
//   gets a copy of bro.js (and Bro gets dom.js).
// - browser.js is the one-file drop-in for sites with no build step.
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pkg = path.join(root, 'packages/bro-mode');
const read = (file) => fs.readFileSync(path.join(pkg, file), 'utf8');

const COPIES = {
  'extensions/bro/bro.js': 'bro.js',
  'extensions/bro/dom.js': 'dom.js',
  'extensions/unbro/bro.js': 'bro.js',
};

function bundle() {
  const { version } = JSON.parse(read('package.json'));
  return [
    `/*! bro-mode ${version} | browser.js, built by scripts/build.js from bro.js, dom.js and snippet.js. Edit those, not this. */`,
    read('bro.js'),
    read('dom.js'),
    read('snippet.js'),
  ].join('\n');
}

if (require.main === module) {
  for (const [to, from] of Object.entries(COPIES)) {
    fs.writeFileSync(path.join(root, to), read(from));
    console.log(`packages/bro-mode/${from} -> ${to}`);
  }
  fs.writeFileSync(path.join(pkg, 'browser.js'), bundle());
  console.log('built packages/bro-mode/browser.js');
}

module.exports = { COPIES, bundle };
