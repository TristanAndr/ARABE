/**
 * Fiche de révision : le présent (الفِعْلُ الْمُضَارِعُ) d'un verbe régulier trilittère.
 *
 * Modèle unique : فَعَلَ / يَفْعَلُ (« faire »), voyelle fatha sur la 2e radicale au présent.
 * Toutes les formes sont construites à partir de leurs éléments (préfixe, radical, voyelle
 * finale, terminaison) : la fiche, la coloration et les exercices lisent ces mêmes données.
 * Aucune forme verbale complète n'est écrite ailleurs dans l'application.
 */

export const FATHA = 'َ'
export const DAMMA = 'ُ'
export const KASRA = 'ِ'
export const SUKUN = 'ْ'
export const TATWEEL = 'ـ'

export type FinalVowel = typeof FATHA | typeof DAMMA | typeof KASRA | typeof SUKUN

export const MODEL = {
  past: 'فَعَلَ',
  present: 'يَفْعَلُ',
  meaning: 'faire',
  root: ['ف', 'ع', 'ل'] as const,
  /** Radical du présent, stable dans les 14 formes : 1re radicale sans voyelle, fatha sur la 2e. */
  stem: 'فْعَل',
}

export type Person = 1 | 2 | 3
export type GrammaticalNumber = 'singulier' | 'duel' | 'pluriel'
export type Gender = 'masculin' | 'féminin' | 'commun'

export interface ConjugatedForm {
  /** Identifiant stable : personne, genre (m/f/c), nombre (s/d/p). */
  id: string
  person: Person
  number: GrammaticalNumber
  gender: Gender
  pronoun: string
  /** Pronom français ; `pronounNote` précise le genre quand le pronom arabe ne suffit pas. */
  pronounFr: string
  pronounNote?: string
  translation: string
  /** Préfixe du présent, avec sa voyelle. */
  prefix: string
  /** Voyelle portée par la 3e radicale (ل) : elle appartient à la terminaison. */
  finalVowel: FinalVowel
  /** Lettres ajoutées après le radical. */
  suffix: string
}

const form = (f: ConjugatedForm) => f

/** Ordre de la fiche : 1re, 2e puis 3e personne. */
export const FORMS: readonly ConjugatedForm[] = [
  form({ id: '1cs', person: 1, number: 'singulier', gender: 'commun', pronoun: 'أَنَا', pronounFr: 'je', translation: 'je fais', prefix: 'أَ', finalVowel: DAMMA, suffix: '' }),
  form({ id: '1cp', person: 1, number: 'pluriel', gender: 'commun', pronoun: 'نَحْنُ', pronounFr: 'nous', translation: 'nous faisons', prefix: 'نَ', finalVowel: DAMMA, suffix: '' }),

  form({ id: '2ms', person: 2, number: 'singulier', gender: 'masculin', pronoun: 'أَنْتَ', pronounFr: 'tu', pronounNote: 'masculin', translation: 'tu fais', prefix: 'تَ', finalVowel: DAMMA, suffix: '' }),
  form({ id: '2fs', person: 2, number: 'singulier', gender: 'féminin', pronoun: 'أَنْتِ', pronounFr: 'tu', pronounNote: 'féminin', translation: 'tu fais', prefix: 'تَ', finalVowel: KASRA, suffix: 'ينَ' }),
  form({ id: '2md', person: 2, number: 'duel', gender: 'masculin', pronoun: 'أَنْتُمَا', pronounFr: 'vous deux', pronounNote: 'masculin', translation: 'vous faites (à deux)', prefix: 'تَ', finalVowel: FATHA, suffix: 'انِ' }),
  form({ id: '2fd', person: 2, number: 'duel', gender: 'féminin', pronoun: 'أَنْتُمَا', pronounFr: 'vous deux', pronounNote: 'féminin', translation: 'vous faites (à deux)', prefix: 'تَ', finalVowel: FATHA, suffix: 'انِ' }),
  form({ id: '2mp', person: 2, number: 'pluriel', gender: 'masculin', pronoun: 'أَنْتُمْ', pronounFr: 'vous', pronounNote: 'masculin ou mixte', translation: 'vous faites', prefix: 'تَ', finalVowel: DAMMA, suffix: 'ونَ' }),
  form({ id: '2fp', person: 2, number: 'pluriel', gender: 'féminin', pronoun: 'أَنْتُنَّ', pronounFr: 'vous', pronounNote: 'féminin', translation: 'vous faites', prefix: 'تَ', finalVowel: SUKUN, suffix: 'نَ' }),

  form({ id: '3ms', person: 3, number: 'singulier', gender: 'masculin', pronoun: 'هُوَ', pronounFr: 'il', translation: 'il fait', prefix: 'يَ', finalVowel: DAMMA, suffix: '' }),
  form({ id: '3fs', person: 3, number: 'singulier', gender: 'féminin', pronoun: 'هِيَ', pronounFr: 'elle', translation: 'elle fait', prefix: 'تَ', finalVowel: DAMMA, suffix: '' }),
  form({ id: '3md', person: 3, number: 'duel', gender: 'masculin', pronoun: 'هُمَا', pronounFr: 'ils (deux)', pronounNote: 'masculin', translation: 'ils font (à deux)', prefix: 'يَ', finalVowel: FATHA, suffix: 'انِ' }),
  form({ id: '3fd', person: 3, number: 'duel', gender: 'féminin', pronoun: 'هُمَا', pronounFr: 'elles (deux)', pronounNote: 'féminin', translation: 'elles font (à deux)', prefix: 'تَ', finalVowel: FATHA, suffix: 'انِ' }),
  form({ id: '3mp', person: 3, number: 'pluriel', gender: 'masculin', pronoun: 'هُمْ', pronounFr: 'ils', pronounNote: 'masculin ou mixte', translation: 'ils font', prefix: 'يَ', finalVowel: DAMMA, suffix: 'ونَ' }),
  form({ id: '3fp', person: 3, number: 'pluriel', gender: 'féminin', pronoun: 'هُنَّ', pronounFr: 'elles', translation: 'elles font', prefix: 'يَ', finalVowel: SUKUN, suffix: 'نَ' }),
]

export const PERSONS: { person: Person; label: string; arabic: string; note: string }[] = [
  { person: 1, label: '1re personne', arabic: 'المُتَكَلِّم', note: 'celui qui parle' },
  { person: 2, label: '2e personne', arabic: 'المُخَاطَب', note: 'celui à qui l’on parle' },
  { person: 3, label: '3e personne', arabic: 'الغَائِب', note: 'celui dont on parle' },
]

export function formById(id: string): ConjugatedForm {
  const f = FORMS.find((x) => x.id === id)
  if (!f) throw new Error(`Forme inconnue : ${id}`)
  return f
}

/** Forme verbale complète, entièrement vocalisée. */
export function verbOf(f: ConjugatedForm): string {
  return f.prefix + MODEL.stem + f.finalVowel + f.suffix
}

/**
 * Segments colorables du mot entier. Les limites tombent entre deux lettres : un signe
 * diacritique n'est jamais séparé de sa lettre (sinon le rendu arabe se casse). La voyelle
 * finale reste donc portée par le ل, dans le segment du radical.
 */
export function wordSegments(f: ConjugatedForm): { prefix: string; stem: string; suffix: string } {
  return { prefix: f.prefix, stem: MODEL.stem + f.finalVowel, suffix: f.suffix }
}

/** Lettres qui ne s'attachent jamais à la lettre suivante. */
const NON_JOINING = new Set(['ا', 'أ', 'إ', 'آ', 'د', 'ذ', 'ر', 'ز', 'و'])

/**
 * Découpage pédagogique, à la manière d'un manuel : chaque élément est montré seul,
 * relié par un tatwīl (ـ) quand la lettre s'attache à la suivante. Ici la voyelle finale
 * est rendue avec la terminaison (ـُ, ـَانِ, ـُونَ, ـِينَ, ـْنَ).
 */
export function breakdown(f: ConjugatedForm): { prefix: string; stem: string; ending: string } {
  const joins = !NON_JOINING.has(f.prefix[0]!)
  return {
    prefix: f.prefix + (joins ? TATWEEL : ''),
    stem: (joins ? TATWEEL : '') + MODEL.stem + TATWEEL,
    ending: TATWEEL + f.finalVowel + f.suffix,
  }
}

/** Libellé court du pronom en français, avec précision de genre si utile. */
export function pronounLabel(f: ConjugatedForm): string {
  return f.pronounNote ? `${f.pronounFr} (${f.pronounNote})` : f.pronounFr
}

/** Description grammaticale : « 2e personne · féminin · duel ». */
export function grammarLabel(f: ConjugatedForm): string {
  const person = f.person === 1 ? '1re pers.' : `${f.person}e pers.`
  return [person, f.gender === 'commun' ? null : f.gender, f.number].filter(Boolean).join(' · ')
}

/** Formes verbales distinctes, dans l'ordre de la fiche (plusieurs pronoms partagent une forme). */
export function distinctVerbs(): string[] {
  return [...new Set(FORMS.map(verbOf))]
}

/** Pronoms qui correspondent à une forme verbale donnée. */
export function formsForVerb(verb: string): ConjugatedForm[] {
  return FORMS.filter((f) => verbOf(f) === verb)
}
