// Update notifier. Extensions installed outside a store cannot update themselves, so this
// checks the latest GitHub Release now and then and tells the user (popup banner + "NEW" badge).
// It sends no personal data: one anonymous GET request to the public GitHub API.
// Shared by the Chromium service worker (importScripts) and the Firefox background page.
const UPDATE_REPO = 'bulbuljessore/Quiet-Feed';
const UPDATE_API = 'https://api.github.com/repos/' + UPDATE_REPO + '/releases/latest';
const UPDATE_ALARM = 'srk-update';
const UPDATE_EVERY_MIN = 12 * 60;

function cmpVersions(a, b) {
  const pa = String(a).replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

function clearUpdateBadge() {
  try { chrome.action.setBadgeText({ text: '' }); } catch (_) { /* noop */ }
  chrome.storage.local.remove('update');
}

function checkForUpdate() {
  chrome.storage.sync.get({ updateCheck: true }, async (s) => {
    if (s.updateCheck === false) { clearUpdateBadge(); return; }
    try {
      const res = await fetch(UPDATE_API, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store', credentials: 'omit' });
      if (!res.ok) return;
      const rel = await res.json();
      const latest = String(rel.tag_name || '').replace(/^v/i, '');
      const url = String(rel.html_url || '');
      const current = chrome.runtime.getManifest().version;
      if (latest && url.startsWith('https://github.com/' + UPDATE_REPO + '/') && cmpVersions(latest, current) > 0) {
        chrome.storage.local.set({ update: { version: latest, url, checked: Date.now() } });
        chrome.action.setBadgeText({ text: 'NEW' });
        chrome.action.setBadgeBackgroundColor({ color: '#c62828' });
      } else {
        clearUpdateBadge();
      }
    } catch (_) { /* offline or rate-limited: try again at the next alarm */ }
  });
}

chrome.alarms.get(UPDATE_ALARM, (alarm) => {
  if (!alarm) chrome.alarms.create(UPDATE_ALARM, { delayInMinutes: 1, periodInMinutes: UPDATE_EVERY_MIN });
});
chrome.alarms.onAlarm.addListener((a) => { if (a.name === UPDATE_ALARM) checkForUpdate(); });
chrome.runtime.onInstalled.addListener(checkForUpdate);
if (chrome.runtime.onStartup) chrome.runtime.onStartup.addListener(checkForUpdate);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.updateCheck) checkForUpdate();
});
chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === 'check-update') checkForUpdate(); // popup asks for a fresh check
});
