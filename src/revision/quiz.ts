/**
 * Construction des sessions d'entraînement, uniquement à partir des données de la fiche.
 */

import { distinctVerbs, FORMS, formsForVerb, verbOf, type ConjugatedForm } from './conjugation'

export type QuizMode = 'verbe' | 'pronom'

export type Question =
  /** Mode A : un pronom est donné, on cherche la forme verbale. */
  | { kind: 'verbe'; form: ConjugatedForm; expected: string; options: string[] }
  /** Mode B : une forme verbale est donnée, on cherche un pronom qui lui correspond. */
  | { kind: 'pronom'; verb: string; accepted: ConjugatedForm[] }

export type Random = () => number

export function shuffle<T>(items: readonly T[], random: Random = Math.random): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

const OPTION_COUNT = 4

/** Les formes du même préfixe ou de la même terminaison sont proposées en priorité : on doit regarder les deux. */
function similarity(a: ConjugatedForm, b: ConjugatedForm): number {
  return (a.prefix === b.prefix ? 1 : 0) + (a.suffix === b.suffix && a.finalVowel === b.finalVowel ? 1 : 0)
}

export function verbOptions(form: ConjugatedForm, random: Random = Math.random): string[] {
  const expected = verbOf(form)
  const rivals = distinctVerbs()
    .filter((v) => v !== expected)
    .map((v) => ({ v, score: similarity(form, formsForVerb(v)[0]!) }))
  const picked = shuffle(rivals, random)
    .sort((a, b) => b.score - a.score)
    .slice(0, OPTION_COUNT - 1)
    .map((r) => r.v)
  return shuffle([expected, ...picked], random)
}

export function buildSession(mode: QuizMode, random: Random = Math.random): Question[] {
  if (mode === 'verbe') {
    return shuffle(FORMS, random).map((form) => ({
      kind: 'verbe',
      form,
      expected: verbOf(form),
      options: verbOptions(form, random),
    }))
  }
  return shuffle(distinctVerbs(), random).map((verb) => ({ kind: 'pronom', verb, accepted: formsForVerb(verb) }))
}
