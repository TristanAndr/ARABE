import { describe, expect, it } from 'vitest'
import { LETTERS } from './letters'
import { recordAnswer, sanitizeAlphabetProgress, statusOf, summarize, type AlphabetProgress } from './progress'
import { buildAlphabetSession, letterOptions, SESSION_LENGTH } from './quiz'

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32
    return s / 2 ** 32
  }
}

describe('suivi', () => {
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

describe('questions', () => {
  it('4 propositions distinctes dont la bonne, au plus deux sosies', () => {
    for (const l of LETTERS) {
      const opts = letterOptions(l, seeded(l.index))
      expect(opts).toHaveLength(4)
      expect(new Set(opts.map((o) => o.letter)).size).toBe(4)
      expect(opts.filter((o) => o.letter === l.letter)).toHaveLength(1)
    }
    // ب a quatre sosies (ت ث ن ي) : deux sont proposés.
    const b = LETTERS.find((l) => l.letter === 'ب')!
    const close = letterOptions(b, seeded(1)).filter((o) => ['ت', 'ث', 'ن', 'ي'].includes(o.letter))
    expect(close).toHaveLength(2)
  })

  it('session : 10 lettres différentes, les lettres non acquises d’abord', () => {
    let p: AlphabetProgress = {}
    for (const l of LETTERS.slice(0, 25)) p = recordAnswer(recordAnswer(p, l.letter, true), l.letter, true)
    const qs = buildAlphabetSession(p, SESSION_LENGTH, seeded(5))
    expect(qs).toHaveLength(10)
    expect(new Set(qs.map((q) => q.letter.letter)).size).toBe(10)
    // Les 3 lettres non acquises (ه و ي) ouvrent la session.
    const pending = new Set(LETTERS.slice(25).map((l) => l.letter))
    expect(qs.slice(0, 3).every((q) => pending.has(q.letter.letter))).toBe(true)
  })
})
