import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type RefObject } from 'react'
import { checkPronoun, checkVerb, type VerbCheck } from '../../revision/check'
import { FORMS, formsForVerb, grammarLabel, pronounLabel, type ConjugatedForm } from '../../revision/conjugation'
import type { AnswerMethod, RevisionPrefs } from '../../revision/prefs'
import { buildSession, type Question, type QuizMode } from '../../revision/quiz'
import { pointsFor, scoreOf } from '../../revision/game'
import { modeStats, type ModeStats } from '../../revision/stats'
import type { ConjugationAttempt, ConjugationSession, ConjugationSessionRecord } from '../../sync/types'
import { ConjugatedPhrase } from './ConjugatedWord'
import { Burst, GameBar, GameEnd } from './Game'
import styles from './Practice.module.css'

interface Props {
  prefs: RevisionPrefs
  onPrefs: (patch: Partial<RevisionPrefs>) => void
  /** Sessions terminées, de la plus récente à la plus ancienne. */
  sessions: ConjugationSessionRecord[]
  onAttempt: (a: Omit<ConjugationAttempt, 'id'>) => void
  onSessionComplete: (s: Omit<ConjugationSession, 'id'>) => void
}

interface Outcome {
  correct: boolean
  /** Pour une forme saisie : lettres justes mais voyelles différentes. */
  vowelsOnly?: boolean
  given: string
}

/** Caractères nécessaires pour écrire toutes les formes du modèle. */
const KEYS = ['أ', 'ن', 'ت', 'ي', 'ف', 'ع', 'ل', 'ا', 'و']
const MARKS = [
  { ch: 'َ', name: 'fatha' },
  { ch: 'ُ', name: 'damma' },
  { ch: 'ِ', name: 'kasra' },
  { ch: 'ْ', name: 'soukoun' },
]

export function Practice({ prefs, onPrefs, sessions, onAttempt, onSessionComplete }: Props) {
  const [questions, setQuestions] = useState<Question[]>(() => buildSession(prefs.mode))
  const [index, setIndex] = useState(0)
  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const [choice, setChoice] = useState<string>('')
  const [typed, setTyped] = useState('')

  const question = questions[index]
  const outcome = outcomes[index]
  const correctCount = outcomes.filter((o) => o.correct).length
  const results = outcomes.map((o) => o.correct)
  const method: AnswerMethod = prefs.method

  const firstField = useRef<HTMLInputElement>(null)
  const nextButton = useRef<HTMLButtonElement>(null)

  // Pas de focus automatique à l'ouverture de la page : seulement une fois l'exercice commencé.
  const initial = useRef({ index, outcome, method, questions })
  useEffect(() => {
    const i = initial.current
    if (i.index === index && i.outcome === outcome && i.method === method && i.questions === questions) return
    initial.current = { index: -1, outcome: undefined, method, questions: [] }
    if (outcome) nextButton.current?.focus()
    else firstField.current?.focus()
  }, [outcome, index, method, questions])

  function restart(mode: QuizMode = prefs.mode) {
    setQuestions(buildSession(mode))
    setIndex(0)
    setOutcomes([])
    setChoice('')
    setTyped('')
  }

  function changeMode(mode: QuizMode) {
    if (mode === prefs.mode) return
    onPrefs({ mode })
    restart(mode)
  }

  function changeMethod(m: AnswerMethod) {
    if (outcome || m === method) return
    onPrefs({ method: m })
    setChoice('')
    setTyped('')
  }

  const answer = question?.kind === 'verbe' && method === 'saisie' ? typed : choice
  const blank = answer.trim() === ''

  function validate() {
    if (!question || outcome || blank) return
    let result: Outcome
    if (question.kind === 'verbe') {
      const check: VerbCheck =
        method === 'saisie' ? checkVerb(typed, question.expected) : choice === question.expected ? 'correct' : 'wrong'
      result = { correct: check === 'correct', vowelsOnly: check === 'vowels', given: answer }
    } else if (question.kind === 'pronom-arabe') {
      result = { correct: choice === question.expected, given: choice }
    } else {
      const chosen = FORMS.find((f) => f.id === choice)!
      result = { correct: checkPronoun(chosen, question.verb), given: choice }
    }
    setOutcomes((o) => [...o, result])
    onAttempt({
      mode: question.kind,
      prompt: question.kind === 'pronom' ? question.verb : question.form.id,
      answer: result.given,
      correct: result.correct,
    })
  }

  function next() {
    if (index + 1 === questions.length) {
      onSessionComplete({
        mode: prefs.mode,
        method: prefs.mode === 'verbe' ? method : 'choix',
        correct: correctCount,
        total: questions.length,
      })
    }
    setIndex((i) => i + 1)
    setChoice('')
    setTyped('')
  }

  function submit(e?: FormEvent) {
    e?.preventDefault()
    if (outcome) next()
    else validate()
  }

  // Entrée valide depuis n'importe quel champ, y compris un bouton radio.
  function onKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key !== 'Enter' || e.target instanceof HTMLButtonElement) return
    e.preventDefault()
    submit()
  }

  function insert(ch: string) {
    const el = firstField.current
    const start = el?.selectionStart ?? typed.length
    const end = el?.selectionEnd ?? typed.length
    setTyped(typed.slice(0, start) + ch + typed.slice(end))
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + ch.length, start + ch.length)
    })
  }

  return (
    <section className={styles.practice} aria-labelledby="practice-title">
      <div className={styles.head}>
        <h2 id="practice-title" className="visually-hidden">
          Entraînement
        </h2>
        <p className={styles.lead}>Les questions reprennent exactement les formes de la fiche.</p>
        <p className={styles.history}>{historyLine(modeStats(sessions, prefs.mode))}</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.switch} role="group" aria-label="Mode d'entraînement">
          <ModeButton active={prefs.mode === 'verbe'} onClick={() => changeMode('verbe')}>
            Retrouver le verbe
          </ModeButton>
          <ModeButton active={prefs.mode === 'pronom'} onClick={() => changeMode('pronom')}>
            Retrouver le pronom
          </ModeButton>
          <ModeButton active={prefs.mode === 'pronom-arabe'} onClick={() => changeMode('pronom-arabe')}>
            Dire le pronom en arabe
          </ModeButton>
        </div>
        {prefs.mode === 'verbe' && (
          <div className={styles.switch} role="group" aria-label="Façon de répondre">
            <ModeButton active={method === 'choix'} disabled={!!outcome} onClick={() => changeMethod('choix')}>
              Choisir
            </ModeButton>
            <ModeButton active={method === 'saisie'} disabled={!!outcome} onClick={() => changeMethod('saisie')}>
              Écrire
            </ModeButton>
          </div>
        )}
      </div>

      <GameBar results={results} total={questions.length} />

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
          <Burst trigger={outcome?.correct ? index : null} />
          {question.kind === 'verbe' ? (
            <VerbQuestion
              question={question}
              method={method}
              choice={choice}
              onChoice={setChoice}
              typed={typed}
              onTyped={setTyped}
              onInsert={insert}
              outcome={outcome}
              fieldRef={firstField}
            />
          ) : question.kind === 'pronom-arabe' ? (
            <ArabicPronounQuestion
              question={question}
              choice={choice}
              onChoice={setChoice}
              outcome={outcome}
              fieldRef={firstField}
            />
          ) : (
            <PronounQuestion
              question={question}
              choice={choice}
              onChoice={setChoice}
              outcome={outcome}
              fieldRef={firstField}
            />
          )}

          {outcome ? (
            <OutcomeView
              question={question}
              outcome={outcome}
              earned={outcome.correct ? pointsFor(scoreOf(results.slice(0, index + 1)).combo) : 0}
            />
          ) : null}

          <div className={styles.actions}>
            {outcome ? (
              <button ref={nextButton} type="button" className="btn btn-secondary" onClick={next}>
                {index + 1 < questions.length ? 'Question suivante' : 'Voir le résultat'}
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={blank}>
                Valider
              </button>
            )}
            <kbd>Entrée</kbd>
          </div>
        </form>
      ) : (
        <GameEnd
          results={results}
          total={questions.length}
          detail={
            correctCount === questions.length
              ? 'Tout est juste.'
              : `${questions.length - correctCount} réponse${questions.length - correctCount > 1 ? 's' : ''} à revoir dans la fiche.`
          }
          onAgain={() => restart()}
        />
      )}
    </section>
  )
}

function historyLine(s: ModeStats): string {
  if (s.sessions === 0) return 'Aucune session terminée dans ce mode pour l’instant.'
  const plural = s.sessions > 1 ? 's' : ''
  return `${s.sessions} session${plural} terminée${plural} dans ce mode · dernière : ${s.last!.correct}/${s.last!.total} · meilleure : ${s.best!.correct}/${s.best!.total}`
}

function ModeButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={styles.modeButton}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

interface VerbQuestionProps {
  question: Extract<Question, { kind: 'verbe' }>
  method: AnswerMethod
  choice: string
  onChoice: (v: string) => void
  typed: string
  onTyped: (v: string) => void
  onInsert: (ch: string) => void
  outcome: Outcome | undefined
  fieldRef: RefObject<HTMLInputElement | null>
}

function VerbQuestion({ question, method, choice, onChoice, typed, onTyped, onInsert, outcome, fieldRef }: VerbQuestionProps) {
  const { form } = question
  return (
    <>
      <div className={styles.prompt}>
        <p className={styles.promptLabel}>Quelle forme du présent va avec ce pronom ?</p>
        <p className={`arabic ${styles.promptAr} ${styles.pronoun}`} lang="ar" dir="rtl">
          {form.pronoun}
        </p>
        <p className={styles.promptFr}>
          <span className={styles.gloss}>{form.pronounFr}</span>
          <span className={styles.muted}> · {grammarLabel(form)}</span>
        </p>
      </div>

      {method === 'choix' ? (
        <fieldset className={`${styles.options} ${styles.verbGrid}`}>
          <legend className="visually-hidden">Formes proposées</legend>
          {question.options.map((v, i) => (
            <label
              key={v}
              className={styles.option}
              data-state={optionState(outcome, v === choice, v === question.expected)}
            >
              <input
                ref={i === 0 ? fieldRef : undefined}
                type="radio"
                name="verb"
                value={v}
                checked={choice === v}
                disabled={!!outcome}
                onChange={() => onChoice(v)}
              />
              <span className={`arabic ${styles.optionAr}`} lang="ar" dir="rtl">
                {v}
              </span>
            </label>
          ))}
        </fieldset>
      ) : (
        <div className={styles.typing}>
          <label htmlFor="verb-answer" className={styles.fieldLabel}>
            Forme verbale, entièrement vocalisée
          </label>
          <input
            ref={fieldRef}
            id="verb-answer"
            className={`arabic ${styles.input}`}
            type="text"
            lang="ar"
            dir="rtl"
            value={typed}
            readOnly={!!outcome}
            onChange={(e) => onTyped(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {!outcome && (
            <div className={styles.keys} role="group" aria-label="Clavier arabe">
              {KEYS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  className={`arabic ${styles.key}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onInsert(ch)}
                  aria-label={`Insérer ${ch}`}
                >
                  {ch}
                </button>
              ))}
              <span className={styles.keyGap} aria-hidden />
              {MARKS.map((m) => (
                <button
                  key={m.ch}
                  type="button"
                  className={`arabic ${styles.key}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onInsert(m.ch)}
                  aria-label={`Insérer ${m.name}`}
                  title={m.name}
                >
                  {'◌' + m.ch}
                </button>
              ))}
              <button
                type="button"
                className={styles.keyText}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onTyped(typed.slice(0, -1))}
              >
                Effacer
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

function PronounQuestion({
  question,
  choice,
  onChoice,
  outcome,
  fieldRef,
}: {
  question: Extract<Question, { kind: 'pronom' }>
  choice: string
  onChoice: (id: string) => void
  outcome: Outcome | undefined
  fieldRef: RefObject<HTMLInputElement | null>
}) {
  const accepted = new Set(question.accepted.map((f) => f.id))
  return (
    <>
      <div className={styles.prompt}>
        <p className={styles.promptLabel}>Quel pronom va avec cette forme ?</p>
        <p className={`arabic ${styles.promptAr}`} lang="ar" dir="rtl">
          {question.verb}
        </p>
      </div>

      <fieldset className={`${styles.options} ${styles.pronounGrid}`}>
        <legend className="visually-hidden">Pronoms</legend>
        {FORMS.map((f, i) => (
          <label
            key={f.id}
            className={styles.option}
            data-state={optionState(outcome, f.id === choice, accepted.has(f.id))}
          >
            <input
              ref={i === 0 ? fieldRef : undefined}
              type="radio"
              name="pronoun"
              value={f.id}
              checked={choice === f.id}
              disabled={!!outcome}
              onChange={() => onChoice(f.id)}
            />
            <span className={`arabic ${styles.optionAr} ${styles.pronoun}`} lang="ar" dir="rtl">
              {f.pronoun}
            </span>
            <span className={styles.optionFr}>{pronounLabel(f)}</span>
          </label>
        ))}
      </fieldset>
    </>
  )
}

function ArabicPronounQuestion({
  question,
  choice,
  onChoice,
  outcome,
  fieldRef,
}: {
  question: Extract<Question, { kind: 'pronom-arabe' }>
  choice: string
  onChoice: (p: string) => void
  outcome: Outcome | undefined
  fieldRef: RefObject<HTMLInputElement | null>
}) {
  const { form } = question
  return (
    <>
      <div className={styles.prompt}>
        <p className={styles.promptLabel}>Comment dit-on ce pronom en arabe ?</p>
        <p className={styles.promptFrBig}>{pronounLabel(form)}</p>
        <p className={styles.promptFr}>
          <span className={styles.muted}>{grammarLabel(form)}</span>
        </p>
      </div>

      <fieldset className={`${styles.options} ${styles.verbGrid}`}>
        <legend className="visually-hidden">Pronoms proposés</legend>
        {question.options.map((p, i) => (
          <label key={p} className={styles.option} data-state={optionState(outcome, p === choice, p === question.expected)}>
            <input
              ref={i === 0 ? fieldRef : undefined}
              type="radio"
              name="arabic-pronoun"
              value={p}
              checked={choice === p}
              disabled={!!outcome}
              onChange={() => onChoice(p)}
            />
            <span className={`arabic ${styles.optionAr} ${styles.pronoun}`} lang="ar" dir="rtl">
              {p}
            </span>
          </label>
        ))}
      </fieldset>
    </>
  )
}

/** État visuel d'une option après validation : réponse attendue, erreur choisie, ou neutre. */
function optionState(outcome: Outcome | undefined, chosen: boolean, right: boolean): string | undefined {
  if (!outcome) return chosen ? 'chosen' : undefined
  if (right) return 'right'
  if (chosen) return 'wrong'
  return undefined
}

function OutcomeView({ question, outcome, earned }: { question: Question; outcome: Outcome; earned: number }) {
  const forms: ConjugatedForm[] = question.kind === 'pronom' ? formsForVerb(question.verb) : [question.form]
  return (
    <div className={styles.outcome} role="status" aria-label="Résultat">
      <p className={outcome.correct ? styles.right : styles.wrong}>
        {outcome.correct ? 'Juste.' : outcome.vowelsOnly ? 'Presque : les lettres sont justes, pas les voyelles.' : 'Pas tout à fait.'}
        {earned > 0 && <span className={styles.earned}>+{earned} pts</span>}
      </p>
      {question.kind === 'pronom-arabe' && !outcome.correct && outcome.given && (
        <p className={styles.given}>
          Ta réponse :{' '}
          <span className="arabic" lang="ar" dir="rtl">
            {outcome.given}
          </span>
        </p>
      )}
      {question.kind === 'verbe' && !outcome.correct && outcome.given && (
        <p className={styles.given}>
          Ta réponse :{' '}
          <span className="arabic" lang="ar" dir="rtl">
            {outcome.given}
          </span>
        </p>
      )}
      <p className={styles.expectedLabel}>
        {question.kind === 'pronom-arabe'
          ? 'Pronom attendu'
          : question.kind === 'verbe'
          ? 'Forme attendue'
          : forms.length > 1
            ? 'Pronoms possibles'
            : 'Pronom attendu'}
      </p>
      <ul className={styles.expected}>
        {forms.map((f) => (
          <li key={f.id}>
            {question.kind === 'pronom-arabe' ? (
              <>
                <span className={`arabic ${styles.expectedAr} ${styles.pronoun}`} lang="ar" dir="rtl">
                  {f.pronoun}
                </span>
                <span className={styles.expectedFr}>{pronounLabel(f)}</span>
              </>
            ) : (
              <>
                <ConjugatedPhrase form={f} className={styles.expectedAr} />
                <span className={styles.expectedFr}>{f.translation}{f.pronounNote ? ` (${f.pronounNote})` : ''}</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
