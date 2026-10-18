// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { applyTheme, DEFAULT_SETTINGS, sanitizeSettings } from './settings'

describe('thème', () => {
  it('conserve les cinq thèmes, et revient à « système » pour une valeur inconnue', () => {
    for (const theme of ['system', 'light', 'dark', 'cocooning', 'cocooning-dark'] as const) {
      expect(sanitizeSettings({ ...DEFAULT_SETTINGS, theme })!.theme).toBe(theme)
    }
    expect(sanitizeSettings({ ...DEFAULT_SETTINGS, theme: 'néon' })!.theme).toBe('system')
  })

  it('Cocooning sombre se choisit indépendamment du système', () => {
    const root = document.documentElement
    applyTheme('cocooning-dark')
    expect([root.dataset.theme, root.dataset.shade]).toEqual(['cocooning', 'dark'])
    applyTheme('cocooning')
    expect([root.dataset.theme, root.dataset.shade]).toEqual(['cocooning', undefined])
    applyTheme('system')
    expect([root.dataset.theme, root.dataset.shade]).toEqual([undefined, undefined])
  })
})
