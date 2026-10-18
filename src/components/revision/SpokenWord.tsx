import { pausalForm } from '../../revision/speech'
import styles from './Vocabulary.module.css'

interface Props {
  text: string
  className?: string
}

/**
 * Mot arabe dont les terminaisons muettes à la pause (tanwīn, voyelle finale) sont en gris clair.
 *
 * Un signe diacritique ne peut pas être coloré à part de sa lettre sans casser le rendu arabe :
 * le mot complet est donc dessiné en gris, et la forme prononcée posée exactement par-dessus.
 * La forme prononcée ne retire que des signes en fin de mot, jamais un signe qui en suit un autre
 * conservé : les signes restants gardent leur place et les deux couches se superposent exactement.
 */
export function SpokenWord({ text, className = '' }: Props) {
  const spoken = pausalForm(text)
  if (spoken === text.normalize('NFC')) {
    return (
      <span className={`arabic ${className}`} lang="ar" dir="rtl">
        {text}
      </span>
    )
  }
  return (
    <span className={`arabic ${styles.layered} ${className}`} lang="ar" dir="rtl">
      <span className={styles.silent}>{text}</span>
      <span className={styles.spoken} aria-hidden="true">
        {spoken}
      </span>
    </span>
  )
}
