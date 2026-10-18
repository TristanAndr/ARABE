import type { RevisionPrefs } from '../../revision/prefs'
import { useSpeech } from '../../revision/speech'
import { COLORS, FRUITS } from '../../revision/vocabulary'
import type { ConjugationAttempt, ConjugationSession, ConjugationSessionRecord } from '../../sync/types'
import { ConjugationSheet } from './ConjugationSheet'
import { Practice } from './Practice'
import { VocabPractice } from './VocabPractice'
import { VocabularySheet } from './VocabularySheet'
import styles from './Revision.module.css'

export type RevisionCategory = 'present' | 'fruits' | 'couleurs'

const CATEGORIES: { id: RevisionCategory; label: string }[] = [
  { id: 'present', label: 'Le présent' },
  { id: 'fruits', label: 'Les fruits' },
  { id: 'couleurs', label: 'Les couleurs' },
]

interface Props {
  category: RevisionCategory
  onCategory: (c: RevisionCategory) => void
  prefs: RevisionPrefs
  onPrefs: (patch: Partial<RevisionPrefs>) => void
  sessions: ConjugationSessionRecord[]
  onAttempt: (a: Omit<ConjugationAttempt, 'id'>) => void
  onSessionComplete: (s: Omit<ConjugationSession, 'id'>) => void
}

export function RevisionView({ category, onCategory, ...props }: Props) {
  const speech = useSpeech()
  const vocab = category === 'fruits' ? FRUITS : category === 'couleurs' ? COLORS : null
  return (
    <>
      <nav className={styles.categories} aria-label="Catégories de révision">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={styles.category}
            aria-pressed={category === c.id}
            onClick={() => onCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </nav>
      {vocab ? (
        <div key={vocab.id}>
          <VocabularySheet category={vocab} speech={speech} />
          <VocabPractice category={vocab} speech={speech} />
        </div>
      ) : (
        <>
          <ConjugationSheet />
          <Practice {...props} />
        </>
      )}
    </>
  )
}
