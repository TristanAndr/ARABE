import { useCallback, useRef, useState } from 'react'
import type { Verdict } from '../compare/compare'
import { EXERCISES } from '../data/corpus'
import { isRecord } from '../storage/storage'
import type { Order } from './settings'

export interface ExerciseResult {
  /** Résultat de la première vérification : seul celui-ci compte dans les statistiques. */
  first: Verdict
  last: Verdict
}

export interface Progress {
  /** Ordre des exercices de la session en cours (identifiants). */
  order: string[]
  index: number
  results: Record<string, ExerciseResult>
  /** Cumul toutes sessions confondues. */
  totals: { validated: number; correct: number }
}

const VERDICTS: Verdict[] = ['correct', 'partial', 'incorrect']
const KNOWN_IDS = new Set(EXERCISES.map((e) => e.id))

export function makeOrder(order: Order, random: () => number = Math.random): string[] {
  const ids = EXERCISES.map((e) => e.id)
  if (order === 'random') {
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
    }
  }
  return ids
}

export function newProgress(order: Order, totals = { validated: 0, correct: 0 }): Progress {
  return { order: makeOrder(order), index: 0, results: {}, totals }
}

export function sanitizeProgress(raw: unknown): Progress | null {
  if (!isRecord(raw) || !Array.isArray(raw.order)) return null
  // Les exercices retirés du corpus sont ignorés ; les nouveaux sont ajoutés en fin de session.
  const order = raw.order.filter((id): id is string => typeof id === 'string' && KNOWN_IDS.has(id))
  for (const e of EXERCISES) if (!order.includes(e.id)) order.push(e.id)
  const results: Record<string, ExerciseResult> = {}
  if (isRecord(raw.results)) {
    for (const [id, r] of Object.entries(raw.results)) {
      if (KNOWN_IDS.has(id) && isRecord(r) && VERDICTS.includes(r.first as Verdict) && VERDICTS.includes(r.last as Verdict)) {
        results[id] = { first: r.first as Verdict, last: r.last as Verdict }
      }
    }
  }
  const t = isRecord(raw.totals) ? raw.totals : {}
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0)
  const index = Math.min(num(raw.index), order.length)
  return { order, index, results, totals: { validated: num(t.validated), correct: num(t.correct) } }
}

export function recordResult(p: Progress, id: string, verdict: Verdict): Progress {
  const prev = p.results[id]
  if (prev) return { ...p, results: { ...p.results, [id]: { ...prev, last: verdict } } }
  return {
    ...p,
    results: { ...p.results, [id]: { first: verdict, last: verdict } },
    totals: {
      validated: p.totals.validated + 1,
      correct: p.totals.correct + (verdict === 'correct' ? 1 : 0),
    },
  }
}

/**
 * Progression de lecture. `initial` vient du compte (ou est vide pour un nouveau compte) ;
 * chaque changement est transmis à `onChange`, chargé de l'enregistrer.
 */
export function useProgress(initial: Progress | null, order: Order, onChange: (p: Progress) => void) {
  const [progress, setProgress] = useState<Progress>(() => initial ?? newProgress(order))
  const latest = useRef(progress)

  const update = useCallback(
    (fn: (p: Progress) => Progress) => {
      const next = fn(latest.current)
      latest.current = next
      setProgress(next)
      onChange(next)
    },
    [onChange],
  )

  return {
    progress,
    record: (id: string, verdict: Verdict) => update((p) => recordResult(p, id, verdict)),
    next: () => update((p) => ({ ...p, index: Math.min(p.index + 1, p.order.length) })),
    restart: () => update((p) => newProgress(order, p.totals)),
    resetAll: () => update(() => newProgress(order)),
  }
}
