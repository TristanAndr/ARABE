import { useEffect, useMemo, useRef, useState } from 'react'
import type { SurahInfo } from '../../data/surahs'
import { searchSurahs } from '../../quran/search'
import styles from './Training.module.css'

interface Props {
  current: SurahInfo
  onPick: (surah: number) => void
}

/** Choix de la sourate : ligne compacte qui s'ouvre sur une liste filtrable des 114 sourates. */
export function SurahPicker({ current, onPick }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchSurahs(query), [query])
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLOListElement>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    input.current?.focus()
    list.current?.querySelector('[aria-current="true"]')?.scrollIntoView?.({ block: 'center' })
  }, [open])

  function pick(n: number) {
    setOpen(false)
    onPick(n)
  }

  return (
    <div className={styles.picker}>
      <button
        type="button"
        className={styles.current}
        aria-expanded={open}
        aria-controls="surah-panel"
        aria-label={`Sourate : ${current.number}, ${current.name}. Changer de sourate`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.number}>{current.number}</span>
        <span className={styles.currentName}>{current.name}</span>
        <span className={`arabic ${styles.currentAr}`} lang="ar" dir="rtl">
          {current.arabic}
        </span>
        <span className={styles.chevron} aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>

      {open && (
        <div id="surah-panel" className={styles.panel}>
          <label className={styles.searchLabel} htmlFor="surah-search">
            Rechercher une sourate
          </label>
          <input
            ref={input}
            id="surah-search"
            className={styles.search}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (results[0]) pick(results[0].number)
              }
              if (e.key === 'Escape') setOpen(false)
            }}
            placeholder="Nom, nom arabe ou numéro…"
            autoComplete="off"
            spellCheck={false}
          />
          <p className={styles.count} aria-live="polite">
            {results.length === 114 ? '114 sourates' : `${results.length} résultat${results.length > 1 ? 's' : ''}`}
          </p>
          <ol ref={list} className={styles.list} aria-label="Sourates">
            {results.map((s) => (
              <li key={s.number}>
                <button
                  type="button"
                  className={styles.item}
                  aria-current={s.number === current.number ? 'true' : undefined}
                  onClick={() => pick(s.number)}
                >
                  <span className={styles.number}>{s.number}</span>
                  <span className={styles.itemNames}>
                    <span className={styles.itemName}>{s.name}</span>
                    <span className={styles.itemFr}>
                      {s.french} · {s.ayahs} versets
                    </span>
                  </span>
                  <span className={`arabic ${styles.itemAr}`} lang="ar" dir="rtl">
                    {s.arabic}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
