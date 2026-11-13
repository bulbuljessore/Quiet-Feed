// Light ad blocker, page part:
//  - "cosmetic": hides common empty ad slots on any website
//  - "social"  : hides Sponsored / Promoted posts on Facebook, Instagram, X, Reddit, LinkedIn, YouTube
// Best effort: these sites change their markup often, so some ads can slip through.
(() => {
  'use strict';

  const ATTR = 'data-srk-ad';
  const host = location.hostname.toLowerCase();

  let active = false;
  let cfg = { on: false, cosmetic: true, social: true, allowSites: [] };
  let enabledMaster = true;

  // ---------- generic ad slots (conservative on purpose) ----------
  const GENERIC_SELECTORS = [
    'ins.adsbygoogle',
    'iframe[src*="doubleclick.net"]',
    'iframe[src*="googlesyndication.com"]',
    'iframe[id^="google_ads_iframe"]',
    'div[id^="google_ads_iframe"]',
    'div[id^="div-gpt-ad"]',
    'div[data-google-query-id]',
    '[data-ad-slot]',
    '[data-ad-client]',
    '[aria-label="Advertisement"]',
    '[aria-label="advertisement"]',
    '#google_image_div',
    '.adsbygoogle',
    '.ad-slot',
    '.ad-banner',
    '.advert-banner',
    '.sponsored-ad',
    '.taboola-widget, [id^="taboola-"]',
    '[id^="outbrain_widget"], .OUTBRAIN'
  ];

  // ---------- social network rules ----------
  // Sponsored/Promoted labels in several languages (leaf text must equal one of these exactly)
  const LABELS = new Set([
    'sponsored', 'promoted', 'advertisement', 'suggested post',
    'স্পনসর্ড', 'প্রযোজিত', 'বিজ্ঞাপন', 'বিজ্ঞাপিত', 'প্রচারিত'
  ]);
  const X_LABELS = new Set(['ad', 'promoted', 'promoted tweet', 'বিজ্ঞাপন', 'প্রচারিত']);

  const YT_AD_SELECTORS = [
    'ytd-ad-slot-renderer', 'ytd-in-feed-ad-layout-renderer', 'ytd-display-ad-renderer',
    'ytd-promoted-sparkles-web-renderer', 'ytd-promoted-video-renderer', 'ytd-banner-promo-renderer',
    'ytd-statement-banner-renderer', 'ytd-companion-slot-renderer', '#masthead-ad', '#player-ads',
    'ytd-primetime-promo-renderer', 'ytd-action-companion-ad-renderer'
  ];

  function hasLabel(container, labels) {
    // visit small leaf elements only; avoids reading whole posts
    const els = container.querySelectorAll('span, a, div, p, b, strong');
    for (const el of els) {
      if (el.children.length > 0) continue;
      const t = el.textContent;
      if (!t || t.length > 24) continue;
      if (labels.has(t.trim().toLowerCase())) return true;
    }
    return false;
  }

  const SOCIAL = [
    { test: /(^|\.)facebook\.com$/,
      items: 'div[role="article"], div[data-pagelet^="FeedUnit"]',
      isAd: (el) => !!el.querySelector('a[href*="/ads/about"], [aria-label="Sponsored"], a[aria-label="Sponsored"]') || hasLabel(el, LABELS),
      extra: ['div[data-pagelet="RightRail"] [data-pagelet*="Ad"]'] },
    { test: /(^|\.)instagram\.com$/,
      items: 'article',
      isAd: (el) => hasLabel(el, LABELS) },
    { test: /(^|\.)(x|twitter)\.com$/,
      items: 'article[data-testid="tweet"]',
      isAd: (el) => hasLabel(el, X_LABELS) || !!el.querySelector('[data-testid="placementTracking"]'),
      container: 'div[data-testid="cellInnerDiv"]' },
    { test: /(^|\.)reddit\.com$/,
      items: 'shreddit-post, article, .thing',
      isAd: (el) => el.tagName === 'SHREDDIT-AD-POST' || el.matches('.promotedlink') || el.getAttribute('data-promoted') === 'true' || hasLabel(el, LABELS),
      extra: ['shreddit-ad-post', 'shreddit-comments-page-ad', '[data-testid="ad"]'] },
    { test: /(^|\.)linkedin\.com$/,
      items: '.feed-shared-update-v2, div[data-id^="urn:li:activity"]',
      isAd: (el) => hasLabel(el, LABELS) },
    { test: /(^|\.)youtube\.com$/,
      items: null,
      extra: YT_AD_SELECTORS }
  ];

  // ---------- helpers ----------
  const style = document.createElement('style');
  style.textContent = `[${ATTR}] { display: none !important; }`;
  (document.head || document.documentElement).appendChild(style);

  const genericStyle = document.createElement('style');
  genericStyle.id = 'srk-ads-generic';

  function siteAllowed() {
    return (cfg.allowSites || []).some((d) => {
      const s = String(d).trim().toLowerCase().replace(/^www\./, '');
      return s && (host === s || host === 'www.' + s || host.endsWith('.' + s));
    });
  }

  function mark(el) {
    if (el && !el.hasAttribute(ATTR)) el.setAttribute(ATTR, '1');
  }

  function scanSocial(root) {
    const rule = SOCIAL.find((r) => r.test.test(host));
    if (!rule) return;
    const scope = root && root.querySelectorAll ? root : document;

    if (rule.items) {
      const items = [];
      if (scope.matches && scope.matches(rule.items)) items.push(scope);
      scope.querySelectorAll(rule.items).forEach((n) => items.push(n));
      for (const el of items) {
        if (el.hasAttribute(ATTR)) continue;
        let ad = false;
        try { ad = rule.isAd(el); } catch (_) { ad = false; }
        if (ad) mark((rule.container && el.closest(rule.container)) || el);
      }
    }
    for (const sel of rule.extra || []) scope.querySelectorAll(sel).forEach(mark);
  }

  // ---------- run / observe ----------
  const pending = new Set();
  let timer = null;

  function flush() {
    timer = null;
    if (!active) return;
    const nodes = Array.from(pending);
    pending.clear();
    if (cfg.social) for (const n of nodes) if (n.isConnected) scanSocial(n);
  }

  const observer = new MutationObserver((muts) => {
    if (!active || !cfg.social) return;
    for (const m of muts) m.addedNodes.forEach((n) => { if (n.nodeType === 1) pending.add(n); });
    if (!timer) timer = setTimeout(flush, 350);
  });
  let observing = false;

  function clearAll() {
    document.querySelectorAll(`[${ATTR}]`).forEach((el) => el.removeAttribute(ATTR));
    genericStyle.remove();
  }

  function apply() {
    active = enabledMaster && cfg.on === true && !siteAllowed();
    if (!active) {
      clearAll();
      return;
    }
    if (cfg.cosmetic) {
      genericStyle.textContent = GENERIC_SELECTORS.map((s) => s + ' { display: none !important; }').join('\n');
      (document.head || document.documentElement).appendChild(genericStyle);
    } else {
      genericStyle.remove();
    }
    if (cfg.social) {
      if (!observing && document.body) {
        observing = true;
        observer.observe(document.body, { childList: true, subtree: true });
      }
      scanSocial(document);
    } else {
      document.querySelectorAll(`[${ATTR}]`).forEach((el) => el.removeAttribute(ATTR));
    }
  }

  const read = () => chrome.storage.sync.get({ enabled: true, ads: null }, (s) => {
    enabledMaster = s.enabled !== false;
    cfg = { on: false, cosmetic: true, social: true, allowSites: [], ...(s.ads || {}) };
    apply();
  });
  read();
  chrome.storage.onChanged.addListener((c, area) => { if (area === 'sync' && (c.ads || c.enabled)) read(); });
})();
