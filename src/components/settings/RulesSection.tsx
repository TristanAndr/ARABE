import { PARTIAL_THRESHOLD } from '../../compare/compare'
import type { NormalizationOptions } from '../../compare/normalize'
import styles from './Settings.module.css'

interface Props {
  normalization: NormalizationOptions
  onChange: (n: NormalizationOptions) => void
}

const OPTIONS: { key: keyof NormalizationOptions; label: string; detail: string }[] = [
  {
    key: 'ignoreCase',
    label: 'Ignorer les majuscules',
    detail: 'Bismi = bismi. À désactiver si tes graphies personnalisées utilisent des majuscules (S pour ص, par exemple).',
  },
  {
    key: 'optionalInitialHamza',
    label: 'Hamza initiale facultative',
    detail:
      "Accepte aḥad pour ʾaḥad. Le coup de glotte en début de mot est prononcé, mais rarement écrit dans les translittérations usuelles.",
  },
  {
    key: 'acceptWaslEndings',
    label: 'Accepter la lecture sans pause',
    detail:
      'La référence est lue à la pause (r-raḥīm). Si cette option est active, la terminaison de liaison (r-raḥīmi) est aussi acceptée.',
  },
]

export function RulesSection({ normalization, onChange }: Props) {
  return (
    <section className={styles.section} aria-labelledby="rules-title">
      <h2 id="rules-title" className={styles.sectionTitle}>
        Règles de vérification
      </h2>
      <div className={styles.toggles}>
        {OPTIONS.map((o) => (
          <label key={o.key} className={styles.toggle}>
            <input
              type="checkbox"
              checked={normalization[o.key]}
              onChange={(e) => onChange({ ...normalization, [o.key]: e.target.checked })}
            />
            <span>
              <span className={styles.choiceLabel}>{o.label}</span>
              <span className={styles.choiceSummary}>{o.detail}</span>
            </span>
          </label>
        ))}
      </div>
      <div className={styles.prose}>
        <p>Toujours appliqué, quel que soit le profil :</p>
        <ul>
          <li>espaces, tirets et soulignés sont ignorés : bismillāh, bismi llāh et bismi-llāh sont équivalents ;</li>
          <li>les diacritiques saisis en caractères combinants sont recomposés (h + point souscrit = ḥ) ;</li>
          <li>
            une consonne doublée (šadda) s'écrit deux fois ; une voyelle longue doit être écrite longue. Ces écarts
            comptent comme des erreurs ;
          </li>
          <li>
            quand l'écriture uthmanie note une assimilation ou un abrègement propre à la récitation, la forme
            orthographique est aussi acceptée et le retour l'indique.
          </li>
        </ul>
        <p>
          Résultat : « juste » sans aucun écart, « presque » jusqu'à {Math.round(PARTIAL_THRESHOLD * 100)} % de sons
          en écart, « à reprendre » au-delà. Les durées de madd, la nasalisation (ġunna), l'iḫfāʾ et la qalqala ne
          sont pas notées dans les références et ne sont donc pas vérifiées.
        </p>
      </div>
    </section>
  )
}
