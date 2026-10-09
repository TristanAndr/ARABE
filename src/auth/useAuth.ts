import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { authErrorMessage } from './errors'
import type { AuthRedirect } from './redirect'

/** Partie de l'API Supabase Auth utilisée par l'application (remplaçable dans les tests). */
export type AuthClient = Pick<
  SupabaseClient['auth'],
  | 'getSession'
  | 'onAuthStateChange'
  | 'signInWithPassword'
  | 'signUp'
  | 'signOut'
  | 'resetPasswordForEmail'
  | 'updateUser'
>

export interface AuthUser {
  id: string
  email: string
}

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut'; notice: string | null; error: string | null }
  | { status: 'recovery'; user: AuthUser }
  | { status: 'signedIn'; user: AuthUser }

/** Résultat d'une action : message d'erreur, ou null en cas de succès. */
export type ActionResult = Promise<string | null>

const toUser = (s: Session): AuthUser => ({ id: s.user.id, email: s.user.email ?? '' })

export function useAuth(client: AuthClient, redirect: AuthRedirect, redirectTo: () => string) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })
  const manualSignOut = useRef(false)
  const recovering = useRef(redirect.type === 'recovery')

  const fromSession = useCallback((session: Session | null, expired = false): AuthState => {
    if (session) return recovering.current ? { status: 'recovery', user: toUser(session) } : { status: 'signedIn', user: toUser(session) }
    return {
      status: 'signedOut',
      notice: expired ? 'Ta session a expiré. Reconnecte-toi pour continuer.' : null,
      error: null,
    }
  }, [])

  useEffect(() => {
    let active = true
    const { data } = client.onAuthStateChange((event, session) => {
      if (!active || event === 'INITIAL_SESSION') return
      if (event === 'PASSWORD_RECOVERY') recovering.current = true
      if (event === 'SIGNED_OUT') {
        const expired = !manualSignOut.current
        manualSignOut.current = false
        recovering.current = false
        setState((prev) => (prev.status === 'signedOut' ? prev : fromSession(null, expired && prev.status !== 'loading')))
        return
      }
      // TOKEN_REFRESHED, USER_UPDATED : même utilisateur, inutile de tout recharger.
      setState((prev) => {
        const next = fromSession(session)
        if (prev.status === next.status && 'user' in prev && 'user' in next && prev.user.id === next.user.id && prev.user.email === next.user.email) {
          return prev
        }
        return next
      })
    })

    client.getSession().then(({ data: { session }, error }) => {
      if (!active) return
      const base = fromSession(session)
      if (base.status === 'signedOut') {
        const linkError = redirect.error ?? (error ? authErrorMessage(error) : null)
        const notice = redirect.type === 'signup' && !linkError ? 'Adresse confirmée. Tu peux te connecter.' : null
        setState({ status: 'signedOut', notice, error: linkError })
      } else {
        setState(base)
      }
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [client, redirect, fromSession])

  const signIn = useCallback(
    async (email: string, password: string): ActionResult => {
      const { error } = await client.signInWithPassword({ email, password })
      return error ? authErrorMessage(error) : null
    },
    [client],
  )

  /** Renvoie 'confirm' si un e-mail de confirmation a été envoyé, 'signedIn' si la session est ouverte. */
  const signUp = useCallback(
    async (email: string, password: string): Promise<{ error: string | null; outcome?: 'confirm' | 'signedIn' | 'exists' }> => {
      const { data, error } = await client.signUp({ email, password, options: { emailRedirectTo: redirectTo() } })
      if (error) return { error: authErrorMessage(error) }
      if (data.session) return { error: null, outcome: 'signedIn' }
      // Supabase masque les adresses déjà inscrites : utilisateur renvoyé sans identité.
      if (data.user && data.user.identities && data.user.identities.length === 0) return { error: null, outcome: 'exists' }
      return { error: null, outcome: 'confirm' }
    },
    [client, redirectTo],
  )

  const requestReset = useCallback(
    async (email: string): ActionResult => {
      const { error } = await client.resetPasswordForEmail(email, { redirectTo: redirectTo() })
      return error ? authErrorMessage(error) : null
    },
    [client, redirectTo],
  )

  const updatePassword = useCallback(
    async (password: string): ActionResult => {
      const { data, error } = await client.updateUser({ password })
      if (error) return authErrorMessage(error)
      recovering.current = false
      if (data.user) setState({ status: 'signedIn', user: { id: data.user.id, email: data.user.email ?? '' } })
      return null
    },
    [client],
  )

  const signOut = useCallback(async (): ActionResult => {
    manualSignOut.current = true
    // scope local : ne déconnecte que ce navigateur.
    const { error } = await client.signOut({ scope: 'local' })
    recovering.current = false
    setState({ status: 'signedOut', notice: null, error: null })
    return error ? authErrorMessage(error) : null
  }, [client])

  return { state, signIn, signUp, requestReset, updatePassword, signOut }
}

export type Auth = ReturnType<typeof useAuth>
