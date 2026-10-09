/**
 * Inventaire phonologique utilisé par les transcriptions de référence.
 *
 * Chaque phonème est identifié par un seul caractère Unicode (forme NFC),
 * emprunté à une translittération savante (proche DIN 31635). Ces identifiants
 * ne sont PAS ce que l'utilisateur doit taper : ils servent de représentation
 * interne neutre. La façon de les écrire dépend du profil de translittération.
 */

export const CONSONANTS = [
  'ʾ', 'b', 't', 'ṯ', 'j', 'ḥ', 'ḫ', 'd', 'ḏ', 'r', 'z', 's', 'š', 'ṣ',
  'ḍ', 'ṭ', 'ẓ', 'ʿ', 'ġ', 'f', 'q', 'k', 'l', 'm', 'n', 'h', 'w', 'y',
] as const

export const SHORT_VOWELS = ['a', 'i', 'u'] as const
export const LONG_VOWELS = ['ā', 'ī', 'ū'] as const

export type Consonant = (typeof CONSONANTS)[number]
export type ShortVowel = (typeof SHORT_VOWELS)[number]
export type LongVowel = (typeof LONG_VOWELS)[number]
export type Phoneme = Consonant | ShortVowel | LongVowel

export const PHONEMES: readonly Phoneme[] = [...CONSONANTS, ...SHORT_VOWELS, ...LONG_VOWELS]

const PHONEME_SET = new Set<string>(PHONEMES)
const CONSONANT_SET = new Set<string>(CONSONANTS)

export function isPhoneme(c: string): c is Phoneme {
  return PHONEME_SET.has(c)
}

export function isConsonant(p: Phoneme): p is Consonant {
  return CONSONANT_SET.has(p)
}

/** Couples voyelle brève / voyelle longue, pour signaler les erreurs de durée. */
export const LENGTH_PAIRS: Record<ShortVowel | LongVowel, ShortVowel | LongVowel> = {
  a: 'ā', i: 'ī', u: 'ū',
  ā: 'a', ī: 'i', ū: 'u',
}
