import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { App, type AccountInfo } from './App'
import { AuthView, RecoveryView } from './auth/AuthView'
import { clearAuthParams, type AuthRedirect } from './auth/redirect'
import { useAuth, type Auth, type AuthClient, type AuthUser } from './auth/useAuth'
import { Header } from './components/Header'
import { ImportPrompt } from './components/ImportPrompt'
import { accountHasData, archiveLegacy, readLegacy, type LegacyData } from './sync/legacy'
import { browserStorage, SyncQueue, type KeyValue, type SyncQueueOptions } from './sync/syncQueue'
import type { RemoteStore, UserData } from './sync/types'
import appStyles from './App.module.css'
import authStyles from './auth/Auth.module.css'

interface Props {
  authClient: AuthClient
  createRemote: (user: AuthUser) => RemoteStore
  redirect: AuthRedirect
  redirectTo: () => string
  storage?: KeyValue
  /** Délais de la file d'envoi (tests). */
  syncOptions?: Pick<SyncQueueOptions, 'debounceMs' | 'retryDelays'>
}

/** Coque minimale (en-tête sans navigation) pour les écrans hors application. */
function Shell({ children }: { children: ReactNode }) {
  return (
    <div className={appStyles.shell}>
      <Header />
      <main className={appStyles.main}>{children}</main>
    </div>
  )
}

export function Root({ authClient, createRemote, redirect, redirectTo, storage = browserStorage, syncOptions }: Props) {
  const auth = useAuth(authClient, redirect, redirectTo)
  const { state } = auth

  // Une fois le retour de lien traité, la barre d'adresse est nettoyée (rechargement sans effet).
  useEffect(() => {
    if (state.status !== 'loading' && redirect.present) clearAuthParams()
  }, [state.status, redirect.present])

  switch (state.status) {
    case 'loading':
      return (
        <Shell>
          <p className={`${authStyles.state} ${authStyles.loading}`} role="status">
            Chargement…
          </p>
        </Shell>
      )
    case 'signedOut':
      return (
        <Shell>
          <AuthView key={`${state.notice}|${state.error}`} auth={auth} notice={state.notice} error={state.error} />
        </Shell>
      )
    case 'recovery':
      return (
        <Shell>
          <RecoveryView email={state.user.email} onSubmit={auth.updatePassword} />
        </Shell>
      )
    case 'signedIn':
      return (
        <UserSpace
          key={state.user.id}
          user={state.user}
          auth={auth}
          createRemote={createRemote}
          storage={storage}
          syncOptions={syncOptions}
        />
      )
  }
}

type Load =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'import'; data: UserData; legacy: LegacyData }
  | { status: 'ready'; data: UserData }

function UserSpace({
  user,
  auth,
  createRemote,
  storage,
  syncOptions,
}: {
  user: AuthUser
  auth: Auth
  createRemote: (user: AuthUser) => RemoteStore
  storage: KeyValue
  syncOptions?: Props['syncOptions']
}) {
  // Recréés seulement si le compte change (pas à chaque rafraîchissement de jeton).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const remote = useMemo(() => createRemote(user), [createRemote, user.id])
  const queue = useMemo(
    () => new SyncQueue(remote, user.id, { storage, ...syncOptions }),
    // Options lues au montage seulement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [remote, user.id, storage],
  )
  const [load, setLoad] = useState<Load>({ status: 'loading' })

  const fetchData = useCallback(async () => {
    setLoad({ status: 'loading' })
    try {
      // Les modifications locales non envoyées l'emportent sur la version du serveur.
      const data = queue.withPending(await remote.load())
      const legacy = readLegacy(storage)
      setLoad(legacy ? { status: 'import', data, legacy } : { status: 'ready', data })
    } catch {
      // Jamais de valeurs par défaut à la place des vraies données : elles écraseraient le compte.
      setLoad({ status: 'error', message: 'Impossible de charger tes données. Vérifie ta connexion internet.' })
    }
  }, [remote, queue, storage])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  useEffect(() => {
    queue.resume()
    const retry = () => void queue.flush()
    window.addEventListener('online', retry)
    return () => {
      window.removeEventListener('online', retry)
      queue.pause()
    }
  }, [queue])

  const syncStatus = useSyncExternalStore(queue.subscribe, queue.getStatus)

  const signOut = useCallback(async () => {
    const synced = await queue.flush()
    if (
      !synced &&
      !window.confirm(
        'Certaines modifications n’ont pas encore pu être enregistrées. Elles restent dans ce navigateur et seront ' +
          'envoyées à ta prochaine connexion ici. Se déconnecter quand même ?',
      )
    ) {
      return
    }
    queue.pause()
    await auth.signOut()
  }, [queue, auth])

  function resolveImport(choice: 'import' | 'keep') {
    if (load.status !== 'import') return
    let data = load.data
    if (choice === 'import') {
      // Remplacement document par document, jamais de fusion des contenus.
      const { settings, revision, progress } = load.legacy
      data = {
        ...data,
        settings: settings ?? data.settings,
        revision: revision ?? data.revision,
        progress: progress ?? data.progress,
      }
      if (settings) queue.saveSettings(settings)
      if (revision) queue.saveRevision(revision)
      if (progress) queue.saveProgress(progress)
    }
    archiveLegacy(storage)
    setLoad({ status: 'ready', data })
  }

  const account: AccountInfo = useMemo(
    () => ({ email: user.email, onSignOut: signOut, onChangePassword: auth.updatePassword }),
    [user.email, signOut, auth.updatePassword],
  )

  if (load.status === 'ready') {
    return <App initial={load.data} store={queue} account={account} syncStatus={syncStatus} />
  }

  return (
    <Shell>
      {load.status === 'loading' && (
        <p className={`${authStyles.state} ${authStyles.loading}`} role="status">
          Chargement de tes données…
        </p>
      )}
      {load.status === 'error' && (
        <section className={authStyles.state}>
          <h1 className={authStyles.title}>Données indisponibles</h1>
          <p className={authStyles.stateText} role="alert">
            {load.message}
          </p>
          <div className={authStyles.stateActions}>
            <button type="button" className="btn btn-primary" onClick={() => void fetchData()}>
              Réessayer
            </button>
            <button type="button" className="btn btn-link" onClick={() => void signOut()}>
              Se déconnecter
            </button>
          </div>
        </section>
      )}
      {load.status === 'import' && (
        <ImportPrompt
          legacy={load.legacy}
          accountHasData={accountHasData(load.data)}
          onImport={() => resolveImport('import')}
          onKeep={() => resolveImport('keep')}
        />
      )}
    </Shell>
  )
}
