import { useState, type FormEvent } from 'react'
import type { Auth } from './useAuth'
import styles from './Auth.module.css'

type Mode = 'signin' | 'signup' | 'forgot'

const MIN_PASSWORD = 8

interface Props {
  auth: Pick<Auth, 'signIn' | 'signUp' | 'requestReset'>
  notice?: string | null
  error?: string | null
}

const TITLES: Record<Mode, string> = {
  signin: 'Connexion',
  signup: 'Créer un compte',
  forgot: 'Mot de passe oublié',
}

export function AuthView({ auth, notice: initialNotice = null, error: initialError = null }: Props) {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
  const [notice, setNotice] = useState<string | null>(initialNotice)

  function switchTo(m: Mode) {
    setMode(m)
    setError(null)
    setNotice(null)
    setPassword('')
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setError(null)
    setNotice(null)
    const address = email.trim()
    if (!address) return setError('Indique ton adresse e-mail.')
    if (mode !== 'forgot' && !password) return setError('Indique ton mot de passe.')
    if (mode === 'signup' && password.length < MIN_PASSWORD) {
      return setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.`)
    }
    setBusy(true)
    try {
      if (mode === 'signin') {
        const err = await auth.signIn(address, password)
        if (err) setError(err)
      } else if (mode === 'signup') {
        const r = await auth.signUp(address, password)
        if (r.error) setError(r.error)
        else if (r.outcome === 'confirm') {
          setMode('signin')
          setPassword('')
          setNotice(`Un e-mail de confirmation a été envoyé à ${address}. Ouvre le lien qu’il contient, puis connecte-toi.`)
        } else if (r.outcome === 'exists') {
          setMode('signin')
          setPassword('')
          setNotice('Un compte existe peut-être déjà avec cette adresse : connecte-toi ou réinitialise le mot de passe.')
        }
      } else {
        const err = await auth.requestReset(address)
        if (err) setError(err)
        else setNotice(`Si un compte existe pour ${address}, un e-mail de réinitialisation vient d’être envoyé.`)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={styles.auth} aria-labelledby="auth-title">
      <p className={styles.kicker}>Qirāʾa · lecture de l’arabe coranique</p>
      <h1 id="auth-title" className={styles.title}>
        {TITLES[mode]}
      </h1>
      <p className={styles.intro}>
        {mode === 'forgot'
          ? 'Indique l’adresse de ton compte : tu recevras un lien pour choisir un nouveau mot de passe.'
          : 'Ta progression, tes réglages et tes résultats sont enregistrés dans ton compte, visibles de toi seul.'}
      </p>

      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <form className={styles.form} onSubmit={submit} noValidate>
        <label className={styles.field}>
          <span className={styles.label}>Adresse e-mail</span>
          <input
            className={styles.input}
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        {mode !== 'forgot' && (
          <label className={styles.field}>
            <span className={styles.label}>Mot de passe</span>
            <input
              className={styles.input}
              type="password"
              name="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={mode === 'signup' ? MIN_PASSWORD : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={mode === 'signup' ? 'password-hint' : undefined}
              required
            />
          </label>
        )}
        {mode === 'signup' && (
          <span id="password-hint" className={styles.hint}>
            Au moins {MIN_PASSWORD} caractères.
          </span>
        )}
        <div className={styles.actions}>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy
              ? 'Patiente…'
              : mode === 'signin'
                ? 'Se connecter'
                : mode === 'signup'
                  ? 'Créer le compte'
                  : 'Envoyer le lien'}
          </button>
        </div>
      </form>

      <div className={styles.switches}>
        {mode === 'signin' ? (
          <>
            <button type="button" className="btn btn-link" onClick={() => switchTo('signup')}>
              Créer un compte
            </button>
            <button type="button" className="btn btn-link" onClick={() => switchTo('forgot')}>
              Mot de passe oublié
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-link" onClick={() => switchTo('signin')}>
            J’ai déjà un compte
          </button>
        )}
      </div>
    </section>
  )
}

/** Choix d'un nouveau mot de passe : après un lien de réinitialisation, ou depuis le compte. */
export function NewPasswordForm({
  onSubmit,
  submitLabel = 'Enregistrer le mot de passe',
}: {
  onSubmit: (password: string) => Promise<string | null>
  submitLabel?: string
}) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setDone(false)
    if (password.length < MIN_PASSWORD) return setError(`Au moins ${MIN_PASSWORD} caractères.`)
    if (password !== confirm) return setError('Les deux mots de passe ne correspondent pas.')
    setBusy(true)
    const err = await onSubmit(password)
    setBusy(false)
    if (err) setError(err)
    else {
      setDone(true)
      setPassword('')
      setConfirm('')
    }
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className={styles.notice} role="status">
          Mot de passe modifié.
        </p>
      )}
      <label className={styles.field}>
        <span className={styles.label}>Nouveau mot de passe</span>
        <input
          className={styles.input}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Confirmer le mot de passe</span>
        <input
          className={styles.input}
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </label>
      <div className={styles.actions}>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Patiente…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

export function RecoveryView({ email, onSubmit }: { email: string; onSubmit: (pw: string) => Promise<string | null> }) {
  return (
    <section className={styles.auth} aria-labelledby="recovery-title">
      <p className={styles.kicker}>Qirāʾa · compte</p>
      <h1 id="recovery-title" className={styles.title}>
        Nouveau mot de passe
      </h1>
      <p className={styles.intro}>Choisis un nouveau mot de passe pour {email}.</p>
      <NewPasswordForm onSubmit={onSubmit} />
    </section>
  )
}
