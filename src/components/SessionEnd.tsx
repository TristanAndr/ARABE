import type { Progress } from '../state/progress'
import styles from './SessionEnd.module.css'

export function SessionEnd({ progress, onRestart }: { progress: Progress; onRestart: () => void }) {
  const results = Object.values(progress.results)
  const count = (v: string) => results.filter((r) => r.first === v).length
  const skipped = progress.order.length - results.length

  return (
    <section className={styles.end}>
      <h1 className={styles.title}>Session terminée.</h1>
      <dl className={styles.summary}>
        <div>
          <dt>Justes</dt>
          <dd>{count('correct')}</dd>
        </div>
        <div>
          <dt>Presque</dt>
          <dd>{count('partial')}</dd>
        </div>
        <div>
          <dt>À reprendre</dt>
          <dd>{count('incorrect')}</dd>
        </div>
        {skipped > 0 && (
          <div>
            <dt>Non vérifiées</dt>
            <dd>{skipped}</dd>
          </div>
        )}
      </dl>
      <button type="button" className="btn btn-primary" onClick={onRestart} autoFocus>
        Recommencer une session
      </button>
      <p className={styles.totals}>
        Depuis le début : {progress.totals.validated} phrases vérifiées, {progress.totals.correct} justes du premier
        coup.
      </p>
    </section>
  )
}
