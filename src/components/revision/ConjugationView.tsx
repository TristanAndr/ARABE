import { useMemo, useState } from 'react'
import type { RevisionPrefs } from '../../revision/prefs'
import type { ConjugationAttempt, ConjugationSession, ConjugationSessionRecord } from '../../sync/types'
import { ConjugationTable } from './ConjugationSheet'
import { presentDirections } from './decks'
import { Flashcards } from './Flashcards'
import { PageTabs } from './PageTabs'
import { Practice } from './Practice'
import styles from './Revision.module.css'

type Tab = 'tableau' | 'flashcards' | 'exercice'

const TABS = [
  ['tableau', 'Tableau'],
  ['flashcards', 'Flashcards'],
  ['exercice', 'S’entraîner'],
] as const

interface Props {
  prefs: RevisionPrefs
  onPrefs: (patch: Partial<RevisionPrefs>) => void
  sessions: ConjugationSessionRecord[]
  onAttempt: (a: Omit<ConjugationAttempt, 'id'>) => void
  onSessionComplete: (s: Omit<ConjugationSession, 'id'>) => void
}

export function ConjugationView(props: Props) {
  const [tab, setTab] = useState<Tab>('tableau')
  const directions = useMemo(() => presentDirections(), [])

  return (
    <article className={styles.sheet} aria-labelledby="page-title">
      <header>
        <h1 id="page-title" className={styles.title}>
          Le présent
          <span className={`arabic ${styles.titleAr}`} lang="ar" dir="rtl">
            الفِعْلُ الْمُضَارِعُ
          </span>
        </h1>
      </header>

      <PageTabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'tableau' && <ConjugationTable />}
      {tab === 'flashcards' && <Flashcards directions={directions} />}
      {tab === 'exercice' && <Practice {...props} />}
    </article>
  )
}
