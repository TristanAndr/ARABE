import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { AlphabetProgress } from '../../alphabet/progress'
import { buildAlphabetSession, type AlphabetQuestion, type AlphabetQuizMode } from '../../alphabet/quiz'
import styles from './Alphabet.module.css'

interface Props {
  progress: AlphabetProgress
  onAnswer: (letter: string, correct: boolean) => void
  synced: boolean
}

export function AlphabetQuiz({ progress, onAnswer, synced }: Props) {
  const [mode, setMode] = useState<AlphabetQuizMode>('lettre')
  // La session est construite au démarrage : la progression qui évolue ne la modifie pas.
  const [questions, setQuestions] = useState<AlphabetQuestion[]>(() => buildAlphabetSession(progress))
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<{ chosen: string; correct: boolean }[]>([])
  const [choice, setChoice] = useState('')
  const firstOption = useRef<HTMLInputElement>(null)
  const nextButton = useRef<HTMLButtonElement>(null)
  const started = useRef(false)

  const question = questions[index]
  const answer = answers[index]
  const correctCount = answers.filter((a) => a.correct).length

  useEffect(() => {
    if (!started.current) return
    if (answer) nextButton.current?.focus()
    else firstOption.current?.focus()
  }, [answer, index, questions])

  function restart(m: AlphabetQuizMode = mode) {
    started.current = true
    setMode(m)
    setQuestions(buildAlphabetSession(progress))
    setIndex(0)
    setAnswers([])
    setChoice('')
  }

  function validate() {
    if (!question || answer || !choice) return
    started.current = true
    const correct = choice === question.letter.letter
    setAnswers((a) => [...a, { chosen: choice, correct }])
    onAnswer(question.letter.letter, correct)
  }

  function next() {
    setIndex((i) => i + 1)
    setChoice('')
  }

  function submit(e?: FormEvent) {
    e?.preventDefault()
    if (answer) next()
    else validate()
  }

  function onKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key !== 'Enter' || e.target instanceof HTMLButtonElement) return
    e.preventDefault()
    submit()
  }

  return (
    <section className={styles.quiz} aria-labelledby="alphabet-quiz-title">
      <h2 id="alphabet-quiz-title" className="visually-hidden">
        Révision de l’alphabet
      </h2>
      <div className={styles.quizModes} role="group" aria-label="Type de question">
        <button type="button" className={styles.tab} aria-pressed={mode === 'lettre'} onClick={() => mode !== 'lettre' && restart('lettre')}>
          Lettre → nom
        </button>
        <button type="button" className={styles.tab} aria-pressed={mode === 'nom'} onClick={() => mode !== 'nom' && restart('nom')}>
          Nom → lettre
        </button>
      </div>
      {!synced && (
        <p className={styles.syncNote}>
          Le suivi des lettres n’est pas encore enregistré dans ton compte (la table <code>alphabet_progress</code>{' '}
          n’existe pas dans Supabase) : il est perdu au rechargement.
        </p>
      )}

      <div className={styles.status} aria-live="polite">
        <span>
          {question ? (
            <>
              Question {index + 1} <span className={styles.muted}>sur</span> {questions.length}
            </>
          ) : (
            'Session terminée'
          )}
        </span>
        <span>
          Correctes : <strong>{correctCount}</strong> / {answers.length}
        </span>
        <button type="button" className="btn btn-link" onClick={() => restart()}>
          Recommencer
        </button>
      </div>

      {question ? (
        <form className={styles.quizForm} onSubmit={submit} onKeyDown={onKeyDown} noValidate>
          <div className={styles.prompt}>
            <p className={styles.promptLabel}>{mode === 'lettre' ? 'Quel est le nom de cette lettre ?' : 'Quelle est cette lettre ?'}</p>
            {mode === 'lettre' ? (
              <p className={`arabic ${styles.promptLetter}`} lang="ar" dir="rtl">
                {question.letter.letter}
              </p>
            ) : (
              <p className={styles.promptName}>{question.letter.name}</p>
            )}
          </div>

          <fieldset className={styles.options} data-mode={mode}>
            <legend className="visually-hidden">Propositions</legend>
            {question.options.map((o, i) => {
              const state = !answer
                ? choice === o.letter
                  ? 'chosen'
                  : undefined
                : o.letter === question.letter.letter
                  ? 'right'
                  : o.letter === answer.chosen
                    ? 'wrong'
                    : undefined
              return (
                <label key={o.letter} className={styles.option} data-state={state}>
                  <input
                    ref={i === 0 ? firstOption : undefined}
                    type="radio"
                    name="alphabet-option"
                    value={o.letter}
                    checked={choice === o.letter}
                    disabled={!!answer}
                    onChange={() => setChoice(o.letter)}
                  />
                  {mode === 'lettre' ? (
                    <span className={styles.optionName}>{o.name}</span>
                  ) : (
                    <span className={`arabic ${styles.optionLetter}`} lang="ar" dir="rtl">
                      {o.letter}
                    </span>
                  )}
                </label>
              )
            })}
          </fieldset>

          {answer && (
            <div className={styles.outcome} role="status" aria-label="Résultat">
              <p className={answer.correct ? styles.right : styles.wrong}>{answer.correct ? 'Juste.' : 'Pas tout à fait.'}</p>
              <p className={styles.correction}>
                <span className={`arabic ${styles.correctionLetter}`} lang="ar" dir="rtl">
                  {question.letter.letter}
                </span>
                <span>
                  <strong>{question.letter.name}</strong>{' '}
                  <span className="arabic" lang="ar" dir="rtl">
                    {question.letter.nameAr}
                  </span>
                  <span className={styles.muted}> · {question.letter.sound}</span>
                </span>
              </p>
            </div>
          )}

          <div className={styles.actions}>
            {answer ? (
              <button ref={nextButton} type="button" className="btn btn-secondary" onClick={next}>
                {index + 1 < questions.length ? 'Question suivante' : 'Voir le résultat'}
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={!choice}>
                Valider
              </button>
            )}
            <kbd>Entrée</kbd>
          </div>
        </form>
      ) : (
        <div className={styles.end}>
          <p className={styles.score}>
            {correctCount} <span className={styles.muted}>/ {questions.length}</span>
          </p>
          <p className={styles.endText}>
            {correctCount === questions.length ? 'Tout est juste.' : 'Les lettres manquées reviendront en priorité.'}
          </p>
          <button type="button" className="btn btn-primary" onClick={() => restart()} autoFocus>
            Nouvelle série
          </button>
        </div>
      )}
    </section>
  )
}
