import type { RevisionPrefs } from '../../revision/prefs'
import type { ConjugationAttempt, ConjugationSession, ConjugationSessionRecord } from '../../sync/types'
import { ConjugationSheet } from './ConjugationSheet'
import { Practice } from './Practice'

interface Props {
  prefs: RevisionPrefs
  onPrefs: (patch: Partial<RevisionPrefs>) => void
  sessions: ConjugationSessionRecord[]
  onAttempt: (a: Omit<ConjugationAttempt, 'id'>) => void
  onSessionComplete: (s: Omit<ConjugationSession, 'id'>) => void
}

export function RevisionView(props: Props) {
  return (
    <>
      <ConjugationSheet />
      <Practice {...props} />
    </>
  )
}
