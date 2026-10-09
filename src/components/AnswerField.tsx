import { useMemo, useRef, type KeyboardEvent } from 'react'
import { PHONEMES } from '../translit/phonemes'
import type { Spellings } from '../translit/profiles'
import styles from './AnswerField.module.css'

interface Props {
  value: string
  onChange: (v: string) => void
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  spellings: Spellings
  stale: boolean
}

/** Caractères hors clavier utilisés par les graphies principales du profil actif. */
function specialCharacters(spellings: Spellings): string[] {
  const chars = new Set<string>()
  for (const p of PHONEMES) {
    for (const ch of spellings[p][0] ?? '') if (ch.codePointAt(0)! > 0x7e) chars.add(ch)
  }
  return [...chars]
}

export function AnswerField({ value, onChange, onKeyDown, spellings, stale }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const specials = useMemo(() => specialCharacters(spellings), [spellings])

  function insert(ch: string) {
    const el = input.current
    if (!el) return
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    onChange(value.slice(0, start) + ch + value.slice(end))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + ch.length, start + ch.length)
    })
  }

  return (
    <div className={styles.field}>
      <label htmlFor="answer" className={styles.label}>
        Transcription
      </label>
      <input
        ref={input}
        id="answer"
        className={styles.input}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Saisis la prononciation en alphabet latin…"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        lang="ar-Latn"
        autoFocus
      />
      {specials.length > 0 && (
        <div className={styles.palette} role="group" aria-label="Insérer un caractère">
          {specials.map((ch) => (
            <button
              key={ch}
              type="button"
              className={styles.char}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(ch)}
              title={`Insérer ${ch}`}
            >
              {ch}
            </button>
          ))}
        </div>
      )}
      {stale && <p className={styles.stale}>Réponse modifiée — Entrée pour vérifier à nouveau.</p>}
    </div>
  )
}
