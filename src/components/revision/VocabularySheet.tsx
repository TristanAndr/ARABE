import { Fragment } from 'react'
import type { SpeechState } from '../../revision/speech'
import type { VocabCategory } from '../../revision/vocabulary'
import { SpeakButton } from './SpeakButton'
import { SpokenWord } from './SpokenWord'
import { FrenchWord } from './WordIcon'
import styles from './Revision.module.css'
import vocab from './Vocabulary.module.css'

interface Props {
  category: VocabCategory
  canSpeak: boolean
}

/** Les mots du thème : français, puis chaque forme arabe avec son bouton d'écoute. */
export function VocabularyTable({ category, canSpeak }: Props) {
  return (
    <section className={vocab.words} aria-label={`Les mots : ${category.title.toLowerCase()}`}>
      <p className={vocab.legend}>
        En gris clair, ce qui ne se prononce pas quand le mot est dit seul :{' '}
        <SpokenWord text="مِشْمِشٌ" className={styles.inlineAr} /> se dit « mishmish ».
      </p>

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
            <Fragment key={w.id}>
              <tr className={vocab.row} data-word={w.id} data-noted={w.note ? true : undefined}>
                <td className={vocab.frCell}>
                  <span className={styles.translation}>
                    <FrenchWord word={w} />
                  </span>
                </td>
                {[w.ar, ...(w.others ?? [])].map((ar, i) => (
                  <td key={i} className={vocab.arCell}>
                    <span className={vocab.cellLabel}>{category.columns[i]}</span>
                    <Word text={ar} canSpeak={canSpeak} />
                  </td>
                ))}
              </tr>
              {w.note && (
                // La précision court sous toute la ligne : la colonne française reste étroite.
                <tr className={vocab.noteRow}>
                  <td colSpan={category.columns.length + 1}>
                    <Mixed text={w.note} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </section>
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
export function Mixed({ text }: { text: string }) {
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
