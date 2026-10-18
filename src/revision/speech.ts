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

const FATHATAN = '\u064B'
/** Voyelles brèves et tanwīn qui tombent à la pause ; la šadda et le soukoun restent. */
const PAUSE_DROPPED = /[\u064B-\u0650]/

/**
 * Forme de pause (الوَقْف) : un mot dit seul, ou en fin d'énoncé, perd sa voyelle finale et son
 * tanwīn (مِشْمِشٌ se dit « mishmish », تُفَّاحَتَانِ « tuffāḥatān »), sauf ـًا qui se dit « -ā »
 * (شُكْرًا → « shukrā »). Seul le dernier mot est concerné : حَبَّةُ فَرَاوِلَةٍ → « ḥabbatu farāwila ».
 */
export function pausalForm(text: string): string {
  const s = text.normalize('NFC').trimEnd()
  if (s.endsWith(FATHATAN + 'ا')) return s.slice(0, -2) + '\u064Eا'
  if (s.endsWith('ا' + FATHATAN)) return s.slice(0, -2) + '\u064Eا'
  let end = s.length
  let kept = ''
  while (end > 0 && /[\u064B-\u0652]/.test(s[end - 1]!)) {
    const mark = s[end - 1]!
    if (!PAUSE_DROPPED.test(mark)) kept = mark + kept
    end--
  }
  return s.slice(0, end) + kept
}

/** Prononce un mot ou une expression tels qu'on les dit seuls (forme de pause). */
export function speakArabic(text: string): void {
  if (!speechSupported()) return
  const synth = window.speechSynthesis
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(pausalForm(text))
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
