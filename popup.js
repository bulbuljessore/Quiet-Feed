const DEFAULT_KEYWORDS = [];
const DEFAULT_YT = {
  mode: 'block',
  blocked: [],
  allowed: [],
  relatedByName: true,
  showRelatedInOnly: false
};

const $ = (id) => document.getElementById(id);

let keywords = [];
let yt = { ...DEFAULT_YT };
let currentChannel = null;
let blur = { all: false, sites: [] };
let currentHost = null;
let adult = { on: false, blockSites: true, safeSearch: true, allowReveal: true };
let ads = { on: false, network: true, cosmetic: true, social: true, allowSites: [] };

// ---------- ads ----------
function saveAds() {
  chrome.storage.sync.set({ ads });
  renderAds();
}

function renderAds() {
  $('adsOn').checked = !!ads.on;
  $('adsNetwork').checked = ads.network !== false;
  $('adsCosmetic').checked = ads.cosmetic !== false;
  $('adsSocial').checked = ads.social !== false;
  $('ads-options').hidden = !ads.on;
  renderList($('ads-list'), document.createElement('p'), ads.allowSites, (i) => {
    ads.allowSites.splice(i, 1);
    saveAds();
  });
  const btn = $('ads-site');
  btn.disabled = !currentHost;
  const has = currentHost && ads.allowSites.some((s) => s.toLowerCase() === currentHost);
  btn.textContent = !currentHost
    ? t('adsSiteDefault')
    : t(has ? 'adsSiteOn' : 'adsSiteOff', { host: currentHost });
}
$('adsOn').addEventListener('change', () => { ads.on = $('adsOn').checked; saveAds(); });
$('adsNetwork').addEventListener('change', () => { ads.network = $('adsNetwork').checked; saveAds(); });
$('adsCosmetic').addEventListener('change', () => { ads.cosmetic = $('adsCosmetic').checked; saveAds(); });
$('adsSocial').addEventListener('change', () => { ads.social = $('adsSocial').checked; saveAds(); });
$('ads-site').addEventListener('click', () => {
  if (!currentHost) return;
  const i = ads.allowSites.findIndex((s) => s.toLowerCase() === currentHost);
  if (i >= 0) ads.allowSites.splice(i, 1);
  else ads.allowSites.push(currentHost);
  saveAds();
});

// ---------- adult content ----------
function saveAdult() {
  chrome.storage.sync.set({ adult });
  renderAdult();
}

function renderAdult() {
  $('adultOn').checked = !!adult.on;
  $('adultSites').checked = adult.blockSites !== false;
  $('adultSafe').checked = adult.safeSearch !== false;
  $('adultReveal').checked = adult.allowReveal !== false;
  $('adult-options').hidden = !adult.on;
}
$('adultOn').addEventListener('change', () => { adult.on = $('adultOn').checked; saveAdult(); });
$('adultSites').addEventListener('change', () => { adult.blockSites = $('adultSites').checked; saveAdult(); });
$('adultSafe').addEventListener('change', () => { adult.safeSearch = $('adultSafe').checked; saveAdult(); });
$('adultReveal').addEventListener('change', () => { adult.allowReveal = $('adultReveal').checked; saveAdult(); });

// ---------- blur mode ----------
function saveBlur() {
  chrome.storage.sync.set({ blur });
  renderBlur();
}

function renderBlur() {
  $('blurAll').checked = !!blur.all;
  renderList($('blur-list'), document.createElement('p'), blur.sites, (i) => {
    blur.sites.splice(i, 1);
    saveBlur();
  });
  const btn = $('blur-site');
  btn.disabled = !currentHost;
  const has = currentHost && blur.sites.some((s) => s.toLowerCase() === currentHost);
  btn.textContent = !currentHost
    ? t('blurSiteDefault')
    : t(has ? 'blurSiteOn' : 'blurSiteOff', { host: currentHost });
}

// ---------- update notice ----------
function cmpVersions(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}
let updateInfo = null;

function renderUpdate() {
  const current = chrome.runtime.getManifest().version;
  $('ver').textContent = t('version', { v: current });
  const ok = updateInfo && /^https://github.com//.test(updateInfo.url || '') && cmpVersions(updateInfo.version, current) > 0;
  $('update-banner').hidden = !ok;
  if (ok) {
    $('update-text').textContent = t('updAvail', { v: updateInfo.version });
    $('update-link').href = updateInfo.url;
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.update) { updateInfo = changes.update.newValue || null; renderUpdate(); }
});
$('updateCheck').addEventListener('change', () => {
  chrome.storage.sync.set({ updateCheck: $('updateCheck').checked });
});

// ---------- language ----------
function setLang(l) {
  setLangValue(l);
  chrome.storage.sync.set({ lang: LANG });
  $('lang-bn').setAttribute('aria-pressed', String(LANG === 'bn'));
  $('lang-en').setAttribute('aria-pressed', String(LANG === 'en'));
  applyI18n();
  renderKeywords();
  renderYt();
  renderBlur();
  renderAdult();
  renderAds();
  renderUpdate();
  showCount();
}
$('lang-bn').addEventListener('click', () => setLang('bn'));
$('lang-en').addEventListener('click', () => setLang('en'));

$('blurAll').addEventListener('change', () => { blur.all = $('blurAll').checked; saveBlur(); });
$('blur-site').addEventListener('click', () => {
  if (!currentHost) return;
  const i = blur.sites.findIndex((s) => s.toLowerCase() === currentHost);
  if (i >= 0) blur.sites.splice(i, 1);
  else blur.sites.push(currentHost);
  saveBlur();
});

function detectHost() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    try {
      const u = new URL(tabs[0].url);
      if (/^https?:$/.test(u.protocol)) currentHost = u.hostname.replace(/^www\./, '').toLowerCase();
    } catch (_) { /* not a web page */ }
    renderBlur();
    renderAds();
  });
}

// ---------- generic list helper ----------
function renderList(ul, emptyEl, items, onRemove) {
  ul.textContent = '';
  items.forEach((k, i) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = k;
    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = '×';
    del.setAttribute('aria-label', t('removeAria', { x: k }));
    del.addEventListener('click', () => onRemove(i));
    li.append(span, del);
    ul.appendChild(li);
  });
  emptyEl.hidden = items.length > 0;
}

function addUnique(arr, value) {
  const v = value.normalize('NFC').trim();
  if (!v) return false;
  if (arr.some((x) => x.toLowerCase() === v.toLowerCase())) return false;
  arr.push(v);
  return true;
}

// Accepts @handle, plain name, /channel/UC... or a full YouTube link.
function normalizeChannel(input) {
  const raw = input.normalize('NFC').trim();
  if (/^https?:\/\//i.test(raw) || /youtube\.com\//i.test(raw)) {
    try {
      const u = new URL(/^https?:/i.test(raw) ? raw : 'https://' + raw);
      const p = decodeURIComponent(u.pathname);
      let m;
      if ((m = p.match(/^\/(@[^/]+)/))) return m[1];
      if ((m = p.match(/^\/channel\/([^/]+)/))) return m[1];
      if ((m = p.match(/^\/(?:c|user)\/([^/]+)/))) return m[1];
    } catch (_) { /* treat as plain text */ }
  }
  return raw;
}

// ---------- keywords ----------
function renderKeywords() {
  renderList($('kw-list'), $('kw-empty'), keywords, (i) => {
    keywords.splice(i, 1);
    chrome.storage.sync.set({ keywords });
    renderKeywords();
  });
}

$('kw-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (addUnique(keywords, $('kw-input').value)) {
    chrome.storage.sync.set({ keywords });
    renderKeywords();
  }
  $('kw-input').value = '';
});

$('enabled').addEventListener('change', () => {
  chrome.storage.sync.set({ enabled: $('enabled').checked });
});

// ---------- YouTube ----------
function saveYt() {
  chrome.storage.sync.set({ yt });
  renderYt();
}

function renderYt() {
  document.querySelectorAll('input[name="mode"]').forEach((r) => { r.checked = r.value === yt.mode; });
  $('yt-block-box').hidden = yt.mode !== 'block';
  $('yt-only-box').hidden = yt.mode !== 'only';
  $('relatedByName').checked = !!yt.relatedByName;
  $('showRelatedInOnly').checked = !!yt.showRelatedInOnly;

  renderList($('blocked-list'), $('blocked-empty'), yt.blocked, (i) => { yt.blocked.splice(i, 1); saveYt(); });
  renderList($('allowed-list'), $('allowed-empty'), yt.allowed, (i) => { yt.allowed.splice(i, 1); saveYt(); });

  $('cur-block').disabled = !currentChannel;
  $('cur-allow').disabled = !currentChannel;
  $('current-label').textContent = currentChannel
    ? t('curLabel', { name: currentChannel.label })
    : t('curNone');
}

document.querySelectorAll('input[name="mode"]').forEach((r) => {
  r.addEventListener('change', () => { if (r.checked) { yt.mode = r.value; saveYt(); } });
});
$('relatedByName').addEventListener('change', () => { yt.relatedByName = $('relatedByName').checked; saveYt(); });
$('showRelatedInOnly').addEventListener('change', () => { yt.showRelatedInOnly = $('showRelatedInOnly').checked; saveYt(); });

$('blocked-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (addUnique(yt.blocked, normalizeChannel($('blocked-input').value))) saveYt();
  $('blocked-input').value = '';
});
$('allowed-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (addUnique(yt.allowed, normalizeChannel($('allowed-input').value))) saveYt();
  $('allowed-input').value = '';
});

$('cur-block').addEventListener('click', () => {
  if (currentChannel && addUnique(yt.blocked, currentChannel.value)) {
    yt.mode = 'block';
    saveYt();
  }
});
$('cur-allow').addEventListener('click', () => {
  if (currentChannel && addUnique(yt.allowed, currentChannel.value)) {
    yt.mode = 'only';
    saveYt();
  }
});

function detectCurrentChannel() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !/^https:\/\/[^/]*youtube\.com\//.test(tab.url || '')) return;
    chrome.tabs.sendMessage(tab.id, { type: 'yt-current-channel' }, (res) => {
      if (chrome.runtime.lastError || !res) return;
      currentChannel = res;
      renderYt();
    });
  });
}

// ---------- tabs ----------
function selectTab(which) {
  if (!['kw', 'yt', 'adult', 'ads'].includes(which)) which = 'kw';
  for (const k of ['kw', 'yt', 'adult', 'ads']) {
    $('tab-' + k).setAttribute('aria-selected', String(k === which));
    $('panel-' + k).hidden = k !== which;
  }
  try { localStorage.setItem('srk-tab', which); } catch (_) { /* ignore */ }
}
$('tab-kw').addEventListener('click', () => selectTab('kw'));
$('tab-yt').addEventListener('click', () => selectTab('yt'));
$('tab-adult').addEventListener('click', () => selectTab('adult'));
$('tab-ads').addEventListener('click', () => selectTab('ads'));

// ---------- page counter ----------
function showCount() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    try {
      const host = new URL(tabs[0].url).hostname;
      chrome.storage.local.get('count:' + host, (r) => {
        const n = r['count:' + host] || 0;
        $('count').textContent = n ? t('count', { n }) : '';
      });
    } catch (_) {
      $('count').textContent = '';
    }
  });
}

// ---------- init ----------
chrome.storage.sync.get({ enabled: true, keywords: null, yt: null, blur: null, lang: 'bn', adult: null, ads: null, updateCheck: true }, (s) => {
  ads = { on: false, network: true, cosmetic: true, social: true, ...(s.ads || {}) };
  if (!Array.isArray(ads.allowSites)) ads.allowSites = [];
  $('updateCheck').checked = s.updateCheck !== false;
  setLangValue(s.lang);
  $('lang-bn').setAttribute('aria-pressed', String(LANG === 'bn'));
  $('lang-en').setAttribute('aria-pressed', String(LANG === 'en'));
  applyI18n();
  keywords = s.keywords === null ? DEFAULT_KEYWORDS.slice() : s.keywords;
  blur = { all: false, sites: [], ...(s.blur || {}) };
  if (!Array.isArray(blur.sites)) blur.sites = [];
  adult = { on: false, blockSites: true, safeSearch: true, allowReveal: true, ...(s.adult || {}) };
  renderAdult();
  renderAds();
  renderBlur();
  detectHost();
  yt = { ...DEFAULT_YT, ...(s.yt || {}) };
  yt.blocked = Array.isArray(yt.blocked) ? yt.blocked : [];
  yt.allowed = Array.isArray(yt.allowed) ? yt.allowed : [];
  $('enabled').checked = s.enabled !== false;
  renderKeywords();
  renderYt();
  showCount();
  detectCurrentChannel();
  chrome.storage.local.get('update', (r) => { updateInfo = r.update || null; renderUpdate(); });
  try { chrome.runtime.sendMessage({ type: 'check-update' }, () => { void chrome.runtime.lastError; }); } catch (_) { /* noop */ }
  let tab = 'kw';
  try { tab = localStorage.getItem('srk-tab') || 'kw'; } catch (_) { /* ignore */ }
  selectTab(tab);
});
