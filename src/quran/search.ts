import { SURAH_LIST, type SurahInfo } from '../data/surahs'

/** Latin : sans accents ni signes (ʿ ʾ ' -), voyelles doublées réduites (Faatiha = Fātiḥa). */
function foldLatin(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[ʿʾ'’`\-\s]/g, '')
    .replace(/([aeiou])\1+/g, '$1')
}

/** Arabe : sans voyelles ni signes, alif unifié, ة = ه, ى = ي, article ال facultatif. */
function foldArabic(s: string): string {
  return s
    .normalize('NFC')
    .replace(/[ً-ٰٟۖ-ۭـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, '')
}

const stripArticleLatin = (s: string) => s.replace(/^(a[lnrstdzš]|aṯ|aḏ|aṭ|aḍ|aẓ|aṣ)-/i, '')
const stripArticleArabic = (s: string) => s.replace(/^ال/, '')

interface Indexed {
  surah: SurahInfo
  latin: string[]
  arabic: string
}

const INDEX: Indexed[] = SURAH_LIST.map((s) => ({
  surah: s,
  latin: [s.name, stripArticleLatin(s.name), s.tanzilName, stripArticleLatin(s.tanzilName), s.french].map(foldLatin),
  arabic: stripArticleArabic(foldArabic(s.arabic)),
}))

/** Sourates correspondant à la recherche (numéro, nom arabe, translittération ou nom français). */
export function searchSurahs(query: string): SurahInfo[] {
  const q = query.trim()
  if (!q) return [...SURAH_LIST]
  if (/^\d+$/.test(q)) return SURAH_LIST.filter((s) => String(s.number).startsWith(q))
  if (/[؀-ۿ]/.test(q)) {
    const a = stripArticleArabic(foldArabic(q))
    return INDEX.filter((i) => i.arabic.includes(a)).map((i) => i.surah)
  }
  const l = foldLatin(q)
  const starts = INDEX.filter((i) => i.latin.some((x) => x.startsWith(l)))
  const contains = INDEX.filter((i) => !starts.includes(i) && i.latin.some((x) => x.includes(l)))
  return [...starts, ...contains].map((i) => i.surah)
}
