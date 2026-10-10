import { describe, expect, it } from 'vitest'
import { FLASHCARDS, nextFlashcard, type Flashcard } from './flashcards'
import { LETTERS, NON_CONNECTORS, TATWEEL } from './letters'

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32
    return s / 2 ** 32
  }
}

const NON_JOINING = new Set<string>(NON_CONNECTORS)

describe('cartes de l’alphabet', () => {
  it('100 cartes : 4 formes pour les 22 lettres liantes, 2 pour les 6 non liantes', () => {
    expect(FLASHCARDS).toHaveLength(100)
    for (const l of LETTERS) {
      const positions = FLASHCARDS.filter((c) => c.letter === l).map((c) => c.position)
      expect(positions).toEqual(
        NON_JOINING.has(l.letter) ? ['isolated', 'final'] : ['isolated', 'initial', 'medial', 'final'],
      )
    }
  })

  it('chaque forme est la lettre de sa carte, attachée selon sa position', () => {
    const expected = { isolated: (c: string) => c, initial: (c: string) => c + TATWEEL, medial: (c: string) => TATWEEL + c + TATWEEL, final: (c: string) => TATWEEL + c }
    for (const card of FLASHCARDS) {
      expect(card.form).toBe(expected[card.position](card.letter.letter))
      // Une seule lettre arabe dans la forme, celle dont on donne le nom.
      expect(card.form.replaceAll(TATWEEL, '')).toBe(card.letter.letter)
    }
    // Aucune forme initiale ou médiane pour ا د ذ ر ز و.
    expect(FLASHCARDS.filter((c) => NON_JOINING.has(c.letter.letter) && c.form.endsWith(TATWEEL))).toEqual([])
  })

  it('jamais deux fois de suite la même lettre sous la même forme', () => {
    const random = seeded(7)
    let card: Flashcard = nextFlashcard(null, random)
    for (let i = 0; i < 5000; i++) {
      const next = nextFlashcard(card, random)
      expect(next.letter === card.letter && next.position === card.position).toBe(false)
      card = next
    }
  })

  it('tirage au hasard : toutes les lettres et toutes les formes sortent, pas dans l’ordre', () => {
    const random = seeded(42)
    const seen = new Set<string>()
    const letters: string[] = []
    let card: Flashcard | null = null
    for (let i = 0; i < 3000; i++) {
      card = nextFlashcard(card, random)
      seen.add(card.form)
      letters.push(card.letter.letter)
    }
    expect(seen.size).toBe(100)
    expect(letters.slice(0, 28)).not.toEqual(LETTERS.map((l) => l.letter))
    // Chaque lettre sort environ 1 fois sur 28 (≈ 107 fois sur 3000).
    for (const l of LETTERS) {
      const n = letters.filter((x) => x === l.letter).length
      expect(n).toBeGreaterThan(60)
      expect(n).toBeLessThan(160)
    }
  })
})
