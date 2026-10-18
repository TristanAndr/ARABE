/**
 * Entraînement sur une fiche de vocabulaire : questions à choix, construites à partir de la fiche.
 */

import { shuffle, type Random } from './quiz'
import type { VocabWord } from './vocabulary'

export type VocabMode = 'fr-ar' | 'ar-fr' | 'ecoute'

export interface VocabQuestion {
  word: VocabWord
  /** Identifiants des mots proposés, dont la bonne réponse. */
  options: string[]
}

const OPTION_COUNT = 4

export function vocabOptions(word: VocabWord, words: readonly VocabWord[], random: Random = Math.random): string[] {
  const rivals = shuffle(
    words.filter((w) => w.id !== word.id),
    random,
  )
    .slice(0, OPTION_COUNT - 1)
    .map((w) => w.id)
  return shuffle([word.id, ...rivals], random)
}

/** Une question par mot de la fiche, dans un ordre aléatoire. */
export function buildVocabSession(words: readonly VocabWord[], random: Random = Math.random): VocabQuestion[] {
  return shuffle(words, random).map((word) => ({ word, options: vocabOptions(word, words, random) }))
}
