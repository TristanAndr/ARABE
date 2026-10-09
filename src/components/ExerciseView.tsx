import { useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import { compareAnswer, type Verdict } from '../compare/compare'
import { isBlank, type NormalizationOptions } from '../compare/normalize'
import type { Exercise } from '../data/corpus'
import type { Progress } from '../state/progress'
import type { Spellings } from '../translit/profiles'
import { AnswerField } from './AnswerField'
import { Feedback } from './Feedback'
import { VerseDisplay } from './VerseDisplay'
import styles from './ExerciseView.module.css'

interface Props {
  exercise: Exercise
  spellings: Spellings
  normalization: NormalizationOptions
  progress: Progress
  onChecked: (verdict: Verdict, answer: string) => void
  onNext: () => void
}

export function ExerciseView({ exercise, spellings, normalization, progress, onChecked, onNext }: Props) {
  const [answer, setAnswer] = useState('')
  // Dernière réponse vérifiée : le résultat est recalculé si les réglages changent.
  const [checked, setChecked] = useState<string | null>(null)

  const result = useMemo(
    () => (checked === null ? null : compareAnswer(exercise.reading, checked, spellings, normalization)),
    [checked, exercise.reading, spellings, normalization],
  )

  const blank = isBlank(answer)

  function check(e?: FormEvent) {
    e?.preventDefault()
    if (blank) return
    const r = compareAnswer(exercise.reading, answer, spellings, normalization)
    setChecked(answer)
    onChecked(r.verdict, answer)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && result) {
      e.preventDefault()
      onNext()
    }
  }

  const session = Object.values(progress.results)
  const sessionCorrect = session.filter((r) => r.first === 'correct').length

  return (
    <article className={styles.exercise}>
      <VerseDisplay exercise={exercise} />

      <form className={styles.form} onSubmit={check} noValidate>
        <AnswerField
          value={answer}
          onChange={setAnswer}
          onKeyDown={onKeyDown}
          spellings={spellings}
          stale={checked !== null && checked !== answer}
        />
        <div className={styles.actions}>
          <button type="submit" className="btn btn-primary" disabled={blank}>
            Vérifier
          </button>
          <kbd>Entrée</kbd>
        </div>
      </form>

      {result && (
        <section className={styles.result} aria-live="polite" aria-label="Résultat">
          <Feedback result={result} exercise={exercise} spellings={spellings} stale={checked !== answer} />
          <div className={styles.next}>
            <button type="button" className="btn btn-secondary" onClick={onNext}>
              Phrase suivante
            </button>
            <kbd>Ctrl / ⌘ + Entrée</kbd>
          </div>
        </section>
      )}

      <footer className={styles.stats}>
        Session : {session.length} vérifiée{session.length > 1 ? 's' : ''} · {sessionCorrect} juste
        {sessionCorrect > 1 ? 's' : ''} du premier coup
      </footer>
    </article>
  )
}
