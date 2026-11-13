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

// rules/ad-domains.txt -> rules/ads.json (declarativeNetRequest static ruleset)
function genAdRules() {
  const domains = fs.readFileSync(path.join(root, 'rules', 'ad-domains.txt'), 'utf8')
    .split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim().toLowerCase()).filter(Boolean);
  const unique = Array.from(new Set(domains));
  const types = ['script', 'image', 'sub_frame', 'xmlhttprequest', 'ping', 'media', 'font', 'stylesheet', 'other'];
  const rules = [];
  for (let i = 0; i < unique.length; i += 100) {
    rules.push({
      id: rules.length + 1,
      priority: 1,
      action: { type: 'block' },
      condition: { requestDomains: unique.slice(i, i + 100), domainType: 'thirdParty', resourceTypes: types }
    });
  }
  fs.writeFileSync(path.join(root, 'rules', 'ads.json'), JSON.stringify(rules, null, 1) + '\n');
  console.log('rules/ads.json:', unique.length, 'domains in', rules.length, 'rules');
}
genAdRules();

const shared = ['content.js', 'blur.js', 'adult.js', 'adult-terms.js', 'safesearch.js', 'updatecheck.js', 'adblock.js', 'ads.js', 'rules/ads.json', 'youtube.js', 'popup.html', 'popup.css', 'popup.js', 'i18n.js', 'icons', 'vendor'];

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
