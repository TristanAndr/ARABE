import { useCallback, useEffect, useState } from 'react'
import { loadQuranText, type QuranText } from './text'

export type QuranTextState = { status: 'idle' | 'loading' | 'error'; text: null } | { status: 'ready'; text: QuranText }

/** Texte du Coran, chargé seulement quand `enabled` (une fois, puis gardé en mémoire). */
export function useQuranText(enabled: boolean) {
  const [state, setState] = useState<QuranTextState>({ status: 'idle', text: null })

  const load = useCallback(() => {
    setState({ status: 'loading', text: null })
    loadQuranText().then(
      (text) => setState({ status: 'ready', text }),
      () => setState({ status: 'error', text: null }),
    )
  }, [])

  useEffect(() => {
    if (enabled && state.status === 'idle') load()
  }, [enabled, state.status, load])

  return { ...state, retry: load }
}
