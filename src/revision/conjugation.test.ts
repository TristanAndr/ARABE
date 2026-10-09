import { describe, expect, it } from 'vitest'
import {
  breakdown,
  DAMMA,
  distinctVerbs,
  FORMS,
  formsForVerb,
  MODEL,
  TATWEEL,
  verbOf,
  wordSegments,
} from './conjugation'

/**
 * Table de contrôle écrite à la main, indépendamment des données : les 14 formes du
 * présent (indicatif) de فَعَلَ / يَفْعَلُ.
 */
const EXPECTED: Record<string, [pronoun: string, verb: string]> = {
  '1cs': ['أَنَا', 'أَفْعَلُ'],
  '1cp': ['نَحْنُ', 'نَفْعَلُ'],
  '2ms': ['أَنْتَ', 'تَفْعَلُ'],
  '2fs': ['أَنْتِ', 'تَفْعَلِينَ'],
  '2md': ['أَنْتُمَا', 'تَفْعَلَانِ'],
  '2fd': ['أَنْتُمَا', 'تَفْعَلَانِ'],
  '2mp': ['أَنْتُمْ', 'تَفْعَلُونَ'],
  '2fp': ['أَنْتُنَّ', 'تَفْعَلْنَ'],
  '3ms': ['هُوَ', 'يَفْعَلُ'],
  '3fs': ['هِيَ', 'تَفْعَلُ'],
  '3md': ['هُمَا', 'يَفْعَلَانِ'],
  '3fd': ['هُمَا', 'تَفْعَلَانِ'],
  '3mp': ['هُمْ', 'يَفْعَلُونَ'],
  '3fp': ['هُنَّ', 'يَفْعَلْنَ'],
}

const nfc = (s: string) => s.normalize('NFC')

describe('données de conjugaison', () => {
  it('contient exactement les 14 formes, sans doublon de personne/genre/nombre', () => {
    expect(FORMS).toHaveLength(14)
    expect(new Set(FORMS.map((f) => f.id)).size).toBe(14)
    expect(new Set(FORMS.map((f) => `${f.person}-${f.gender}-${f.number}`)).size).toBe(14)
    expect(FORMS.map((f) => f.id).sort()).toEqual(Object.keys(EXPECTED).sort())
  })

  it.each(Object.entries(EXPECTED))('%s : pronom et forme verbale vocalisée', (id, [pronoun, verb]) => {
    const f = FORMS.find((x) => x.id === id)!
    expect(nfc(f.pronoun)).toBe(nfc(pronoun))
    expect(nfc(verbOf(f))).toBe(nfc(verb))
  })

  it('identifiant cohérent avec la personne, le genre et le nombre', () => {
    for (const f of FORMS) {
      expect(f.id[0]).toBe(String(f.person))
      expect(f.id[1]).toBe(f.gender === 'commun' ? 'c' : f.gender === 'masculin' ? 'm' : 'f')
      expect(f.id[2]).toBe(f.number[0])
    }
  })

  it('le modèle annoncé correspond à la 3e personne du masculin singulier', () => {
    expect(verbOf(FORMS.find((f) => f.id === '3ms')!)).toBe(MODEL.present)
    expect(MODEL.past).toBe('فَعَلَ')
  })

  it('les textes sont en forme Unicode composée (NFC)', () => {
    for (const f of FORMS) {
      expect(f.pronoun).toBe(nfc(f.pronoun))
      expect(verbOf(f)).toBe(nfc(verbOf(f)))
    }
  })
})

describe('découpage préfixe / radical / terminaison', () => {
  it('le radical est identique dans toutes les formes et contient les trois radicales', () => {
    expect(MODEL.stem.replace(/[ً-ْ]/g, '')).toBe(MODEL.root.join(''))
    for (const f of FORMS) expect(verbOf(f).includes(MODEL.stem)).toBe(true)
  })

  it('préfixes : أَ (je), نَ (nous), تَ (tu, vous, elle, elles deux), يَ (il, ils, elles pl.)', () => {
    const prefixOf = (id: string) => FORMS.find((f) => f.id === id)!.prefix
    expect(prefixOf('1cs')).toBe('أَ')
    expect(prefixOf('1cp')).toBe('نَ')
    for (const id of ['2ms', '2fs', '2md', '2fd', '2mp', '2fp', '3fs', '3fd']) expect(prefixOf(id)).toBe('تَ')
    for (const id of ['3ms', '3md', '3mp', '3fp']) expect(prefixOf(id)).toBe('يَ')
  })

  it('les segments colorés recomposent exactement la forme, sans couper une lettre de ses signes', () => {
    for (const f of FORMS) {
      const s = wordSegments(f)
      expect(s.prefix + s.stem + s.suffix).toBe(verbOf(f))
      // Chaque segment commence par une lettre, jamais par un signe combinant.
      for (const part of [s.prefix, s.stem, s.suffix].filter(Boolean)) {
        expect(part[0]).toMatch(/[ء-ي]/)
      }
    }
  })

  it('terminaisons du découpage', () => {
    const endingOf = (id: string) => breakdown(FORMS.find((f) => f.id === id)!).ending
    for (const id of ['1cs', '1cp', '2ms', '3ms', '3fs']) expect(endingOf(id)).toBe(TATWEEL + DAMMA)
    expect(endingOf('2fs')).toBe('ـِينَ')
    for (const id of ['2md', '2fd', '3md', '3fd']) expect(endingOf(id)).toBe('ـَانِ')
    for (const id of ['2mp', '3mp']) expect(endingOf(id)).toBe('ـُونَ')
    for (const id of ['2fp', '3fp']) expect(endingOf(id)).toBe('ـْنَ')
  })

  it('le découpage, sans les tatwīl, redonne la forme complète', () => {
    for (const f of FORMS) {
      const b = breakdown(f)
      expect((b.prefix + b.stem + b.ending).replaceAll(TATWEEL, '')).toBe(verbOf(f))
    }
  })

  it('pas de tatwīl après أَ, qui ne se lie pas à la lettre suivante', () => {
    const b = breakdown(FORMS.find((f) => f.id === '1cs')!)
    expect(b.prefix).toBe('أَ')
    expect(b.stem.startsWith(TATWEEL)).toBe(false)
    expect(breakdown(FORMS.find((f) => f.id === '3ms')!).prefix).toBe('يَـ')
  })
})

describe('formes partagées', () => {
  it('11 formes distinctes pour 14 pronoms', () => {
    expect(distinctVerbs()).toHaveLength(11)
  })

  it('تَفْعَلُ : أَنْتَ et هِيَ ; تَفْعَلَانِ : les deux أَنْتُمَا et هُمَا féminin', () => {
    expect(formsForVerb('تَفْعَلُ').map((f) => f.id)).toEqual(['2ms', '3fs'])
    expect(formsForVerb('تَفْعَلَانِ').map((f) => f.id)).toEqual(['2md', '2fd', '3fd'])
    expect(formsForVerb('يَفْعَلْنَ').map((f) => f.id)).toEqual(['3fp'])
    expect(formsForVerb('تَفْعَلْنَ').map((f) => f.id)).toEqual(['2fp'])
  })
})
