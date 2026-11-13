# GitHub Release – v1.3.0 (copy and paste)

**Tag:** `v1.3.0`
**Title:** `Quiet Feed 1.3.0`
**Attach exactly these two files (do not rename them):**
- `dist/quiet-feed-chromium.zip`
- `dist/quiet-feed-firefox.zip`

**Set as the latest release.** Do not tick "pre-release". The download buttons in the README (`releases/latest/download/...`) and the in-extension update notice both depend on this.

---

## Description (paste into the release box)

### বাংলা

**Quiet Feed 1.3.0**

**কোনটা নামাবেন:**
- **Chrome, Edge, Brave, Opera, Vivaldi, Arc:** `quiet-feed-chromium.zip`
- **Firefox:** `quiet-feed-firefox.zip`

নতুন কী:
- **YouTube:** চ্যানেল ছাড়াও ভিডিওর শিরোনাম বা চ্যানেলের নামের **শব্দ** দিয়ে ব্লক বা অনুমোদন (যেমন `education`, `football`)। "শুধু এগুলো দেখাও" মোডে অনুমোদিত শব্দ মিললেই দেখায়।
- **প্রিসেট:** শিশু ৩–৬ বছর শিক্ষা, শিশু ৭–১২ বছর শিক্ষা, ফুটবল/কার্টুন/গেম ব্লক।
- ঠিক করা: অনুমোদিত চ্যানেলের তালিকায় বিষয় (যেমন "education") লিখলে YouTube ফাঁকা হয়ে যেত।
- ডাউনলোড সহজ: দুই ধরনের browser-এর জন্য দুটো আলাদা, পরিষ্কার নামের ZIP।

**ইনস্টল:** ZIP Extract করুন। Chromium browser-এ Extensions পেজে **Developer mode** চালু করে **Load unpacked** দিয়ে ফোল্ডারটা বাছুন। Firefox-এ `about:debugging#/runtime/this-firefox` থেকে **Load Temporary Add-on** দিয়ে ZIP বা `manifest.json` বাছুন (browser বন্ধ করলে চলে যায়)।
**আপডেট:** নতুন ZIP পুরনো ফোল্ডারের উপর Extract করে Extensions পেজে **Reload** চাপুন। সেটিংস থেকে যায়।

> এটা শিশুর নিরাপত্তার নিশ্চয়তা নয়, শিরোনামের শব্দ দিয়ে কাজ করে। শিশুদের জন্য YouTube Kids বা সুপারভাইজড অ্যাকাউন্টও ব্যবহার করুন।

### English

**Quiet Feed 1.3.0**

**Which file to download:**
- **Chrome, Edge, Brave, Opera, Vivaldi, Arc:** `quiet-feed-chromium.zip`
- **Firefox:** `quiet-feed-firefox.zip`

What's new:
- **YouTube:** block or allow by **words** in a video title or channel name (e.g. `education`, `football`), not only by channel. In "show only" mode a video is shown when an allowed word matches.
- **Presets:** Kids 3–6 learning, Kids 7–12 education, block football / cartoons / games.
- Fixed: typing a topic such as "education" into the allowed-channels list blanked YouTube.
- Easier download: one clearly named ZIP per browser family.

**Install:** extract the ZIP. Chromium browsers: Extensions page, turn on **Developer mode**, **Load unpacked**, choose the folder. Firefox: `about:debugging#/runtime/this-firefox`, **Load Temporary Add-on**, choose the ZIP or `manifest.json` (removed when Firefox closes).
**Update:** extract the new ZIP over the old folder and press **Reload** on the Extensions page. Your settings are kept.

> This is not a child-safety guarantee: it works from title words. For children also use YouTube Kids or a supervised account.

**SHA-256**
```
5cb036b829a6d7acc7d4fe65cd7c52917a39fd4f7cefd70bdb28c3eb06776752  quiet-feed-chromium.zip
34e0ddc126d800f4832d1b54218293458ff8756c2b070bbc4cb02667d199945b  quiet-feed-firefox.zip
```
