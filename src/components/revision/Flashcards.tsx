import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { answerCard, knownCount, newDeck } from '../../revision/flashcards'
import { Burst, GameBar, GameEnd } from './Game'
import styles from './Practice.module.css'
import cards from './Flashcards.module.css'

export interface Flashcard {
  id: string
  front: ReactNode
  back: ReactNode
}

/** Un sens de révision : mêmes cartes, faces choisies par la catégorie. */
export interface FlashcardDirection {
  id: string
  label: string
  /** Question posée au-dessus du recto. */
  prompt: string
  cards: readonly Flashcard[]
}

export function Flashcards({ directions }: { directions: readonly FlashcardDirection[] }) {
  const [directionId, setDirectionId] = useState(directions[0]!.id)
  const direction = directions.find((d) => d.id === directionId) ?? directions[0]!
  const [deck, setDeck] = useState(() => newDeck(direction.cards.map((c) => c.id)))
  const [flipped, setFlipped] = useState(false)
  /** Réponses données, dans l'ordre : sert aux points et à la série. */
  const [answers, setAnswers] = useState<boolean[]>([])

  const card = direction.cards.find((c) => c.id === deck.queue[0])
  const known = knownCount(deck)

  const flipButton = useRef<HTMLButtonElement>(null)
  const knownButton = useRef<HTMLButtonElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!started.current) return
    if (flipped) knownButton.current?.focus()
    else flipButton.current?.focus()
  }, [flipped, deck])

  function restart(ids: readonly string[] = direction.cards.map((c) => c.id)) {
    setDeck(newDeck(ids))
    setFlipped(false)
    setAnswers([])
  }

  function changeDirection(d: FlashcardDirection) {
    if (d.id === direction.id) return
    setDirectionId(d.id)
    restart(d.cards.map((c) => c.id))
  }

  function flip() {
    started.current = true
    setFlipped(true)
  }

  function answer(isKnown: boolean) {
    started.current = true
    setDeck((d) => answerCard(d, isKnown))
    setAnswers((a) => [...a, isKnown])
    setFlipped(false)
  }

  // Un clic sur la carte la retourne, sauf sur un bouton qu'elle contient (écoute).
  function onCardClick(e: MouseEvent) {
    if (flipped || (e.target as HTMLElement).closest('button')) return
    flip()
  }

  return (
    <section className={styles.practice} aria-labelledby="flashcards-title">
      <div className={styles.head}>
        <h2 id="flashcards-title" className="visually-hidden">
          Flashcards
        </h2>
        <p className={styles.lead}>Retourne la carte, puis dis si tu savais. Les cartes à revoir reviennent à la fin du paquet.</p>
      </div>

      {directions.length > 1 && (
        <div className={styles.controls}>
          <div className={styles.switch} role="group" aria-label="Sens des cartes">
            {directions.map((d) => (
              <button
                key={d.id}
                type="button"
                aria-pressed={direction.id === d.id}
                className={styles.modeButton}
                onClick={() => changeDirection(d)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <GameBar results={answers} total={deck.total} progress={Array.from({ length: known }, () => true)} />

      <div className={styles.status} aria-live="polite">
        <span>
          {card ? (
            <>
              Encore {deck.queue.length} <span className={styles.muted}>carte{deck.queue.length > 1 ? 's' : ''}</span>
            </>
          ) : (
            'Paquet terminé'
          )}
        </span>
        <span>
          Sues : <strong>{known}</strong> / {deck.total}
        </span>
        <button type="button" className="btn btn-link" onClick={() => restart()}>
          Recommencer le paquet
        </button>
      </div>

      {card ? (
        <div className={cards.stage}>
          <Burst trigger={answers.at(-1) ? answers.length : null} />
          <div
            key={`${card.id}-${flipped}`}
            className={cards.card}
            data-side={flipped ? 'verso' : 'recto'}
            aria-label={flipped ? 'Verso de la carte' : 'Recto de la carte'}
            role="group"
            onClick={onCardClick}
          >
            <p className={styles.promptLabel}>{flipped ? 'Réponse' : direction.prompt}</p>
            <div className={cards.face}>{flipped ? card.back : card.front}</div>
          </div>

          <div className={`${styles.actions} ${cards.actions}`}>
            {flipped ? (
              <>
                <button type="button" className="btn btn-secondary" onClick={() => answer(false)}>
                  À revoir
                </button>
                <button ref={knownButton} type="button" className="btn btn-primary" onClick={() => answer(true)}>
                  Je savais
                </button>
              </>
            ) : (
              <button ref={flipButton} type="button" className="btn btn-primary" onClick={flip}>
                Retourner la carte
              </button>
            )}
          </div>
        </div>
      ) : (
        <GameEnd
          results={answers}
          correct={deck.total - deck.missed.length}
          total={deck.total}
          detail={
            deck.missed.length === 0
              ? 'Tout su du premier coup.'
              : `Cartes sues du premier coup · ${deck.missed.length} à revoir.`
          }
          againLabel="Tout le paquet"
          onAgain={() => restart()}
        >
          {deck.missed.length > 0 && (
            <button type="button" className="btn btn-secondary" onClick={() => restart(deck.missed)}>
              Revoir les cartes ratées
            </button>
          )}
        </GameEnd>
      )}
    </section>
  )
}
