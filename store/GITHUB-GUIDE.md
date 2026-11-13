# GitHub-এ আপলোড গাইড

## আগে ঠিক করে নিন
1. `LICENSE` ফাইলে `YOUR NAME` এর জায়গায় আপনার নাম (বা ছদ্মনাম) বসান।
2. `store/PRIVACY-POLICY.md`-এর শেষে ইমেইল বসান, বা ইমেইল না দিতে চাইলে ওই লাইনটা মুছে দিন। GitHub-এ ইমেইল না দিয়ে Issues ব্যবহার করাই নিরাপদ।
3. ফোল্ডারের নাম `quiet-feed` করে নিন (Claude বন্ধ থাকা অবস্থায় rename করুন)।
4. `node build.js` চালিয়ে `dist/`-এ নতুন ZIP বানিয়ে নিন।

## রিপোতে কোন ফাইলগুলো যাবে
সব যাবে, শুধু `dist/` আর `store/screenshots/src/` বাদে (`.gitignore` এটা নিজে বাদ দেয়)।
ZIP ফাইল রিপোতে না রেখে **Release**-এ দেওয়া হয়, নিচে দেখুন।

## পদ্ধতি ক: ওয়েবসাইট দিয়ে (সবচেয়ে সহজ)
1. https://github.com/new এ যান। Repository name: `quiet-feed`। Public বেছে নিন। README/.gitignore/license চাপবেন না (আমাদের আছে)। **Create repository**।
2. পেজে **uploading an existing file** লিংক চাপুন।
3. ফোল্ডারের ভেতরের সব ফাইল ও ফোল্ডার (`dist` বাদে) টেনে এনে ছেড়ে দিন। একবারে সর্বোচ্চ ১০০টা ফাইল যায়; আমাদের প্রায় ৪০টা।
   - `.gitignore` লুকানো ফাইল। File Explorer-এ View → Show → Hidden items চালু করুন, না হলে ওটা আলাদাভাবে আপলোড করুন।
4. নিচে commit মেসেজ "Initial release" লিখে **Commit changes**।

## পদ্ধতি খ: git কমান্ড দিয়ে
GitHub-এ খালি রিপো বানিয়ে (উপরের ধাপ ১) তারপর প্রজেক্ট ফোল্ডারে:

```bash
git init -b main
git add .
git commit -m "Initial release"
git remote add origin https://github.com/YOUR-USERNAME/quiet-feed.git
git push -u origin main
```

## Release বানানো (ডাউনলোডের জন্য ZIP)
1. রিপোর ডান পাশে **Releases → Create a new release**।
2. Tag: `v1.0.0`, Title: `Quiet Feed 1.0.0`।
3. **Attach binaries** এ `dist/quiet-feed-chromium.zip` আর `dist/quiet-feed-firefox.zip` দুটোই দিন। **নাম বদলাবেন না**: README-র ডাউনলোড বাটন `releases/latest/download/` লিংকে ঠিক এই নামের ফাইল খোঁজে।
4. বিবরণে নিচের লেখাটা দিন, তারপর **Publish release**।

```
প্রথম প্রকাশ।
- কীওয়ার্ড ফিল্টার, ছবির ভেতরের লেখা (OCR), YouTube চ্যানেল ব্লক ও শুধু-দেখাও মোড, ঝাপসা মোড।
- Chrome, Edge, Brave, Opera, Vivaldi, Arc: quiet-feed-chromium.zip Extract করে "Load unpacked" দিন।
- Firefox: quiet-feed-firefox.zip, about:debugging থেকে অস্থায়ীভাবে লোড হয়।
ইনস্টলের ধাপ README-তে আছে।
```

## রিপোর সাজসজ্জা
- About (ডান পাশে গিয়ার) → Description: "Hide posts, comments, images and YouTube channels by keyword. Bengali + English. Runs fully on-device."
- Topics: `chrome-extension`, `firefox-addon`, `content-filter`, `keyword-blocker`, `youtube`, `bengali`, `ocr`
- Settings → General → Features থেকে Issues চালু রাখুন।

## আপডেটের বিজ্ঞপ্তি কীভাবে কাজ করে
Extension প্রায় প্রতি ১২ ঘণ্টায় `https://api.github.com/repos/bulbuljessore/Quiet-Feed/releases/latest` দেখে। সেখানকার tag (যেমন `v1.1.0`) Extension-এর `manifest.json`-এর `version`-এর চেয়ে বড় হলে popup-এ ব্যানার আর আইকনে NEW চিহ্ন আসে।
- Release-এর tag অবশ্যই `v` + সংস্করণ হতে হবে (যেমন manifest-এ `1.1.0` হলে tag `v1.1.0`)।
- Release-টা **Pre-release** বা **Draft** করবেন না, নইলে `latest` হিসেবে ধরা পড়বে না।
- রিপো Public থাকতে হবে।
- ZIP থেকে লোড করা Extension নিজে নিজে আপডেট হতে পারে না; ব্যবহারকারীকে নতুন ZIP নামিয়ে Reload করতে হয়। পুরোপুরি স্বয়ংক্রিয় আপডেট চাইলে স্টোরে দিতে হবে।

## নতুন সংস্করণ দিতে
1. `manifest.json` আর `build-firefox/manifest.json`-এ `version` বাড়ান।
2. `node build.js`।
3. কোড পুশ করুন, নতুন tag দিয়ে নতুন Release বানিয়ে নতুন ZIP দিন।

## মনে রাখবেন
- ব্যবহারকারীর জন্য ইনস্টল ঝামেলাপূর্ণ: Developer mode চালু করতে হয়, আর Firefox-এ প্রতিবার browser চালু করলে আবার লোড করতে হয়। স্টোরে না দিলে এটাই সীমাবদ্ধতা। README-তে এটা পরিষ্কার লেখা আছে।
- Repo public হলে ওই সময়ে কোডে থাকা সব কিছু সবাই দেখবে। কোথাও ব্যক্তিগত তথ্য নেই কিনা শেষবার দেখে নিন (আমি একবার খুঁজে দেখেছি)।
