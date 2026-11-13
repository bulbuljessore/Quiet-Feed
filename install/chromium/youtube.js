// YouTube channel filter.
//   mode "block": hide everything from blocked channels (cards, comments, watch/channel pages)
//   mode "only" : hide everything except channels the user allowed
(() => {
  'use strict';

  const ATTR = 'data-srk-yt-hidden';
  const DEFAULT_YT = {
    mode: 'block',            // 'off' | 'block' | 'only'
    blocked: [],              // channels (handle, id or name)
    allowed: [],
    blockedWords: [],         // words matched in a video's title or channel name (e.g. football, cartoon)
    allowedWords: [],         // only mode: a video is kept when its title/channel name has one of these (e.g. education)
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
  let lang = 'bn';
  // adult filter (separate from the channel lists; needs adult-terms.js)
  let adultOn = false;
  let allowReveal = true;
  let adultRegex = null;
  const SHOWN = 'data-srk-yt-shown';
  const placeholders = new WeakMap(); // card -> placeholder element

  // ---------- helpers ----------
  function norm(s) {
    if (!s) return '';
    let t = String(s);
    try { t = decodeURIComponent(t); } catch (_) { /* keep raw */ }
    return t.normalize('NFC').trim().replace(/^@/, '').toLowerCase();
  }

  let blockedRe = null;
  let allowedRe = null;

  // Latin words match from the start of a word ("kid" matches "kids" but not "skid");
  // Bengali and other scripts match anywhere in the text.
  function buildWordRegex(words) {
    const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = (words || []).map((k) => String(k).normalize('NFC').trim()).filter(Boolean).map((k) => {
      const body = k.split(/\s+/).map(esc).join('\\s+');
      return /^[\x00-\x7F]+$/.test(k) ? '(?<![A-Za-z0-9])' + body : body;
    });
    return parts.length ? new RegExp(parts.join('|'), 'iu') : null;
  }

  function buildKeys() {
    blockedKeys = (cfg.blocked || []).map(norm).filter(Boolean);
    allowedKeys = (cfg.allowed || []).map(norm).filter(Boolean);
    blockedRe = buildWordRegex(cfg.blockedWords);
    allowedRe = buildWordRegex(cfg.allowedWords);
  }

  function buildAdultRegex() {
    const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = ADULT_TERMS.map((k) => k.normalize('NFC').trim()).filter(Boolean).map((k) => {
      const body = k.split(/\s+/).map(esc).join('\\s*');
      return /^[\x00-\x7F]+$/.test(k) ? '(?<![A-Za-z])' + body + '(?![A-Za-z])' : body;
    });
    adultRegex = parts.length ? new RegExp(parts.join('|'), 'iu') : null;
  }
  const isAdultText = (t) => !!(adultOn && adultRegex && t && adultRegex.test(t.normalize('NFC')));

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
    if (cfg.mode !== 'block' && cfg.mode !== 'only') return false;
    const info = channelOf(card);
    const text = ((info.name || '') + ' ' + titleOf(card)).normalize('NFC');

    // blocked channels and blocked words apply in both modes (blocked always wins)
    if (blockedKeys.length && keyMatches(info, blockedKeys)) return true;
    if (blockedRe && blockedRe.test(text)) return true;

    if (cfg.mode === 'block') {
      if (cfg.relatedByName && blockedKeys.length) {
        const t = titleOf(card);
        if (t && blockedKeys.some((k) => k.length >= 3 && t.includes(k))) return true;
      }
      return false;
    }

    // only mode: keep a video when its channel is allowed, or its title/channel name has an allowed word
    if (!allowedKeys.length && !allowedRe) return false; // empty allow-list: don't blank the whole site
    if (cfg.showRelatedInOnly && card.closest(RELATED_AREA)) return false;
    if (hasChannel(info) && keyMatches(info, allowedKeys)) return false;
    if (allowedRe && allowedRe.test(text)) return false;
    return true;
  }

  function setHidden(el, hide) {
    if (hide) { if (!el.hasAttribute(ATTR)) el.setAttribute(ATTR, '1'); }
    else if (el.hasAttribute(ATTR)) el.removeAttribute(ATTR);
  }

  // 'user' = hidden by the channel lists, 'adult' = hidden by the adult filter, null = visible
  function cardVerdict(card) {
    if (shouldHideCard(card)) return 'user';
    if (adultOn) {
      const info = channelOf(card);
      if (isAdultText((info.name || '') + ' ' + titleOf(card))) return 'adult';
    }
    return null;
  }

  function setPlaceholder(card, need) {
    const existing = placeholders.get(card);
    if (!need) {
      if (existing) { existing.remove(); placeholders.delete(card); }
      return;
    }
    if (existing && existing.isConnected) return;
    const ph = document.createElement('div');
    ph.setAttribute('data-srk-yt-ph', '1');
    const msg = document.createElement('span');
    msg.textContent = lang === 'en' ? 'Adult content hidden' : 'প্রাপ্তবয়স্ক কনটেন্ট লুকানো হয়েছে';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = lang === 'en' ? 'Show' : 'দেখুন';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.setAttribute(SHOWN, '1');
      run();
    });
    ph.append(msg, btn);
    if (card.parentNode) card.parentNode.insertBefore(ph, card);
    placeholders.set(card, ph);
  }

  function filterCards() {
    document.querySelectorAll(CARD).forEach((card) => {
      // evaluate only the outermost card (rich-item wraps lockup etc.)
      if (card.parentElement && card.parentElement.closest(CARD)) return;
      let v = cardVerdict(card);
      if (v === 'adult' && card.hasAttribute(SHOWN)) v = null; // the user chose to see it
      setHidden(card, !!v);
      setPlaceholder(card, v === 'adult' && allowReveal);
    });

    // hide shelves whose cards are all hidden
    document.querySelectorAll(SHELF).forEach((shelf) => {
      const cards = shelf.querySelectorAll(CARD);
      if (!cards.length) return;
      const allHidden = Array.from(cards).every((c) =>
        (c.hasAttribute(ATTR) || c.closest(`[${ATTR}]`)) && !placeholders.has(c));
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

  // returns 'user' (channel lists), 'adult' (adult filter) or null
  // channel name plus, on a watch page, the video title (document.title is "(n) Title - YouTube")
  function currentPageText(info) {
    let t = info.name || '';
    if (location.pathname === '/watch') {
      t += ' ' + document.title.replace(/^\(\d+\)\s*/, '').replace(/\s*-\s*YouTube$/, '');
    }
    return t.normalize('NFC');
  }

  function pageBlockReason(info) {
    if (!info) return null;
    if (cfg.mode === 'block' || cfg.mode === 'only') {
      if (blockedKeys.length && keyMatches(info, blockedKeys)) return 'user';
      if (blockedRe && blockedRe.test(currentPageText(info))) return 'user';
    }
    if (cfg.mode === 'only' && (allowedKeys.length || allowedRe)) {
      const ok = keyMatches(info, allowedKeys) || (allowedRe && allowedRe.test(currentPageText(info)));
      if (!ok) return 'user';
    }
    if (adultOn && isAdultText(info.name)) return 'adult';
    return null;
  }

  function removeOverlay() {
    const o = document.getElementById('srk-yt-overlay');
    if (o) o.remove();
  }

  function showOverlay(reason) {
    if (document.getElementById('srk-yt-overlay')) return;
    const o = document.createElement('div');
    o.id = 'srk-yt-overlay';
    const box = document.createElement('div');
    const msg = document.createElement('p');
    const en = lang === 'en';
    msg.textContent = reason === 'adult'
      ? (en ? 'This channel looks like adult content, so it was blocked.' : 'এই চ্যানেলটি প্রাপ্তবয়স্ক কনটেন্টের মনে হচ্ছে, তাই ব্লক করা হয়েছে।')
      : cfg.mode === 'only'
        ? (en ? 'This video or channel does not match your allowed list.' : 'এই ভিডিও বা চ্যানেল আপনার অনুমোদিত তালিকার সাথে মেলে না।')
        : (en ? 'You blocked this video or channel.' : 'এই ভিডিও বা চ্যানেল আপনি ব্লক করেছেন।');
    const back = document.createElement('button');
    back.textContent = en ? '← Go back' : '← ফিরে যান';
    back.addEventListener('click', () => history.back());
    const once = document.createElement('button');
    once.className = 'srk-secondary';
    once.textContent = en ? 'Show this once' : 'এবারের জন্য দেখুন';
    once.addEventListener('click', () => { bypassHref = location.href; run(); });
    box.append(msg, back);
    if (reason !== 'adult' || allowReveal) box.append(once); // adult overlay: reveal only if the user allows it
    o.appendChild(box);
    document.documentElement.appendChild(o);
  }

  function handlePage() {
    const reason = bypassHref !== location.href ? pageBlockReason(pageChannel()) : null;
    const blocked = !!reason;
    pageIsBlocked = blocked;
    if (blocked) {
      document.querySelectorAll('video').forEach((v) => { try { v.pause(); } catch (_) { /* noop */ } });
      showOverlay(reason);
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
    document.querySelectorAll(`[${SHOWN}]`).forEach((el) => el.removeAttribute(SHOWN));
    document.querySelectorAll('[data-srk-yt-ph]').forEach((el) => el.remove());
    pageIsBlocked = false;
    removeOverlay();
  }

  function run() {
    if (cfg.mode === 'off' && !adultOn) { clearAll(); return; }
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
    [data-srk-yt-ph] { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 6px 0; padding: 8px 12px;
      border: 1px dashed #999; border-radius: 8px; background: rgba(128,128,128,.12); color: inherit; font: 13px/1.4 system-ui, sans-serif; }
    [data-srk-yt-ph] button { padding: 4px 12px; border: 0; border-radius: 6px; background: #c62828; color: #fff; font: inherit; cursor: pointer; }
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
  function applyAdult(a) {
    a = a || {};
    adultOn = a.on === true;
    allowReveal = a.allowReveal !== false;
    if (adultOn && !adultRegex) buildAdultRegex();
  }

  function applyCfg(yt) {
    cfg = { ...DEFAULT_YT, ...(yt || {}) };
    bypassHref = null;
    buildKeys();
    clearAll();
    run();
  }

  chrome.storage.sync.get({ yt: null, lang: 'bn', adult: null }, (s) => {
    lang = s.lang;
    applyAdult(s.adult);
    applyCfg(s.yt);
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (changes.lang) { lang = changes.lang.newValue; removeOverlay(); run(); }
    if (changes.adult) {
      applyAdult(changes.adult.newValue);
      clearAll();
      run();
    }
    if (changes.yt) applyCfg(changes.yt.newValue);
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
