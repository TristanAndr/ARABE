import { isConsonant, isPhoneme, type Phoneme } from './phonemes'
import type { Spellings } from './profiles'

/**
 * Format des lectures de référence (champ `reading` du corpus)
 *
 *   - phonèmes de l'inventaire (`phonemes.ts`), un caractère chacun ;
 *   - espace : frontière de mot (pour l'affichage et le retour par mot) ;
 *   - tiret : frontière de morphème (article, préfixe), purement visuelle ;
 *   - consonne écrite deux fois : gémination (šadda) ;
 *   - `[…]` : terminaison prononcée seulement sans pause (waṣl). La référence
 *     est lue à la pause (waqf) ; ces terminaisons peuvent être acceptées
 *     selon les réglages ;
 *   - `{x|y}` : variantes acceptées, la première étant la lecture principale.
 */

export interface RefUnit {
  phoneme: Phoneme
  /** Consonne géminée (šadda) : une seule unité qui s'écrit deux fois. */
  geminate: boolean
  /** Indice du mot dans `words`. */
  word: number
  /** Terminaison de waṣl, absente de la lecture à la pause. */
  pausal: boolean
  /** Premier son d'un mot ou d'un morphème (utile pour la hamza initiale). */
  wordInitial: boolean
}

export interface ParsedReading {
  source: string
  words: string[]
  units: RefUnit[]
}

const ALT = /\{([^{}]*)\}/

/** Développe `{x|y}` en toutes les combinaisons ; la première est la principale. */
export function expandVariants(source: string): string[] {
  const m = ALT.exec(source)
  if (!m) return [source]
  const options = m[1]!.split('|')
  const before = source.slice(0, m.index)
  const after = source.slice(m.index + m[0].length)
  return options.flatMap((opt) => expandVariants(before + opt + after))
}

/** Lecture principale : la première option de chaque `{x|y}`, sans tout développer. */
export function primaryVariant(source: string): string {
  return source.replace(/\{([^{}|]*)[^{}]*\}/g, '$1')
}

/**
 * Découpe une lecture en morceaux indépendants, aux espaces où rien ne relie les deux
 * côtés : ni variante collée à l'espace (son option peut former une gémination avec le mot
 * suivant : ʾaḏa{m|n} mi), ni même consonne de part et d'autre (ʿābidum mā). Les variantes
 * d'un morceau ne dépendent que de lui : on peut les comparer morceau par morceau.
 */
export function splitReading(source: string): string[] {
  const text = source.normalize('NFC').trim()
  const chunks: string[] = []
  let start = 0
  let depth = 0
  for (let k = 0; k < text.length; k++) {
    const ch = text[k]!
    if (ch === '{' || ch === '[') depth++
    else if (ch === '}' || ch === ']') depth--
    else if (depth === 0 && /\s/.test(ch)) {
      const before = text.slice(start, k).trimEnd()
      const after = text.slice(k).trimStart()
      const last = before[before.length - 1]
      const first = after[0]
      if (last && first && last !== '}' && first !== '{' && first !== '[' && last !== first) {
        chunks.push(before)
        start = k + 1
        while (start < text.length && /\s/.test(text[start]!)) start++
        k = start - 1
      }
    }
  }
  chunks.push(text.slice(start).trim())
  return chunks.filter((c) => c.length > 0)
}

export function parseReading(source: string): ParsedReading {
  const text = source.normalize('NFC').trim()
  const words = text.split(/\s+/)
  const units: RefUnit[] = []
  let word = 0
  let atStart = true
  let pausal = false
  let prevSpace = false

  for (const ch of text) {
    const space = /\s/.test(ch)
    if (space) {
      if (!prevSpace) word++
      atStart = true
    }
    prevSpace = space
    if (space) {
      continue
    } else if (ch === '-') {
      atStart = true
    } else if (ch === '[') {
      pausal = true
    } else if (ch === ']') {
      pausal = false
    } else if (isPhoneme(ch)) {
      const prev = units[units.length - 1]
      // Deux consonnes identiques consécutives = une consonne géminée,
      // même de part et d'autre d'un tiret ou d'un espace (r-raḥmān, ʿābidum mā).
      if (prev && !prev.geminate && prev.phoneme === ch && isConsonant(ch) && prev.pausal === pausal) {
        prev.geminate = true
      } else {
        units.push({ phoneme: ch, geminate: false, word, pausal, wordInitial: atStart })
      }
      atStart = false
    } else {
      throw new Error(`Caractère inattendu « ${ch} » dans la lecture « ${source} »`)
    }
  }
  return { source: text, words, units }
}

/** Écrit un mot de référence avec les graphies principales du profil (forme pausale). */
export function renderWord(word: string, spellings: Spellings): string {
  let out = ''
  let pausal = false
  for (const ch of word) {
    if (ch === '[') pausal = true
    else if (ch === ']') pausal = false
    else if (pausal) continue
    else if (ch === '-') out += '-'
    else if (isPhoneme(ch)) out += spellings[ch][0] ?? ch
    else out += ch
  }
  return out
}

export function renderReading(source: string, spellings: Spellings): string {
  return source.trim().split(/\s+/).map((w) => renderWord(w, spellings)).join(' ')
}
