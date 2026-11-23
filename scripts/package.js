// Zips an extension for the Chrome Web Store: `npm run package` (Bro) or
// `npm run package -- unbro`. Rebuilds the shared copies first, and puts
// manifest.json at the top of the zip, which is what the store expects.
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const name = process.argv[2] || 'bro';
const dir = path.join(root, 'extensions', name);
if (!fs.existsSync(path.join(dir, 'manifest.json'))) {
  console.error(`No extension at extensions/${name}`);
  process.exit(1);
}

execFileSync(process.execPath, [path.join(__dirname, 'build.js')], { stdio: 'inherit' });

const { version } = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const out = path.join(root, 'dist', `${name}-${version}.zip`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.rmSync(out, { force: true });
execFileSync('zip', ['-r', '-X', '-q', out, '.', '-x', '.*', '-x', '*/.*'], { cwd: dir });
console.log(`dist/${name}-${version}.zip`);
