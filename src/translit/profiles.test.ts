import { describe, expect, it } from 'vitest'
import { PHONEMES } from './phonemes'
import { findConflicts, parseSpellingList, PRESETS, resolveSpellings } from './profiles'

describe('profils', () => {
  it('définissent au moins une graphie pour chaque son', () => {
    for (const preset of Object.values(PRESETS)) {
      for (const p of PHONEMES) expect(preset.spellings[p].length).toBeGreaterThan(0)
    }
  })

  it('le profil précis distingue tous les sons', () => {
    expect(findConflicts(PRESETS.precise.spellings, true).size).toBe(0)
  })

  it('le profil simplifié ne confond que les emphatiques, et le signale', () => {
    const conflicts = findConflicts(PRESETS.simple.spellings, true)
    expect([...conflicts.keys()].sort()).toEqual(['d', 's', 't', 'z'])
    expect(conflicts.get('s')).toEqual(['s', 'ṣ'])
  })

  it('le profil personnalisé applique les surcharges sur sa base', () => {
    const s = resolveSpellings({ profileId: 'custom', customBase: 'precise', overrides: { 'ʿ': ['c'] } })
    expect(s['ʿ']).toEqual(['c'])
    expect(s['ḥ']).toEqual(PRESETS.precise.spellings['ḥ'])
  })

  it('un préréglage ignore les surcharges', () => {
    const s = resolveSpellings({ profileId: 'simple', customBase: 'precise', overrides: { 'ʿ': ['c'] } })
    expect(s['ʿ']).toEqual(PRESETS.simple.spellings['ʿ'])
  })
})

describe('parseSpellingList', () => {
  it('découpe, nettoie et dédoublonne', () => {
    expect(parseSpellingList(' ch , sh,ch, ')).toEqual({ spellings: ['ch', 'sh'], invalid: [] })
  })
  it('refuse les séparateurs, ignorés à la saisie', () => {
    expect(parseSpellingList('a-a, b b').invalid).toEqual(['a-a', 'b b'])
  })
  it('compose les diacritiques', () => {
    expect(parseSpellingList('ḥ').spellings).toEqual(['ḥ'])
  })
})
