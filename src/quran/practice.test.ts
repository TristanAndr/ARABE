import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EXERCISES } from '../data/corpus'
import { parseTanzil } from './text'
import { AUTO_NOTE, verseItem } from './practice'

const QURAN = parseTanzil(readFileSync(join(__dirname, '../../data/tanzil/quran-uthmani.txt'), 'utf8'))
const byId = (id: string) => EXERCISES.find((e) => e.id === id)!

describe('exercice sur un verset', () => {
  it('verset du corpus : lecture et notes écrites à la main, texte identique', () => {
    const item = verseItem(QURAN, { surah: 113, ayah: 4 })
    const hand = byId('113:4')
    expect(item).toMatchObject({ id: '113:4', arabic: hand.arabic, reading: hand.reading, notes: hand.notes, auto: false })
  })

  it('verset couvert par plusieurs segments : lectures mises bout à bout', () => {
    const item = verseItem(QURAN, { surah: 1, ayah: 7 })
    expect(item.reading).toBe(`${byId('1:7:1-4').reading} ${byId('1:7:5-9').reading}`)
    expect(item.arabic).toBe(`${byId('1:7:1-4').arabic} ${byId('1:7:5-9').arabic}`)
    expect(item.auto).toBe(false)
  })

  it('verset hors corpus : lecture générée et signalée', () => {
    const item = verseItem(QURAN, { surah: 109, ayah: 5 })
    expect(item.auto).toBe(true)
    expect(item.notes).toEqual([AUTO_NOTE])
    expect(item.reading).toBe('walā ʾantum ʿābidūna mā ʾaʿbud[u]')
  })

  it('verset 1 : sans la basmala ajoutée par Tanzil', () => {
    const item = verseItem(QURAN, { surah: 36, ayah: 1 })
    expect(item.arabic).toBe('يسٓ')
    expect(item.reading).toBe('yā-sīn')
  })
})
