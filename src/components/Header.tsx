import type { SyncStatus } from '../sync/types'
import styles from './Header.module.css'

export type View = 'exercise' | 'revision' | 'settings' | 'account'

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
  { view: 'revision', label: 'Révision' },
]

const SYNC_HINT: Partial<Record<SyncStatus, string>> = {
  saving: 'Enregistrement…',
  pending: 'Non enregistré',
}

export function Header({ view, position = null, total = 0, onNavigate, syncStatus = 'saved' }: Props) {
  const main = view === 'exercise' || view === 'revision'
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
