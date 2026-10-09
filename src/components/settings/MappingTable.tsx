import { LETTER_GROUPS } from '../../translit/letters'
import type { Phoneme } from '../../translit/phonemes'
import { PRESETS, type PresetId } from '../../translit/profiles'
import styles from './Settings.module.css'

interface Props {
  base: PresetId
  isCustom: boolean
  cells: Partial<Record<Phoneme, string>>
  invalid: Partial<Record<Phoneme, string[]>>
  onEdit: (p: Phoneme, text: string) => void
  conflicts: Map<string, Phoneme[]>
}

const LETTER_OF = new Map<Phoneme, string>()
for (const g of LETTER_GROUPS) for (const r of g.rows) if (r.phoneme && !LETTER_OF.has(r.phoneme)) LETTER_OF.set(r.phoneme, r.arabic)

export function MappingTable({ base, isCustom, cells, invalid, onEdit, conflicts }: Props) {
  const defaults = PRESETS[base].spellings

  return (
    <section className={styles.section} aria-labelledby="mapping-title">
      <h2 id="mapping-title" className={styles.sectionTitle}>
        Correspondances
      </h2>
      <p className={styles.sectionNote}>
        « Par défaut » montre les graphies du profil {isCustom ? 'de base' : 'actif'} : la première sert à afficher la
        référence, les suivantes sont acceptées à la saisie. Dans « Personnalisée », sépare plusieurs graphies par des
        virgules.{!isCustom && ' Modifier une case active le profil Personnalisé.'}
      </p>

      {LETTER_GROUPS.map((group) => (
        <div key={group.title} className={styles.group}>
          <h3 className={styles.groupTitle}>{group.title}</h3>
          {group.note && <p className={styles.groupNote}>{group.note}</p>}
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Lettre</th>
                <th scope="col">Par défaut</th>
                <th scope="col">Personnalisée</th>
                <th scope="col">Prononciation</th>
              </tr>
            </thead>
            <tbody>
              {group.rows.map((row) => {
                const p = row.phoneme
                const [first, ...alts] = p ? defaults[p] : []
                const bad = p ? invalid[p] : undefined
                return (
                  <tr key={row.arabic + row.name}>
                    <th scope="row" className={styles.letterCell}>
                      <span className={`arabic ${styles.letter}`} lang="ar" dir="rtl">
                        {row.arabic}
                      </span>
                      <span className={styles.letterName}>{row.name}</span>
                    </th>
                    <td className={styles.defaultCell}>
                      {p ? (
                        <>
                          <span className={styles.primarySpelling}>{first}</span>
                          {alts.length > 0 && <span className={styles.altSpelling}>{alts.join('  ')}</span>}
                        </>
                      ) : (
                        <span className={styles.none}>—</span>
                      )}
                    </td>
                    <td className={styles.customCell}>
                      {p ? (
                        <>
                          <input
                            type="text"
                            className={styles.cellInput}
                            value={cells[p] ?? ''}
                            placeholder={first}
                            onChange={(e) => onEdit(p, e.target.value)}
                            aria-label={`Graphie personnalisée pour ${row.name}`}
                            aria-invalid={bad ? true : undefined}
                            autoComplete="off"
                            spellCheck={false}
                          />
                          {bad && <span className={styles.cellError}>Refusé : {bad.join(', ')} (espace, tiret ou _)</span>}
                        </>
                      ) : (
                        <span className={styles.none}>—</span>
                      )}
                    </td>
                    <td className={styles.hintCell}>{row.hint}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}

      {conflicts.size > 0 && (
        <div className={styles.conflicts}>
          <h3 className={styles.groupTitle}>Sons non distingués par ce profil</h3>
          <ul>
            {[...conflicts].map(([spelling, phonemes]) => (
              <li key={spelling}>
                <span className={styles.primarySpelling}>{spelling}</span> sert pour{' '}
                {phonemes.map((ph, i) => (
                  <span key={ph}>
                    {i > 0 && ' et '}
                    <span className="arabic" lang="ar">{LETTER_OF.get(ph) ?? ph}</span>
                  </span>
                ))}
                {' '}: ces sons ne seront pas distingués à la vérification.
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
