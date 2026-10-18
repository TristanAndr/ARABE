import styles from './Revision.module.css'

interface Props<T extends string> {
  tabs: readonly (readonly [T, string])[]
  value: T
  onChange: (tab: T) => void
}

/** Onglets d'une page, comme ceux de l'alphabet : une seule partie affichée à la fois. */
export function PageTabs<T extends string>({ tabs, value, onChange }: Props<T>) {
  return (
    <div className={styles.tabs} role="group" aria-label="Affichage">
      {tabs.map(([t, label]) => (
        <button key={t} type="button" className={styles.tab} aria-pressed={value === t} onClick={() => onChange(t)}>
          {label}
        </button>
      ))}
    </div>
  )
}
