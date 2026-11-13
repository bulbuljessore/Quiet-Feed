# Store Listing (সব স্টোরে কপি-পেস্ট করার জন্য)

## নাম
Quiet Feed – Keyword & Channel Filter

> নাম বদলাতে চাইলে `manifest.json` আর `firefox/manifest.json`-এর `"name"` পাল্টে `node build.js` চালান।
> Submit-এর আগে প্রতিটা স্টোরে নামটা আগে থেকে নেওয়া আছে কিনা সার্চ করে দেখে নিন।

## সংক্ষিপ্ত বিবরণ (Chrome: সর্বোচ্চ ১৩২ অক্ষর)
**English:** Hide posts, comments, images and YouTube channels that match the names and keywords you choose.
**বাংলা:** আপনার দেওয়া নাম বা কীওয়ার্ড মিললে সোশ্যাল মিডিয়া, ব্লগ ও YouTube-এর কনটেন্ট লুকিয়ে দেয়।

## বিস্তারিত বিবরণ

**English**

Quiet Feed is a personal content filter. You decide which names, words and YouTube channels you do not want to see, and the extension hides them for you on every website.

What it does
• Keyword filter: hides posts, comments and articles on Facebook, X, Reddit, blogs, news sites and any other page when they contain a word or name from your list.
• Text inside images: reads text in pictures (news cards, memes, screenshots) with a built-in Bengali + English OCR and hides the image if it matches. Everything runs on your device.
• YouTube channel blocker: block channels so their videos, Shorts, comments and channel pages disappear.
• "Only show" mode on YouTube: choose the channels you want and hide everything else.
• Related content control: optionally hide videos that mention a blocked channel in the title, or keep or hide the "Related" sidebar in only-show mode.
• Blur mode: blur all images and videos (on every site or only the sites you pick) and click a picture to reveal it.
• One-click add from the current YouTube video or channel page.
• Works with Bengali and English text.

Privacy
• No account, no tracking, no ads.
• Your lists are stored in your browser's own storage (synced by your browser account if sync is on).
• Image text recognition runs locally. No image or page content is sent anywhere.

**বাংলা**

Quiet Feed একটা ব্যক্তিগত ফিল্টার। কোন নাম, শব্দ বা YouTube চ্যানেল আপনি দেখতে চান না তা আপনি ঠিক করেন, আর Extension সব ওয়েবসাইটে সেগুলো লুকিয়ে দেয়।

কী কী করে
• কীওয়ার্ড ফিল্টার: Facebook, X, Reddit, ব্লগ, নিউজ সাইটসহ যেকোনো পেজে আপনার তালিকার শব্দ থাকলে সেই পোস্ট, কমেন্ট বা লেখা লুকিয়ে যায়।
• ছবির ভেতরের লেখা: বাংলা ও ইংরেজি OCR দিয়ে ছবির লেখা পড়ে, মিললে ছবি লুকায়। সব কাজ আপনার কম্পিউটারেই হয়।
• YouTube চ্যানেল ব্লক: ব্লক করা চ্যানেলের ভিডিও, Shorts, কমেন্ট ও চ্যানেল পেজ আর দেখা যায় না।
• YouTube-এ "শুধু এগুলো দেখাও" মোড: পছন্দের চ্যানেল বেছে নিন, বাকি সব লুকিয়ে যাবে।
• Related কনটেন্ট নিয়ন্ত্রণ: ব্লক করা চ্যানেলের নাম শিরোনামে থাকা ভিডিও লুকানো যায়, আর শুধু-দেখাও মোডে "Related" সাইডবার রাখা বা লুকানো যায়।
• ঝাপসা মোড: সব সাইটে বা শুধু বাছাই করা সাইটে ছবি ও ভিডিও ঝাপসা থাকে, ক্লিক করলে সেটা দেখা যায়।
• YouTube-এর ভিডিও বা চ্যানেল পেজ থেকে এক ক্লিকে চ্যানেল যোগ।

গোপনীয়তা
• অ্যাকাউন্ট, ট্র্যাকিং বা বিজ্ঞাপন নেই।
• আপনার তালিকা শুধু আপনার browser-এর storage-এ থাকে।
• ছবির লেখা পড়া আপনার ডিভাইসেই হয়। কোনো ছবি বা পেজের তথ্য কোথাও পাঠানো হয় না।

## ক্যাটাগরি
- Chrome: Productivity (বা Social & Communication)
- Edge: Productivity
- Firefox: Social & Communication / Privacy & Security
- Opera: Productivity

## ট্যাগ / কীওয়ার্ড
keyword blocker, content filter, mute words, hide posts, YouTube channel blocker, Bengali, ব্লক, ফিল্টার

---

# Chrome Web Store → Privacy ট্যাবের উত্তর

**Single purpose**
Hide web page content (text, images, YouTube videos and comments) that matches names, keywords or YouTube channels chosen by the user.

**Permission justifications**
- `storage`: Saves the user's keyword list, YouTube channel lists and on/off settings.
- `offscreen`: Runs the on-device OCR engine (a Web Worker) that reads text inside images so matching images can be hidden. No data leaves the device.
- Host permissions (`http://*/*`, `https://*/*`): The filter must run on any website or blog the user visits, and the extension must read image bytes from any site to run OCR. Content is processed locally.

**Remote code:** No, I am not using remote code. (All scripts, the OCR engine, WebAssembly and language data are bundled in the package.)

**Data usage:** Don't tick any collected-data category. Certify all three statements (no sale, no unrelated use, no creditworthiness use).

**Privacy policy URL:** `store/PRIVACY-POLICY.md` কোথাও পাবলিক করে (যেমন GitHub Pages বা Gist) তার লিংক দিন।

---

# Firefox (AMO) → Notes to Reviewer (Source code / explanation)

```
This extension runs a local OCR engine to read text inside images.
The files under vendor/ are unmodified third-party builds:
  - tesseract.min.js, worker.min.js : tesseract.js 5.1.1 (npm: tesseract.js@5.1.1, dist/)
  - tesseract-core-simd-lstm.wasm.js : tesseract.js-core 5.1.1 (npm: tesseract.js-core@5.1.1)
  - lang/ben.traineddata, lang/eng.traineddata : official models from
    https://github.com/tesseract-ocr/tessdata_fast
To verify: run `npm install tesseract.js@5.1.1 tesseract.js-core@5.1.1` and compare the files above byte-for-byte.
The web-ext lint warnings (DANGEROUS_EVAL, UNSAFE_VAR_ASSIGNMENT) are inside these unmodified
library files. The extension's own code (content.js, youtube.js, popup.js, background.js) is not minified.
No remote code is loaded and no network requests are made except fetching the page's own images to run OCR locally.
```
