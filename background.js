// Relays OCR requests from content scripts to the offscreen document,
// which runs Tesseract (needs a DOM + workers).
// Works on Chrome, Edge, Brave, Opera, Vivaldi, Arc (any Chromium >= 109).
importScripts('safesearch.js', 'adblock.js', 'updatecheck.js'); // SafeSearch rules, ad blocker rules, update notifier

let creating = null;

async function hasOffscreen() {
  try {
    if (chrome.offscreen.hasDocument) return await chrome.offscreen.hasDocument();
    if (chrome.runtime.getContexts) {
      const ctx = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
      return ctx.length > 0;
    }
  } catch (_) { /* fall through */ }
  return false;
}

async function ensureOffscreen() {
  if (!chrome.offscreen) throw new Error('offscreen API unavailable');
  if (await hasOffscreen()) return;
  if (!creating) {
    creating = chrome.offscreen
      .createDocument({
        url: 'offscreen.html',
        reasons: ['WORKERS'],
        justification: 'Read text inside images locally to find keywords the user wants hidden.'
      })
      .catch((e) => {
        // another call may have created it first
        if (!/single offscreen/i.test(String(e && e.message))) throw e;
      })
      .finally(() => { creating = null; });
  }
  await creating;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== 'ocr' || typeof msg.url !== 'string') return;
  ensureOffscreen()
    .then(() => chrome.runtime.sendMessage({ target: 'offscreen', url: msg.url }))
    .then((r) => sendResponse(r || { text: '' }))
    .catch((e) => sendResponse({ text: '', error: String(e) })); // OCR just stays off
  return true; // async response
});
