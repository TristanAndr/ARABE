import { joinsNext } from '../../revision/conjugation'
import { partsText, type WordParts } from '../../revision/vocabulary'
import styles from './Revision.module.css'

/** Zero-width joiner : garde la forme liée d'une lettre placée en bord de segment. */
const ZWJ = '‍'

/**
 * Mot du mémo dont la partie qui varie (préfixe, terminaison) est en couleur. Même technique que
 * ConjugatedWord : deux couches superposées aux frontières identiques, pour que la voyelle de la
 * terminaison posée sur le radical (`tail`) prenne la couleur de la terminaison.
 */
export function SegmentedWord({ parts, className }: { parts: WordParts; className?: string }) {
  const { prefix = '', stem, tail = '', suffix = '' } = parts
  const afterPrefix = prefix && joinsNext(prefix) ? ZWJ : ''
  const beforeSuffix = suffix && joinsNext(stem) ? ZWJ : ''
  const layer = (below: boolean) => (
    <span aria-hidden="true">
      {prefix && <span className={styles.variable}>{prefix + afterPrefix}</span>}
      <span className={below && tail ? styles.variable : undefined}>
        {afterPrefix + stem + (below ? tail : '') + beforeSuffix}
      </span>
      {suffix && <span className={styles.variable}>{beforeSuffix + suffix}</span>}
    </span>
  )
  return (
    <span
      className={`arabic ${styles.layered} ${styles.segmented} ${className ?? ''}`}
      lang="ar"
      dir="rtl"
      aria-label={partsText(parts)}
    >
      {tail ? layer(true) : null}
      {layer(false)}
    </span>
  )
}
