import { speakArabic } from '../../revision/speech'
import styles from './Vocabulary.module.css'

interface Props {
  text: string
  /** Nom accessible, ex. « Écouter تُفَّاحَةٌ ». */
  label: string
  large?: boolean
}

export function SpeakButton({ text, label, large }: Props) {
  return (
    <button
      type="button"
      className={`${styles.speak} ${large ? styles.speakLarge : ''}`}
      aria-label={label}
      title="Écouter"
      onClick={() => speakArabic(text)}
    >
      <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">
        <path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4Z" fill="currentColor" />
        <path
          d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}
