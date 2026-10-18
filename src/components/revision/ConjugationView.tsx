import { useMemo, useState } from 'react'
import { MODEL } from '../../revision/conjugation'
import type { RevisionPrefs } from '../../revision/prefs'
import type { ConjugationAttempt, ConjugationSession, ConjugationSessionRecord } from '../../sync/types'
import { Ar, ConjugationNotes, ConjugationTable } from './ConjugationSheet'
import { presentDirections } from './decks'
import { Flashcards } from './Flashcards'
import { PageTabs } from './PageTabs'
import { Practice } from './Practice'
import styles from './Revision.module.css'

type Tab = 'tableau' | 'retenir' | 'flashcards' | 'exercice'

const TABS = [
  ['tableau', 'Tableau'],
  ['retenir', 'À retenir'],
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
        <p className={styles.kicker}>Fiche · conjugaison</p>
        <h1 id="page-title" className={styles.title}>
          Le présent
          <span className={`arabic ${styles.titleAr}`} lang="ar" dir="rtl">
            الفِعْلُ الْمُضَارِعُ
          </span>
        </h1>
        <p className={styles.intro}>
          Modèle : <Ar>{MODEL.past}</Ar> / <Ar>{MODEL.present}</Ar>{' '}
          <span className={styles.gloss}>« {MODEL.meaning} »</span>, verbe régulier de trois lettres. Chaque verbe du
          même type se conjugue en remplaçant <Ar>ف</Ar>, <Ar>ع</Ar> et <Ar>ل</Ar> par ses propres lettres.
        </p>
      </header>

      <section className={styles.rules} aria-label="L’essentiel">
        <ul>
          <li>
            Une forme du présent = <strong className={styles.affix}>préfixe</strong> +{' '}
            <strong>radical</strong> + <strong className={styles.affix}>terminaison</strong>.
          </li>
          <li>
            Le <strong>préfixe</strong> dit la personne ; la <strong>terminaison</strong> dit le genre et le nombre.
          </li>
          <li>
            Le radical <Ar>{MODEL.stem}</Ar> ne change jamais.
          </li>
          <li>
            On apprend chaque forme avec son pronom :{' '}
            <span className={`arabic ${styles.inlineAr}`} lang="ar" dir="rtl">
              <span className={styles.pronoun}>أَنَا</span> أَفْعَلُ
            </span>
            , « je fais ».
          </li>
        </ul>
      </section>

      <PageTabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'tableau' && <ConjugationTable />}
      {tab === 'retenir' && <ConjugationNotes />}
      {tab === 'flashcards' && <Flashcards directions={directions} />}
      {tab === 'exercice' && <Practice {...props} />}
    </article>
  )
}
