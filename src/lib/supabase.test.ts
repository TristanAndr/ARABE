import { describe, expect, it } from 'vitest'
import { readConfig } from './supabase'

describe('configuration Supabase', () => {
  it('absente ou incomplète : null (écran explicatif)', () => {
    expect(readConfig({})).toBeNull()
    expect(readConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co' })).toBeNull()
    expect(readConfig({ VITE_SUPABASE_URL: 'pas une url', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' })).toBeNull()
  })

  it('complète', () => {
    expect(readConfig({ VITE_SUPABASE_URL: ' https://x.supabase.co ', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' })).toEqual({
      url: 'https://x.supabase.co',
      publishableKey: 'sb_publishable_x',
    })
  })

  it('refuse une clé secrète', () => {
    expect(() => readConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_abc' })).toThrow(/secrète/)
    const jwt = (role: string) => `x.${btoa(JSON.stringify({ role })).replace(/=+$/, '')}.y`
    expect(() => readConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: jwt('service_role') })).toThrow(/secrète/)
    expect(readConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: jwt('anon') })).not.toBeNull()
  })
})
