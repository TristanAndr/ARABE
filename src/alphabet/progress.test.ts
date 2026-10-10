import { describe, expect, it } from 'vitest'
import { recordAnswer, sanitizeAlphabetProgress, statusOf, summarize, type AlphabetProgress } from './progress'

describe('suivi des lettres', () => {
  it('nouvelle → en cours → acquise après deux bonnes réponses de suite ; une erreur repart à zéro', () => {
    let p: AlphabetProgress = {}
    expect(statusOf(p['ب'])).toBe('new')
    p = recordAnswer(p, 'ب', true)
    expect(statusOf(p['ب'])).toBe('learning')
    p = recordAnswer(p, 'ب', true)
    expect(statusOf(p['ب'])).toBe('mastered')
    p = recordAnswer(p, 'ب', false)
    expect(statusOf(p['ب'])).toBe('learning')
    expect(p['ب']).toEqual({ seen: 3, correct: 2, streak: 0 })
    expect(summarize(p)).toEqual({ new: 27, learning: 1, mastered: 0 })
  })

  it('données invalides venant de la base : nettoyées', () => {
    expect(sanitizeAlphabetProgress({ ب: { seen: 2, correct: 5, streak: 9 }, X: { seen: 1 }, ت: 'x' })).toEqual({
      ب: { seen: 2, correct: 2, streak: 2 },
    })
    expect(sanitizeAlphabetProgress(null)).toEqual({})
  })
})
