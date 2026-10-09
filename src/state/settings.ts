import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_NORMALIZATION, type NormalizationOptions } from '../compare/normalize'
import { PHONEMES, type Phoneme } from '../translit/phonemes'
import { PRESETS, type Overrides, type PresetId, type ProfileId, type ProfileSettings } from '../translit/profiles'
import { isRecord } from '../storage/storage'

export type Theme = 'system' | 'light' | 'dark'
export type Order = 'mushaf' | 'random'

export interface Settings extends ProfileSettings {
  normalization: NormalizationOptions
  theme: Theme
  order: Order
}

export const DEFAULT_SETTINGS: Settings = {
  profileId: 'simple',
  customBase: 'precise',
  overrides: {},
  normalization: DEFAULT_NORMALIZATION,
  theme: 'system',
  order: 'mushaf',
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
    theme: raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : 'system',
    order: raw.order === 'random' ? 'random' : 'mushaf',
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

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme
}
