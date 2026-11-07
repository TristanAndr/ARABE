/**
 * Jeu « mot à mot » : un mot est montré dans son verset, on choisit son sens parmi trois.
 *
 * Les mots les moins sus passent en premier ; un mot raté revient une fois en fin de série.
 * La maîtrise de chaque mot (0 à 3) est retenue sur l'appareil.
 */

import { useCallback, useState } from 'react'
import { LEXICON, type WbwText, type WbwVerse } from '../data/wordByWord'
import { isRecord, loadJSON, saveJSON } from '../storage/storage'
import { shuffle, type Random } from './quiz'

export const MASTERED = 3
const OPTION_COUNT = 3
export const SESSION_SIZE = 10

export type Mastery = Record<string, number>

export interface Occurrence {
  verse: WbwVerse
  index: number
}

export interface WordQuestion {
  key: string
  occurrence: Occurrence
  /** Entrées du lexique proposées, dont la bonne. */
  options: string[]
  /** Question reposée après une erreur. */
  retry?: boolean
}

/**
 * Famille d'une entrée, en remontant les `base` : وَإِيَّاكَ et إِيَّاكَ, ou لَمْ et لَا, ne se servent
 * pas de piège l'un à l'autre.
 */
export function family(key: string): string {
  let k = key
  for (let base = LEXICON[k]?.base; base; base = LEXICON[k]?.base) k = base
  return k
}

export function occurrencesByKey(texts: readonly WbwText[]): Map<string, Occurrence[]> {
  const map = new Map<string, Occurrence[]>()
  for (const t of texts) {
    for (const verse of t.verses) {
      verse.words.forEach((w, index) => {
        const list = map.get(w.key) ?? []
        list.push({ verse, index })
        map.set(w.key, list)
      })
    }
  }
  return map
}

/** Entrées distinctes d'un texte, dans l'ordre où on les rencontre. */
export function textKeys(text: WbwText): string[] {
  return [...occurrencesByKey([text]).keys()]
}

/** Deux pièges, de préférence de la même nature (un verbe contre des verbes), de sens distinct. */
export function wordOptions(key: string, random: Random = Math.random): string[] {
  const right = LEXICON[key]!
  const rivals = shuffle(
    Object.keys(LEXICON).filter((k) => family(k) !== family(key) && LEXICON[k]!.fr !== right.fr),
    random,
  )
  const sameKind = rivals.filter((k) => LEXICON[k]!.kind === right.kind)
  const others = rivals.filter((k) => LEXICON[k]!.kind !== right.kind)
  const picked: string[] = []
  for (const k of [...sameKind, ...others]) {
    if (picked.length === OPTION_COUNT - 1) break
    if (picked.some((p) => family(p) === family(k) || LEXICON[p]!.fr === LEXICON[k]!.fr)) continue
    picked.push(k)
  }
  return shuffle([key, ...picked], random)
}

function question(key: string, occurrences: Map<string, Occurrence[]>, random: Random, retry?: boolean): WordQuestion {
  const list = occurrences.get(key)!
  const occurrence = list[Math.floor(random() * list.length)]!
  return { key, occurrence, options: wordOptions(key, random), ...(retry ? { retry } : {}) }
}

/** Une série : les mots les moins sus d'abord, mélangés à niveau égal. */
export function buildWordSession(
  text: WbwText,
  mastery: Mastery,
  random: Random = Math.random,
  size = SESSION_SIZE,
): WordQuestion[] {
  const occurrences = occurrencesByKey([text])
  const keys = shuffle([...occurrences.keys()], random)
    .map((k, i) => ({ k, level: mastery[k] ?? 0, i }))
    .sort((a, b) => a.level - b.level || a.i - b.i)
    .slice(0, size)
    .map((x) => x.k)
  return keys.map((k) => question(k, occurrences, random))
}

/** Le même mot, reposé plus loin (une seule fois), dans un autre verset s'il en a plusieurs. */
export function retryQuestion(text: WbwText, key: string, random: Random = Math.random): WordQuestion {
  return question(key, occurrencesByKey([text]), random, true)
}

/** Plage de versets travaillée (numéros d'ordre dans le texte, à partir de 1, bornes incluses). */
export interface VerseRange {
  from: number
  to: number
}

/** À partir de combien de versets on peut choisir une plage : les textes courts se font en entier. */
export const RANGE_MIN_VERSES = 5

export function fullRange(text: WbwText): VerseRange {
  return { from: 1, to: text.verses.length }
}

/** Plage ramenée dans les bornes du texte, `from` ≤ `to`. */
export function clampRange(text: WbwText, range: VerseRange): VerseRange {
  const n = text.verses.length
  const from = Math.min(Math.max(1, Math.round(range.from)), n)
  const to = Math.min(Math.max(from, Math.round(range.to)), n)
  return { from, to }
}

/** Le texte réduit aux versets de la plage. */
export function textRange(text: WbwText, range: VerseRange): WbwText {
  const { from, to } = clampRange(text, range)
  return { ...text, verses: text.verses.slice(from - 1, to) }
}

const RANGE_KEY = 'motamot.plage'

type Ranges = Partial<Record<WbwText['id'], VerseRange>>

function sanitizeRanges(raw: unknown): Ranges | null {
  if (!isRecord(raw)) return null
  const ranges: Ranges = {}
  for (const [id, r] of Object.entries(raw)) {
    if (isRecord(r) && typeof r.from === 'number' && typeof r.to === 'number') {
      ranges[id as WbwText['id']] = { from: r.from, to: r.to }
    }
  }
  return ranges
}

/** Plage choisie pour chaque texte, retenue sur l'appareil. */
export function useVerseRange(text: WbwText) {
  const [ranges, setRanges] = useState<Ranges>(() => loadJSON(RANGE_KEY, {}, sanitizeRanges))
  const stored = ranges[text.id]
  const range = stored && text.verses.length >= RANGE_MIN_VERSES ? clampRange(text, stored) : fullRange(text)
  const setRange = useCallback(
    (next: VerseRange) => {
      setRanges((r) => {
        const all = { ...r, [text.id]: clampRange(text, next) }
        saveJSON(RANGE_KEY, all)
        return all
      })
    },
    [text],
  )
  return [range, setRange] as const
}

export function nextLevel(level: number, correct: boolean): number {
  return correct ? Math.min(level + 1, MASTERED) : 0
}

const STORAGE_KEY = 'motamot.maitrise'

function sanitizeMastery(raw: unknown): Mastery | null {
  if (!isRecord(raw)) return null
  const m: Mastery = {}
  for (const [k, v] of Object.entries(raw)) {
    if (k in LEXICON && typeof v === 'number' && Number.isInteger(v)) m[k] = Math.max(0, Math.min(MASTERED, v))
  }
  return m
}

export function useMastery() {
  const [mastery, setMastery] = useState<Mastery>(() => loadJSON(STORAGE_KEY, {}, sanitizeMastery))
  const record = useCallback((key: string, correct: boolean) => {
    setMastery((m) => {
      const next = { ...m, [key]: nextLevel(m[key] ?? 0, correct) }
      saveJSON(STORAGE_KEY, next)
      return next
    })
  }, [])
  return { mastery, record }
}
