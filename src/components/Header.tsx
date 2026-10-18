import type { SyncStatus } from '../sync/types'
import styles from './Header.module.css'

export type View = 'exercise' | 'vocabulaire' | 'conjugaison' | 'alphabet' | 'settings' | 'account'

interface Props {
  /** Sans `view`, en-tête réduit à la marque (écrans de connexion, chargement). */
  view?: View
  position?: number | null
  total?: number
  onNavigate?: (view: View) => void
  syncStatus?: SyncStatus
}

const SECTIONS: { view: View; label: string }[] = [
  { view: 'exercise', label: 'Lecture' },
  { view: 'vocabulaire', label: 'Vocabulaire' },
  { view: 'conjugaison', label: 'Conjugaison' },
  { view: 'alphabet', label: 'Alphabet' },
]

// Seul l'échec est signalé : « en cours » clignoterait à chaque changement de verset.
const SYNC_HINT: Partial<Record<SyncStatus, string>> = {
  pending: 'Non enregistré',
}

export function Header({ view, position = null, total = 0, onNavigate, syncStatus = 'saved' }: Props) {
  const main = view !== undefined && view !== 'settings' && view !== 'account'
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <span className={styles.brand}>
          Qirāʾa
          <span className={styles.brandAr} lang="ar" dir="rtl">قراءة</span>
        </span>
        {main && onNavigate && (
          <nav className={styles.nav} aria-label="Sections">
            {SECTIONS.map((s) => (
              <button
                key={s.view}
                type="button"
                className={styles.navItem}
                data-section={s.view}
                aria-current={view === s.view ? 'page' : undefined}
                onClick={() => onNavigate(s.view)}
              >
                {s.label}
              </button>
            ))}
          </nav>
        )}
        {view && (
          <div className={styles.meta}>
            {SYNC_HINT[syncStatus] && (
              <span className={styles.sync} data-status={syncStatus} role="status">
                {SYNC_HINT[syncStatus]}
              </span>
            )}
            {view === 'exercise' && position !== null && (
              <span className={styles.progress} aria-live="polite">
                Phrase {position} <span className={styles.of}>sur</span> {total}
              </span>
            )}
            {main && onNavigate && (
              <>
                <button type="button" className="btn btn-link" onClick={() => onNavigate('settings')}>
                  Paramètres
                </button>
                <button type="button" className="btn btn-link" onClick={() => onNavigate('account')}>
                  Compte
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
