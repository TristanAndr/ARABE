/**
 * Exercice de lecture sur un verset quelconque du Coran.
 *
 * Le texte arabe vient du fichier Tanzil, sans modification (la basmala placée par Tanzil en
 * tête du verset 1 n'en fait pas partie, comme dans le corpus). La lecture de référence est,
 * par ordre de préférence :
 *   1. celle du corpus écrite à la main pour le verset entier ;
 *   2. les segments du corpus écrits à la main, mis bout à bout s'ils couvrent tout le verset ;
 *   3. sinon, une lecture générée à partir du texte vocalisé (autoReading.ts), signalée comme telle.
 */
import { EXERCISES, type Exercise } from '../data/corpus'
import { generateReading } from '../translit/autoReading'
import type { Position } from './navigation'
import { verseView, type QuranText } from './text'

export interface PracticeItem extends Exercise {
  /** Lecture de référence générée automatiquement (non relue). */
  auto: boolean
}

export const AUTO_NOTE =
  'Lecture de référence générée automatiquement à partir du texte vocalisé (règles de Ḥafṣ), sans relecture humaine. En cas de doute, fie-toi à un récitateur.'

export const verseId = (p: Position) => `${p.surah}:${p.ayah}`

/** Segments du corpus couvrant exactement le verset, dans l'ordre, ou null. */
function handSegments(p: Position, wordCount: number): Exercise[] | null {
  const segs = EXERCISES.filter((e) => e.surah === p.surah && e.ayah === p.ayah).sort((a, b) => a.words[0] - b.words[0])
  if (segs.length === 0) return null
  let expected = 1
  for (const s of segs) {
    if (s.words[0] !== expected) return null
    expected = s.words[1] + 1
  }
  return expected === wordCount + 1 ? segs : null
}

export function verseItem(text: QuranText, p: Position): PracticeItem {
  const arabic = verseView(text, p.surah, p.ayah).text
  const words = arabic.split(' ')
  const base = { id: verseId(p), surah: p.surah, ayah: p.ayah, words: [1, words.length] as [number, number], arabic }
  const segs = handSegments(p, words.length)
  if (segs) {
    const notes = segs.flatMap((s) => s.notes ?? [])
    return { ...base, reading: segs.map((s) => s.reading).join(' '), notes: notes.length ? notes : undefined, auto: false }
  }
  return { ...base, reading: generateReading(words, { verseStart: true }), notes: [AUTO_NOTE], auto: true }
}
