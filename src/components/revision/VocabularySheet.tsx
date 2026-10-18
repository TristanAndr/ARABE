import type { SpeechState } from '../../revision/speech'
import type { VocabCategory } from '../../revision/vocabulary'
import { SpeakButton } from './SpeakButton'
import styles from './Revision.module.css'
import vocab from './Vocabulary.module.css'

interface Props {
  category: VocabCategory
  speech: SpeechState
}

export function VocabularySheet({ category, speech }: Props) {
  const canSpeak = speech !== 'indisponible'
  return (
    <article className={styles.sheet} aria-labelledby="sheet-title">
      <header className={styles.sheetHead}>
        <p className={styles.kicker}>Fiche de révision · vocabulaire</p>
        <h1 id="sheet-title" className={styles.title}>
          {category.title}
          <span className={`arabic ${styles.titleAr}`} lang="ar" dir="rtl">
            {category.titleAr}
          </span>
        </h1>
        <p className={styles.intro}>
          <Mixed text={category.intro} />
        </p>
        <SpeechNote speech={speech} />
      </header>

      <table className={`${styles.table} ${vocab.table}`}>
        <thead className={category.columns ? vocab.head : 'visually-hidden'}>
          <tr>
            <th scope="col">Français</th>
            <th scope="col">{category.columns?.main ?? 'Arabe'}</th>
            {category.columns && <th scope="col">{category.columns.fem}</th>}
          </tr>
        </thead>
        <tbody>
          {category.words.map((w) => (
            <tr key={w.id} className={vocab.row} data-word={w.id}>
              <td className={vocab.frCell}>
                <span className={styles.translation}>{w.fr}</span>
                {w.note && (
                  <span className={styles.grammar}>
                    <Mixed text={w.note} />
                  </span>
                )}
              </td>
              <td className={vocab.arCell}>
                <Word text={w.ar} canSpeak={canSpeak} />
              </td>
              {category.columns && (
                <td className={vocab.arCell}>{w.arFem && <Word text={w.arFem} canSpeak={canSpeak} />}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  )
}

function Word({ text, canSpeak }: { text: string; canSpeak: boolean }) {
  return (
    <span className={vocab.word}>
      <span className={`arabic ${vocab.wordAr}`} lang="ar" dir="rtl">
        {text}
      </span>
      {canSpeak && <SpeakButton text={text} label={`Écouter ${text}`} />}
    </span>
  )
}

/** Texte français contenant des mots arabes : chaque mot arabe est isolé et grossi. */
function Mixed({ text }: { text: string }) {
  return (
    <>
      {text.split(/([؀-ۿ]+)/).map((part, i) =>
        /[؀-ۿ]/.test(part) ? (
          <span key={i} className={`arabic ${styles.inlineAr}`} lang="ar" dir="rtl">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  )
}

export function SpeechNote({ speech }: { speech: SpeechState }) {
  if (speech === 'pret') return null
  return (
    <p className={vocab.speechNote} role="note">
      {speech === 'indisponible'
        ? 'Ton navigateur ne propose pas de synthèse vocale : l’écoute des mots n’est pas disponible.'
        : 'Aucune voix arabe n’a été trouvée sur cet appareil : la prononciation peut manquer ou être incorrecte. Elle s’installe dans les réglages de langue / synthèse vocale du système.'}
    </p>
  )
}
