// Forces SafeSearch on Google, Bing and DuckDuckGo with declarativeNetRequest rules.
// Loaded by the background script (Chromium: importScripts, Firefox: background.scripts).
const SAFE_RULES = [
  // Google: add safe=active (the "allow" rule stops redirect loops once it is present)
  { id: 11, priority: 2, action: { type: 'allow' },
    condition: { regexFilter: '^https?://(www\\.)?google\\.[a-z.]{2,}/search\\?.*safe=active', resourceTypes: ['main_frame'] } },
  { id: 12, priority: 1,
    action: { type: 'redirect', redirect: { transform: { queryTransform: { addOrReplaceParams: [{ key: 'safe', value: 'active' }] } } } },
    condition: { regexFilter: '^https?://(www\\.)?google\\.[a-z.]{2,}/search\\?', resourceTypes: ['main_frame'] } },
  // Bing: adlt=strict
  { id: 21, priority: 2, action: { type: 'allow' },
    condition: { regexFilter: '^https?://(www\\.)?bing\\.com/(images/|videos/)?search\\?.*adlt=strict', resourceTypes: ['main_frame'] } },
  { id: 22, priority: 1,
    action: { type: 'redirect', redirect: { transform: { queryTransform: { addOrReplaceParams: [{ key: 'adlt', value: 'strict' }] } } } },
    condition: { regexFilter: '^https?://(www\\.)?bing\\.com/(images/|videos/)?search\\?', resourceTypes: ['main_frame'] } },
  // DuckDuckGo: kp=1 (strict)
  { id: 31, priority: 2, action: { type: 'allow' },
    condition: { regexFilter: '^https?://(www\\.)?duckduckgo\\.com/\\?.*kp=1', resourceTypes: ['main_frame'] } },
  { id: 32, priority: 1,
    action: { type: 'redirect', redirect: { transform: { queryTransform: { addOrReplaceParams: [{ key: 'kp', value: '1' }] } } } },
    condition: { regexFilter: '^https?://(www\\.)?duckduckgo\\.com/\\?', resourceTypes: ['main_frame'] } }
];
const SAFE_RULE_IDS = SAFE_RULES.map((r) => r.id);

function applySafeSearch() {
  chrome.storage.sync.get({ enabled: true, adult: null }, (s) => {
    const a = s.adult || {};
    const on = s.enabled !== false && a.on === true && a.safeSearch !== false;
    chrome.declarativeNetRequest.updateDynamicRules(
      { removeRuleIds: SAFE_RULE_IDS, addRules: on ? SAFE_RULES : [] },
      () => { void chrome.runtime.lastError; }
    );
  });
}

applySafeSearch();
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && (changes.adult || changes.enabled)) applySafeSearch();
});
