import { Fragment, useMemo, useState } from 'react'
import { useSpeech } from '../../revision/speech'
import { COLORS, FRUITS, VEGETABLES, type ThemeGuide as Guide, type VocabCategory } from '../../revision/vocabulary'
import { vocabDirections } from './decks'
import { Flashcards } from './Flashcards'
import { PageTabs } from './PageTabs'
import { VocabPractice } from './VocabPractice'
import { SegmentedWord } from './SegmentedWord'
import { Mixed, SpeechNote, VocabularyTable } from './VocabularySheet'
import styles from './Revision.module.css'

export type VocabTheme = VocabCategory['id']

const THEMES: { theme: VocabCategory; emoji: string }[] = [
  { theme: FRUITS, emoji: '🍓' },
  { theme: VEGETABLES, emoji: '🥕' },
  { theme: COLORS, emoji: '🎨' },
]

type Tab = 'mots' | 'flashcards' | 'exercice'

const TABS = [
  ['mots', 'Les mots'],
  ['flashcards', 'Flashcards'],
  ['exercice', 'S’entraîner'],
] as const

interface Props {
  theme: VocabTheme
  onTheme: (t: VocabTheme) => void
}

export function VocabularyView({ theme, onTheme }: Props) {
  const speech = useSpeech()
  const canSpeak = speech !== 'indisponible'
  const [tab, setTab] = useState<Tab>('mots')
  const category = THEMES.find((t) => t.theme.id === theme)!.theme
  const directions = useMemo(() => vocabDirections(category, canSpeak), [category, canSpeak])

  return (
    <article className={styles.sheet} aria-labelledby="page-title">
      <header>
        <h1 id="page-title" className={styles.title}>
          Le vocabulaire
          <span className={`arabic ${styles.titleAr}`} lang="ar" dir="rtl">
            المُفْرَدَاتُ
          </span>
        </h1>
      </header>

      <nav className={styles.categories} aria-label="Thèmes">
        {THEMES.map(({ theme: t, emoji }) => (
          <button
            key={t.id}
            type="button"
            className={styles.category}
            aria-pressed={t.id === theme}
            onClick={() => onTheme(t.id)}
          >
            <span className={styles.categoryEmoji} aria-hidden="true">
              {emoji}
            </span>
            <span className={styles.categoryName}>{t.title}</span>
          </button>
        ))}
      </nav>

      <ThemeGuide guide={category.guide} />
      <SpeechNote speech={speech} />

      <PageTabs tabs={TABS} value={tab} onChange={setTab} />

      <div key={category.id}>
        {tab === 'mots' && <VocabularyTable category={category} canSpeak={canSpeak} />}
        {tab === 'flashcards' && <Flashcards directions={directions} />}
        {tab === 'exercice' && <VocabPractice category={category} speech={speech} />}
      </div>
    </article>
  )
}

/** Mémo du thème : les formes d'un mot exemple reliées par des flèches, puis les rappels. */
function ThemeGuide({ guide }: { guide: Guide }) {
  return (
    <section className={styles.guide} aria-label="Mémo">
      <ol className={styles.guideSteps}>
        {guide.steps.map((step, i) => (
          <Fragment key={step.label}>
            {i > 0 && (
              <li className={styles.guideArrow} aria-hidden="true">
                →
              </li>
            )}
            <li className={styles.guideStep}>
              <SegmentedWord parts={step.parts} className={styles.guideAr} />
              <span className={styles.guideLabel}>
                <Mixed text={step.label} />
              </span>
            </li>
          </Fragment>
        ))}
      </ol>
      <ul className={styles.guideTips}>
        {guide.tips.map((tip) => (
          <li key={tip}>
            <Mixed text={tip} />
          </li>
        ))}
      </ul>
    </section>
  )
}
