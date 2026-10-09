export interface SurahInfo {
  name: string
  arabic: string
}

/** Noms des sourates présentes dans le corpus (translittération précise). */
export const SURAHS: Record<number, SurahInfo> = {
  1: { name: 'al-Fātiḥa', arabic: 'الفاتحة' },
  103: { name: 'al-ʿAṣr', arabic: 'العصر' },
  108: { name: 'al-Kawṯar', arabic: 'الكوثر' },
  109: { name: 'al-Kāfirūn', arabic: 'الكافرون' },
  112: { name: 'al-Iḫlāṣ', arabic: 'الإخلاص' },
  113: { name: 'al-Falaq', arabic: 'الفلق' },
  114: { name: 'an-Nās', arabic: 'الناس' },
}

export function surahName(n: number): string {
  return SURAHS[n]?.name ?? `Sourate ${n}`
}
