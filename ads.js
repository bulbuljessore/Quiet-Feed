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
    '.ad', '.ads', '.advert', '.advertisement', '.ad-wrapper', '.ad-unit', '.adunit', '.ad-box', '.ad-container',
    '.banner-ad', '.banner-ads', '.header-ad', '.sidebar-ad', '.top-ad', '.bottom-ad', '.sticky-ad',
    'amp-ad', 'amp-embed[type="taboola"]', 'amp-embed[type="outbrain"]',
    'a[href*="doubleclick.net/"]', 'a[href*="googleadservices.com/"]',
    'iframe[src*="/ads/"]', 'iframe[src*="adserver"]', 'iframe[id^="aswift_"]', 'div[id^="aswift_"]',
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

  // Facebook hides its "Sponsored" label from page text on purpose, so ads are recognised by
  // other signals: the call-to-action button role (data-ad-rendering-role="cta-..."), the old
  // /ads/about link, an aria-label, or a plain label. Feed posts are div[aria-posinset].
  // The right column shows a plain "Sponsored" heading above its ads.
  function fbRail(scope) {
    const root = scope && scope.querySelectorAll ? scope : document;
    root.querySelectorAll('[role="complementary"] h3, [data-pagelet="RightRail"] h3').forEach((h) => {
      if (h.textContent.trim().toLowerCase() !== 'sponsored' && h.textContent.trim() !== 'স্পনসর্ড') return;
      // climb to the largest ancestor that holds only this heading (not "Contacts" etc.)
      let c = h;
      while (c.parentElement && c.parentElement.querySelectorAll('h3, h2').length === 1 &&
             !c.parentElement.matches('[role="complementary"]') && !c.parentElement.matches('body')) {
        c = c.parentElement;
      }
      if (c !== h) mark(c);
    });
  }
  const fbIsComment = (el) => /^(comment|reply)/i.test(el.getAttribute('aria-label') || '');

  const SOCIAL = [
    { test: /(^|\.)facebook\.com$/,
      items: 'div[aria-posinset], div[role="article"], div[data-pagelet^="FeedUnit"]',
      isAd: (el) => !fbIsComment(el) && (
        !!el.querySelector('[data-ad-rendering-role^="cta"], a[href*="/ads/about"], [aria-label="Sponsored"], a[aria-label="Sponsored"]') ||
        hasLabel(el, LABELS)),
      custom: fbRail },
    { test: /(^|\.)instagram\.com$/,
      items: 'article',
      isAd: (el) => hasLabel(el, LABELS) },
    { test: /(^|\.)(x|twitter)\.com$/,
      items: 'article[data-testid="tweet"]',
      // NOTE: do not use [data-testid="placementTracking"]; X puts it around every video player,
      // so it would hide all tweets with videos (checked on the live site). Only the label is used.
      isAd: (el) => hasLabel(el, X_LABELS),
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
    if (rule.custom) rule.custom(scope);
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
        // slow safety net: late-rendered labels or virtualised lists can be missed by the observer
        setInterval(() => { if (active && cfg.social) scanSocial(document); }, 2500);
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
