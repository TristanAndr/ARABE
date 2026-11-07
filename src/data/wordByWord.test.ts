import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { family } from '../revision/wordQuiz'
import { LEXICON, WBW_TEXTS } from './wordByWord'

const TANZIL = fileURLToPath(new URL('../../data/tanzil/quran-uthmani.txt', import.meta.url))
const verses = new Map<string, string>()
for (const line of readFileSync(TANZIL, 'utf8').split('\n')) {
  if (!line || line.startsWith('#')) continue
  const [s, a, text] = line.split('|')
  verses.set(`${s}:${a}`, text!)
}
const BASMALA = verses.get('1:1')!
/** Signes de pause du muṣḥaf (ۚ ۖ ۗ…), écrits comme des mots à part dans Tanzil. */
const PAUSE = /^[ۖ-ۭ]+$/

/** Mots écrits pareil, de sens différents selon la phrase : le cours les distingue. */
const HOMOGRAPHS = {
  'إِنْ': ['in-nafy', 'in-shart'], // « si » / « ne… que »
  'مَا': ['ma', 'ma-nafy'], // « ce que » / « ne… pas »
  'مَّا': ['ma-nafy', 'ma-zaida'], // « ne… pas » / « bien peu »
}

describe('mot à mot', () => {
  it('chaque verset est le texte Tanzil, mot pour mot, signes de pause retirés', () => {
    for (const text of WBW_TEXTS) {
      for (const v of text.verses.filter((v) => v.surah !== undefined)) {
        let raw = verses.get(`${v.surah}:${v.ayah}`)!
        if (v.surah !== 1 && v.ayah === 1) raw = raw.slice(BASMALA.length + 1)
        expect(v.words.map((w) => w.ar)).toEqual(raw.split(' ').filter((t) => !PAUSE.test(t)))
      }
    }
  })

  it('les textes complets : al-Fātiḥa, al-Ikhlāṣ, Āyat al-Kursī, al-Mulk, le tashahhud', () => {
    expect(WBW_TEXTS.map((t) => t.verses.map((v) => v.id))).toEqual([
      ['1:1', '1:2', '1:3', '1:4', '1:5', '1:6', '1:7'],
      ['112:1', '112:2', '112:3', '112:4'],
      ['2:255'],
      Array.from({ length: 30 }, (_, i) => `67:${i + 1}`),
      ['tashahhud:1', 'tashahhud:2', 'tashahhud:3', 'tashahhud:4', 'tashahhud:5'],
    ])
  })

  it('chaque mot a son entrée, sa lecture et une traduction ; chaque entrée sert', () => {
    const used = new Set<string>()
    for (const v of WBW_TEXTS.flatMap((t) => t.verses)) {
      expect(v.fr.length).toBeGreaterThan(0)
      for (const w of v.words) {
        expect(LEXICON[w.key], w.key).toBeDefined()
        expect(w.tr.trim()).toBe(w.tr)
        expect(w.tr.length).toBeGreaterThan(0)
        used.add(w.key)
      }
    }
    expect([...used].sort()).toEqual(Object.keys(LEXICON).sort())
    for (const [key, lemma] of Object.entries(LEXICON)) {
      if (lemma.base) expect(LEXICON[lemma.base], key).toBeDefined()
      for (const [ar, fr] of lemma.parts ?? []) {
        expect(ar.length).toBeGreaterThan(0)
        expect(fr.length).toBeGreaterThan(0)
      }
    }
  })

  it('un mot qui revient renvoie à la même entrée : il ne s’apprend qu’une fois', () => {
    const keysByWord = new Map<string, Set<string>>()
    for (const w of WBW_TEXTS.flatMap((t) => t.verses.flatMap((v) => v.words))) {
      keysByWord.set(w.ar, (keysByWord.get(w.ar) ?? new Set()).add(w.key))
    }
    // Un même mot écrit peut avoir deux sens : de la même famille (أَحَد), ou homographe connu.
    const homographs = [...keysByWord].filter(([, keys]) => new Set([...keys].map(family)).size > 1)
    expect(Object.fromEntries(homographs.map(([ar, keys]) => [ar, [...keys].sort()]))).toEqual(HOMOGRAPHS)
    const allah = WBW_TEXTS.flatMap((t) => t.verses.flatMap((v) => v.words)).filter((w) => w.key === 'allah')
    expect(allah.length).toBeGreaterThan(3)
    // أَحَد : « Unique » au verset 1, « nul » au verset 4, deux sens, une même famille.
    expect(LEXICON['ahad-nul']!.base).toBe('ahad')
  })
})
