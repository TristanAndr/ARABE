import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { SURAH_LIST, SURAHS } from '../data/surahs'
import { next, previous, sanitizePosition } from './navigation'
import { searchSurahs } from './search'
import { loadQuranText, parseTanzil, verseView } from './text'

const RAW = readFileSync(fileURLToPath(new URL('../../data/tanzil/quran-uthmani.txt', import.meta.url)), 'utf8')
const text = parseTanzil(RAW)

describe('texte (Tanzil)', () => {
  it('114 sourates, 6236 versets, nombres conformes aux métadonnées', () => {
    expect(text.size).toBe(114)
    expect([...text.values()].reduce((n, v) => n + v.length, 0)).toBe(6236)
    for (const s of SURAH_LIST) expect(text.get(s.number)!.length, s.name).toBe(s.ayahs)
  })

  it('aucune modification : chaque verset est identique à sa ligne du fichier', () => {
    for (const line of RAW.split('\n')) {
      if (!line || line.startsWith('#')) continue
      const [s, a, verse] = line.split('|')
      expect(text.get(Number(s))![Number(a) - 1]).toBe(verse)
    }
  })

  it('le texte est vocalisé', () => {
    expect(text.get(2)![0]).toMatch(/[ً-ْ]/)
  })

  it('basmala séparée du verset 1 pour l’affichage, texte recomposable à l’identique', () => {
    const basmala = text.get(1)![0]!
    const v = verseView(text, 2, 1)
    expect(v.basmala).toBe(basmala)
    expect(`${v.basmala} ${v.text}`).toBe(text.get(2)![0])
    expect(verseView(text, 1, 1)).toEqual({ basmala: null, text: basmala })
    expect(verseView(text, 9, 1).basmala).toBeNull()
    expect(verseView(text, 2, 2).basmala).toBeNull()
    // Basmala écrite avec une šadda initiale (بِّسْمِ) : détectée aussi.
    for (const s of [95, 97]) {
      const b = verseView(text, s, 1)
      expect(b.basmala).not.toBeNull()
      expect(`${b.basmala} ${b.text}`).toBe(text.get(s)![0])
    }
    // Toutes les sourates sauf 1 et 9 ont leur basmala séparée.
    for (let s = 2; s <= 114; s++) expect(verseView(text, s, 1).basmala === null, String(s)).toBe(s === 9)
  })

  it('le chargement à la demande renvoie le même texte', async () => {
    const loaded = await loadQuranText()
    expect(loaded.get(36)).toEqual(text.get(36))
  })
})

describe('navigation', () => {
  it('versets consécutifs au milieu du Coran', () => {
    let p = { surah: 36, ayah: 1 }
    for (let i = 2; i <= 5; i++) {
      p = next(p)!
      expect(p).toEqual({ surah: 36, ayah: i })
    }
    expect(previous(p)).toEqual({ surah: 36, ayah: 4 })
  })

  it('pas de verset précédent au premier verset', () => {
    expect(previous({ surah: 36, ayah: 1 })).toBeNull()
  })

  it('après le dernier verset : premier verset de la sourate suivante', () => {
    expect(next({ surah: 36, ayah: 83 })).toEqual({ surah: 37, ayah: 1 })
    expect(next({ surah: 1, ayah: 7 })).toEqual({ surah: 2, ayah: 1 })
  })

  it('fin du Coran : pas de suivant', () => {
    expect(next({ surah: 114, ayah: 6 })).toBeNull()
  })

  it('position enregistrée invalide : ignorée', () => {
    expect(sanitizePosition({ surah: 2, ayah: 286 })).toEqual({ surah: 2, ayah: 286 })
    expect(sanitizePosition({ surah: 2, ayah: 287 })).toBeNull()
    expect(sanitizePosition({ surah: 115, ayah: 1 })).toBeNull()
    expect(sanitizePosition('x')).toBeNull()
  })
})

describe('recherche de sourate', () => {
  const first = (q: string) => searchSurahs(q)[0]?.number

  it('nom français', () => {
    expect(first('vache')).toBe(2)
    expect(first('La Caverne')).toBe(18)
    expect(first('evenement')).toBe(56)
  })

  it('nom arabe, avec ou sans article ni voyelles', () => {
    expect(first('البقرة')).toBe(2)
    expect(first('بقرة')).toBe(2)
    expect(first('الكَهْف')).toBe(18)
    expect(first('يس')).toBe(36)
  })

  it('translittération précise, simplifiée ou Tanzil', () => {
    expect(first('al-Fātiḥa')).toBe(1)
    expect(first('fatiha')).toBe(1)
    expect(first('Faatiha')).toBe(1)
    expect(first('kawthar')).toBe(108)
    expect(first('Yaseen')).toBe(36)
    expect(first('rahman')).toBe(55)
  })

  it('numéro et recherche vide', () => {
    expect(first('112')).toBe(112)
    expect(searchSurahs('')).toHaveLength(114)
    expect(searchSurahs('zzzz')).toHaveLength(0)
  })

  it('métadonnées complètes', () => {
    expect(SURAH_LIST).toHaveLength(114)
    expect(SURAH_LIST.map((s) => s.number)).toEqual(Array.from({ length: 114 }, (_, i) => i + 1))
    expect(new Set(SURAH_LIST.map((s) => s.french)).size).toBe(114)
    expect(SURAHS[2]!.arabic).toBe('البقرة')
  })
})
