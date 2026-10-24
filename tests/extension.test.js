const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { COPIES, bundle } = require('../scripts/build.js');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('copies of the shared code are up to date (run `npm run build`)', () => {
  for (const [to, from] of Object.entries(COPIES)) {
    assert.equal(read(to), read(`packages/bro-mode/${from}`), to);
  }
  assert.equal(read('packages/bro-mode/browser.js'), bundle(), 'packages/bro-mode/browser.js');
});

test('extension manifests are valid JSON and point at real files', () => {
  for (const dir of ['extensions/bro', 'extensions/unbro']) {
    const manifest = JSON.parse(read(`${dir}/manifest.json`));
    const files = [
      ...Object.values(manifest.icons),
      ...manifest.content_scripts.flatMap((c) => [...(c.js || []), ...(c.css || [])]),
      ...(manifest.action ? [manifest.action.default_popup] : []),
    ];
    for (const file of files) assert.ok(fs.existsSync(path.join(root, dir, file)), `${dir}/${file}`);
  }
});
