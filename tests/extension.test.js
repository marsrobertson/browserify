const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('extension bro.js matches the package (run `npm run sync`)', () => {
  assert.equal(read('extensions/bro/bro.js'), read('packages/bro-mode/bro.js'));
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
