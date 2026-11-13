// Built-in lists for the adult-content filter. Plain data, easy to edit.
// ADULT_TERMS   : words/phrases that hide a post, comment, article or image text
// ADULT_DOMAINS : well-known adult sites (subdomains included)
// ADULT_HOST_PATTERN : obvious adult host names and TLDs
var ADULT_TERMS = [
  // English (kept specific on purpose to avoid hiding ordinary news or health content)
  'porn', 'porno', 'pornhub', 'pornography', 'xxx video', 'xxx videos', 'nsfw', 'onlyfans',
  'sex video', 'sex videos', 'sex tape', 'sex chat', 'sex cam', 'sexting', 'sex story', 'sex stories',
  'nude', 'nudes', 'nude photo', 'nude photos', 'erotic', 'erotica', 'hentai', 'milf', 'blowjob',
  'handjob', 'camgirl', 'cam girl', 'webcam girl', 'live sex', 'adult video', 'adult videos',
  'adult content', 'uncensored video', 'leaked video', 'leaked nudes', 'escort service', 'call girl',
  'hot girls video', 'xvideos', 'xnxx', 'xhamster', 'redtube', 'youporn', 'brazzers', 'fapello',
  // Bengali
  'পর্ন', 'পর্নো', 'পর্নোগ্রাফি', 'ন্যুড', 'নগ্ন ছবি', 'নগ্ন ভিডিও', 'সেক্স ভিডিও', 'সেক্স চ্যাট',
  'ব্লু ফিল্ম', 'চটি গল্প', 'বাংলা চটি', 'এডাল্ট ভিডিও', 'এডাল্ট কনটেন্ট', 'আনসেন্সরড ভিডিও',
  'হট ভিডিও', 'ভাইরাল ভিডিও লিংক', 'লিক ভিডিও', 'ফাঁস হওয়া ভিডিও', 'কল গার্ল'
];

var ADULT_DOMAINS = [
  'pornhub.com', 'xvideos.com', 'xnxx.com', 'xhamster.com', 'redtube.com', 'youporn.com',
  'spankbang.com', 'eporner.com', 'tube8.com', 'porn.com', 'brazzers.com', 'chaturbate.com',
  'stripchat.com', 'livejasmin.com', 'bongacams.com', 'cam4.com', 'motherless.com',
  'tnaflix.com', 'beeg.com', 'thumbzilla.com', 'hqporner.com', 'rule34.xxx', 'e-hentai.org',
  'nhentai.net', 'hentaihaven.xxx', 'fapello.com', 'erome.com', 'xvideos2.com', 'xnxx2.com',
  'pornhubpremium.com', 'onlyfans.com', 'fansly.com', 'camsoda.com', 'myfreecams.com'
];

var ADULT_HOST_PATTERN = /(porn|xvideos|xnxx|xhamster|hentai)|\.(xxx|porn|sex|adult)$/i;
