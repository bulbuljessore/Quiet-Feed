// Popup translations. Bengali is the default, English is the second option.
const I18N = {
  bn: {
    toggleTitle: 'সব ফিল্টার চালু / বন্ধ',
    tabKw: 'কীওয়ার্ড',
    tabYt: 'YouTube',
    tabAdult: 'প্রাপ্তবয়স্ক',
    adultTitle: 'প্রাপ্তবয়স্ক কনটেন্ট ফিল্টার',
    adultOn: 'প্রাপ্তবয়স্ক কনটেন্ট ফিল্টার চালু করো',
    adultSites: 'প্রাপ্তবয়স্ক ওয়েবসাইট ব্লক করো',
    adultSafe: 'Google, Bing ও DuckDuckGo-তে SafeSearch জোর করে চালু রাখো',
    adultReveal: 'লুকানো কনটেন্টে "দেখুন" বাটন রাখো (বন্ধ করলে কড়া মোড)',
    adultHint: 'চালু করলে এই শব্দগুলো থাকা পোস্ট, কমেন্ট, লেখা ও ছবির লেখা লুকানো হয়, পরিচিত প্রাপ্তবয়স্ক সাইট ব্লক হয়, আর সার্চে SafeSearch চালু থাকে।',
    adultLimit: 'সীমাবদ্ধতা: এটা শব্দ ও সাইটের তালিকা দিয়ে কাজ করে, ছবি দেখে চেনে না। তাই কিছু কনটেন্ট বাদ পড়তে পারে। ছবির জন্য কীওয়ার্ড ট্যাবের ঝাপসা মোডও চালু রাখতে পারেন।',
    kwPlaceholder: 'নাম বা শব্দ লিখুন...',
    add: 'যোগ করুন',
    kwEmpty: 'কোনো কীওয়ার্ড নেই।',
    kwHint: 'পোস্ট, কমেন্ট, লেখা আর ছবির ভেতরের লেখায় এগুলো মিললে লুকানো হয়।',
    blurTitle: 'ছবি ঝাপসা (Blur)',
    blurAll: 'সব সাইটে সব ছবি ও ভিডিও ঝাপসা রাখো',
    blurSiteDefault: 'এই সাইটে ঝাপসা করো',
    blurSiteOn: '{host}: ঝাপসা বন্ধ করো',
    blurSiteOff: '{host}: ঝাপসা করো',
    blurHint: 'ঝাপসা ছবিতে ক্লিক করলে সেটা দেখা যাবে।',
    ytMode: 'YouTube মোড',
    modeOff: 'বন্ধ',
    modeBlock: 'এই চ্যানেলগুলো ব্লক করো',
    modeOnly: 'শুধু এই চ্যানেলগুলো দেখাও',
    blockedTitle: 'ব্লক করা চ্যানেল',
    chPlaceholder: '@handle, চ্যানেলের নাম বা লিংক',
    block: 'ব্লক',
    blockedEmpty: 'কোনো চ্যানেল ব্লক করা নেই।',
    relatedByName: 'যেসব ভিডিওর শিরোনামে ব্লক করা চ্যানেলের নাম আছে, সেগুলোও লুকাও',
    allowedTitle: 'অনুমোদিত চ্যানেল',
    addShort: 'যোগ',
    allowedEmpty: 'তালিকা খালি, তাই এখনো কিছু লুকানো হচ্ছে না।',
    showRelated: 'ভিডিও দেখার পেজে "Related" ভিডিও দেখাও',
    curNone: 'YouTube-এর ভিডিও বা চ্যানেল পেজে থাকলে এখান থেকে সরাসরি যোগ করতে পারবেন।',
    curLabel: 'বর্তমান পেজের চ্যানেল: {name}',
    curBlock: 'ব্লকে যোগ',
    curAllow: 'অনুমোদিতে যোগ',
    footHint: 'পরিবর্তন সাথে সাথে সব ট্যাবে কাজ করে।',
    count: 'এই পেজে {n}টি লুকানো হয়েছে',
    updAvail: 'নতুন সংস্করণ {v} পাওয়া গেছে',
    updGet: 'ডাউনলোড',
    updHow: 'ZIP নামিয়ে আগের ফোল্ডারে Extract করুন (ফাইল বদলে দিন), তারপর Extensions পেজে Quiet Feed-এর Reload চাপুন।',
    updCheck: 'নতুন সংস্করণ আছে কিনা নিজে থেকে দেখো (GitHub-এ একটা অজ্ঞাতনামা অনুরোধ যায়, আপনার কোনো তথ্য নয়)',
    version: 'সংস্করণ {v}',
    removeAria: 'মুছুন: {x}'
  },
  en: {
    toggleTitle: 'Turn all filters on / off',
    tabKw: 'Keywords',
    tabYt: 'YouTube',
    tabAdult: 'Adult',
    adultTitle: 'Adult content filter',
    adultOn: 'Turn on the adult content filter',
    adultSites: 'Block adult websites',
    adultSafe: 'Force SafeSearch on Google, Bing and DuckDuckGo',
    adultReveal: 'Keep a "Show" button on hidden items (turn off for strict mode)',
    adultHint: 'When on, posts, comments, articles and image text containing these words are hidden, known adult sites are blocked, and search engines are kept in SafeSearch.',
    adultLimit: 'Limitation: it works from word and site lists and does not recognize pictures, so some content can slip through. For images you can also turn on Blur mode on the Keywords tab.',
    kwPlaceholder: 'Type a name or word...',
    add: 'Add',
    kwEmpty: 'No keywords yet.',
    kwHint: 'Posts, comments, text and text inside images that match are hidden.',
    blurTitle: 'Blur images',
    blurAll: 'Blur all images and videos on every site',
    blurSiteDefault: 'Blur on this site',
    blurSiteOn: '{host}: turn blur off',
    blurSiteOff: '{host}: blur',
    blurHint: 'Click a blurred picture to reveal it.',
    ytMode: 'YouTube mode',
    modeOff: 'Off',
    modeBlock: 'Block these channels',
    modeOnly: 'Show only these channels',
    blockedTitle: 'Blocked channels',
    chPlaceholder: '@handle, channel name or link',
    block: 'Block',
    blockedEmpty: 'No channels blocked.',
    relatedByName: 'Also hide videos whose title mentions a blocked channel',
    allowedTitle: 'Allowed channels',
    addShort: 'Add',
    allowedEmpty: 'The list is empty, so nothing is hidden yet.',
    showRelated: 'Show "Related" videos on the watch page',
    curNone: 'On a YouTube video or channel page you can add its channel from here.',
    curLabel: 'Channel on this page: {name}',
    curBlock: 'Add to blocked',
    curAllow: 'Add to allowed',
    footHint: 'Changes apply to all tabs immediately.',
    count: '{n} hidden on this page',
    updAvail: 'New version {v} is available',
    updGet: 'Download',
    updHow: 'Download the ZIP, extract it over your old folder (replace the files), then press Reload on Quiet Feed in the Extensions page.',
    updCheck: 'Check for new versions automatically (sends one anonymous request to GitHub, no personal data)',
    version: 'Version {v}',
    removeAria: 'Remove: {x}'
  }
};

let LANG = 'bn';

function setLangValue(l) {
  LANG = I18N[l] ? l : 'bn';
  document.documentElement.lang = LANG;
}

function t(key, vars) {
  let s = (I18N[LANG] && I18N[LANG][key]) || I18N.bn[key] || key;
  if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(String(vars[k]));
  return s;
}

// data-i18n -> text, data-i18n-ph -> placeholder, data-i18n-title -> title
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
}
