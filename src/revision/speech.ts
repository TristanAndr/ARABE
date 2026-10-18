/**
 * Prononciation des mots par la synthèse vocale du navigateur (voix arabe de l'appareil).
 */

import { useEffect, useState } from 'react'

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
}

function arabicVoice(): SpeechSynthesisVoice | undefined {
  return window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('ar'))
}

export function speakArabic(text: string): void {
  if (!speechSupported()) return
  const synth = window.speechSynthesis
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ar-SA'
  const voice = arabicVoice()
  if (voice) utterance.voice = voice
  utterance.rate = 0.8
  synth.speak(utterance)
}

export type SpeechState = 'indisponible' | 'sans-voix' | 'pret'

/** Les voix se chargent de façon asynchrone dans certains navigateurs. */
export function useSpeech(): SpeechState {
  const [state, setState] = useState<SpeechState>(() => current())
  useEffect(() => {
    if (!speechSupported()) return
    const synth = window.speechSynthesis
    const update = () => setState(current())
    update()
    synth.addEventListener?.('voiceschanged', update)
    return () => synth.removeEventListener?.('voiceschanged', update)
  }, [])
  return state
}

function current(): SpeechState {
  if (!speechSupported()) return 'indisponible'
  return arabicVoice() ? 'pret' : 'sans-voix'
}
