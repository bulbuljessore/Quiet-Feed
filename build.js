// Builds store-ready ZIPs:
//   dist/quiet-feed-chromium-1.0.0.zip  (Chrome, Edge, Brave, Opera, Vivaldi, Arc)
//   dist/quiet-feed-firefox-1.0.0.zip   (Firefox)
// Run:  node build.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = __dirname;
const dist = path.join(root, 'dist');
const version = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8')).version;

const shared = ['content.js', 'blur.js', 'youtube.js', 'popup.html', 'popup.css', 'popup.js', 'icons', 'vendor'];

function copy(src, dest) {
  fs.cpSync(src, dest, { recursive: true });
}

function build(name, extra) {
  const out = path.join(dist, name);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  for (const f of shared) copy(path.join(root, f), path.join(out, f));
  for (const [from, to] of extra) copy(path.join(root, from), path.join(out, to));

  const zip = path.join(dist, `quiet-feed-${name}-${version}.zip`);
  fs.rmSync(zip, { force: true });
  // bsdtar (built into Windows 10+/macOS/Linux) writes standards-compliant zips with "/" paths
  const tar = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
  execFileSync(tar, ['-a', '-c', '-f', zip, '-C', out, ...fs.readdirSync(out)], { stdio: 'inherit' });
  console.log('built', path.relative(root, zip), (fs.statSync(zip).size / 1048576).toFixed(1) + ' MB');
}

fs.mkdirSync(dist, { recursive: true });

build('chromium', [
  ['manifest.json', 'manifest.json'],
  ['background.js', 'background.js'],
  ['offscreen.html', 'offscreen.html'],
  ['offscreen.js', 'offscreen.js']
]);

build('firefox', [
  ['firefox/manifest.json', 'manifest.json'],
  ['firefox/background.js', 'background.js']
]);
