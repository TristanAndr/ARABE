import { describe, expect, it } from 'vitest'
import { isBlank, normalizeAnswer } from './normalize'

describe('normalizeAnswer', () => {
  it('retire les espaces superflus et unifie la casse', () => {
    expect(normalizeAnswer('  Bismi   LLāhi  ', { ignoreCase: true })).toBe('bismi llāhi')
  })
  it('conserve la casse si demandé', () => {
    expect(normalizeAnswer('Ṣ', { ignoreCase: false })).toBe('Ṣ')
  })
  it('compose les diacritiques combinants (h + point souscrit = ḥ)', () => {
    expect(normalizeAnswer('raḥīm', { ignoreCase: true })).toBe('raḥīm')
  })
  it('retire les caractères invisibles', () => {
    expect(normalizeAnswer('qu​l', { ignoreCase: true })).toBe('qul')
  })
})

describe('isBlank', () => {
  it('détecte une saisie vide', () => {
    expect(isBlank('   ')).toBe(true)
    expect(isBlank('​')).toBe(true)
    expect(isBlank('a')).toBe(false)
  })
})
