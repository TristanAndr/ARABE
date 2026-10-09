import { useMemo, useState } from 'react'
import { AccountView } from './components/AccountView'
import { ExerciseView } from './components/ExerciseView'
import { Header, type View } from './components/Header'
import { RevisionView } from './components/revision/RevisionView'
import { SessionEnd } from './components/SessionEnd'
import { SettingsView } from './components/settings/SettingsView'
import { EXERCISES } from './data/corpus'
import { useProgress } from './state/progress'
import { useSettings } from './state/settings'
import { useRevisionPrefs } from './revision/prefs'
import type { AppStore, ConjugationSessionRecord, SyncStatus, UserData } from './sync/types'
import { resolveSpellings } from './translit/profiles'
import styles from './App.module.css'

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]))

export interface AccountInfo {
  email: string
  onSignOut: () => Promise<void>
  onChangePassword: (password: string) => Promise<string | null>
}

interface Props {
  /** Données du compte connecté, déjà chargées. */
  initial: UserData
  /** Enregistrement des modifications (file d'envoi vers le compte). */
  store: AppStore
  account: AccountInfo
  syncStatus?: SyncStatus
}

type Section = 'exercise' | 'revision'

export function App({ initial, store, account, syncStatus = 'saved' }: Props) {
  const savers = useMemo(
    () => ({
      settings: store.saveSettings.bind(store),
      progress: store.saveProgress.bind(store),
      revision: store.saveRevision.bind(store),
    }),
    [store],
  )
  const { settings, save } = useSettings(initial.settings, savers.settings)
  const progress = useProgress(initial.progress, settings.order, savers.progress)
  const revision = useRevisionPrefs(initial.revision, savers.revision)
  const [sessions, setSessions] = useState<ConjugationSessionRecord[]>(initial.conjugationSessions)
  const [view, setView] = useState<View>('exercise')
  // Section à retrouver en quittant les paramètres ou le compte.
  const [section, setSection] = useState<Section>('exercise')
  const spellings = useMemo(() => resolveSpellings(settings), [settings])

  const { order, index } = progress.progress
  const exercise = index < order.length ? BY_ID.get(order[index]!) : undefined
  const backLabel = section === 'revision' ? 'Retour à la révision' : "Retour à l'exercice"

  return (
    <div className={styles.shell}>
      <Header
        position={exercise ? index + 1 : null}
        total={order.length}
        view={view}
        syncStatus={syncStatus}
        onNavigate={(next) => {
          if (next === 'exercise' || next === 'revision') setSection(next)
          setView(next)
        }}
      />
      <main className={styles.main}>
        {view === 'settings' ? (
          <SettingsView
            settings={settings}
            onSave={save}
            onClose={() => setView(section)}
            closeLabel={backLabel}
            progress={progress.progress}
            onRestart={progress.restart}
            onResetStats={progress.resetAll}
          />
        ) : view === 'account' ? (
          <AccountView account={account} syncStatus={syncStatus} onClose={() => setView(section)} closeLabel={backLabel} />
        ) : view === 'revision' ? (
          <RevisionView
            prefs={revision.prefs}
            onPrefs={revision.update}
            sessions={sessions}
            onAttempt={(a) => store.addConjugationAttempt(a)}
            onSessionComplete={(s) => {
              store.addConjugationSession(s)
              setSessions((list) => [{ ...s, completedAt: new Date().toISOString() }, ...list])
            }}
          />
        ) : exercise ? (
          <ExerciseView
            key={`${exercise.id}#${index}`}
            exercise={exercise}
            spellings={spellings}
            normalization={settings.normalization}
            progress={progress.progress}
            onChecked={(verdict, answer) => {
              progress.record(exercise.id, verdict)
              store.addReadingAttempt({ exercise_id: exercise.id, verdict, answer })
            }}
            onNext={progress.next}
          />
        ) : (
          <SessionEnd progress={progress.progress} onRestart={progress.restart} />
        )}
      </main>
    </div>
  )
}
