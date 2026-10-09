import { breakdown, verbOf, wordSegments, type ConjugatedForm } from '../../revision/conjugation'
import styles from './Revision.module.css'

/**
 * Forme verbale colorée dans le mot lui-même. Les segments sont des éléments inline
 * contigus, sans espace : les lettres restent liées et les signes sur leur lettre.
 */
export function ConjugatedWord({ form }: { form: ConjugatedForm }) {
  const { prefix, stem, suffix } = wordSegments(form)
  return (
    <span className={styles.word} lang="ar" dir="rtl" aria-label={verbOf(form)}>
      <span className={styles.affix}>{prefix}</span>
      <span className={styles.stem}>{stem}</span>
      {suffix && <span className={styles.affix}>{suffix}</span>}
    </span>
  )
}

/** Phrase « pronom + verbe », lue de droite à gauche. */
export function ConjugatedPhrase({ form, className }: { form: ConjugatedForm; className?: string }) {
  return (
    <span className={`arabic ${styles.phrase} ${className ?? ''}`} lang="ar" dir="rtl">
      <span className={styles.pronoun}>{form.pronoun}</span> <ConjugatedWord form={form} />
    </span>
  )
}

/** Préfixe + radical + terminaison, chaque élément isolé comme dans un manuel. */
export function Breakdown({ form }: { form: ConjugatedForm }) {
  const b = breakdown(form)
  const label = `préfixe ${form.prefix}, radical, terminaison ${b.ending}`
  return (
    <span className={`arabic ${styles.breakdown}`} lang="ar" dir="rtl" aria-label={label}>
      <span className={styles.affix}>{b.prefix}</span>
      <span className={styles.plus} aria-hidden>+</span>
      <span className={styles.stem}>{b.stem}</span>
      <span className={styles.plus} aria-hidden>+</span>
      <span className={styles.affix}>{b.ending}</span>
    </span>
  )
}
