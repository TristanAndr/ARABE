import { useCallback, useRef, useState } from 'react'
import { isRecord } from '../storage/storage'
import type { QuizMode } from './quiz'

export type AnswerMethod = 'choix' | 'saisie'

export interface RevisionPrefs {
  mode: QuizMode
  method: AnswerMethod
}

export const DEFAULT_REVISION_PREFS: RevisionPrefs = { mode: 'verbe', method: 'choix' }

export function sanitizeRevisionPrefs(raw: unknown): RevisionPrefs | null {
  if (!isRecord(raw)) return null
  return {
    mode: raw.mode === 'pronom' || raw.mode === 'pronom-arabe' ? raw.mode : 'verbe',
    method: raw.method === 'saisie' ? 'saisie' : 'choix',
  }
}

/** Mode et façon de répondre retenus d'une visite à l'autre. */
export function useRevisionPrefs(initial: RevisionPrefs | null, onChange: (p: RevisionPrefs) => void) {
  const [prefs, setPrefs] = useState<RevisionPrefs>(() => initial ?? DEFAULT_REVISION_PREFS)
  const latest = useRef(prefs)
  const update = useCallback(
    (patch: Partial<RevisionPrefs>) => {
      const next = { ...latest.current, ...patch }
      latest.current = next
      setPrefs(next)
      onChange(next)
    },
    [onChange],
  )
  return { prefs, update }
}
