/** UI string dictionary — English / Sinhala / Tamil (NFR-11).
 *  Keys are namespaced by area. Missing translations fall back to English. */
export type Lang = 'en' | 'si' | 'ta';

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
];

export const DICT: Record<string, Record<Lang, string>> = {
  'nav.discover': { en: 'Discover', si: 'සොයන්න', ta: 'கண்டறிக' },
  'nav.myBusiness': { en: 'My Business', si: 'මගේ ව්‍යාපාරය', ta: 'எனது வணிகம்' },
  'nav.admin': { en: 'Admin', si: 'පරිපාලක', ta: 'நிர்வாகி' },
  'nav.signin': { en: 'Sign in', si: 'පිවිසෙන්න', ta: 'உள்நுழை' },

  'home.title': {
    en: 'Find where to eat — with menus you can trust.',
    si: 'විශ්වාස කළ හැකි මෙනු සමඟ — කෑමට තැනක් සොයන්න.',
    ta: 'நம்பகமான மெனுக்களுடன் — சாப்பிட இடம் கண்டறியுங்கள்.',
  },
  'home.subtitle': {
    en: 'Real prices, real photos, live open/busy status — kept fresh by the owners themselves.',
    si: 'සැබෑ මිල, සැබෑ ඡායාරූප, සජීවී විවෘත/කාර්යබහුල තත්ත්වය — හිමිකරුවන් විසින්ම යාවත්කාලීන කරයි.',
    ta: 'உண்மையான விலைகள், உண்மையான படங்கள், நேரடி நிலை — உரிமையாளர்களால் புதுப்பிக்கப்படுகிறது.',
  },
  'home.searchPlaceholder': {
    en: 'Search a dish or place…',
    si: 'කෑමක් හෝ ස්ථානයක් සොයන්න…',
    ta: 'உணவு அல்லது இடத்தைத் தேடுங்கள்…',
  },
  'common.search': { en: 'Search', si: 'සොයන්න', ta: 'தேடு' },
  'common.veg': { en: 'Veg', si: 'නිර්මාංශ', ta: 'சைவம்' },
  'common.openNow': { en: 'Open now', si: 'දැන් විවෘතයි', ta: 'இப்போது திறந்துள்ளது' },
  'common.moreFilters': { en: 'More filters', si: 'තවත් පෙරහන්', ta: 'மேலும் வடிப்பான்கள்' },
  'common.reviews': { en: 'Reviews', si: 'සමාලෝචන', ta: 'மதிப்புரைகள்' },
  'common.menu': { en: 'Menu', si: 'මෙනුව', ta: 'மெனு' },

  'live.open': { en: 'Open', si: 'විවෘතයි', ta: 'திறந்துள்ளது' },
  'live.busy': { en: 'Busy', si: 'කාර්යබහුලයි', ta: 'பரபரப்பாக' },
  'live.closed': { en: 'Closed', si: 'වසා ඇත', ta: 'மூடப்பட்டது' },

  'admin.title': { en: 'Admin', si: 'පරිපාලක', ta: 'நிர்வாகி' },
  'admin.queue': { en: 'Approval queue', si: 'අනුමත පෝලිම', ta: 'ஒப்புதல் வரிசை' },
  'admin.users': { en: 'Users', si: 'පරිශීලකයෝ', ta: 'பயனர்கள்' },
  'admin.reports': { en: 'Reports', si: 'වාර්තා', ta: 'புகார்கள்' },

  'owner.title': { en: 'My Business', si: 'මගේ ව්‍යාපාරය', ta: 'எனது வணிகம்' },
  'owner.reviewsReceived': {
    en: 'Reviews received',
    si: 'ලැබුණු සමාලෝචන',
    ta: 'பெறப்பட்ட மதிப்புரைகள்',
  },
};

export function translate(key: string, lang: Lang): string {
  return DICT[key]?.[lang] ?? DICT[key]?.en ?? key;
}
