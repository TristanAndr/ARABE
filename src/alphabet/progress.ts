/**
 * Suivi de la révision de l'alphabet : pour chaque lettre, nombre de réponses, de bonnes
 * réponses et série de bonnes réponses consécutives.
 */
import { isRecord } from '../storage/storage'
import { LETTERS } from './letters'

export interface LetterStats {
  seen: number
  correct: number
  /** Bonnes réponses consécutives (remise à zéro à chaque erreur). */
  streak: number
}

export type AlphabetProgress = Record<string, LetterStats>

/** Deux bonnes réponses de suite : la lettre est considérée comme acquise. */
export const MASTERY_STREAK = 2

export type LetterStatus = 'new' | 'learning' | 'mastered'

export function statusOf(stats: LetterStats | undefined): LetterStatus {
  if (!stats || stats.seen === 0) return 'new'
  return stats.streak >= MASTERY_STREAK ? 'mastered' : 'learning'
}

export function recordAnswer(p: AlphabetProgress, letter: string, correct: boolean): AlphabetProgress {
  const prev = p[letter] ?? { seen: 0, correct: 0, streak: 0 }
  return {
    ...p,
    [letter]: {
      seen: prev.seen + 1,
      correct: prev.correct + (correct ? 1 : 0),
      streak: correct ? prev.streak + 1 : 0,
    },
  }
}

export function summarize(p: AlphabetProgress): Record<LetterStatus, number> {
  const counts = { new: 0, learning: 0, mastered: 0 }
  for (const l of LETTERS) counts[statusOf(p[l.letter])]++
  return counts
}

const KNOWN = new Set(LETTERS.map((l) => l.letter))
const count = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0)

/** Nettoie un suivi venant de la base : lettres inconnues et valeurs invalides ignorées. */
export function sanitizeAlphabetProgress(raw: unknown): AlphabetProgress {
  const out: AlphabetProgress = {}
  if (!isRecord(raw)) return out
  for (const [letter, v] of Object.entries(raw)) {
    if (!KNOWN.has(letter) || !isRecord(v)) continue
    const seen = count(v.seen)
    const correct = Math.min(count(v.correct), seen)
    out[letter] = { seen, correct, streak: Math.min(count(v.streak), correct) }
  }
  return out
}
