// Blur mode: images and videos are blurred until you click them.
// Works on all sites ("all") or only on sites you pick ("sites").
(() => {
  'use strict';

  const ROOT_ATTR = 'data-srk-blur-on';
  const OK_ATTR = 'data-srk-ok';   // set on tiny icons and on items the user revealed
  const MIN_NATURAL = 48;          // skip icons/emojis smaller than this
  const MEDIA = 'img, video';

  let active = false;
  let observing = false;

  // The blur itself is pure CSS, so nothing flashes unblurred while scripts run.
  const style = document.createElement('style');
  style.textContent = `
    html[${ROOT_ATTR}] img:not([${OK_ATTR}]),
    html[${ROOT_ATTR}] video:not([${OK_ATTR}]) {
      filter: blur(24px) !important;
      cursor: pointer !important;
    }`;
  (document.head || document.documentElement).appendChild(style);

  function hostMatches(sites) {
    const host = location.hostname.toLowerCase();
    return (sites || []).some((s) => {
      const d = String(s).trim().toLowerCase().replace(/^www\./, '');
      return d && (host === d || host === 'www.' + d || host.endsWith('.' + d));
    });
  }

  // Mark small icons as fine so only real pictures stay blurred.
  function evaluate(el) {
    if (el.hasAttribute(OK_ATTR)) return;
    if (el.tagName === 'IMG') {
      if (!el.complete) {
        el.addEventListener('load', () => evaluate(el), { once: true });
        el.addEventListener('error', () => el.setAttribute(OK_ATTR, '1'), { once: true });
        return;
      }
      if (el.naturalWidth && (el.naturalWidth < MIN_NATURAL || el.naturalHeight < MIN_NATURAL)) {
        el.setAttribute(OK_ATTR, '1');
      }
    }
  }

  function evaluateTree(root) {
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    if (root.matches && root.matches(MEDIA)) evaluate(root);
    if (root.querySelectorAll) root.querySelectorAll(MEDIA).forEach(evaluate);
  }

  // ---------- watch for new images ----------
  const pending = new Set();
  let timer = null;
  const observer = new MutationObserver((muts) => {
    for (const m of muts) m.addedNodes.forEach((n) => pending.add(n));
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        const nodes = Array.from(pending);
        pending.clear();
        nodes.forEach((n) => n.isConnected && evaluateTree(n));
      }, 120);
    }
  });

  // ---------- click to reveal ----------
  function isBlurred(el) {
    return !!el && el.nodeType === 1 && el.matches && el.matches(MEDIA) &&
      !el.hasAttribute(OK_ATTR) && document.documentElement.hasAttribute(ROOT_ATTR);
  }

  document.addEventListener('click', (e) => {
    if (!active) return;
    // overlays often sit above the picture, so look at everything under the pointer
    const stack = document.elementsFromPoint ? document.elementsFromPoint(e.clientX, e.clientY) : [e.target];
    const target = stack.find(isBlurred);
    if (!target) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    target.setAttribute(OK_ATTR, '1');
  }, true);

  // ---------- settings ----------
  function apply(s) {
    const blur = s.blur || { all: false, sites: [] };
    active = s.enabled !== false && (blur.all === true || hostMatches(blur.sites));
    if (active) {
      document.documentElement.setAttribute(ROOT_ATTR, '1');
      if (!observing) {
        observing = true;
        observer.observe(document.documentElement, { childList: true, subtree: true });
      }
      evaluateTree(document.documentElement);
    } else {
      document.documentElement.removeAttribute(ROOT_ATTR);
    }
  }

  const read = (cb) => chrome.storage.sync.get({ enabled: true, blur: null }, cb);
  read(apply);
  chrome.storage.onChanged.addListener((_c, area) => { if (area === 'sync') read(apply); });
})();
