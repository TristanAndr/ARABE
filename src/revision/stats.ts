import type { ConjugationSessionRecord } from '../sync/types'
import type { QuizMode } from './quiz'

export interface ModeStats {
  sessions: number
  best: { correct: number; total: number } | null
  last: { correct: number; total: number } | null
}

/** Résumé des sessions terminées d'un mode (liste triée de la plus récente à la plus ancienne). */
export function modeStats(sessions: ConjugationSessionRecord[], mode: QuizMode): ModeStats {
  const list = sessions.filter((s) => s.mode === mode)
  let best: ModeStats['best'] = null
  for (const s of list) {
    if (!best || s.correct / s.total > best.correct / best.total) best = { correct: s.correct, total: s.total }
  }
  const last = list[0] ? { correct: list[0].correct, total: list[0].total } : null
  return { sessions: list.length, best, last }
}
