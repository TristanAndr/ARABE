import { useMemo, useRef, useState } from 'react'
import { AlphabetView } from './components/alphabet/AlphabetView'
import { VerseNav } from './components/training/VerseNav'
import trainingStyles from './components/training/Training.module.css'
import { next, type Position } from './quran/navigation'
import { verseItem } from './quran/practice'
import { useQuranText } from './quran/useQuranText'
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

type Section = 'exercise' | 'revision' | 'alphabet'

const BACK_LABELS: Record<Section, string> = {
  exercise: "Retour à l'exercice",
  revision: 'Retour à la révision',
  alphabet: "Retour à l'alphabet",
}

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
  const sessionExercise = index < order.length ? BY_ID.get(order[index]!) : undefined

  // Entraînement verset par verset : texte chargé à la demande, exercice construit sur le verset.
  const verse = settings.trainingVerse
  const quran = useQuranText(verse !== null)
  const verseExercise = useMemo(
    () => (verse && quran.status === 'ready' ? verseItem(quran.text, verse) : undefined),
    [verse, quran],
  )
  const exercise = verse ? verseExercise : sessionExercise

  // Dernière position demandée : des clics rapides avancent bien d'autant de versets.
  const latestVerse = useRef<Position | null>(verse)
  latestVerse.current = verse
  const latestSettings = useRef(settings)
  latestSettings.current = settings
  const goVerse = (p: Position | null) => {
    latestVerse.current = p
    latestSettings.current = { ...latestSettings.current, trainingVerse: p }
    save(latestSettings.current)
  }
  // Verset de référence pour la barre : celui de l'exercice affiché (ou, en fin de série, le dernier).
  const shown = sessionExercise ?? BY_ID.get(order[order.length - 1] ?? '')
  const position: Position | null = verse ?? (shown ? { surah: shown.surah, ayah: shown.ayah } : null)
  const stepVerse = (move: (p: Position) => Position | null) => {
    const from = latestVerse.current ?? position
    const to = from && move(from)
    if (to) goVerse(to)
  }
  const toolbar = position && (
    <VerseNav
      position={position}
      verseMode={verse !== null}
      onGo={goVerse}
      onStep={stepVerse}
      onExit={() => goVerse(null)}
    />
  )
  const backLabel = BACK_LABELS[section]

  return (
    <div className={styles.shell}>
      <Header
        position={sessionExercise && !verse ? index + 1 : null}
        total={order.length}
        view={view}
        syncStatus={syncStatus}
        onNavigate={(next) => {
          if (next === 'exercise' || next === 'revision' || next === 'alphabet') setSection(next)
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
        ) : view === 'alphabet' ? (
          <AlphabetView spellings={spellings} />
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
        ) : verse && !exercise ? (
          <article>
            {toolbar}
            {quran.status === 'error' ? (
              <div className={trainingStyles.state} role="alert">
                <p>Le texte du Coran n’a pas pu être chargé. Vérifie ta connexion internet.</p>
                <button type="button" className="btn btn-secondary" onClick={quran.retry}>
                  Réessayer
                </button>
              </div>
            ) : (
              <p className={trainingStyles.state} role="status">
                Chargement du verset…
              </p>
            )}
          </article>
        ) : exercise ? (
          <ExerciseView
            key={verse ? `verset:${exercise.id}` : `${exercise.id}#${index}`}
            exercise={exercise}
            spellings={spellings}
            normalization={settings.normalization}
            progress={progress.progress}
            onChecked={(verdict, answer) => {
              progress.record(exercise.id, verdict)
              store.addReadingAttempt({ exercise_id: exercise.id, verdict, answer })
            }}
            onNext={verse ? () => stepVerse(next) : progress.next}
            nextLabel={verse ? 'Verset suivant' : 'Phrase suivante'}
            canNext={verse ? next(verse) !== null : true}
            toolbar={toolbar}
          />
        ) : (
          <>
            <div className={trainingStyles.endBar}>{toolbar}</div>
            <SessionEnd progress={progress.progress} onRestart={progress.restart} />
          </>
        )}
      </main>
    </div>
  )
}
