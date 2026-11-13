// Generates store/README screenshots (1280x800) from the REAL popup.html/css/js with demo data.
// Bengali -> store/screenshots/*.png     English -> store/screenshots/en/*.png
// Run: node gen.js   (renders with Microsoft Edge headless)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..', '..');
const out = __dirname;
const srcDir = path.join(out, 'src');
fs.mkdirSync(srcDir, { recursive: true });
fs.mkdirSync(path.join(out, 'en'), { recursive: true });

const popupHtml = fs.readFileSync(path.join(root, 'popup.html'), 'utf8');
const popupJs = fs.readFileSync(path.join(root, 'popup.js'), 'utf8');
const i18nJs = fs.readFileSync(path.join(root, 'i18n.js'), 'utf8');
const fileUrl = (p) => 'file:///' + p.replace(/\\/g, '/');
const popupCssHref = fileUrl(path.join(root, 'popup.css'));

function popupPage({ state, tab, url, channel, count }) {
  const stub = `
    window.chrome = {
      storage: {
        sync: { get: (d, cb) => cb(${JSON.stringify(state)}), set() {} },
        local: { get: (k, cb) => cb(${JSON.stringify(count || {})}) },
        onChanged: { addListener() {} }
      },
      tabs: {
        query: (q, cb) => cb([{ id: 1, url: ${JSON.stringify(url)} }]),
        sendMessage: (id, m, cb) => cb(${JSON.stringify(channel || null)})
      },
      runtime: { getManifest: () => ({ version: '1.1.0' }), sendMessage() {}, lastError: null }
    };`;
  return popupHtml
    .replace('href="popup.css"', `href="${popupCssHref}"`)
    .replace('<script src="i18n.js"></script>', `<script>${i18nJs}</script>`)
    .replace('<script src="popup.js"></script>',
      `<script>${stub}</script><script>${popupJs}</script><script>document.getElementById('tab-${tab}').click();</script>`);
}

const css = `
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1280px; height: 800px; overflow: hidden; }
  body { font-family: "Segoe UI", "Nirmala UI", system-ui, sans-serif; color: #1c1b1f;
    background: linear-gradient(135deg, #fdecec 0%, #f4f1f8 55%, #e9eef9 100%); }
  header { padding: 34px 60px 0; }
  h1 { margin: 0; font-size: 42px; letter-spacing: -.5px; }
  h1 b { color: #c62828; }
  header p { margin: 8px 0 0; font-size: 22px; color: #55515c; }
  .stage { position: absolute; left: 60px; right: 60px; top: 150px; bottom: 10px; display: flex; gap: 36px; align-items: flex-start; }
  .browser { flex: 1; height: 100%; background: #fff; border-radius: 14px; box-shadow: 0 12px 40px rgba(40,20,60,.18); overflow: hidden; display: flex; flex-direction: column; }
  .bar { height: 42px; background: #eceaf0; display: flex; align-items: center; gap: 8px; padding: 0 14px; }
  .dot { width: 11px; height: 11px; border-radius: 50%; background: #c9c5d0; }
  .url { margin-left: 10px; flex: 1; height: 26px; border-radius: 13px; background: #fff; color: #77737e; font-size: 13px; line-height: 26px; padding: 0 14px; }
  .content { padding: 20px 24px; overflow: hidden; flex: 1; }
  .popupwrap { width: 340px; flex: none; }
  .popupwrap iframe { width: 340px; height: 640px; border: 0; border-radius: 12px; box-shadow: 0 12px 40px rgba(40,20,60,.28); background: #fff; }
  .badge { display: inline-block; margin-top: 14px; background: #c62828; color: #fff; padding: 8px 14px; border-radius: 20px; font-size: 15px; }
  .post { border: 1px solid #e6e3ea; border-radius: 12px; padding: 14px 16px; margin-bottom: 14px; display: flex; gap: 12px; }
  .av { width: 40px; height: 40px; border-radius: 50%; flex: none; }
  .post h4 { margin: 0 0 4px; font-size: 15px; } .post p { margin: 0; font-size: 14px; color: #55515c; line-height: 1.5; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .vid .th { aspect-ratio: 16/9; border-radius: 10px; }
  .vid h5 { margin: 8px 0 2px; font-size: 14px; } .vid span { font-size: 12.5px; color: #77737e; }
  .note { margin-top: 14px; font-size: 14px; color: #77737e; }
  .pic { width: 100%; height: 170px; border-radius: 10px; margin-top: 10px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 28px; font-weight: 700; }
`;

const av = (c) => `<div class="av" style="background:${c}"></div>`;
const post = (c, t, p) => `<div class="post">${av(c)}<div><h4>${t}</h4><p>${p}</p></div></div>`;
const vid = (g, t, ch) => `<div class="vid"><div class="th" style="background:${g}"></div><h5>${t}</h5><span>${ch}</span></div>`;

const T = {
  bn: {
    keywords: ['spoiler', 'গুজব', 'clickbait', 'Sample Name'],
    s1: { title: 'আপনার দেওয়া <b>কীওয়ার্ড</b> লুকিয়ে ফেলুন', sub: 'Hide posts, comments and articles that contain the words you choose',
      posts: [['আবহাওয়া', 'আজ দুপুরের পর ঢাকায় হালকা বৃষ্টির সম্ভাবনা রয়েছে।'], ['Local Food Fair', 'The weekend street food fair opens on Friday with 40 stalls.'], ['বই আলোচনা', 'নতুন প্রকাশিত উপন্যাসটি নিয়ে পাঠকদের মিশ্র প্রতিক্রিয়া।']],
      badge: 'এই পেজে ৩টি পোস্ট লুকানো হয়েছে' },
    s2: { title: 'YouTube-এর <b>চ্যানেল ব্লক</b> করুন', sub: 'Blocked channels’ videos, Shorts and comments disappear', note: 'ব্লক করা চ্যানেলের ভিডিও তালিকা থেকে বাদ পড়েছে।' },
    s3: { title: 'শুধু <b>পছন্দের চ্যানেল</b> দেখুন', sub: 'Only-show mode: everything else is hidden', note: 'অনুমোদিত তালিকার বাইরের সব ভিডিও ও সাজেশন লুকানো।' },
    s4: { title: 'ছবির <b>ভেতরের লেখাও</b> ধরে', sub: 'Built-in Bengali + English text recognition, running only on your device',
      before: 'আগে (Before)', after: 'পরে (After)', red: 'ছবির ভেতরে "spoiler" লেখা', badge: 'ছবির লেখা মেলায় ১টি পোস্ট লুকানো হয়েছে' }
  },
  en: {
    keywords: ['spoiler', 'rumor', 'clickbait', 'Sample Name'],
    s1: { title: 'Hide the <b>keywords</b> you choose', sub: 'Posts, comments and articles that contain your words disappear',
      posts: [['Weather', 'Light rain is expected in the city after noon today.'], ['Local Food Fair', 'The weekend street food fair opens on Friday with 40 stalls.'], ['Book club', 'Readers share mixed reactions to the newly released novel.']],
      badge: '3 posts hidden on this page' },
    s2: { title: 'Block <b>YouTube channels</b>', sub: 'Blocked channels’ videos, Shorts and comments disappear', note: 'Videos from blocked channels are removed from the list.' },
    s3: { title: 'Show only <b>channels you like</b>', sub: 'Only-show mode: everything else is hidden', note: 'Every video and suggestion outside your allowed list is hidden.' },
    s4: { title: 'It reads <b>text inside images</b> too', sub: 'Built-in Bengali + English text recognition, running only on your device',
      before: 'Before', after: 'After', red: 'The image contains the text "spoiler"', badge: '1 post hidden because of the text in its image' }
  }
};

function build(lang) {
  const x = T[lang];
  const pages = {
    kw: popupPage({ state: { enabled: true, lang, keywords: x.keywords, yt: null }, tab: 'kw', url: 'https://news.example.com/', count: { 'count:news.example.com': 3 } }),
    ytblock: popupPage({ state: { enabled: true, lang, keywords: [], yt: { mode: 'block', blocked: ['@noisy_channel', 'Daily Drama Show'], allowed: [], relatedByName: true, showRelatedInOnly: false } },
      tab: 'yt', url: 'https://www.youtube.com/watch?v=demo', channel: { value: '@sample_channel', label: 'Sample Channel' } }),
    ytonly: popupPage({ state: { enabled: true, lang, keywords: [], yt: { mode: 'only', blocked: [], allowed: ['@learn_with_sam', 'Nature Docs'], allowedWords: ['education', 'learning', 'kids'], blockedWords: ['football', 'cartoon'], relatedByName: true, showRelatedInOnly: false } },
      tab: 'yt', url: 'https://www.youtube.com/', channel: null }),
    img: popupPage({ state: { enabled: true, lang, keywords: x.keywords.slice(0, 3), yt: null }, tab: 'kw', url: 'https://social.example.com/', count: { 'count:social.example.com': 2 } })
  };
  for (const [k, v] of Object.entries(pages)) fs.writeFileSync(path.join(srcDir, `popup-${lang}-${k}.html`), v);

  const grid = (items) => `<div class="grid">${items.join('')}</div>`;
  const vids6 = grid([
    vid('linear-gradient(135deg,#6a8cff,#9be)', 'Learn Python in 20 minutes', 'Learn With Sam'),
    vid('linear-gradient(135deg,#ffb36a,#fd9)', 'Easy dinner ideas', 'Cooking Corner'),
    vid('linear-gradient(135deg,#7ad3a3,#bfe)', 'Rainforest 4K tour', 'Nature Docs'),
    vid('linear-gradient(135deg,#c59bff,#ebf)', 'Budget travel tips', 'Wander Notes'),
    vid('linear-gradient(135deg,#ff8aa0,#fcd)', 'Morning stretch routine', 'Fit Daily'),
    vid('linear-gradient(135deg,#8ad0e8,#cef)', 'Photography basics', 'Lens Lab')
  ]);
  const vids6only = grid([
    vid('linear-gradient(135deg,#6a8cff,#9be)', 'Learn Python in 20 minutes', 'Learn With Sam'),
    vid('linear-gradient(135deg,#ffb36a,#fd9)', 'Easy dinner ideas', 'Cooking Corner'),
    vid('linear-gradient(135deg,#7ad3a3,#bfe)', 'Rainforest 4K tour', 'Nature Docs'),
    vid('linear-gradient(135deg,#6a8cff,#9be)', 'Intro to data structures', 'Learn With Sam'),
    vid('linear-gradient(135deg,#ffb36a,#fd9)', '10-minute pasta', 'Cooking Corner'),
    vid('linear-gradient(135deg,#7ad3a3,#bfe)', 'Deep ocean life', 'Nature Docs')
  ]);
  const cols = ['#7aa7e8', '#e8a77a', '#9bd39b'];

  const scenes = {
    '1-keyword-filter': { s: x.s1, url: 'news.example.com', popup: 'kw',
      body: x.s1.posts.map((p, i) => post(cols[i], p[0], p[1])).join('') + `<span class="badge">${x.s1.badge}</span>` },
    '2-youtube-block': { s: x.s2, url: 'video-site.example.com', popup: 'ytblock', body: vids6 + `<p class="note">${x.s2.note}</p>` },
    '3-youtube-only-mode': { s: x.s3, url: 'video-site.example.com', popup: 'ytonly', body: vids6only + `<p class="note">${x.s3.note}</p>` },
    '4-text-in-images': { s: x.s4, url: 'social.example.com', popup: 'img',
      body: `<div style="display:flex;gap:18px">
        <div style="flex:1"><div class="note" style="margin:0 0 8px;font-weight:700;color:#77737e">${x.s4.before}</div>
          ${post('#7aa7e8', 'Travel Club', 'Sunset at the river.')}
          <div class="post">${av('#e8a77a')}<div style="flex:1"><h4>Movie Fans</h4><p>New episode review</p>
            <div class="pic" style="background:linear-gradient(135deg,#4a4a6a,#1f1f33);outline:3px solid #c62828;font-size:24px">SPOILER: hero wins</div>
            <p style="color:#c62828;margin-top:6px;font-size:12.5px">${x.s4.red}</p></div></div></div>
        <div style="flex:1"><div class="note" style="margin:0 0 8px;font-weight:700;color:#2e7d32">${x.s4.after}</div>
          ${post('#7aa7e8', 'Travel Club', 'Sunset at the river.')}
          <span class="badge" style="margin-top:6px">${x.s4.badge}</span></div></div>` }
  };

  const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  for (const [name, sc] of Object.entries(scenes)) {
    const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>${css}</style></head><body>
      <header><h1>${sc.s.title}</h1><p>${sc.s.sub}</p></header>
      <div class="stage">
        <div class="browser"><div class="bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="url">https://${sc.url}</span></div>
          <div class="content">${sc.body}</div></div>
        <div class="popupwrap"><iframe src="popup-${lang}-${sc.popup}.html"></iframe></div>
      </div></body></html>`;
    const f = path.join(srcDir, `${lang}-${name}.html`);
    fs.writeFileSync(f, html);
    const png = lang === 'en' ? path.join(out, 'en', `${name}.png`) : path.join(out, `${name}.png`);
    execFileSync(edge, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
      '--allow-file-access-from-files', '--virtual-time-budget=4000',
      `--screenshot=${png}`, '--window-size=1280,800', fileUrl(f)], { stdio: 'ignore' });
    console.log('wrote', path.relative(out, png), fs.existsSync(png) ? fs.statSync(png).size : 'MISSING');
  }
}

build('bn');
build('en');
