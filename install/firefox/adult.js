// Adult-site blocker: replaces the page with a notice when the site is on the adult list.
// Needs adult-terms.js loaded first (see manifest).
(() => {
  'use strict';

  const host = location.hostname.toLowerCase();
  const isAdultHost =
    ADULT_HOST_PATTERN.test(host) ||
    ADULT_DOMAINS.some((d) => host === d || host.endsWith('.' + d));
  if (!isAdultHost) return; // every normal site exits here immediately

  // the user chose "show anyway" for this site in this tab
  try { if (sessionStorage.getItem('srk-adult-ok') === host) return; } catch (_) { /* storage blocked */ }

  const ID = 'srk-adult-overlay';
  let shown = false;

  function show(lang, allowReveal) {
    if (shown) return;
    shown = true;
    try { window.stop(); } catch (_) { /* noop */ }

    const en = lang === 'en';
    const style = document.createElement('style');
    style.textContent = `
      html { overflow: hidden !important; }
      html > body > *:not(#${ID}), body > *:not(#${ID}) { display: none !important; }
      #${ID} {
        position: fixed; inset: 0; z-index: 2147483647;
        display: flex; align-items: center; justify-content: center; text-align: center;
        background: #111; color: #fff; padding: 24px;
        font: 17px/1.6 "Noto Sans Bengali", "Segoe UI", system-ui, sans-serif;
      }
      #${ID} p { font-size: 20px; margin: 0 0 16px; }
      #${ID} small { display: block; color: #aaa; margin-bottom: 18px; }
      #${ID} button {
        padding: 10px 20px; border: 0; border-radius: 8px;
        background: #c62828; color: #fff; font: inherit; cursor: pointer;
      }`;
    const box = document.createElement('div');
    box.id = ID;
    const inner = document.createElement('div');
    const p = document.createElement('p');
    p.textContent = en
      ? 'This website is on the adult-content list, so it was blocked.'
      : 'এই ওয়েবসাইটটি প্রাপ্তবয়স্ক কনটেন্টের তালিকায় আছে, তাই ব্লক করা হয়েছে।';
    const small = document.createElement('small');
    small.textContent = en
      ? 'You can turn this off in Quiet Feed > Adult.'
      : 'Quiet Feed > প্রাপ্তবয়স্ক ট্যাব থেকে এটা বন্ধ করতে পারবেন।';
    const back = document.createElement('button');
    back.textContent = en ? '← Go back' : '← ফিরে যান';
    back.addEventListener('click', () => {
      if (history.length > 1) history.back(); else location.href = 'about:blank';
    });
    inner.append(p, small, back);
    if (allowReveal) {
      const once = document.createElement('button');
      once.style.cssText = 'margin-left:10px;background:#3a3a3a';
      once.textContent = en ? 'Show anyway (this tab)' : 'তবুও দেখুন (এই ট্যাবে)';
      once.addEventListener('click', () => {
        try { sessionStorage.setItem('srk-adult-ok', host); } catch (_) { /* noop */ }
        location.reload();
      });
      inner.append(once);
    }
    box.appendChild(inner);

    document.documentElement.append(style, box);
    document.querySelectorAll('video, audio').forEach((m) => { try { m.pause(); } catch (_) { /* noop */ } });
  }

  function check(s) {
    const a = s.adult || {};
    if (s.enabled !== false && a.on === true && a.blockSites !== false) show(s.lang, a.allowReveal !== false);
  }

  chrome.storage.sync.get({ enabled: true, adult: null, lang: 'bn' }, check);
  chrome.storage.onChanged.addListener((c, area) => {
    if (area === 'sync' && shown && (c.adult || c.enabled)) location.reload(); // re-evaluate after a setting change
  });
})();
