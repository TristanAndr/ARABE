import type { ReactNode } from 'react'
import { cheerFor, END_TITLES, scoreOf, starsFor } from '../../revision/game'
import styles from './Game.module.css'

/**
 * Barre de jeu : un trait par question (vert si juste, rouge si faux), les points et la série
 * en cours.
 */
export function GameBar({
  results,
  total,
  progress = results,
}: {
  results: readonly boolean[]
  total: number
  /** Cases de la barre, si elles diffèrent des réponses (flashcards : cartes sues). */
  progress?: readonly boolean[]
}) {
  const { points, combo } = scoreOf(results)
  const cheer = cheerFor(combo)
  return (
    <div className={styles.bar}>
      {total > 0 && (
        <ol className={styles.track} aria-label={`Progression : ${progress.length} sur ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <li
              key={i}
              className={styles.sprinkle}
              data-state={
                i < progress.length ? (progress[i] ? 'right' : 'wrong') : i === progress.length ? 'current' : undefined
              }
            />
          ))}
        </ol>
      )}
      <div className={styles.counters}>
        <span className={styles.points} key={`p${points}`}>
          <span aria-hidden="true">⭐ </span>
          {points} pts
        </span>
        {combo >= 2 && (
          <span className={styles.combo} key={`c${combo}`}>
            <span aria-hidden="true">🔥 </span>
            Série ×{combo}
          </span>
        )}
        {cheer && (
          <span className={styles.cheer} key={`h${combo}`} role="status">
            {cheer}
          </span>
        )}
      </div>
    </div>
  )
}

const BURST_COLORS = ['--conj-pronoun', '--partial', '--conj-affix', '--conj-gloss', '--accent']

/** Explosion de confettis, rejouée à chaque nouvelle valeur de `trigger`. */
export function Burst({ trigger, big }: { trigger: string | number | null; big?: boolean }) {
  if (trigger === null) return null
  const count = big ? 36 : 18
  return (
    <span key={trigger} className={`${styles.burst} ${big ? styles.burstBig : ''}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 2 * Math.PI + (i % 3) * 0.3
        const distance = (big ? 9 : 5) + (i % 4) * (big ? 2.5 : 1.4)
        return (
          <span
            key={i}
            style={{
              ['--dx' as string]: `${Math.cos(angle) * distance}rem`,
              ['--dy' as string]: `${Math.sin(angle) * distance}rem`,
              ['--rot' as string]: `${(i * 67) % 360}deg`,
              ['--color' as string]: `var(${BURST_COLORS[i % BURST_COLORS.length]})`,
              animationDelay: `${(i % 5) * 20}ms`,
            }}
          />
        )
      })}
    </span>
  )
}

interface EndProps {
  results: readonly boolean[]
  /** Bonnes réponses retenues pour le score (par défaut : toutes les réponses justes). */
  correct?: number
  total: number
  /** Ligne sous le titre. */
  detail: string
  againLabel?: string
  onAgain: () => void
  children?: ReactNode
}

/** Fin de série : étoiles, points, meilleure série, et un gros bouton pour enchaîner. */
export function GameEnd({
  results,
  correct,
  total,
  detail,
  againLabel = 'Encore une série !',
  onAgain,
  children,
}: EndProps) {
  const right = correct ?? results.filter(Boolean).length
  const stars = starsFor(right, total)
  const { points, bestCombo } = scoreOf(results)
  return (
    <div className={styles.end}>
      <Burst trigger={stars === 3 ? 'end' : null} big />
      <p className={styles.stars} role="img" aria-label={`${stars} étoile${stars > 1 ? 's' : ''} sur 3`}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={styles.star} data-on={i < stars} style={{ animationDelay: `${150 + i * 180}ms` }}>
            ★
          </span>
        ))}
      </p>
      <p className={styles.endTitle}>{END_TITLES[stars]}</p>
      <p className={styles.endScore}>
        {right} <span className={styles.muted}>/ {total}</span>
      </p>
      <p className={styles.endDetail}>{detail}</p>
      <ul className={styles.endStats}>
        <li>
          <span aria-hidden="true">⭐</span> <strong>{points}</strong> points
        </li>
        <li>
          <span aria-hidden="true">🔥</span> meilleure série : <strong>{bestCombo}</strong>
        </li>
      </ul>
      <div className={styles.endActions}>
        <button type="button" className={`btn btn-primary ${styles.again}`} onClick={onAgain} autoFocus>
          {againLabel} <span aria-hidden="true">🚀</span>
        </button>
        {children}
      </div>
    </div>
  )
}
