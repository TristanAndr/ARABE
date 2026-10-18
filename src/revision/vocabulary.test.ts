import { describe, expect, it } from 'vitest'
import { stripVowels } from './check'
import { buildVocabSession } from './vocabQuiz'
import { COLORS, FRUITS, partsText, VEGETABLES, VOCAB_CATEGORIES } from './vocabulary'

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
      for (const ar of [w.ar, ...(w.others ?? [])]) expect(stripVowels(ar)).not.toBe(ar)
    }
  })

  it('chaque mot a une forme par colonne de la fiche', () => {
    for (const c of VOCAB_CATEGORIES) {
      for (const w of c.words) expect(1 + (w.others?.length ?? 0)).toBe(c.columns.length)
    }
    const abricot = FRUITS.words.find((w) => w.id === 'abricot')!
    expect([abricot.ar, ...abricot.others!]).toEqual(['مِشْمِشٌ', 'مِشْمِشَةٌ', 'مِشْمِشَتَانِ'])
    expect(COLORS.columns).toEqual(['Masculin', 'Féminin'])
  })

  it('légumes : les 24 du support, unité en ـَةٌ ou mot de mesure, ن du duel qui tombe en annexion', () => {
    expect(VEGETABLES.words).toHaveLength(24)
    const forms = (id: string) => {
      const w = VEGETABLES.words.find((v) => v.id === id)!
      return [w.ar, ...w.others!]
    }
    expect(forms('carotte')).toEqual(['جَزَرٌ', 'جَزَرَةٌ', 'جَزَرَتَانِ'])
    expect(forms('tomate')).toEqual(['طَمَاطِمُ', 'حَبَّةُ طَمَاطِمَ', 'حَبَّتَا طَمَاطِمَ'])
    expect(forms('ail')).toEqual(['ثُومٌ', 'فَصُّ ثُومٍ', 'فَصَّا ثُومٍ'])
    expect(forms('chou')).toEqual(['مَلْفُوفٌ', 'رَأْسُ مَلْفُوفٍ', 'رَأْسَا مَلْفُوفٍ'])
    expect(forms('epinard')).toEqual(['سَبَانِخُ', 'وَرَقَةُ سَبَانِخَ', 'وَرَقَتَا سَبَانِخَ'])
  })
})

describe('mémo des thèmes', () => {
  it('les morceaux colorés recomposent exactement les mots exemples', () => {
    const words = VOCAB_CATEGORIES.map((c) => c.guide.steps.map((s) => partsText(s.parts)))
    expect(words).toEqual([
      ['تُفَّاحٌ', 'تُفَّاحَةٌ', 'تُفَّاحَتَانِ'],
      ['جَزَرٌ', 'جَزَرَةٌ', 'جَزَرَتَانِ'],
      ['أَحْمَرُ', 'حَمْرَاءُ'],
    ])
    // Et ce sont bien des formes de la fiche.
    for (const c of VOCAB_CATEGORIES) {
      const forms = c.words.flatMap((w) => [w.ar, ...(w.others ?? [])])
      for (const s of c.guide.steps) expect(forms).toContain(partsText(s.parts))
    }
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
