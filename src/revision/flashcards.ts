/**
 * Paquet de flashcards : on retourne la carte, puis on dit si on savait. Une carte sue sort du
 * paquet ; une carte à revoir repasse à la fin, jusqu'à ce que tout le paquet soit su.
 */

import { shuffle, type Random } from './quiz'

export interface Deck {
  /** Cartes restantes, la première est la carte en cours. */
  readonly queue: readonly string[]
  readonly total: number
  /** Cartes ratées au moins une fois, dans l'ordre où elles l'ont été. */
  readonly missed: readonly string[]
}

export function newDeck(ids: readonly string[], random: Random = Math.random): Deck {
  return { queue: shuffle(ids, random), total: ids.length, missed: [] }
}

export function answerCard(deck: Deck, known: boolean): Deck {
  const [current, ...rest] = deck.queue
  if (current === undefined) return deck
  if (known) return { ...deck, queue: rest }
  return {
    ...deck,
    queue: [...rest, current],
    missed: deck.missed.includes(current) ? deck.missed : [...deck.missed, current],
  }
}

/** Nombre de cartes sues : celles qui sont sorties du paquet. */
export function knownCount(deck: Deck): number {
  return deck.total - deck.queue.length
}
