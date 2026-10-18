import { breakdown, joinsNext, MODEL, verbOf, wordSegments, type ConjugatedForm } from '../../revision/conjugation'
import styles from './Revision.module.css'

/** Zero-width joiner : garde la forme liée d'une lettre placée en bord de segment. */
const ZWJ = '\u200D'

/**
 * Forme verbale colorée dans le mot lui-même. Safari cesse de lier deux lettres dès qu'elles sont
 * dans des éléments différents : chaque frontière entre deux lettres liées porte donc un ZWJ de
 * part et d'autre, comme le tatwīl du découpage.
 *
 * La voyelle finale du ل appartient à la terminaison, mais un signe ne peut pas être coloré à
 * part de sa lettre. Le mot est donc dessiné deux fois, superposé : dessous dans la couleur de la
 * terminaison, dessus coloré par segment et sans cette seule voyelle. Les deux couches ont le même
 * texte et les mêmes frontières, à cette voyelle près : elles se recouvrent exactement.
 */
export function ConjugatedWord({ form }: { form: ConjugatedForm }) {
  const { prefix, suffix } = wordSegments(form)
  const afterPrefix = joinsNext(prefix) ? ZWJ : ''
  const layer = (stem: string, below: boolean) => (
    <span aria-hidden="true">
      <span className={styles.affix}>{prefix + afterPrefix}</span>
      <span className={below ? styles.affix : styles.stem}>{afterPrefix + stem + (suffix ? ZWJ : '')}</span>
      {suffix && <span className={styles.affix}>{ZWJ + suffix}</span>}
    </span>
  )
  return (
    <span className={`${styles.word} ${styles.layered}`} lang="ar" dir="rtl" aria-label={verbOf(form)}>
      {layer(MODEL.stem + form.finalVowel, true)}
      {layer(MODEL.stem, false)}
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
