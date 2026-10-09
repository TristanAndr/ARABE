/**
 * Retour d'un lien e-mail Supabase. Les paramètres arrivent dans le fragment (#…) en flux
 * implicite, parfois dans la requête (?…) pour les erreurs.
 */
export interface AuthRedirect {
  /** signup (confirmation), recovery (réinitialisation), magiclink, invite, email_change… */
  type: string | null
  /** Message d'erreur à afficher, déjà traduit. */
  error: string | null
  /** Le fragment contenait des paramètres d'authentification (à effacer de la barre d'adresse). */
  present: boolean
}

const ERRORS: Record<string, string> = {
  otp_expired: 'Ce lien a expiré ou a déjà servi. Demande un nouvel e-mail.',
  access_denied: 'Ce lien n’est pas valide. Demande un nouvel e-mail.',
}

export function parseAuthRedirect(href: string): AuthRedirect {
  const url = new URL(href)
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
  const query = url.searchParams
  const get = (k: string) => hash.get(k) ?? query.get(k)

  const code = get('error_code')
  const err = get('error')
  const description = get('error_description')
  const error = err || code ? (ERRORS[code ?? ''] ?? ERRORS[err ?? ''] ?? description ?? 'Le lien n’a pas pu être utilisé.') : null
  const type = get('type')
  return { type, error, present: !!(type || error || hash.get('access_token')) }
}

/** Efface les paramètres d'authentification de la barre d'adresse, sans recharger. */
export function clearAuthParams(): void {
  const url = new URL(window.location.href)
  for (const k of ['error', 'error_code', 'error_description', 'type', 'code']) url.searchParams.delete(k)
  url.hash = ''
  window.history.replaceState(window.history.state, '', url.pathname + url.search)
}
