import { summarizeLegacy, type LegacyData } from '../sync/legacy'
import styles from '../auth/Auth.module.css'

interface Props {
  legacy: LegacyData
  accountHasData: boolean
  onImport: () => void
  onKeep: () => void
}

/**
 * Données de la version sans compte trouvées dans ce navigateur. Aucune fusion : soit elles
 * deviennent celles du compte, soit le compte reste tel quel. Dans les deux cas elles sont
 * archivées (pas effacées) pour ne plus être proposées.
 */
export function ImportPrompt({ legacy, accountHasData, onImport, onKeep }: Props) {
  function replace() {
    if (window.confirm('Remplacer la progression et les réglages du compte par ceux de ce navigateur ?')) onImport()
  }

  return (
    <section className={styles.state} aria-labelledby="import-title">
      <h1 id="import-title" className={styles.title}>
        Progression trouvée sur ce navigateur
      </h1>
      <p className={styles.stateText}>
        Ce navigateur contient des données de l’ancienne version, sans compte : {summarizeLegacy(legacy)}.
      </p>
      <p className={styles.stateText}>
        {accountHasData
          ? 'Ton compte contient déjà une progression. Les deux ne sont pas fusionnées : choisis laquelle garder.'
          : 'Ton compte est vide. Tu peux y importer ces données.'}
      </p>
      <p className={styles.stateText}>
        Dans tous les cas, une copie reste archivée dans ce navigateur ; elle ne sera plus proposée.
      </p>
      <div className={styles.stateActions}>
        {accountHasData ? (
          <>
            <button type="button" className="btn btn-primary" onClick={onKeep}>
              Garder les données du compte
            </button>
            <button type="button" className="btn btn-secondary" onClick={replace}>
              Remplacer par celles du navigateur
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-primary" onClick={onImport}>
              Importer dans mon compte
            </button>
            <button type="button" className="btn btn-link" onClick={onKeep}>
              Ne pas importer
            </button>
          </>
        )}
      </div>
    </section>
  )
}
