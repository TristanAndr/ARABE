import { describe, expect, it } from 'vitest'
import { answerCard, knownCount, newDeck } from './flashcards'

const ids = ['a', 'b', 'c']
const ordered = () => newDeck(ids, () => 0.999)

describe('flashcards', () => {
  it('le paquet contient chaque carte une fois', () => {
    const deck = newDeck(ids)
    expect([...deck.queue].sort()).toEqual(ids)
    expect(deck.total).toBe(3)
    expect(knownCount(deck)).toBe(0)
  })

  it('une carte sue sort du paquet', () => {
    const deck = answerCard(ordered(), true)
    expect(deck.queue).toEqual(['b', 'c'])
    expect(knownCount(deck)).toBe(1)
    expect(deck.missed).toEqual([])
  })

  it('une carte à revoir repasse à la fin et est notée une seule fois', () => {
    let deck = answerCard(ordered(), false)
    expect(deck.queue).toEqual(['b', 'c', 'a'])
    deck = answerCard(answerCard(deck, true), true)
    deck = answerCard(deck, false)
    expect(deck.queue).toEqual(['a'])
    expect(deck.missed).toEqual(['a'])
    deck = answerCard(deck, true)
    expect(deck.queue).toEqual([])
    expect(knownCount(deck)).toBe(3)
  })

  it('un paquet vide ne change plus', () => {
    const deck = answerCard(answerCard(answerCard(ordered(), true), true), true)
    expect(answerCard(deck, false)).toBe(deck)
  })
})
