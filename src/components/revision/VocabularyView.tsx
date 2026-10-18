import { useMemo, useState } from 'react'
import { useSpeech } from '../../revision/speech'
import { COLORS, FRUITS, VEGETABLES, type VocabCategory } from '../../revision/vocabulary'
import { vocabDirections } from './decks'
import { Flashcards } from './Flashcards'
import { PageTabs } from './PageTabs'
import { VocabPractice } from './VocabPractice'
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
        <p className={styles.kicker}>Fiche · vocabulaire</p>
        <h1 id="page-title" className={styles.title}>
          Le vocabulaire
          <span className={`arabic ${styles.titleAr}`} lang="ar" dir="rtl">
            المُفْرَدَاتُ
          </span>
        </h1>
        <p className={styles.intro}>
          Les mots par thème, avec leur prononciation. Choisis un thème, puis lis les mots, révise-les en flashcards
          ou entraîne-toi.
        </p>
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
            <span>
              <span className={styles.categoryName}>{t.title}</span>
              <span className={styles.categoryCount}>{t.words.length} mots</span>
            </span>
          </button>
        ))}
      </nav>

      <section className={styles.rules} aria-labelledby="theme-title">
        <h2 id="theme-title" className={styles.themeTitle}>
          {category.title}
          <span className={`arabic ${styles.themeAr}`} lang="ar" dir="rtl">
            {category.titleAr}
          </span>
        </h2>
        <p>
          <Mixed text={category.intro} />
        </p>
      </section>
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
