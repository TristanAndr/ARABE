/**
 * Questions de révision de l'alphabet, tirées des données de la fiche.
 */
import { shuffle, type Random } from '../revision/quiz'
import { LETTERS, LOOKALIKES, type Letter } from './letters'
import { statusOf, type AlphabetProgress } from './progress'

/** « lettre » : la lettre est montrée, on choisit son nom ; « nom » : l'inverse. */
export type AlphabetQuizMode = 'lettre' | 'nom'

export interface AlphabetQuestion {
  letter: Letter
  /** Quatre lettres proposées (dont la bonne), dans un ordre aléatoire. */
  options: Letter[]
}

export const SESSION_LENGTH = 10
const OPTION_COUNT = 4

const lookalikesOf = (l: Letter) => new Set(LOOKALIKES.filter((g) => g.includes(l.letter)).flat())

/** Mauvaises réponses : d'abord les lettres faciles à confondre, puis au hasard. */
export function letterOptions(target: Letter, random: Random = Math.random): Letter[] {
  const close = lookalikesOf(target)
  const rivals = shuffle(
    LETTERS.filter((l) => l.letter !== target.letter),
    random,
  ).sort((a, b) => Number(close.has(b.letter)) - Number(close.has(a.letter)))
  // Au plus deux sosies, pour que la question reste une vraie question de lecture.
  const similar = rivals.filter((l) => close.has(l.letter)).slice(0, 2)
  const others = rivals.filter((l) => !close.has(l.letter)).slice(0, OPTION_COUNT - 1 - similar.length)
  return shuffle([target, ...similar, ...others], random)
}

/**
 * Session : les lettres pas encore acquises passent en premier (mélangées), complétées par
 * des lettres acquises (mélangées), pour réviser sans oublier ce qui est su.
 */
export function buildAlphabetSession(
  progress: AlphabetProgress,
  length = SESSION_LENGTH,
  random: Random = Math.random,
): AlphabetQuestion[] {
  const pending = shuffle(LETTERS.filter((l) => statusOf(progress[l.letter]) !== 'mastered'), random)
  const known = shuffle(LETTERS.filter((l) => statusOf(progress[l.letter]) === 'mastered'), random)
  return [...pending, ...known].slice(0, length).map((letter) => ({ letter, options: letterOptions(letter, random) }))
}
