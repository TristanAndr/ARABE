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

/**
 * Texte français contenant de l'arabe : chaque expression arabe (mots consécutifs) est isolée et
 * grossie d'un bloc, pour que ses mots restent dans l'ordre de droite à gauche.
 */
export function Mixed({ text }: { text: string }) {
  return (
    <>
      {text.split(/([؀-ۿ]+(?:\s+[؀-ۿ]+)*)/).map((part, i) =>
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
