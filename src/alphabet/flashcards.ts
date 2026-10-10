/**
 * Cartes de l'entraînement continu : une lettre, à une position, tirée au hasard.
 * Les formes viennent de la fiche (formOf) : une lettre qui ne se lie pas à la suivante
 * n'est jamais montrée en forme initiale ou médiane.
 */
import type { Random } from '../revision/quiz'
import { formOf, LETTERS, POSITIONS, type Letter, type Position } from './letters'

export interface Flashcard {
  letter: Letter
  position: Position
  /** Forme affichée : lettre seule ou attachée par un tatwīl. */
  form: string
}

/** Toutes les cartes possibles : 22 lettres × 4 formes + 6 lettres × 2 formes = 100. */
export const FLASHCARDS: readonly Flashcard[] = LETTERS.flatMap((letter) =>
  POSITIONS.flatMap(({ position }) => {
    const form = formOf(letter, position)
    return form ? [{ letter, position, form }] : []
  }),
)

const pick = <T>(items: readonly T[], random: Random): T => items[Math.floor(random() * items.length)]!

const same = (a: Flashcard, b: Flashcard) => a.letter.letter === b.letter.letter && a.position === b.position

/**
 * Carte suivante : une des 28 lettres au hasard, puis une de ses formes valides au hasard.
 * Jamais exactement la même lettre sous la même forme que la carte précédente (chaque lettre
 * a au moins deux formes, il reste donc toujours un choix).
 */
export function nextFlashcard(previous: Flashcard | null, random: Random = Math.random): Flashcard {
  const letter = pick(LETTERS, random)
  const forms = FLASHCARDS.filter((c) => c.letter === letter && !(previous && same(c, previous)))
  return pick(forms, random)
}
