import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { parseAuthRedirect, type AuthRedirect } from '../auth/redirect'

export interface SupabaseConfig {
  url: string
  publishableKey: string
}

/**
 * Configuration lue au build (variables Vite). La clé publishable est faite pour être publique :
 * la sécurité repose sur la RLS. Une clé secrète ou service_role ne doit jamais apparaître ici.
 */
export function readConfig(env: Record<string, string | undefined> = import.meta.env): SupabaseConfig | null {
  const url = env.VITE_SUPABASE_URL?.trim()
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !publishableKey) return null
  if (!/^https?:\/\//.test(url)) return null
  if (/^sb_secret_/.test(publishableKey) || jwtRole(publishableKey) === 'service_role') {
    throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY contient une clé secrète : utilise la clé publishable.')
  }
  return { url, publishableKey }
}

/** Rôle porté par une ancienne clé au format JWT (anon ou service_role), sinon null. */
function jwtRole(key: string): string | null {
  const payload = key.split('.')[1]
  if (!payload) return null
  try {
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { role?: unknown }
    return typeof json.role === 'string' ? json.role : null
  } catch {
    return null
  }
}

/** URL vers laquelle Supabase renvoie après un lien e-mail : la racine de l'application. */
export function appUrl(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href
}

/**
 * Lu avant la création du client, qui consomme puis efface le fragment d'URL : on garde ainsi
 * la trace d'un retour de confirmation, de réinitialisation ou d'un lien expiré.
 */
let initialRedirect: AuthRedirect = { type: null, error: null, present: false }
export const getInitialRedirect = () => initialRedirect

let client: SupabaseClient | null | undefined

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client
  initialRedirect = parseAuthRedirect(window.location.href)
  const config = readConfig()
  client = config
    ? createClient(config.url, config.publishableKey, {
        auth: {
          // Liens e-mail en flux implicite : ils fonctionnent même ouverts sur un autre appareil
          // que celui de la demande, et le fragment (#) passe sans configuration sur GitHub Pages.
          flowType: 'implicit',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'qiraa.auth',
        },
      })
    : null
  return client
}
