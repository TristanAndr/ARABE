import { describe, expect, it } from 'vitest'
import { PRESETS } from './profiles'
import { expandVariants, parseReading, renderReading } from './reference'

describe('expandVariants', () => {
  it('garde la lecture principale en premier', () => {
    expect(expandVariants('wa-l{a|ā} ḍ-ḍāllīn')).toEqual(['wa-la ḍ-ḍāllīn', 'wa-lā ḍ-ḍāllīn'])
  })
  it('développe plusieurs groupes', () => {
    expect(expandVariants('{a|b}x{c|d}')).toEqual(['axc', 'axd', 'bxc', 'bxd'])
  })
  it('laisse une lecture sans variante intacte', () => {
    expect(expandVariants('qul')).toEqual(['qul'])
  })
})

describe('parseReading', () => {
  it('fusionne deux consonnes identiques en une consonne géminée, même à travers un tiret', () => {
    const { units } = parseReading('r-raḥmān')
    expect(units.map((u) => u.phoneme).join('')).toBe('raḥmān')
    expect(units[0]!.geminate).toBe(true)
  })
  it('ne fusionne pas des voyelles', () => {
    expect(() => parseReading('aa')).not.toThrow()
    expect(parseReading('aa').units).toHaveLength(2)
  })
  it('attribue chaque son à son mot et repère les débuts de mot', () => {
    const { words, units } = parseReading('wa-ʾiyyāka naʿbudu')
    expect(words).toEqual(['wa-ʾiyyāka', 'naʿbudu'])
    const hamza = units.find((u) => u.phoneme === 'ʾ')!
    expect(hamza.wordInitial).toBe(true)
    expect(hamza.word).toBe(0)
    expect(units.find((u) => u.phoneme === 'n')!.word).toBe(1)
  })
  it('marque les terminaisons de liaison', () => {
    const { units } = parseReading('r-raḥīm[i]')
    expect(units.at(-1)).toMatchObject({ phoneme: 'i', pausal: true })
    expect(units.filter((u) => u.pausal)).toHaveLength(1)
  })
  it('rejette un caractère hors inventaire', () => {
    expect(() => parseReading('bismi allah!')).toThrow()
  })
})

describe('renderReading', () => {
  it('écrit la forme pausale avec les graphies principales du profil', () => {
    const r = 'bismi llāhi r-raḥmāni r-raḥīm[i]'
    expect(renderReading(r, PRESETS.precise.spellings)).toBe('bismi llāhi r-raḥmāni r-raḥīm')
    expect(renderReading(r, PRESETS.simple.spellings)).toBe('bismi llaahi r-ra7maani r-ra7iim')
  })
})
