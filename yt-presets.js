// One-click word packs for the YouTube tab (used by the popup).
// "mode: only" packs switch YouTube to "show only these"; the other packs add blocked words.
// Words are matched in a video's title and its channel name. Edit freely: they are copied into the
// user's own lists, which can be changed or cleared at any time.
const YT_PRESETS = {
  kid: {
    mode: 'only',
    allowedWords: [
      'nursery', 'rhyme', 'rhymes', 'abc', 'alphabet', 'phonics', 'counting', 'numbers', '123',
      'colors', 'colours', 'shapes', 'preschool', 'kindergarten', 'toddler', 'learn', 'learning',
      'educational', 'education',
      'ছড়া', 'বর্ণমালা', 'অক্ষর', 'গণনা', 'রং', 'শিখি', 'শিক্ষা', 'শিক্ষামূলক'
    ]
  },
  school: {
    mode: 'only',
    allowedWords: [
      'education', 'educational', 'learn', 'learning', 'lesson', 'tutorial', 'science', 'experiment',
      'math', 'maths', 'mathematics', 'history', 'geography', 'space', 'nature', 'documentary',
      'how it works', 'english', 'grammar', 'coding', 'programming', 'drawing', 'art', 'craft',
      'শিক্ষা', 'শিক্ষামূলক', 'শেখা', 'শিখি', 'বিজ্ঞান', 'গণিত', 'অঙ্ক', 'ইতিহাস', 'ভূগোল', 'ইংরেজি', 'আঁকা', 'প্রকৃতি'
    ]
  },
  football: {
    blockedWords: [
      'football', 'soccer', 'fifa', 'premier league', 'champions league', 'la liga', 'messi', 'ronaldo', 'neymar',
      'ফুটবল', 'ফিফা'
    ]
  },
  cartoon: {
    blockedWords: ['cartoon', 'cartoons', 'anime', 'কার্টুন', 'অ্যানিমে', 'এনিমে']
  },
  games: {
    blockedWords: [
      'gameplay', 'gaming', 'minecraft', 'roblox', 'fortnite', 'pubg', 'free fire',
      'গেমপ্লে', 'গেমিং', 'ফ্রি ফায়ার'
    ]
  }
};
