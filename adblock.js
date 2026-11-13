// Light ad blocker, network part. Enables/disables the bundled rules/ads.json ruleset
// (declarativeNetRequest) and applies the user's per-site allow-list.
// Loaded by the background script (Chromium: importScripts, Firefox: background.scripts).
const AD_RULESET_ID = 'ads';
const AD_ALLOW_RULE_ID = 1001;
const AD_ALL_TYPES = ['script', 'image', 'sub_frame', 'xmlhttprequest', 'ping', 'media', 'font', 'stylesheet', 'other', 'websocket'];

function applyAdBlock() {
  chrome.storage.sync.get({ enabled: true, ads: null }, (s) => {
    const a = s.ads || {};
    const on = s.enabled !== false && a.on === true && a.network !== false;
    const noop = () => { void chrome.runtime.lastError; };

    chrome.declarativeNetRequest.updateEnabledRulesets(
      on ? { enableRulesetIds: [AD_RULESET_ID] } : { disableRulesetIds: [AD_RULESET_ID] }, noop);

    // Sites the user switched ads-blocking off for: requests made by those pages are allowed.
    const sites = (Array.isArray(a.allowSites) ? a.allowSites : [])
      .map((d) => String(d).trim().toLowerCase().replace(/^www\./, ''))
      .filter(Boolean);
    const addRules = on && sites.length
      ? [{ id: AD_ALLOW_RULE_ID, priority: 2, action: { type: 'allow' },
           condition: { initiatorDomains: sites, resourceTypes: AD_ALL_TYPES } }]
      : [];
    chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [AD_ALLOW_RULE_ID], addRules }, noop);
  });
}

applyAdBlock();
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && (changes.ads || changes.enabled)) applyAdBlock();
});
