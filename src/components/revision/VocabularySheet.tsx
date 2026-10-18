import type { SpeechState } from '../../revision/speech'
import type { VocabCategory } from '../../revision/vocabulary'
import { SpeakButton } from './SpeakButton'
import { SpokenWord } from './SpokenWord'
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
        <p className={vocab.legend}>
          En gris clair, ce qui ne se prononce pas quand le mot est dit seul :{' '}
          <SpokenWord text="مِشْمِشٌ" className={styles.inlineAr} /> se dit « mishmish ».
        </p>
        <SpeechNote speech={speech} />
      </header>

      <table className={`${styles.table} ${vocab.table}`}>
        <thead className={vocab.head}>
          <tr>
            <th scope="col">Français</th>
            {category.columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {category.words.map((w) => (
            <tr key={w.id} className={vocab.row} data-word={w.id}>
              <td className={vocab.frCell}>
                <span className={styles.translation}>
                  {w.emoji && <Emoji symbol={w.emoji} />}
                  {w.fr}
                </span>
                {w.note && (
                  <span className={styles.grammar}>
                    <Mixed text={w.note} />
                  </span>
                )}
              </td>
              {[w.ar, ...(w.others ?? [])].map((ar, i) => (
                <td key={i} className={vocab.arCell}>
                  <span className={vocab.cellLabel}>{category.columns[i]}</span>
                  <Word text={ar} canSpeak={canSpeak} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  )
}

/** Emoji décoratif : le mot français suffit aux lecteurs d'écran. */
export function Emoji({ symbol, className }: { symbol: string; className?: string }) {
  return (
    <span className={`${vocab.emoji} ${className ?? ''}`} aria-hidden="true">
      {symbol}
    </span>
  )
}

function Word({ text, canSpeak }: { text: string; canSpeak: boolean }) {
  return (
    <span className={vocab.word}>
      <SpokenWord text={text} className={vocab.wordAr} />
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
