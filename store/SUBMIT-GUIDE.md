# কীভাবে Submit করবেন

## প্যাকেজ
`dist/` ফোল্ডারে দুটো ZIP আছে (`node build.js` চালালে নতুন করে তৈরি হয়):

| ফাইল | কোথায় দেবেন |
|---|---|
| `quiet-feed-chromium.zip` | Chrome Web Store, Microsoft Edge Add-ons, Opera Add-ons |
| `quiet-feed-firefox.zip` | Firefox Add-ons (AMO) |

Brave, Vivaldi, Arc আলাদা স্টোর চালায় না। ওগুলোর ব্যবহারকারীরা Chrome Web Store থেকেই ইনস্টল করেন, তাই আলাদা submit লাগবে না।

## শুরুর আগে বানিয়ে নিন
1. **স্ক্রিনশট**: কমপক্ষে ১টা, ১২৮০×৮০০ (বা ৬৪০×৪০০) PNG/JPG। popup-এর YouTube ট্যাব, কীওয়ার্ড ট্যাব আর কোনো পেজে ফিল্টারের আগে-পরে তুলুন।
2. **Privacy policy-র পাবলিক লিংক**: `PRIVACY-POLICY.md` GitHub Pages / Gist / Google Docs (Publish to web) এ রেখে লিংক নিন। নিচে আপনার ইমেইল বসিয়ে নিন।
3. **Small promo tile** (Chrome-এ ঐচ্ছিক, ৪৪০×২৮০): আইকন ও নাম দিয়ে বানানো একটা সাধারণ ছবি।
4. listing-এর লেখা সব `STORE-LISTING.md` থেকে নিন।

> ছবি নিয়ে: স্ক্রিনশট বা promo ছবিতে কোনো বাস্তব ব্যক্তির ছবি রাখবেন না (নিচের "রিজেক্ট হওয়ার কারণ" দেখুন)।

## ১. Chrome Web Store
1. https://chrome.google.com/webstore/devconsole এ Google অ্যাকাউন্টে ঢুকুন। প্রথমবার $5 রেজিস্ট্রেশন ফি দিতে হয়।
2. **New item** → `quiet-feed-chromium.zip` আপলোড।
3. **Store listing** ট্যাব: নাম, বিবরণ, ক্যাটাগরি, ভাষা, স্ক্রিনশট, আইকন (128px আইকন প্যাকেজেই আছে)।
4. **Privacy** ট্যাব: `STORE-LISTING.md`-এর নিচের অংশ থেকে Single purpose, Permission justifications, Remote code, Data usage আর Privacy policy URL দিন।
5. **Distribution**: Public (বা Unlisted, যদি শুধু লিংক দিয়ে শেয়ার করতে চান), দেশ বাছুন।
6. **Submit for review**। সাধারণত কয়েক দিন, সব সাইটের permission থাকায় এক-দুই সপ্তাহও লাগতে পারে।

## ২. Microsoft Edge Add-ons
1. https://partner.microsoft.com/dashboard/microsoftedge/overview এ Microsoft অ্যাকাউন্ট দিয়ে ঢুকুন (ফ্রি)।
2. **Create new extension** → একই Chromium ZIP আপলোড।
3. Availability, Properties (ক্যাটাগরি, privacy policy লিংক), Store listings (বিবরণ, স্ক্রিনশট) পূরণ করুন।
4. Notes for certification-এ Chrome-এর "Single purpose" লেখাটা দিন। **Publish**।

## ৩. Opera Add-ons
1. https://addons.opera.com/developer/ এ অ্যাকাউন্ট খুলুন (ফ্রি)।
2. **Upload extension** → একই Chromium ZIP।
3. বিবরণ, স্ক্রিনশট, ক্যাটাগরি দিয়ে submit। Opera moderator ম্যানুয়ালি দেখে।

## ৪. Firefox Add-ons (AMO)
1. https://addons.mozilla.org/developers/ এ Firefox অ্যাকাউন্ট দিয়ে ঢুকুন (ফ্রি, 2FA চালু করতে হয়)।
2. **Submit a New Add-on** → **On this site** (সবার জন্য পাবলিক) → `quiet-feed-firefox.zip` আপলোড।
3. স্বয়ংক্রিয় validation চলবে। `tesseract` ফাইলে ৫টা warning দেখাবে (eval সম্পর্কিত), এগুলো ব্লক করে না।
4. "Do you need to submit source code?" প্রশ্নে **No** বলা যায়, কারণ আমাদের নিজের কোড মিনিফাই করা নয়। তবে Notes to Reviewer-এ `STORE-LISTING.md`-এর নিচের ইংরেজি লেখাটা পেস্ট করুন, এতে লাইব্রেরি যাচাই সহজ হয়।
5. নাম, summary, বিবরণ, ক্যাটাগরি, স্ক্রিনশট, support email, privacy policy লিংক, license (যেমন MIT) দিন।
6. Submit। Firefox-এ সাধারণত স্বয়ংক্রিয় চেক পাস করলেও ম্যানুয়াল review পরে হয়, আর ফাইল বড় বলে কিছু দিন লাগতে পারে।

Firefox-এর জন্য মনে রাখবেন: ইনস্টলের সময় সব ওয়েবসাইট অ্যাক্সেসের অনুমতি চাইবে। ব্যবহারকারী না দিলে Extension কাজ করবে না।

## রিজেক্ট হলে সাধারণ কারণ
- **নামে বা ছবিতে নির্দিষ্ট ব্যক্তি**: কারো নাম, ছবি বা পরিচয় নিয়ে হয়রানির মতো মনে হলে স্টোর রিজেক্ট করে। তাই নাম, listing ও স্ক্রিনশটে কোনো বাস্তব ব্যক্তির উল্লেখ রাখা হয়নি। Extension-এ আগে থেকে দেওয়া কোনো নামও নেই; ব্যবহারকারী নিজে যা যোগ করে সেটাই ফিল্টার হয়।
- **Permission-এর কারণ অস্পষ্ট**: সব সাইটের permission কেন লাগে সেটা Privacy ট্যাবে পরিষ্কার লিখুন (লেখা তৈরি আছে)।
- **Privacy policy লিংক কাজ করে না বা নেই**।

## পরে আপডেট দিতে
1. `manifest.json` আর `build-firefox/manifest.json`-এ `version` বাড়ান (যেমন 1.0.1)।
2. `node build.js` চালান।
3. প্রতিটা স্টোরের ড্যাশবোর্ডে নতুন ZIP আপলোড করুন।
