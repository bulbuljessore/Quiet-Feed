// YouTube channel filter.
//   mode "block": hide everything from blocked channels (cards, comments, watch/channel pages)
//   mode "only" : hide everything except channels the user allowed
(() => {
  'use strict';

  const ATTR = 'data-srk-yt-hidden';
  const DEFAULT_YT = {
    mode: 'block',            // 'off' | 'block' | 'only'
    blocked: [],
    allowed: [],
    relatedByName: true,      // block mode: also hide videos whose title mentions a blocked channel
    showRelatedInOnly: false  // only mode: keep the "related videos" sidebar on watch pages
  };

  const CARD = [
    'ytd-video-renderer', 'ytd-rich-item-renderer', 'ytd-compact-video-renderer',
    'ytd-grid-video-renderer', 'ytd-reel-item-renderer', 'ytd-channel-renderer',
    'ytd-playlist-renderer', 'ytd-compact-radio-renderer', 'ytd-compact-playlist-renderer',
    'yt-lockup-view-model', 'ytm-shorts-lockup-view-model', 'ytm-shorts-lockup-view-model-v2'
  ].join(',');
  const SHELF = 'ytd-rich-section-renderer, ytd-reel-shelf-renderer, ytd-shelf-renderer';
  const COMMENT = 'ytd-comment-thread-renderer, ytd-comment-view-model, ytd-comment-renderer';
  const RELATED_AREA = 'ytd-watch-flexy #secondary, #related, ytd-watch-next-secondary-results-renderer';
  const TITLE_SEL = '#video-title, a#video-title-link, h3, .yt-lockup-metadata-view-model-wiz__title, .yt-lockup-metadata-view-model__title, a[title]';

  let cfg = { ...DEFAULT_YT };
  let blockedKeys = [];
  let allowedKeys = [];
  let bypassHref = null;
  let pageIsBlocked = false;

  // ---------- helpers ----------
  function norm(s) {
    if (!s) return '';
    let t = String(s);
    try { t = decodeURIComponent(t); } catch (_) { /* keep raw */ }
    return t.normalize('NFC').trim().replace(/^@/, '').toLowerCase();
  }

  function buildKeys() {
    blockedKeys = (cfg.blocked || []).map(norm).filter(Boolean);
    allowedKeys = (cfg.allowed || []).map(norm).filter(Boolean);
  }

  function channelFromAnchor(a) {
    if (!/(^|\.)youtube\.com$/.test(a.hostname)) return null;
    const p = a.pathname;
    let m;
    if ((m = p.match(/^\/@([^/]+)/))) return { handle: norm(m[1]) };
    if ((m = p.match(/^\/channel\/([^/]+)/))) return { id: norm(m[1]) };
    if ((m = p.match(/^\/(?:c|user)\/([^/]+)/))) return { handle: norm(m[1]) };
    return null;
  }

  function channelOf(root) {
    const info = { handle: null, id: null, name: null };
    for (const a of root.querySelectorAll('a[href]')) {
      const c = channelFromAnchor(a);
      if (!c) continue;
      info.handle = info.handle || c.handle || null;
      info.id = info.id || c.id || null;
      const t = a.textContent.trim();
      if (t && !info.name) info.name = norm(t);
    }
    if (!info.name) {
      const n = root.querySelector('ytd-channel-name, #channel-name');
      if (n && n.textContent.trim()) info.name = norm(n.textContent);
    }
    return info;
  }

  const hasChannel = (i) => !!(i && (i.handle || i.id || i.name));
  const keyMatches = (i, keys) =>
    !!i && keys.some((k) => i.handle === k || i.id === k || i.name === k);

  function titleOf(card) {
    const el = card.querySelector(TITLE_SEL);
    if (!el) return '';
    return (el.getAttribute('title') || el.textContent || '').normalize('NFC').toLowerCase();
  }

  // ---------- cards & comments ----------
  function shouldHideCard(card) {
    const info = channelOf(card);
    if (cfg.mode === 'block') {
      if (!blockedKeys.length) return false;
      if (keyMatches(info, blockedKeys)) return true;
      if (cfg.relatedByName) {
        const t = titleOf(card);
        if (t && blockedKeys.some((k) => k.length >= 3 && t.includes(k))) return true;
      }
      return false;
    }
    if (cfg.mode === 'only') {
      if (!allowedKeys.length) return false; // empty allow-list: don't blank the whole site
      if (cfg.showRelatedInOnly && card.closest(RELATED_AREA)) return false;
      return !(hasChannel(info) && keyMatches(info, allowedKeys));
    }
    return false;
  }

  function setHidden(el, hide) {
    if (hide) { if (!el.hasAttribute(ATTR)) el.setAttribute(ATTR, '1'); }
    else if (el.hasAttribute(ATTR)) el.removeAttribute(ATTR);
  }

  function filterCards() {
    document.querySelectorAll(CARD).forEach((card) => {
      // evaluate only the outermost card (rich-item wraps lockup etc.)
      if (card.parentElement && card.parentElement.closest(CARD)) return;
      setHidden(card, shouldHideCard(card));
    });

    // hide shelves whose cards are all hidden
    document.querySelectorAll(SHELF).forEach((shelf) => {
      const cards = shelf.querySelectorAll(CARD);
      if (!cards.length) return;
      const allHidden = Array.from(cards).every((c) => c.hasAttribute(ATTR) || c.closest(`[${ATTR}]`));
      setHidden(shelf, allHidden);
    });
  }

  function filterComments() {
    document.querySelectorAll(COMMENT).forEach((c) => {
      let hide = false;
      if (cfg.mode === 'block' && blockedKeys.length) {
        const author = c.querySelector('#author-text');
        if (author) {
          const info = { handle: null, id: null, name: norm(author.textContent) };
          const ch = author.matches('a') ? channelFromAnchor(author) : null;
          if (ch) { info.handle = ch.handle || null; info.id = ch.id || null; }
          hide = keyMatches(info, blockedKeys);
        }
      }
      setHidden(c, hide);
    });
  }

  // ---------- current page (watch / shorts / channel) ----------
  function pageChannel() {
    const p = location.pathname;
    let info = null;
    if (/^\/(@|channel\/|c\/|user\/)/.test(p)) {
      info = { handle: null, id: null, name: null };
      let m;
      if ((m = p.match(/^\/@([^/]+)/))) info.handle = norm(m[1]);
      else if ((m = p.match(/^\/channel\/([^/]+)/))) info.id = norm(m[1]);
      else if ((m = p.match(/^\/(?:c|user)\/([^/]+)/))) info.handle = norm(m[1]);
      const h = document.querySelector('ytd-channel-name yt-formatted-string, #channel-name yt-formatted-string, #channel-header-container h1');
      if (h && h.textContent.trim()) info.name = norm(h.textContent);
    } else if (p === '/watch') {
      const owner = document.querySelector('ytd-watch-metadata #owner, ytd-video-owner-renderer, #owner');
      if (owner) info = channelOf(owner);
    } else if (p.startsWith('/shorts/')) {
      const reel = document.querySelector('ytd-reel-video-renderer[is-active]');
      if (reel) info = channelOf(reel);
    }
    return hasChannel(info) ? info : null;
  }

  function pageShouldBeBlocked(info) {
    if (!info) return false;
    if (cfg.mode === 'block') return blockedKeys.length > 0 && keyMatches(info, blockedKeys);
    if (cfg.mode === 'only') return allowedKeys.length > 0 && !keyMatches(info, allowedKeys);
    return false;
  }

  function removeOverlay() {
    const o = document.getElementById('srk-yt-overlay');
    if (o) o.remove();
  }

  function showOverlay() {
    if (document.getElementById('srk-yt-overlay')) return;
    const o = document.createElement('div');
    o.id = 'srk-yt-overlay';
    const box = document.createElement('div');
    const msg = document.createElement('p');
    msg.textContent = cfg.mode === 'only'
      ? 'এই চ্যানেল আপনার অনুমোদিত তালিকায় নেই।'
      : 'এই চ্যানেল আপনি ব্লক করেছেন।';
    const back = document.createElement('button');
    back.textContent = '← ফিরে যান';
    back.addEventListener('click', () => history.back());
    const once = document.createElement('button');
    once.className = 'srk-secondary';
    once.textContent = 'এবারের জন্য দেখুন';
    once.addEventListener('click', () => { bypassHref = location.href; run(); });
    box.append(msg, back, once);
    o.appendChild(box);
    document.documentElement.appendChild(o);
  }

  function handlePage() {
    const blocked = bypassHref !== location.href && pageShouldBeBlocked(pageChannel());
    pageIsBlocked = blocked;
    if (blocked) {
      document.querySelectorAll('video').forEach((v) => { try { v.pause(); } catch (_) { /* noop */ } });
      showOverlay();
    } else {
      removeOverlay();
    }
  }

  // keep a blocked video from auto-playing
  document.addEventListener('play', (e) => {
    if (pageIsBlocked && e.target && e.target.tagName === 'VIDEO') {
      try { e.target.pause(); } catch (_) { /* noop */ }
    }
  }, true);

  // ---------- main loop ----------
  function clearAll() {
    document.querySelectorAll(`[${ATTR}]`).forEach((el) => el.removeAttribute(ATTR));
    pageIsBlocked = false;
    removeOverlay();
  }

  function run() {
    if (cfg.mode === 'off') { clearAll(); return; }
    filterCards();
    filterComments();
    handlePage();
  }

  let timer = null;
  function schedule() {
    if (timer) return;
    timer = setTimeout(() => { timer = null; run(); }, 300);
  }

  const style = document.createElement('style');
  style.textContent = `
    [${ATTR}] { display: none !important; }
    #srk-yt-overlay {
      position: fixed; inset: 0; z-index: 2147483647;
      display: flex; align-items: center; justify-content: center;
      background: #111; color: #fff;
      font: 16px/1.5 "Noto Sans Bengali", "Segoe UI", system-ui, sans-serif;
    }
    #srk-yt-overlay > div { text-align: center; padding: 24px; }
    #srk-yt-overlay p { font-size: 20px; margin: 0 0 16px; }
    #srk-yt-overlay button {
      margin: 0 6px; padding: 10px 18px; border: 0; border-radius: 8px;
      background: #c62828; color: #fff; font: inherit; cursor: pointer;
    }
    #srk-yt-overlay button.srk-secondary { background: #3a3a3a; }
  `;
  (document.head || document.documentElement).appendChild(style);

  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('yt-navigate-finish', schedule);
  document.addEventListener('yt-page-data-updated', schedule);

  // ---------- settings & popup messages ----------
  function applyCfg(yt) {
    cfg = { ...DEFAULT_YT, ...(yt || {}) };
    bypassHref = null;
    buildKeys();
    clearAll();
    run();
  }

  chrome.storage.sync.get({ yt: null }, (s) => applyCfg(s.yt));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.yt) applyCfg(changes.yt.newValue);
  });

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || msg.type !== 'yt-current-channel') return;
    const i = pageChannel();
    if (!i) { sendResponse(null); return; }
    sendResponse({
      value: i.handle ? '@' + i.handle : (i.id || i.name),
      label: i.name || i.handle || i.id
    });
  });
})();
