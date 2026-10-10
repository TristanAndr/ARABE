import type { ComparisonResult, IssueKind } from '../compare/compare'
import type { Exercise } from '../data/corpus'
import type { Spellings } from '../translit/profiles'
import { primaryVariant, renderReading } from '../translit/reference'
import styles from './Feedback.module.css'

const ISSUE_LABELS: Record<IssueKind, string> = {
  gemination: 'consonne doublée (šadda) écrite simple',
  length: 'durée de voyelle (brève ou longue)',
  substitution: 'son différent',
  missing: 'son manquant',
  extra: 'son en trop',
}

const HEADLINES = {
  correct: 'Juste.',
  partial: 'Presque.',
  incorrect: 'À reprendre.',
} as const

interface Props {
  result: ComparisonResult
  exercise: Exercise
  spellings: Spellings
  stale: boolean
}

export function Feedback({ result, exercise, spellings, stale }: Props) {
  const wrong = result.words.filter((w) => !w.ok)
  const primary = result.variantIndex > 0 ? renderReading(primaryVariant(exercise.reading), spellings) : null

  return (
    <div className={`${styles.feedback} ${stale ? styles.stale : ''}`}>
      <p className={`${styles.verdict} ${styles[result.verdict]}`}>
        {HEADLINES[result.verdict]}
        <span className={styles.count}>
          {result.errors === 0
            ? primary
              ? 'Variante acceptée.'
              : 'Aucun écart.'
            : `${result.errors} écart${result.errors > 1 ? 's' : ''} sur ${result.total} sons.`}
        </span>
      </p>

      <h2 className={styles.label}>Référence</h2>
      <p className={styles.reference}>
        {result.words.map((w, i) => (
          <span key={i}>
            {i > 0 && ' '}
            <span className={w.ok ? undefined : styles.wrongWord}>{w.expected}</span>
          </span>
        ))}
      </p>
      {primary && <p className={styles.primary}>Lecture principale : {primary}</p>}

      {wrong.length > 0 && (
        <>
          <h2 className={styles.label}>Écarts</h2>
          <dl className={styles.diff}>
            {wrong.map((w, i) => (
              <div key={i} className={styles.row}>
                <dt className={styles.expected}>{w.expected}</dt>
                <dd className={styles.typed}>{w.typed ? `« ${w.typed} »` : <em>rien</em>}</dd>
                <dd className={styles.issues}>{w.issues.map((k) => ISSUE_LABELS[k]).join(' · ')}</dd>
              </div>
            ))}
          </dl>
          <p className={styles.caveat}>
            Les écarts sont localisés par alignement automatique : l'emplacement est fiable, la nature de l'erreur
            est indicative.
          </p>
        </>
      )}

      {exercise.notes && exercise.notes.length > 0 && (
        <>
          <h2 className={styles.label}>Notes de lecture</h2>
          <ul className={styles.notes}>
            {exercise.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
