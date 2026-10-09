import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { compareAnswer } from '../compare/compare'
import { DEFAULT_NORMALIZATION } from '../compare/normalize'
import { PRESETS } from '../translit/profiles'
import { expandVariants, parseReading, renderReading } from '../translit/reference'
import { EXERCISES } from './corpus'
import { SURAHS } from './surahs'

const TANZIL = fileURLToPath(new URL('../../data/tanzil/quran-uthmani.txt', import.meta.url))

function loadTanzil(): Map<string, string> {
  const verses = new Map<string, string>()
  for (const line of readFileSync(TANZIL, 'utf8').split('\n')) {
    if (!line || line.startsWith('#')) continue
    const [s, a, text] = line.split('|')
    verses.set(`${s}:${a}`, text!)
  }
  return verses
}

const verses = loadTanzil()
const BASMALA = verses.get('1:1')!

function verseWords(surah: number, ayah: number): string[] {
  let text = verses.get(`${surah}:${ayah}`)!
  if (surah !== 1 && surah !== 9 && ayah === 1 && text.startsWith(BASMALA + ' ')) {
    text = text.slice(BASMALA.length + 1)
  }
  return text.split(' ')
}

describe('fichier Tanzil', () => {
  it('contient les 6236 versets et sa notice de licence', () => {
    expect(verses.size).toBe(6236)
    expect(readFileSync(TANZIL, 'utf8')).toContain('Tanzil Quran Text (Uthmani, Version 1.1)')
  })
})

describe('corpus', () => {
  it('compte au moins 20 exercices aux identifiants uniques', () => {
    expect(EXERCISES.length).toBeGreaterThanOrEqual(20)
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length)
  })

  it.each(EXERCISES)('$id : texte arabe identique à la source Tanzil', (e) => {
    const words = verseWords(e.surah, e.ayah)
    const [from, to] = e.words
    expect(from).toBeGreaterThanOrEqual(1)
    expect(to).toBeLessThanOrEqual(words.length)
    expect(e.arabic).toBe(words.slice(from - 1, to).join(' '))
    const expectedId = from === 1 && to === words.length ? `${e.surah}:${e.ayah}` : `${e.surah}:${e.ayah}:${from}-${to}`
    expect(e.id).toBe(expectedId)
    expect(SURAHS[e.surah]).toBeDefined()
  })

  it.each(EXERCISES)('$id : lecture de référence valide, un mot ou groupe par mot', (e) => {
    for (const variant of expandVariants(e.reading)) {
      const parsed = parseReading(variant)
      expect(parsed.units.length).toBeGreaterThan(0)
      // Les mots de la référence ne correspondent pas un à un aux mots arabes
      // (liaisons), mais leur nombre reste du même ordre.
      expect(Math.abs(parsed.words.length - (e.words[1] - e.words[0] + 1))).toBeLessThanOrEqual(1)
    }
  })
})

describe('cohérence affichage / vérification', () => {
  const profiles = Object.values(PRESETS)
  it.each(EXERCISES)('$id : la référence affichée est jugée juste dans chaque profil', (e) => {
    for (const { spellings } of profiles) {
      for (const variant of expandVariants(e.reading)) {
        const shown = renderReading(variant, spellings)
        const strict = { ...DEFAULT_NORMALIZATION, optionalInitialHamza: false, acceptWaslEndings: false }
        expect(compareAnswer(e.reading, shown, spellings, strict).verdict).toBe('correct')
      }
    }
  })
})
