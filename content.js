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
  let hiddenCount = 0;

  // ---------- style ----------
  const style = document.createElement('style');
  style.textContent = `[${HIDDEN_ATTR}] { display: none !important; }`;
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

  function matches(text) {
    return !!regex && !!text && regex.test(text.normalize('NFC'));
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

  function hide(el) {
    if (!el || el.hasAttribute(HIDDEN_ATTR)) return;
    el.setAttribute(HIDDEN_ATTR, '1');
    hiddenCount++;
    reportCount();
  }

  function scan(root) {
    if (!enabled || !regex || !root) return;

    if (root.nodeType === Node.TEXT_NODE) {
      if (matches(root.nodeValue)) hide(pickContainer(root));
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE || SKIP_TAGS.has(root.tagName)) return;
    if (root.closest && root.closest(`[${HIDDEN_ATTR}]`)) return;

    scanImages(root);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentElement;
        if (!p || SKIP_TAGS.has(p.tagName) || p.isContentEditable) return NodeFilter.FILTER_REJECT;
        return n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    let n;
    while ((n = walker.nextNode())) {
      if (matches(n.nodeValue)) hide(pickContainer(n));
    }

    // image alt text, titles, aria labels
    const attrNodes = root.querySelectorAll ? root.querySelectorAll('[alt],[title],[aria-label]') : [];
    for (const el of attrNodes) {
      if (SKIP_TAGS.has(el.tagName)) continue;
      const v = el.getAttribute('alt') || el.getAttribute('title') || el.getAttribute('aria-label');
      if (matches(v)) hide(pickContainer(el));
    }
  }

  // ---------- text inside images (OCR) ----------
  const MIN_W = 150;
  const MIN_H = 40;
  const MAX_OCR_PER_PAGE = 80;
  let ocrSeen = new WeakSet();
  const ocrResults = new Map(); // src -> true/false (blocked?)
  const ocrActive = new Set(); // img elements hidden by OCR
  let ocrRequested = 0;

  function compact(s) {
    return s.normalize('NFC').replace(/\s+/g, '');
  }

  // OCR often inserts stray spaces, so compare with all whitespace removed.
  function matchesLoose(text) {
    return !!regexLoose && !!text && regexLoose.test(compact(text));
  }

  function imageSrc(img) {
    const s = img.currentSrc || img.src;
    return s && /^(https?:|data:image)/.test(s) ? s : null;
  }

  function checkImage(img) {
    if (!enabled || !regexLoose || ocrSeen.has(img)) return;
    if (!img.complete) {
      img.addEventListener('load', () => checkImage(img), { once: true });
      return;
    }
    if (img.naturalWidth < MIN_W || img.naturalHeight < MIN_H) return;
    const src = imageSrc(img);
    if (!src) return;
    ocrSeen.add(img);

    if (ocrResults.has(src)) {
      if (ocrResults.get(src)) { hide(pickContainer(img)); ocrActive.add(img); }
      return;
    }
    if (ocrRequested >= MAX_OCR_PER_PAGE) return;
    ocrRequested++;

    try {
      chrome.runtime.sendMessage({ type: 'ocr', url: src }, (res) => {
        if (chrome.runtime.lastError || !res) return;
        const hit = matchesLoose(res.text);
        ocrResults.set(src, hit);
        if (hit && img.isConnected && enabled) {
          hide(pickContainer(img));
          ocrActive.add(img);
        }
      });
    } catch (_) { /* extension reloaded */ }
  }

  function scanImages(root) {
    if (!regexLoose || !root) return;
    if (root.nodeType === Node.ELEMENT_NODE) {
      if (root.tagName === 'IMG') checkImage(root);
      else if (root.querySelectorAll) root.querySelectorAll('img').forEach(checkImage);
    }
  }

  function unhideAll() {
    document.querySelectorAll(`[${HIDDEN_ATTR}]`).forEach((el) => el.removeAttribute(HIDDEN_ATTR));
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
    if (!enabled || !regex) return;
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
  function applySettings(s) {
    enabled = s.enabled !== false;
    const list = Array.isArray(s.keywords) ? s.keywords : DEFAULT_KEYWORDS;
    regex = buildRegex(list);
    regexLoose = buildLooseRegex(list);
    ocrResults.clear(); // keywords changed: re-evaluate images
    ocrRequested = 0;
    if (enabled && regex) rescanAll();
    else unhideAll();
  }

  chrome.storage.sync.get({ enabled: true, keywords: null }, (s) => {
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
    chrome.storage.sync.get({ enabled: true, keywords: DEFAULT_KEYWORDS }, applySettings);
  });
})();
