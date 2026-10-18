import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { speakArabic, type SpeechState } from '../../revision/speech'
import { buildVocabSession, type VocabMode, type VocabQuestion } from '../../revision/vocabQuiz'
import type { VocabCategory, VocabWord } from '../../revision/vocabulary'
import { SpeakButton } from './SpeakButton'
import styles from './Practice.module.css'
import vocab from './Vocabulary.module.css'

interface Props {
  category: VocabCategory
  speech: SpeechState
}

const MODES: { mode: VocabMode; label: string; prompt: string }[] = [
  { mode: 'fr-ar', label: 'Retrouver le mot arabe', prompt: 'Comment dit-on en arabe ?' },
  { mode: 'ar-fr', label: 'Retrouver le sens', prompt: 'Que veut dire ce mot ?' },
  { mode: 'ecoute', label: 'À l’écoute', prompt: 'Quel mot as-tu entendu ?' },
]

export function VocabPractice({ category, speech }: Props) {
  const [mode, setMode] = useState<VocabMode>('fr-ar')
  const [questions, setQuestions] = useState<VocabQuestion[]>(() => buildVocabSession(category.words))
  const [index, setIndex] = useState(0)
  const [outcomes, setOutcomes] = useState<boolean[]>([])
  const [choice, setChoice] = useState('')

  const question = questions[index]
  const outcome = outcomes[index]
  const answered = outcome !== undefined
  const correctCount = outcomes.filter(Boolean).length
  const byId = new Map(category.words.map((w) => [w.id, w]))
  const modes = speech === 'indisponible' ? MODES.filter((m) => m.mode !== 'ecoute') : MODES

  const firstField = useRef<HTMLInputElement>(null)
  const nextButton = useRef<HTMLButtonElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!started.current) return
    if (answered) nextButton.current?.focus()
    else firstField.current?.focus()
  }, [answered, index, questions])

  // En mode écoute, le mot est prononcé à chaque nouvelle question une fois l'exercice commencé.
  useEffect(() => {
    if (mode === 'ecoute' && question && started.current) speakArabic(question.word.ar)
  }, [mode, question])

  function restart() {
    started.current = true
    setQuestions(buildVocabSession(category.words))
    setIndex(0)
    setOutcomes([])
    setChoice('')
  }

  function changeMode(m: VocabMode) {
    if (m === mode) return
    setMode(m)
    restart()
  }

  function validate() {
    if (!question || answered || !choice) return
    started.current = true
    setOutcomes((o) => [...o, choice === question.word.id])
  }

  function next() {
    started.current = true
    setIndex((i) => i + 1)
    setChoice('')
  }

  function submit(e?: FormEvent) {
    e?.preventDefault()
    if (answered) next()
    else validate()
  }

  function onKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key !== 'Enter' || e.target instanceof HTMLButtonElement) return
    e.preventDefault()
    submit()
  }

  const current = MODES.find((m) => m.mode === mode)!
  const arabicOptions = mode === 'fr-ar' || mode === 'ecoute'

  return (
    <section className={styles.practice} aria-labelledby="practice-title">
      <div className={styles.head}>
        <h2 id="practice-title" className={styles.title}>
          Entraînement
        </h2>
        <p className={styles.lead}>Une question par mot de la fiche.</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.switch} role="group" aria-label="Mode d'entraînement">
          {modes.map((m) => (
            <button
              key={m.mode}
              type="button"
              aria-pressed={mode === m.mode}
              className={styles.modeButton}
              onClick={() => changeMode(m.mode)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

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
          Correctes : <strong>{correctCount}</strong> / {outcomes.length}
        </span>
        <button type="button" className="btn btn-link" onClick={() => restart()}>
          Recommencer
        </button>
      </div>

      {question ? (
        <form className={styles.form} onSubmit={submit} onKeyDown={onKeyDown} noValidate>
          <div className={styles.prompt}>
            <p className={styles.promptLabel}>{current.prompt}</p>
            {mode === 'fr-ar' && <p className={styles.promptFrBig}>{question.word.fr}</p>}
            {mode === 'ar-fr' && (
              <p className={`arabic ${styles.promptAr}`} lang="ar" dir="rtl">
                {question.word.ar}
              </p>
            )}
            {mode === 'ecoute' && (
              <div className={vocab.listen}>
                <SpeakButton text={question.word.ar} label="Réécouter le mot" large />
                <p className={styles.muted}>Appuie pour écouter le mot.</p>
              </div>
            )}
          </div>

          <fieldset className={`${styles.options} ${arabicOptions ? styles.verbGrid : ''}`}>
            <legend className="visually-hidden">Réponses proposées</legend>
            {question.options.map((id, i) => {
              const w = byId.get(id)!
              return (
                <label key={id} className={styles.option} data-state={optionState(outcome, id === choice, id === question.word.id)}>
                  <input
                    ref={i === 0 ? firstField : undefined}
                    type="radio"
                    name="vocab"
                    value={id}
                    checked={choice === id}
                    disabled={answered}
                    onChange={() => setChoice(id)}
                  />
                  {arabicOptions ? (
                    <span className={`arabic ${styles.optionAr}`} lang="ar" dir="rtl">
                      {w.ar}
                    </span>
                  ) : (
                    <span className={vocab.optionFr}>{w.fr}</span>
                  )}
                </label>
              )
            })}
          </fieldset>

          {answered && <Outcome correct={outcome} word={question.word} secondLabel={category.columns?.second} canSpeak={speech !== 'indisponible'} />}

          <div className={styles.actions}>
            {answered ? (
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
            {correctCount === questions.length
              ? 'Tout est juste.'
              : `${questions.length - correctCount} mot${questions.length - correctCount > 1 ? 's' : ''} à revoir dans la fiche.`}
          </p>
          <button type="button" className="btn btn-primary" onClick={() => restart()} autoFocus>
            Recommencer une session
          </button>
        </div>
      )}
    </section>
  )
}

function optionState(outcome: boolean | undefined, chosen: boolean, right: boolean): string | undefined {
  if (outcome === undefined) return chosen ? 'chosen' : undefined
  if (right) return 'right'
  if (chosen) return 'wrong'
  return undefined
}

function Outcome({
  correct,
  word,
  secondLabel,
  canSpeak,
}: {
  correct: boolean
  word: VocabWord
  secondLabel?: string
  canSpeak: boolean
}) {
  const second = word.ar2 && word.ar2 !== word.ar && secondLabel ? word.ar2 : null
  return (
    <div className={styles.outcome} role="status" aria-label="Résultat">
      <p className={correct ? styles.right : styles.wrong}>{correct ? 'Juste.' : 'Pas tout à fait.'}</p>
      <p className={styles.expectedLabel}>Réponse</p>
      <ul className={styles.expected}>
        <li>
          <span className={vocab.answerAr}>
            <span className={`arabic ${styles.expectedAr}`} lang="ar" dir="rtl">
              {word.ar}
            </span>
            {canSpeak && <SpeakButton text={word.ar} label={`Écouter ${word.ar}`} />}
          </span>
          <span className={styles.expectedFr}>
            {word.fr}
            {second && ` · ${secondLabel!.toLowerCase()} : `}
            {second && (
              <span className="arabic" lang="ar" dir="rtl">
                {second}
              </span>
            )}
          </span>
        </li>
      </ul>
    </div>
  )
}
