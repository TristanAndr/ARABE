/**
 * Gamification des exercices : points, série de bonnes réponses (combo), étoiles de fin.
 * Tout se déduit de la suite des réponses, sans état à part.
 */

export interface Score {
  points: number
  /** Bonnes réponses d'affilée en cours. */
  combo: number
  bestCombo: number
}

/** Une bonne réponse rapporte 10 points, plus 5 par réponse juste d'affilée, jusqu'à 30. */
export function pointsFor(combo: number): number {
  return 10 + 5 * Math.min(Math.max(combo - 1, 0), 4)
}

export function scoreOf(results: readonly boolean[]): Score {
  let points = 0
  let combo = 0
  let bestCombo = 0
  for (const correct of results) {
    if (correct) {
      combo++
      points += pointsFor(combo)
      bestCombo = Math.max(bestCombo, combo)
    } else {
      combo = 0
    }
  }
  return { points, combo, bestCombo }
}

/** 3 étoiles : sans faute ; 2 : au moins 70 % ; 1 : au moins 40 %. */
export function starsFor(correct: number, total: number): 0 | 1 | 2 | 3 {
  if (total === 0) return 0
  if (correct === total) return 3
  const ratio = correct / total
  if (ratio >= 0.7) return 2
  if (ratio >= 0.4) return 1
  return 0
}

const CHEERS: [number, string][] = [
  [10, 'Inarrêtable !'],
  [7, 'En feu !'],
  [5, 'Quelle série !'],
  [3, 'Bien joué !'],
]

/** Encouragement affiché quand la série atteint un palier, sinon null. */
export function cheerFor(combo: number): string | null {
  return CHEERS.find(([n]) => combo === n)?.[1] ?? (combo > 10 && combo % 5 === 0 ? 'Inarrêtable !' : null)
}

export const END_TITLES = ['On s’accroche !', 'Pas mal !', 'Très bien !', 'Parfait !'] as const
