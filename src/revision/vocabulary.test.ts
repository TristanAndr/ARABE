import { describe, expect, it } from 'vitest'
import { stripVowels } from './check'
import { buildVocabSession } from './vocabQuiz'
import { COLORS, FRUITS, VOCAB_CATEGORIES } from './vocabulary'

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32
    return s / 2 ** 32
  }
}

describe('fiches de vocabulaire', () => {
  it.each(VOCAB_CATEGORIES.map((c) => [c.id, c] as const))('%s : identifiants, mots et sens uniques', (_, c) => {
    expect(new Set(c.words.map((w) => w.id)).size).toBe(c.words.length)
    expect(new Set(c.words.map((w) => w.ar)).size).toBe(c.words.length)
    expect(new Set(c.words.map((w) => w.fr)).size).toBe(c.words.length)
  })

  it.each(VOCAB_CATEGORIES.map((c) => [c.id, c] as const))('%s : chaque mot est vocalisé', (_, c) => {
    for (const w of c.words) {
      for (const ar of [w.ar, w.arFem].filter((x): x is string => !!x)) expect(stripVowels(ar)).not.toBe(ar)
    }
  })

  it('chaque couleur a son féminin', () => {
    expect(COLORS.words.every((w) => w.arFem)).toBe(true)
    expect(FRUITS.words.some((w) => w.arFem)).toBe(false)
  })
})

describe('entraînement', () => {
  it('une question par mot, 4 propositions distinctes dont la bonne', () => {
    const qs = buildVocabSession(FRUITS.words, seeded(1))
    expect(qs).toHaveLength(FRUITS.words.length)
    expect(new Set(qs.map((q) => q.word.id)).size).toBe(FRUITS.words.length)
    for (const q of qs) {
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options).size).toBe(4)
      expect(q.options).toContain(q.word.id)
      for (const id of q.options) expect(FRUITS.words.some((w) => w.id === id)).toBe(true)
    }
  })
})
