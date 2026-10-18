import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_NORMALIZATION, type NormalizationOptions } from '../compare/normalize'
import { PHONEMES, type Phoneme } from '../translit/phonemes'
import { PRESETS, type Overrides, type PresetId, type ProfileId, type ProfileSettings } from '../translit/profiles'
import { sanitizePosition, type Position } from '../quran/navigation'
import { isRecord } from '../storage/storage'

export type Theme = 'system' | 'light' | 'dark' | 'cocooning' | 'cocooning-dark'
const THEMES: readonly Theme[] = ['system', 'light', 'dark', 'cocooning', 'cocooning-dark']
export type Order = 'mushaf' | 'random'

export interface Settings extends ProfileSettings {
  normalization: NormalizationOptions
  theme: Theme
  order: Order
  /**
   * Entraînement verset par verset : verset en cours (null = sélection d'exercices, comportement
   * d'origine). Enregistré avec les réglages du compte.
   */
  trainingVerse: Position | null
}

export const DEFAULT_SETTINGS: Settings = {
  profileId: 'simple',
  customBase: 'precise',
  overrides: {},
  normalization: DEFAULT_NORMALIZATION,
  theme: 'system',
  order: 'mushaf',
  trainingVerse: null,
}

const isPreset = (v: unknown): v is PresetId => typeof v === 'string' && v in PRESETS
const isProfile = (v: unknown): v is ProfileId => isPreset(v) || v === 'custom'

export function sanitizeSettings(raw: unknown): Settings | null {
  if (!isRecord(raw)) return null
  const overrides: Overrides = {}
  if (isRecord(raw.overrides)) {
    for (const p of PHONEMES) {
      const list = raw.overrides[p]
      if (Array.isArray(list) && list.every((s) => typeof s === 'string' && s.length > 0)) {
        overrides[p as Phoneme] = list as string[]
      }
    }
  }
  const norm = isRecord(raw.normalization) ? raw.normalization : {}
  const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d)
  return {
    profileId: isProfile(raw.profileId) ? raw.profileId : DEFAULT_SETTINGS.profileId,
    customBase: isPreset(raw.customBase) ? raw.customBase : DEFAULT_SETTINGS.customBase,
    overrides,
    normalization: {
      ignoreCase: bool(norm.ignoreCase, DEFAULT_NORMALIZATION.ignoreCase),
      optionalInitialHamza: bool(norm.optionalInitialHamza, DEFAULT_NORMALIZATION.optionalInitialHamza),
      acceptWaslEndings: bool(norm.acceptWaslEndings, DEFAULT_NORMALIZATION.acceptWaslEndings),
    },
    theme: THEMES.includes(raw.theme as Theme) ? (raw.theme as Theme) : 'system',
    order: raw.order === 'random' ? 'random' : 'mushaf',
    trainingVerse: sanitizePosition(raw.trainingVerse),
  }
}

export function useSettings(initial: Settings | null, onChange: (s: Settings) => void) {
  const [settings, setSettings] = useState<Settings>(() => initial ?? DEFAULT_SETTINGS)

  const save = useCallback(
    (next: Settings) => {
      setSettings(next)
      onChange(next)
    },
    [onChange],
  )

  useEffect(() => {
    applyTheme(settings.theme)
    return () => applyTheme('system')
  }, [settings.theme])

  return { settings, save }
}

/**
 * Clair et sombre posent data-theme ; les deux Cocooning partagent data-theme="cocooning" et se
 * distinguent par data-shade, pour que leurs styles communs n'aient qu'un sélecteur.
 */
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  delete root.dataset.shade
  if (theme === 'system') delete root.dataset.theme
  else if (theme === 'cocooning-dark') {
    root.dataset.theme = 'cocooning'
    root.dataset.shade = 'dark'
  } else root.dataset.theme = theme
}
