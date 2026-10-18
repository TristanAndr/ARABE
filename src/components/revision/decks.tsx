/** Paquets de flashcards de chaque catégorie de révision. */

import { FORMS, grammarLabel, pronounLabel, type ConjugatedForm } from '../../revision/conjugation'
import type { VocabCategory, VocabWord } from '../../revision/vocabulary'
import { ConjugatedPhrase } from './ConjugatedWord'
import type { FlashcardDirection } from './Flashcards'
import { SpeakButton } from './SpeakButton'
import { SpokenWord } from './SpokenWord'
import { FrenchWord } from './WordIcon'
import cards from './Flashcards.module.css'
import revision from './Revision.module.css'

export function vocabDirections(category: VocabCategory, canSpeak: boolean): FlashcardDirection[] {
  const arabic = (w: VocabWord) => (
    <span className={cards.withSpeak}>
      <SpokenWord text={w.ar} className={cards.big} />
      {canSpeak && <SpeakButton text={w.ar} label={`Écouter ${w.ar}`} />}
    </span>
  )
  const french = (w: VocabWord) => (
    <>
      <span className={cards.bigFr}>
        <FrenchWord word={w} iconClassName={cards.emoji} />
      </span>
    </>
  )
  const forms = (w: VocabWord) =>
    w.others?.length ? (
      <ul className={cards.forms}>
        {w.others.map((ar, i) => (
          <li key={ar}>
            {category.columns[i + 1]!.toLowerCase()}
            <SpokenWord text={ar} className={cards.formAr} />
          </li>
        ))}
      </ul>
    ) : null

  return [
    {
      id: 'fr-ar',
      label: 'Du français à l’arabe',
      prompt: 'Comment dit-on en arabe ?',
      cards: category.words.map((w) => ({
        id: w.id,
        front: french(w),
        back: (
          <>
            {arabic(w)}
            {forms(w)}
          </>
        ),
      })),
    },
    {
      id: 'ar-fr',
      label: 'De l’arabe au français',
      prompt: 'Que veut dire ce mot ?',
      cards: category.words.map((w) => ({
        id: w.id,
        front: arabic(w),
        back: (
          <>
            {french(w)}
            {forms(w)}
          </>
        ),
      })),
    },
  ]
}

const pronoun = (f: ConjugatedForm) => (
  <span className={`arabic ${cards.big} ${revision.pronoun}`} lang="ar" dir="rtl">
    {f.pronoun}
  </span>
)

const grammar = (f: ConjugatedForm) => <span className={cards.detail}>{grammarLabel(f)}</span>

export function presentDirections(): FlashcardDirection[] {
  return [
    {
      id: 'pronom-verbe',
      label: 'Pronom → verbe',
      prompt: 'Quelle forme du présent va avec ce pronom ?',
      cards: FORMS.map((f) => ({
        id: f.id,
        front: (
          <>
            {pronoun(f)}
            <span className={cards.detail}>
              <span className={revision.gloss}>{f.pronounFr}</span> · {grammarLabel(f)}
            </span>
          </>
        ),
        back: (
          <>
            <ConjugatedPhrase form={f} />
            <span className={cards.bigFr}>{f.translation}</span>
          </>
        ),
      })),
    },
    {
      id: 'francais-arabe',
      label: 'Français → arabe',
      prompt: 'Comment dit-on en arabe ?',
      cards: FORMS.map((f) => ({
        id: f.id,
        front: (
          <>
            <span className={cards.bigFr}>{f.translation}</span>
            {grammar(f)}
          </>
        ),
        back: <ConjugatedPhrase form={f} />,
      })),
    },
    {
      id: 'pronoms',
      label: 'Les pronoms',
      prompt: 'Comment dit-on ce pronom en arabe ?',
      cards: FORMS.map((f) => ({
        id: f.id,
        front: (
          <>
            <span className={cards.bigFr}>{pronounLabel(f)}</span>
            {grammar(f)}
          </>
        ),
        back: pronoun(f),
      })),
    },
  ]
}
