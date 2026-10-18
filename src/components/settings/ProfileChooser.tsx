import { PRESETS, type PresetId, type ProfileId } from '../../translit/profiles'
import styles from './Settings.module.css'

interface Props {
  profileId: ProfileId
  customBase: PresetId
  onProfile: (id: ProfileId) => void
  onBase: (id: PresetId) => void
}

const OPTIONS: { id: ProfileId; label: string; summary: string }[] = [
  ...Object.values(PRESETS).map(({ id, label, summary }) => ({ id, label, summary })),
  {
    id: 'custom',
    label: 'Personnalisé',
    summary:
      'Tes propres graphies, saisies dans la colonne « Personnalisée » ci-dessous. Les sons laissés vides reprennent ceux du profil de base.',
  },
]

export function ProfileChooser({ profileId, customBase, onProfile, onBase }: Props) {
  return (
    <section className={styles.section} aria-labelledby="profile-title">
      <h2 id="profile-title" className={styles.sectionTitle}>
        Profil de translittération
      </h2>
      <div className={styles.choices} role="radiogroup" aria-labelledby="profile-title">
        {OPTIONS.map((o) => (
          <label key={o.id} className={styles.choice} data-checked={profileId === o.id}>
            <input
              type="radio"
              name="profile"
              value={o.id}
              checked={profileId === o.id}
              onChange={() => onProfile(o.id)}
            />
            <span className={styles.choiceBody}>
              <span className={styles.choiceLabel}>{o.label}</span>
              {o.id === 'custom' && profileId === 'custom' && (
                <span className={styles.baseRow}>
                  Profil de base
                  <select value={customBase} onChange={(e) => onBase(e.target.value as PresetId)}>
                    {Object.values(PRESETS).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </section>
  )
}
