import { useState } from 'react'
import type { AccountInfo } from '../App'
import { NewPasswordForm } from '../auth/AuthView'
import type { SyncStatus } from '../sync/types'
import styles from './settings/Settings.module.css'

const SYNC_LABEL: Record<SyncStatus, string> = {
  saved: 'Tout est enregistré dans ton compte.',
  saving: 'Enregistrement en cours…',
  pending: 'Connexion au serveur impossible pour le moment : les modifications sont gardées dans ce navigateur et seront envoyées automatiquement.',
}

export function AccountView({
  account,
  syncStatus,
  onClose,
  closeLabel,
}: {
  account: AccountInfo
  syncStatus: SyncStatus
  onClose: () => void
  closeLabel: string
}) {
  const [busy, setBusy] = useState(false)

  async function signOut() {
    setBusy(true)
    try {
      await account.onSignOut()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.settings}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>Compte</h1>
        <button type="button" className="btn btn-link" onClick={onClose}>
          {closeLabel}
        </button>
      </div>
      <p className={styles.intro}>
        Connecté avec <strong>{account.email}</strong>. Ta progression, tes réglages et tes résultats sont liés à ce
        compte et ne sont visibles que par toi.
      </p>

      <section className={styles.section} aria-labelledby="sync-title">
        <h2 id="sync-title" className={styles.sectionTitle}>
          Enregistrement
        </h2>
        <p className={styles.sectionNote} aria-live="polite">
          {SYNC_LABEL[syncStatus]}
        </p>
      </section>

      <section className={styles.section} aria-labelledby="password-title">
        <h2 id="password-title" className={styles.sectionTitle}>
          Mot de passe
        </h2>
        <NewPasswordForm onSubmit={account.onChangePassword} submitLabel="Changer le mot de passe" />
      </section>

      <section className={styles.section} aria-labelledby="signout-title">
        <h2 id="signout-title" className={styles.sectionTitle}>
          Déconnexion
        </h2>
        <p className={styles.sectionNote}>Ferme la session sur ce navigateur uniquement.</p>
        <p style={{ marginTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => void signOut()} disabled={busy}>
            Se déconnecter
          </button>
        </p>
      </section>
    </div>
  )
}
