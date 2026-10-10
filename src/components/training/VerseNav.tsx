import { SURAHS } from '../../data/surahs'
import { next, previous, type Position } from '../../quran/navigation'
import { SurahPicker } from './SurahPicker'
import styles from './Training.module.css'

interface Props {
  /** Verset de l'exercice affiché. */
  position: Position
  /** Entraînement verset par verset (sinon : sélection d'exercices d'origine). */
  verseMode: boolean
  onGo: (p: Position) => void
  onStep: (move: (p: Position) => Position | null) => void
  onExit: () => void
}

/** Choix de la sourate et passage au verset précédent ou suivant, au-dessus de l'exercice. */
export function VerseNav({ position, verseMode, onGo, onStep, onExit }: Props) {
  const surah = SURAHS[position.surah]!
  const prev = previous(position)
  const nextPos = next(position)
  return (
    <div className={styles.bar}>
      <SurahPicker current={surah} onPick={(n) => onGo({ surah: n, ayah: 1 })} />
      <nav className={styles.verseNav} aria-label="Versets">
        <button type="button" className={styles.step} onClick={() => onStep(previous)} disabled={!prev}>
          ← <span className={styles.long}>Verset précédent</span>
          <span className={styles.short} aria-hidden>
            Précédent
          </span>
        </button>
        <span className={styles.counter} aria-live="polite">
          Verset {position.ayah} <span className={styles.muted}>/ {surah.ayahs}</span>
        </span>
        <button type="button" className={styles.step} onClick={() => onStep(next)} disabled={!nextPos}>
          <span className={styles.long}>Verset suivant</span>
          <span className={styles.short} aria-hidden>
            Suivant
          </span>{' '}
          →
        </button>
      </nav>
      {verseMode && (
        <button type="button" className={`btn btn-link ${styles.exit}`} onClick={onExit}>
          Revenir à la sélection d’exercices
        </button>
      )}
    </div>
  )
}
