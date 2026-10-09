import type { Progress } from '../../state/progress'
import type { Order, Theme } from '../../state/settings'
import styles from './Settings.module.css'

interface Props {
  order: Order
  theme: Theme
  onOrder: (o: Order) => void
  onTheme: (t: Theme) => void
  progress: Progress
  onRestart: () => void
  onResetStats: () => void
}

function Segmented<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string
  value: T
  options: [T, string][]
  onChange: (v: T) => void
}) {
  return (
    <div className={styles.segmented} role="radiogroup">
      {options.map(([v, label]) => (
        <label key={v} data-checked={value === v}>
          <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />
          {label}
        </label>
      ))}
    </div>
  )
}

export function SessionSection({ order, theme, onOrder, onTheme, progress, onRestart, onResetStats }: Props) {
  const done = Object.keys(progress.results).length
  return (
    <section className={styles.section} aria-labelledby="session-title">
      <h2 id="session-title" className={styles.sectionTitle}>
        Session et affichage
      </h2>
      <div className={styles.fieldRow}>
        <span className={styles.fieldLabel}>Ordre des phrases</span>
        <Segmented
          name="order"
          value={order}
          options={[
            ['mushaf', 'Ordre du Coran'],
            ['random', 'Aléatoire'],
          ]}
          onChange={onOrder}
        />
        <span className={styles.fieldHint}>S'applique à la prochaine session.</span>
      </div>
      <div className={styles.fieldRow}>
        <span className={styles.fieldLabel}>Thème</span>
        <Segmented
          name="theme"
          value={theme}
          options={[
            ['system', 'Système'],
            ['light', 'Clair'],
            ['dark', 'Sombre'],
          ]}
          onChange={onTheme}
        />
      </div>
      <div className={styles.fieldRow}>
        <span className={styles.fieldLabel}>Progression</span>
        <span className={styles.fieldText}>
          Session en cours : {done} sur {progress.order.length} vérifiées. Depuis le début :{' '}
          {progress.totals.validated} vérifiées, {progress.totals.correct} justes du premier coup.
        </span>
        <span className={styles.inlineActions}>
          <button
            type="button"
            className="btn btn-link"
            onClick={() => window.confirm('Recommencer la session depuis la première phrase ?') && onRestart()}
          >
            Recommencer la session
          </button>
          <button
            type="button"
            className="btn btn-link"
            onClick={() => window.confirm('Effacer la session et toutes les statistiques ?') && onResetStats()}
          >
            Effacer les statistiques
          </button>
        </span>
      </div>
    </section>
  )
}
