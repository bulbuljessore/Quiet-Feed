// Firefox build: runs Tesseract OCR (Bengali + English) directly in the background
// page, because Firefox has no chrome.offscreen API. Everything stays local.
// vendor/tesseract.min.js is loaded before this file (see manifest "background.scripts").
const cache = new Map(); // url -> text
let workerPromise = null;
let queue = Promise.resolve();

function getWorker() {
  if (!workerPromise) {
    workerPromise = Tesseract.createWorker('ben+eng', 1, {
      workerPath: chrome.runtime.getURL('vendor/worker.min.js'),
      corePath: chrome.runtime.getURL('vendor/tesseract-core-simd-lstm.wasm.js'),
      langPath: chrome.runtime.getURL('vendor/lang'),
      gzip: false,
      workerBlobURL: false
    });
  }
  return workerPromise;
}

async function recognize(url) {
  if (cache.has(url)) return cache.get(url);
  let text = '';
  try {
    const res = await fetch(url, { credentials: 'omit' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const blob = await res.blob();
    if (!blob.type.startsWith('image/') || blob.size > 8 * 1024 * 1024) throw new Error('skip');
    const worker = await getWorker();
    const { data } = await worker.recognize(blob);
    text = data.text || '';
  } catch (_) {
    text = '';
  }
  if (cache.size > 500) cache.delete(cache.keys().next().value);
  cache.set(url, text);
  return text;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== 'ocr' || typeof msg.url !== 'string') return;
  queue = queue.then(() => recognize(msg.url)).then((text) => sendResponse({ text }));
  return true; // async response
});
