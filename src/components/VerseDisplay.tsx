import type { Exercise } from '../data/corpus'
import { SURAHS, surahName } from '../data/surahs'
import styles from './VerseDisplay.module.css'

export function VerseDisplay({ exercise }: { exercise: Exercise }) {
  const partial = exercise.id.split(':').length > 2
  return (
    <figure className={styles.figure}>
      <p className={`arabic ${styles.verse}`} lang="ar" dir="rtl">
        {exercise.arabic}
      </p>
      <figcaption className={styles.ref}>
        <span>{surahName(exercise.surah)}</span>
        <span className={styles.sep} aria-hidden>·</span>
        <span>
          {exercise.surah}:{exercise.ayah}
          {partial && <span className={styles.part}> (mots {exercise.words[0]}–{exercise.words[1]})</span>}
        </span>
        <span className={styles.refAr} lang="ar" dir="rtl">{SURAHS[exercise.surah]?.arabic}</span>
      </figcaption>
    </figure>
  )
}
