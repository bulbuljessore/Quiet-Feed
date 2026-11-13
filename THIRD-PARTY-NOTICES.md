# Third-party notices

The files in `vendor/` are unmodified third-party components used for on-device text recognition (OCR).

| Component | Files | Version | License | Source |
|---|---|---|---|---|
| tesseract.js | `vendor/tesseract.min.js`, `vendor/worker.min.js` | 5.1.1 | Apache-2.0 | https://github.com/naptha/tesseract.js |
| tesseract.js-core | `vendor/tesseract-core-simd-lstm.wasm.js` | 5.1.1 | Apache-2.0 | https://github.com/naptha/tesseract.js-core |
| Tesseract language data (fast) | `vendor/lang/ben.traineddata`, `vendor/lang/eng.traineddata` | tessdata_fast | Apache-2.0 | https://github.com/tesseract-ocr/tessdata_fast |

Apache License 2.0: https://www.apache.org/licenses/LICENSE-2.0

A copy of the tesseract.js license is in `vendor/TESSERACT-LICENSE.md`.

To verify the files are unmodified, run `npm install tesseract.js@5.1.1 tesseract.js-core@5.1.1`
and compare `node_modules/tesseract.js/dist/{tesseract.min.js,worker.min.js}` and
`node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js` with the files in `vendor/`.
