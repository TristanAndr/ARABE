import { useEffect, useRef, useState } from 'react'
import { nextFlashcard, type Flashcard } from '../../alphabet/flashcards'
import { formOf, POSITIONS } from '../../alphabet/letters'
import { GameBar, Burst } from '../revision/Game'
import styles from './Alphabet.module.css'

const LABEL = Object.fromEntries(POSITIONS.map((p) => [p.position, p]))

/**
 * Entraînement continu : une lettre au hasard, la réponse sur demande, puis on dit si on la
 * connaissait (points et série, sans fin de partie).
 */
export function AlphabetQuiz() {
  const [card, setCard] = useState<Flashcard>(() => nextFlashcard(null))
  const [revealed, setRevealed] = useState(false)
  const [answers, setAnswers] = useState<boolean[]>([])
  const revealButton = useRef<HTMLButtonElement>(null)
  const nextButton = useRef<HTMLButtonElement>(null)
  // Pas de focus automatique à l'ouverture de l'onglet, seulement après une action.
  const started = useRef(false)

  useEffect(() => {
    if (!started.current) return
    if (revealed) nextButton.current?.focus()
    else revealButton.current?.focus()
  }, [revealed, card])

  function reveal() {
    started.current = true
    setRevealed(true)
  }

  function next(known: boolean) {
    started.current = true
    setAnswers((a) => [...a, known])
    setCard((c) => nextFlashcard(c))
    setRevealed(false)
  }

  const { letter, position, form } = card
  const label = LABEL[position]!
  const isolated = formOf(letter, 'isolated')!

  return (
    <section className={styles.quiz} aria-labelledby="alphabet-quiz-title">
      <h2 id="alphabet-quiz-title" className="visually-hidden">
        Entraînement : reconnaître les lettres
      </h2>

      <GameBar results={answers} total={0} />

      <div className={styles.card}>
        <Burst trigger={answers.at(-1) ? answers.length : null} />
        <p className={styles.promptLabel}>Quelle est cette lettre ?</p>
        <p className={`arabic ${styles.cardLetter}`} lang="ar" dir="rtl" data-testid="flashcard-letter">
          {form}
        </p>

        <div className={styles.answer} aria-live="polite">
          {revealed && (
            <div className={styles.reveal} role="region" aria-label="Réponse">
              <p className={styles.answerName}>
                {letter.name}
                <span className={`arabic ${styles.answerNameAr}`} lang="ar" dir="rtl">
                  {letter.nameAr}
                </span>
              </p>
              <p className={styles.answerForm}>
                Forme {label.label.toLowerCase()} <span className={styles.muted}>· {label.note}</span>
                {position !== 'isolated' && (
                  <span className={styles.nowrap}>
                    <span className={styles.muted}> · isolée : </span>
                    <span className={`arabic ${styles.answerIsolated}`} lang="ar" dir="rtl">
                      {isolated}
                    </span>
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {revealed ? (
          <div className={styles.verdictButtons}>
            <button type="button" className="btn btn-secondary" onClick={() => next(false)}>
              À revoir
            </button>
            <button ref={nextButton} type="button" className="btn btn-primary" onClick={() => next(true)}>
              Je savais
            </button>
          </div>
        ) : (
          <button ref={revealButton} type="button" className="btn btn-secondary" onClick={reveal}>
            Afficher la réponse
          </button>
        )}
      </div>
    </section>
  )
}
