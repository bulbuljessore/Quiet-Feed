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
    ? 'এই সাইটে ঝাপসা করো'
    : has ? `${currentHost}: ঝাপসা বন্ধ করো` : `${currentHost}: ঝাপসা করো`;
}

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
    del.setAttribute('aria-label', 'মুছুন: ' + k);
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
    ? 'বর্তমান পেজের চ্যানেল: ' + currentChannel.label
    : 'YouTube-এর ভিডিও বা চ্যানেল পেজে থাকলে এখান থেকে সরাসরি যোগ করতে পারবেন।';
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
  const isKw = which === 'kw';
  $('tab-kw').setAttribute('aria-selected', String(isKw));
  $('tab-yt').setAttribute('aria-selected', String(!isKw));
  $('panel-kw').hidden = !isKw;
  $('panel-yt').hidden = isKw;
  try { localStorage.setItem('srk-tab', which); } catch (_) { /* ignore */ }
}
$('tab-kw').addEventListener('click', () => selectTab('kw'));
$('tab-yt').addEventListener('click', () => selectTab('yt'));

// ---------- page counter ----------
function showCount() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    try {
      const host = new URL(tabs[0].url).hostname;
      chrome.storage.local.get('count:' + host, (r) => {
        const n = r['count:' + host] || 0;
        $('count').textContent = n ? `এই পেজে ${n}টি লুকানো হয়েছে` : '';
      });
    } catch (_) {
      $('count').textContent = '';
    }
  });
}

// ---------- init ----------
chrome.storage.sync.get({ enabled: true, keywords: null, yt: null, blur: null }, (s) => {
  keywords = s.keywords === null ? DEFAULT_KEYWORDS.slice() : s.keywords;
  blur = { all: false, sites: [], ...(s.blur || {}) };
  if (!Array.isArray(blur.sites)) blur.sites = [];
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
  let tab = 'kw';
  try { tab = localStorage.getItem('srk-tab') || 'kw'; } catch (_) { /* ignore */ }
  selectTab(tab === 'yt' ? 'yt' : 'kw');
});
