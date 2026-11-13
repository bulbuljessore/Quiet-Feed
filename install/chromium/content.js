(() => {
  'use strict';

  const HIDDEN_ATTR = 'data-srk-hidden';
  const DEFAULT_KEYWORDS = [];

  // Containers that usually represent one "post" or one "comment".
  const CONTAINER_SELECTOR = [
    'article',
    '[role="article"]',
    '[data-testid="tweet"]',
    '[data-testid="cellInnerDiv"]',
    'ytd-comment-renderer',
    'ytd-comment-thread-renderer',
    'ytd-video-renderer',
    'ytd-rich-item-renderer',
    'ytd-compact-video-renderer',
    'shreddit-post',
    'shreddit-comment',
    '.comment',
    '.post',
    '.entry',
    '.story',
    '.feed-item',
    'li'
  ].join(',');

  // Fallback: smallest text block around the match.
  const TEXT_BLOCK_SELECTOR = 'p,h1,h2,h3,h4,h5,h6,blockquote,figcaption,td,dd,dt,a';

  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION',
    'CODE', 'PRE', 'HEAD', 'TITLE', 'META', 'LINK', 'SVG'
  ]);
  const NEVER_HIDE = new Set(['HTML', 'BODY', 'MAIN']);

  let enabled = true;
  let regex = null;
  let regexLoose = null;
  let regexAdult = null;       // built-in adult words (only when the adult filter is on)
  let regexAdultLoose = null;
  let allowReveal = true;      // show a "Show" button on adult-hidden items
  let lang = 'bn';
  let hiddenCount = 0;
  const SHOWN_ATTR = 'data-srk-shown';
  const PH_ATTR = 'data-srk-ph';

  // ---------- style ----------
  const style = document.createElement('style');
  style.textContent = `[${HIDDEN_ATTR}] { display: none !important; }
    [${PH_ATTR}] { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 6px 0; padding: 8px 12px;
      border: 1px dashed #999; border-radius: 8px; background: rgba(128,128,128,.12); color: inherit; font: 13px/1.4 system-ui, sans-serif; }
    [${PH_ATTR}] button { padding: 4px 12px; border: 0; border-radius: 6px; background: #c62828; color: #fff; font: inherit; cursor: pointer; }`;
  (document.head || document.documentElement).appendChild(style);

  // ---------- matching ----------
  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function buildRegex(keywords) {
    const parts = keywords
      .map((k) => (k || '').normalize('NFC').trim())
      .filter(Boolean)
      .map((k) => {
        // spaces inside a keyword may be missing or extra in real text
        const body = k.split(/\s+/).map(escapeRegex).join('\\s*');
        // For pure Latin keywords avoid matching inside other words.
        return /^[\x00-\x7F]+$/.test(k) ? `(?<![A-Za-z])${body}(?![A-Za-z])` : body;
      });
    return parts.length ? new RegExp(parts.join('|'), 'iu') : null;
  }

  function buildLooseRegex(keywords) {
    const parts = keywords
      .map((k) => (k || '').normalize('NFC').replace(/\s+/g, ''))
      .filter((k) => k.length >= 3)
      .map(escapeRegex);
    return parts.length ? new RegExp(parts.join('|'), 'iu') : null;
  }

  // 'user' = the user's own keywords (always hidden), 'adult' = built-in adult list (can be revealed)
  function kindOf(text) {
    if (!text) return null;
    const t = text.normalize('NFC');
    if (regex && regex.test(t)) return 'user';
    if (regexAdult && regexAdult.test(t)) return 'adult';
    return null;
  }

  // ---------- hiding ----------
  function pickContainer(node) {
    const start = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    if (!start) return null;
    let target = start.closest(CONTAINER_SELECTOR);
    if (!target) target = start.closest(TEXT_BLOCK_SELECTOR) || start;
    if (!target || NEVER_HIDE.has(target.tagName)) return null;
    return target;
  }

  function addPlaceholder(el) {
    const ph = document.createElement('div');
    ph.setAttribute(PH_ATTR, '1');
    const msg = document.createElement('span');
    msg.textContent = lang === 'en' ? 'Adult content hidden' : 'প্রাপ্তবয়স্ক কনটেন্ট লুকানো হয়েছে';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = lang === 'en' ? 'Show' : 'দেখুন';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.removeAttribute(HIDDEN_ATTR);
      el.setAttribute(SHOWN_ATTR, '1');
      ph.remove();
      hiddenCount = Math.max(0, hiddenCount - 1);
      reportCount();
    });
    ph.append(msg, btn);
    if (el.parentNode) el.parentNode.insertBefore(ph, el);
  }

  function hide(el, kind) {
    if (!el || el.hasAttribute(HIDDEN_ATTR) || el.hasAttribute(SHOWN_ATTR)) return;
    el.setAttribute(HIDDEN_ATTR, '1');
    if (kind === 'adult' && allowReveal) addPlaceholder(el);
    hiddenCount++;
    reportCount();
  }

  function scan(root) {
    if (!enabled || (!regex && !regexAdult) || !root) return;

    if (root.nodeType === Node.TEXT_NODE) {
      if (root.parentElement && root.parentElement.closest(`[${PH_ATTR}]`)) return;
      const k = kindOf(root.nodeValue);
      if (k) hide(pickContainer(root), k);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE || SKIP_TAGS.has(root.tagName)) return;
    if (root.closest && (root.closest(`[${HIDDEN_ATTR}]`) || root.closest(`[${PH_ATTR}]`))) return;

    scanImages(root);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentElement;
        if (!p || SKIP_TAGS.has(p.tagName) || p.isContentEditable || p.closest(`[${PH_ATTR}]`)) return NodeFilter.FILTER_REJECT;
        return n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    let n;
    while ((n = walker.nextNode())) {
      const k = kindOf(n.nodeValue);
      if (k) hide(pickContainer(n), k);
    }

    // image alt text, titles, aria labels
    const attrNodes = root.querySelectorAll ? root.querySelectorAll('[alt],[title],[aria-label]') : [];
    for (const el of attrNodes) {
      if (SKIP_TAGS.has(el.tagName)) continue;
      const v = el.getAttribute('alt') || el.getAttribute('title') || el.getAttribute('aria-label');
      const k = kindOf(v);
      if (k) hide(pickContainer(el), k);
    }
  }

  // ---------- text inside images (OCR) ----------
  const MIN_W = 150;
  const MIN_H = 40;
  const MAX_OCR_PER_PAGE = 80;
  let ocrSeen = new WeakSet();
  const ocrResults = new Map(); // src -> 'user' | 'adult' | null
  const ocrActive = new Set(); // img elements hidden by OCR
  let ocrRequested = 0;

  function compact(s) {
    return s.normalize('NFC').replace(/\s+/g, '');
  }

  // OCR often inserts stray spaces, so compare with all whitespace removed.
  function kindOfLoose(text) {
    if (!text) return null;
    const c = compact(text);
    if (regexLoose && regexLoose.test(c)) return 'user';
    if (regexAdultLoose && regexAdultLoose.test(c)) return 'adult';
    return null;
  }

  function imageSrc(img) {
    const s = img.currentSrc || img.src;
    return s && /^(https?:|data:image)/.test(s) ? s : null;
  }

  function checkImage(img) {
    if (!enabled || (!regexLoose && !regexAdultLoose) || ocrSeen.has(img)) return;
    if (!img.complete) {
      img.addEventListener('load', () => checkImage(img), { once: true });
      return;
    }
    if (img.naturalWidth < MIN_W || img.naturalHeight < MIN_H) return;
    const src = imageSrc(img);
    if (!src) return;
    ocrSeen.add(img);

    if (ocrResults.has(src)) {
      const k = ocrResults.get(src);
      if (k) { hide(pickContainer(img), k); ocrActive.add(img); }
      return;
    }
    if (ocrRequested >= MAX_OCR_PER_PAGE) return;
    ocrRequested++;

    try {
      chrome.runtime.sendMessage({ type: 'ocr', url: src }, (res) => {
        if (chrome.runtime.lastError || !res) return;
        const hit = kindOfLoose(res.text);
        ocrResults.set(src, hit);
        if (hit && img.isConnected && enabled) {
          hide(pickContainer(img), hit);
          ocrActive.add(img);
        }
      });
    } catch (_) { /* extension reloaded */ }
  }

  function scanImages(root) {
    if ((!regexLoose && !regexAdultLoose) || !root) return;
    if (root.nodeType === Node.ELEMENT_NODE) {
      if (root.tagName === 'IMG') checkImage(root);
      else if (root.querySelectorAll) root.querySelectorAll('img').forEach(checkImage);
    }
  }

  function unhideAll() {
    document.querySelectorAll(`[${HIDDEN_ATTR}]`).forEach((el) => el.removeAttribute(HIDDEN_ATTR));
    document.querySelectorAll(`[${SHOWN_ATTR}]`).forEach((el) => el.removeAttribute(SHOWN_ATTR));
    document.querySelectorAll(`[${PH_ATTR}]`).forEach((el) => el.remove());
    hiddenCount = 0;
    ocrSeen = new WeakSet();
    reportCount();
  }

  function rescanAll() {
    unhideAll();
    if (document.body) scan(document.body);
  }

  // ---------- badge counter (best effort) ----------
  let reportTimer = null;
  function reportCount() {
    clearTimeout(reportTimer);
    reportTimer = setTimeout(() => {
      try {
        chrome.storage.local.set({ ['count:' + location.hostname]: hiddenCount });
      } catch (_) { /* extension reloaded */ }
    }, 300);
  }

  // ---------- observe page changes ----------
  const pending = new Set();
  let flushTimer = null;

  function flush() {
    flushTimer = null;
    const nodes = Array.from(pending);
    pending.clear();
    for (const n of nodes) {
      if (n.isConnected) scan(n);
    }
  }

  const observer = new MutationObserver((mutations) => {
    if (!enabled || (!regex && !regexAdult)) return;
    for (const m of mutations) {
      if (m.type === 'childList') {
        m.addedNodes.forEach((n) => pending.add(n));
      } else if (m.type === 'characterData') {
        pending.add(m.target);
      }
    }
    if (!flushTimer) flushTimer = setTimeout(flush, 150);
  });

  function start() {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      scan(document.body);
    }
  }

  // ---------- settings ----------
  const READ_DEFAULTS = { enabled: true, keywords: DEFAULT_KEYWORDS, adult: null, lang: 'bn' };

  function applySettings(s) {
    enabled = s.enabled !== false;
    lang = s.lang === 'en' ? 'en' : 'bn';
    const user = Array.isArray(s.keywords) ? s.keywords : DEFAULT_KEYWORDS;
    const a = s.adult || {};
    const adultOn = a.on === true;
    allowReveal = a.allowReveal !== false;

    // The user's own keywords and the built-in adult list are kept apart, so turning the
    // adult filter on or off never changes the user's keyword filter (and vice versa).
    regex = buildRegex(user);
    regexLoose = buildLooseRegex(user);
    regexAdult = adultOn ? buildRegex(ADULT_TERMS) : null;
    // OCR text is compared without spaces, so only longer adult terms are used there (avoids "Essex"-style hits)
    regexAdultLoose = adultOn ? buildLooseRegex(ADULT_TERMS.filter((k) => k.replace(/s+/g, '').length >= 5)) : null;

    ocrResults.clear(); // settings changed: re-evaluate images
    ocrRequested = 0;
    if (enabled && (regex || regexAdult)) rescanAll();
    else unhideAll();
  }

  chrome.storage.sync.get({ ...READ_DEFAULTS, keywords: null }, (s) => {
    if (s.keywords === null) {
      // first run: seed defaults
      chrome.storage.sync.set({ keywords: DEFAULT_KEYWORDS, enabled: true });
      s.keywords = DEFAULT_KEYWORDS;
    }
    applySettings(s);
    start();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    chrome.storage.sync.get(READ_DEFAULTS, applySettings);
  });
})();
