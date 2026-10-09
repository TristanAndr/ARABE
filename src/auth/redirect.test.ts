import { describe, expect, it } from 'vitest'
import { authErrorMessage } from './errors'
import { parseAuthRedirect } from './redirect'

const BASE = 'https://exemple.github.io/qiraa/'

describe('retours de liens e-mail', () => {
  it('réinitialisation du mot de passe (flux implicite)', () => {
    expect(parseAuthRedirect(`${BASE}#access_token=abc&refresh_token=def&type=recovery`)).toEqual({ type: 'recovery', error: null, present: true })
  })

  it('confirmation d’inscription', () => {
    expect(parseAuthRedirect(`${BASE}#access_token=abc&type=signup`).type).toBe('signup')
  })

  it('lien expiré, dans le fragment ou la requête', () => {
    const r = parseAuthRedirect(`${BASE}#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`)
    expect(r.error).toContain('expiré')
    expect(parseAuthRedirect(`${BASE}?error=server_error&error_description=Oups`).error).toBe('Oups')
  })

  it('adresse ordinaire : rien à traiter', () => {
    expect(parseAuthRedirect(BASE)).toEqual({ type: null, error: null, present: false })
  })
})

describe('messages d’erreur', () => {
  it('traduit les codes Supabase courants', () => {
    expect(authErrorMessage({ code: 'invalid_credentials' })).toBe('Adresse e-mail ou mot de passe incorrect.')
    expect(authErrorMessage({ code: 'over_email_send_rate_limit' })).toContain('Trop de tentatives')
    expect(authErrorMessage({ name: 'AuthRetryableFetchError', message: 'Failed to fetch' })).toContain('Connexion au serveur')
    expect(authErrorMessage({ message: 'autre' })).toBe('Erreur : autre')
  })
})
