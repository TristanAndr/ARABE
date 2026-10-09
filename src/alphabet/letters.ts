/**
 * Les 28 lettres de l'alphabet arabe (حُرُوفُ الهِجَاءِ), dans l'ordre alphabétique usuel
 * (hijāʾī) : ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي.
 *
 * Seul le caractère de base (bloc Unicode arabe standard, jamais une « forme de présentation »)
 * est stocké. Les formes positionnelles sont construites avec le tatwīl (ـ) : c'est la police
 * qui dessine la bonne forme, exactement comme dans un mot. Une seule donnée détermine les
 * formes disponibles : la lettre se lie-t-elle à la suivante ? Toutes se lient à la précédente.
 *
 * Le son et l'explication de prononciation viennent de la table des lettres des paramètres
 * (src/translit/letters.ts), pour qu'il n'y ait qu'une seule description par lettre.
 */
import { LETTER_GROUPS } from '../translit/letters'
import type { Phoneme } from '../translit/phonemes'

export const TATWEEL = 'ـ'

/** Les six lettres qui ne se lient jamais à la lettre suivante. */
export const NON_CONNECTORS = ['ا', 'د', 'ذ', 'ر', 'ز', 'و'] as const

interface LetterSource {
  letter: string
  /** Nom usuel, translittéré (lettres pointées : ḥ, ṣ, ḍ, ṭ, ẓ ; ʿ = ʿayn, ʾ = hamza). */
  name: string
  /** Nom en arabe, vocalisé. */
  nameAr: string
  /** Indication de prononciation courte pour un francophone. */
  sound: string
}

const SOURCE: LetterSource[] = [
  { letter: 'ا', name: 'Alif', nameAr: 'أَلِف', sound: 'â long, ou support de la hamza' },
  { letter: 'ب', name: 'Bāʾ', nameAr: 'بَاء', sound: 'b' },
  { letter: 'ت', name: 'Tāʾ', nameAr: 'تَاء', sound: 't' },
  { letter: 'ث', name: 'Thāʾ', nameAr: 'ثَاء', sound: 'th anglais de « think »' },
  { letter: 'ج', name: 'Jīm', nameAr: 'جِيم', sound: 'dj' },
  { letter: 'ح', name: 'Ḥāʾ', nameAr: 'حَاء', sound: 'h soufflé, gorge serrée' },
  { letter: 'خ', name: 'Khāʾ', nameAr: 'خَاء', sound: 'kh, jota espagnole' },
  { letter: 'د', name: 'Dāl', nameAr: 'دَال', sound: 'd' },
  { letter: 'ذ', name: 'Dhāl', nameAr: 'ذَال', sound: 'th anglais de « this »' },
  { letter: 'ر', name: 'Rāʾ', nameAr: 'رَاء', sound: 'r roulé' },
  { letter: 'ز', name: 'Zāy', nameAr: 'زَاي', sound: 'z' },
  { letter: 'س', name: 'Sīn', nameAr: 'سِين', sound: 's (toujours sourd)' },
  { letter: 'ش', name: 'Shīn', nameAr: 'شِين', sound: 'ch' },
  { letter: 'ص', name: 'Ṣād', nameAr: 'صَاد', sound: 's emphatique' },
  { letter: 'ض', name: 'Ḍād', nameAr: 'ضَاد', sound: 'd emphatique' },
  { letter: 'ط', name: 'Ṭāʾ', nameAr: 'طَاء', sound: 't emphatique' },
  { letter: 'ظ', name: 'Ẓāʾ', nameAr: 'ظَاء', sound: 'th de « this », emphatique' },
  { letter: 'ع', name: 'ʿAyn', nameAr: 'عَيْن', sound: 'ʿ : serrement de la gorge, sans équivalent' },
  { letter: 'غ', name: 'Ghayn', nameAr: 'غَيْن', sound: 'gh, r grasseyé' },
  { letter: 'ف', name: 'Fāʾ', nameAr: 'فَاء', sound: 'f' },
  { letter: 'ق', name: 'Qāf', nameAr: 'قَاف', sound: 'q, k du fond de la gorge' },
  { letter: 'ك', name: 'Kāf', nameAr: 'كَاف', sound: 'k' },
  { letter: 'ل', name: 'Lām', nameAr: 'لَام', sound: 'l' },
  { letter: 'م', name: 'Mīm', nameAr: 'مِيم', sound: 'm' },
  { letter: 'ن', name: 'Nūn', nameAr: 'نُون', sound: 'n' },
  { letter: 'ه', name: 'Hāʾ', nameAr: 'هَاء', sound: 'h expiré, toujours prononcé' },
  { letter: 'و', name: 'Wāw', nameAr: 'وَاو', sound: 'w, ou û long' },
  { letter: 'ي', name: 'Yāʾ', nameAr: 'يَاء', sound: 'y, ou î long' },
]

export interface Letter extends LetterSource {
  /** Position dans l'alphabet, de 1 à 28. */
  index: number
  joinsNext: boolean
  /** Son de l'inventaire de translittération (null pour l'alif, qui n'a pas de son consonantique). */
  phoneme: Phoneme | null
  /** Explication détaillée de la prononciation (table des paramètres), éventuellement vide. */
  hint: string
}

const DETAILS = new Map(LETTER_GROUPS[0]!.rows.map((r) => [r.arabic, r]))
const NON_CONNECTING = new Set<string>(NON_CONNECTORS)

export const LETTERS: readonly Letter[] = SOURCE.map((s, i) => {
  const detail = DETAILS.get(s.letter)
  if (!detail) throw new Error(`Lettre absente de la table des sons : ${s.letter}`)
  return { ...s, index: i + 1, joinsNext: !NON_CONNECTING.has(s.letter), phoneme: detail.phoneme, hint: detail.hint }
})

export type Position = 'isolated' | 'initial' | 'medial' | 'final'

export const POSITIONS: { position: Position; label: string; note: string }[] = [
  { position: 'isolated', label: 'Isolée', note: 'écrite seule' },
  { position: 'initial', label: 'Initiale', note: 'liée à la suivante' },
  { position: 'medial', label: 'Médiane', note: 'liée des deux côtés' },
  { position: 'final', label: 'Finale', note: 'liée à la précédente' },
]

/**
 * Forme d'une lettre à une position, ou null si elle n'existe pas en écriture standard :
 * une lettre qui ne se lie pas à la suivante n'a ni forme initiale ni forme médiane (en début
 * ou au milieu d'un mot, elle prend sa forme isolée ou finale, et la lettre suivante repart).
 */
export function formOf(l: Letter, position: Position): string | null {
  switch (position) {
    case 'isolated':
      return l.letter
    case 'initial':
      return l.joinsNext ? l.letter + TATWEEL : null
    case 'medial':
      return l.joinsNext ? TATWEEL + l.letter + TATWEEL : null
    case 'final':
      return TATWEEL + l.letter
  }
}

export function letterAt(index: number): Letter {
  return LETTERS[(((index - 1) % LETTERS.length) + LETTERS.length) % LETTERS.length]!
}

/**
 * Lettres faciles à confondre : même tracé, distinguées seulement par les points, ou noms
 * presque identiques (Ḥāʾ / Hāʾ). Proposées en priorité comme mauvaises réponses.
 */
export const LOOKALIKES: readonly string[][] = [
  ['ب', 'ت', 'ث', 'ن', 'ي'],
  ['ج', 'ح', 'خ'],
  ['د', 'ذ'],
  ['ر', 'ز'],
  ['س', 'ش'],
  ['ص', 'ض'],
  ['ط', 'ظ'],
  ['ع', 'غ'],
  ['ف', 'ق'],
  ['ح', 'ه'],
]
