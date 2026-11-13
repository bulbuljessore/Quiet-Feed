// Runs Tesseract OCR (Bengali + English) entirely locally. Nothing leaves the browser.
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
      workerBlobURL: false // blob: workers are blocked by extension CSP
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
  if (!msg || msg.target !== 'offscreen') return;
  // one image at a time keeps CPU and memory low
  queue = queue.then(() => recognize(msg.url)).then((text) => sendResponse({ text }));
  return true;
});
