import { LENGTH_PAIRS, PHONEMES, type Phoneme } from '../translit/phonemes'
import type { Spellings } from '../translit/profiles'
import { expandVariants, parseReading, renderWord, type RefUnit } from '../translit/reference'
import { normalizeAnswer, SEPARATOR, type NormalizationOptions } from './normalize'

/**
 * Comparaison saisie / référence
 *
 * La saisie n'est pas convertie en phonèmes (ce serait ambigu : « th » peut
 * valoir ث ou t+h). On aligne directement la chaîne saisie sur la suite de
 * sons attendus, par programmation dynamique : chaque son attendu peut
 * consommer l'une de ses graphies acceptées par le profil. Le coût minimal
 * correspond au nombre d'écarts de prononciation ; les séparateurs sont gratuits.
 *
 * Types d'écart, chacun de coût 1 :
 *   - gemination   : consonne géminée écrite simple (šadda oubliée)
 *   - length       : voyelle brève au lieu de longue, ou l'inverse
 *   - substitution : un autre son à la place du son attendu
 *   - missing      : son attendu absent
 *   - extra        : son saisi en trop
 *
 * Limite : l'alignement localise les écarts, il ne garantit pas d'en
 * identifier la cause exacte quand plusieurs explications sont possibles.
 */

export type IssueKind = 'gemination' | 'length' | 'substitution' | 'missing' | 'extra'
type OpKind = 'match' | 'skip' | IssueKind

interface Op {
  kind: OpKind
  unit: number | null
  from: number
  to: number
}

export type Verdict = 'correct' | 'partial' | 'incorrect'

export interface WordFeedback {
  /** Mot de référence écrit selon le profil actif. */
  expected: string
  /** Portion de la saisie alignée sur ce mot. */
  typed: string
  ok: boolean
  issues: IssueKind[]
}

export interface ComparisonResult {
  verdict: Verdict
  errors: number
  total: number
  /** Indice de la variante retenue (0 = lecture principale). */
  variantIndex: number
  variantCount: number
  words: WordFeedback[]
}

/** Au-delà de cette proportion d'écarts, la réponse est jugée incorrecte. */
export const PARTIAL_THRESHOLD = 0.25

interface PreparedUnit extends RefUnit {
  spellings: string[]
  optional: boolean
  /** Graphies de la voyelle de durée opposée, pour diagnostiquer les erreurs de longueur. */
  lengthSpellings: string[]
}

function prepareUnits(units: RefUnit[], spellings: Spellings, opts: NormalizationOptions): PreparedUnit[] {
  const fold = (list: string[]) => (opts.ignoreCase ? list.map((s) => s.toLowerCase()) : list)
  return units
    .filter((u) => opts.acceptWaslEndings || !u.pausal)
    .map((u) => {
      const pair = LENGTH_PAIRS[u.phoneme as keyof typeof LENGTH_PAIRS] as Phoneme | undefined
      return {
        ...u,
        spellings: fold(spellings[u.phoneme]),
        optional: u.pausal || (opts.optionalInitialHamza && u.phoneme === 'ʾ' && u.wordInitial),
        lengthSpellings: pair ? fold(spellings[pair]) : [],
      }
    })
}

function allSpellings(spellings: Spellings, ignoreCase: boolean): string[] {
  const set = new Set<string>()
  for (const p of PHONEMES) for (const s of spellings[p]) set.add(ignoreCase ? s.toLowerCase() : s)
  // Les plus longues d'abord : découpage glouton d'un « jeton » de saisie.
  return [...set].sort((a, b) => b.length - a.length)
}

function isSep(input: string, j: number): boolean {
  return j < input.length && SEPARATOR.test(input[j]!)
}

function skipSeps(input: string, j: number): number {
  while (isSep(input, j)) j++
  return j
}

/** Fin de la graphie `s` lue à partir de `j`, ou -1. */
function matchAt(input: string, j: number, s: string): number {
  return input.startsWith(s, j) ? j + s.length : -1
}

/** Graphie géminée : `s` deux fois, éventuellement séparée (r-r de r-raḥmān). */
function matchDouble(input: string, j: number, s: string): number {
  const e1 = matchAt(input, j, s)
  return e1 < 0 ? -1 : matchAt(input, skipSeps(input, e1), s)
}

/** Fin du jeton de saisie commençant en `j` : graphie connue la plus longue, sinon un caractère. */
function tokenEnd(input: string, j: number, tokens: string[]): number {
  for (const t of tokens) if (input.startsWith(t, j)) return j + t.length
  const cp = input.codePointAt(j)!
  return j + (cp > 0xffff ? 2 : 1)
}

function align(input: string, units: PreparedUnit[], tokens: string[]): { cost: number; ops: Op[] } {
  const n = units.length
  const m = input.length
  const INF = Number.POSITIVE_INFINITY
  const cost: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(INF))
  const back: (Op & { pi: number; pj: number } | null)[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(null),
  )
  cost[0]![0] = 0

  const relax = (pi: number, pj: number, i: number, j: number, c: number, kind: OpKind, unit: number | null) => {
    const total = cost[pi]![pj]! + c
    if (total < cost[i]![j]!) {
      cost[i]![j] = total
      back[i]![j] = { kind, unit, from: pj, to: j, pi, pj }
    }
  }

  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      if (cost[i]![j] === INF) continue
      if (isSep(input, j)) relax(i, j, i, j + 1, 0, 'skip', null)

      if (i < n) {
        const u = units[i]!
        for (const s of u.spellings) {
          const e = u.geminate ? matchDouble(input, j, s) : matchAt(input, j, s)
          if (e >= 0) relax(i, j, i + 1, e, 0, 'match', i)
        }
        if (u.optional) relax(i, j, i + 1, j, 0, 'skip', i)
        if (u.geminate) {
          for (const s of u.spellings) {
            const e = matchAt(input, j, s)
            if (e >= 0) relax(i, j, i + 1, e, 1, 'gemination', i)
          }
        }
        for (const s of u.lengthSpellings) {
          const e = matchAt(input, j, s)
          if (e >= 0) relax(i, j, i + 1, e, 1, 'length', i)
        }
        if (j < m && !isSep(input, j)) relax(i, j, i + 1, tokenEnd(input, j, tokens), 1, 'substitution', i)
        relax(i, j, i + 1, j, 1, 'missing', i)
      }
      if (j < m && !isSep(input, j)) relax(i, j, i, tokenEnd(input, j, tokens), 1, 'extra', null)
    }
  }

  const ops: Op[] = []
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    const b = back[i]![j]
    if (!b) break
    ops.push({ kind: b.kind, unit: b.unit, from: b.from, to: b.to })
    i = b.pi
    j = b.pj
  }
  ops.reverse()
  return { cost: cost[n]![m]!, ops }
}

function buildWords(
  words: string[],
  units: PreparedUnit[],
  ops: Op[],
  input: string,
  spellings: Spellings,
): WordFeedback[] {
  const spans = words.map(() => ({ from: Infinity, to: -Infinity, issues: new Set<IssueKind>() }))
  let current = 0
  for (const op of ops) {
    if (op.kind === 'skip' && op.unit === null) continue
    if (op.unit !== null) current = units[op.unit]!.word
    const span = spans[current]!
    if (op.to > op.from) {
      span.from = Math.min(span.from, op.from)
      span.to = Math.max(span.to, op.to)
    }
    if (op.kind !== 'match' && op.kind !== 'skip') span.issues.add(op.kind)
  }
  return words.map((w, k) => {
    const span = spans[k]!
    const typed = span.to > span.from ? input.slice(span.from, span.to).replace(/^[\s\-_]+|[\s\-_]+$/g, '') : ''
    return {
      expected: renderWord(w, spellings),
      typed,
      ok: span.issues.size === 0,
      issues: [...span.issues],
    }
  })
}

export function compareAnswer(
  reading: string,
  answer: string,
  spellings: Spellings,
  opts: NormalizationOptions,
): ComparisonResult {
  const input = normalizeAnswer(answer, opts)
  const tokens = allSpellings(spellings, opts.ignoreCase)
  const variants = expandVariants(reading)

  let best: ComparisonResult | null = null
  variants.forEach((variant, index) => {
    const parsed = parseReading(variant)
    const units = prepareUnits(parsed.units, spellings, opts)
    const { cost, ops } = align(input, units, tokens)
    if (best && cost >= best.errors) return
    const total = Math.max(1, units.filter((u) => !u.optional).length)
    const verdict: Verdict = cost === 0 ? 'correct' : cost / total <= PARTIAL_THRESHOLD ? 'partial' : 'incorrect'
    best = {
      verdict,
      errors: cost,
      total,
      variantIndex: index,
      variantCount: variants.length,
      words: buildWords(parsed.words, units, ops, input, spellings),
    }
  })
  return best!
}
