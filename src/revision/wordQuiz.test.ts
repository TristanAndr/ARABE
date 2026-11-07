import { describe, expect, it } from 'vitest'
import { LEXICON, WBW_TEXTS } from '../data/wordByWord'
import { buildWordSession, clampRange, family, MASTERED, textRange, nextLevel, retryQuestion, SESSION_SIZE, textKeys, wordOptions } from './wordQuiz'

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32
    return s / 2 ** 32
  }
}

const [FATIHA, IKHLAS, KURSI] = WBW_TEXTS as [(typeof WBW_TEXTS)[number], (typeof WBW_TEXTS)[number], (typeof WBW_TEXTS)[number]]

describe('jeu mot à mot', () => {
  it('trois sens proposés, distincts, dont le bon, sans forme du même mot comme piège', () => {
    const random = seeded(3)
    for (const key of Object.keys(LEXICON)) {
      for (let n = 0; n < 5; n++) {
        const options = wordOptions(key, random)
        expect(options).toHaveLength(3)
        expect(options).toContain(key)
        expect(new Set(options.map((k) => LEXICON[k]!.fr)).size).toBe(3)
        expect(new Set(options.map(family)).size).toBe(3)
      }
    }
  })

  it('une série de 10 mots distincts du texte, chacun montré dans un de ses versets', () => {
    const qs = buildWordSession(KURSI, {}, seeded(1))
    expect(qs).toHaveLength(SESSION_SIZE)
    expect(new Set(qs.map((q) => q.key)).size).toBe(SESSION_SIZE)
    for (const q of qs) {
      expect(textKeys(KURSI)).toContain(q.key)
      expect(q.occurrence.verse.words[q.occurrence.index]!.key).toBe(q.key)
    }
    // Une série plus longue que le texte : chaque mot une fois.
    expect(buildWordSession(IKHLAS, {}, seeded(2), 50)).toHaveLength(textKeys(IKHLAS).length)
  })

  it('les mots les moins sus passent en premier', () => {
    const keys = textKeys(FATIHA)
    const mastery = Object.fromEntries(keys.map((k) => [k, MASTERED]))
    const weak = keys.slice(0, 4)
    for (const k of weak) mastery[k] = 0
    const qs = buildWordSession(FATIHA, mastery, seeded(5))
    expect(new Set(qs.slice(0, 4).map((q) => q.key))).toEqual(new Set(weak))
  })

  it('maîtrise : +1 par bonne réponse jusqu’à 3, retour à 0 sur une erreur ; un mot raté est reposé', () => {
    expect(nextLevel(0, true)).toBe(1)
    expect(nextLevel(MASTERED, true)).toBe(MASTERED)
    expect(nextLevel(2, false)).toBe(0)
    const q = retryQuestion(FATIHA, 'rahman', seeded(9))
    expect(q.retry).toBe(true)
    expect(q.key).toBe('rahman')
  })

  it('les négations forment une seule famille : لَا, لَمْ, أَلَمْ, مَا « ne… pas »', () => {
    for (const k of ['la', 'lam', 'wa-lam', 'alam', 'awalam', 'ma-nafy', 'in-nafy', 'wala']) expect(family(k)).toBe('la')
    expect(family('ma')).toBe('ma')
  })

  it('plage de versets : les questions ne portent que sur les versets choisis', () => {
    const MULK = WBW_TEXTS.find((t) => t.id === 'mulk')!
    expect(clampRange(MULK, { from: 0, to: 99 })).toEqual({ from: 1, to: 30 })
    expect(clampRange(MULK, { from: 12, to: 4 })).toEqual({ from: 12, to: 12 })
    const pool = textRange(MULK, { from: 1, to: 3 })
    expect(pool.verses.map((v) => v.id)).toEqual(['67:1', '67:2', '67:3'])
    for (let seed = 1; seed < 20; seed++) {
      for (const q of buildWordSession(pool, {}, seeded(seed))) expect(['67:1', '67:2', '67:3']).toContain(q.occurrence.verse.id)
    }
  })
})
