import type { AlphabetProgress } from '../alphabet/progress'
import type { Verdict } from '../compare/compare'
import type { AnswerMethod, RevisionPrefs } from '../revision/prefs'
import type { QuizMode } from '../revision/quiz'
import type { Progress } from '../state/progress'
import type { Settings } from '../state/settings'

/** Sessions de conjugaison terminées, résumées pour l'affichage. */
export interface ConjugationSessionRecord {
  mode: QuizMode
  method: AnswerMethod
  correct: number
  total: number
  completedAt: string
}

/** Données personnelles d'un compte. `null` : jamais enregistré (nouveau compte). */
export interface UserData {
  settings: Settings | null
  revision: RevisionPrefs | null
  progress: Progress | null
  conjugationSessions: ConjugationSessionRecord[]
  alphabet: AlphabetProgress | null
  /**
   * false si la table alphabet_progress n'existe pas encore dans le projet Supabase (migration
   * non appliquée) : l'alphabet reste utilisable, son suivi n'est simplement pas enregistré.
   */
  alphabetSync: boolean
}

export interface ReadingAttempt {
  id: string
  exercise_id: string
  verdict: Verdict
  answer: string
}

export interface ConjugationAttempt {
  id: string
  mode: QuizMode
  prompt: string
  answer: string
  correct: boolean
}

export interface ConjugationSession {
  id: string
  mode: QuizMode
  method: AnswerMethod
  correct: number
  total: number
}

export interface InsertRows {
  reading_attempts: ReadingAttempt
  conjugation_attempts: ConjugationAttempt
  conjugation_sessions: ConjugationSession
}

export type InsertTable = keyof InsertRows

/** Accès distant aux données du compte connecté. Chaque méthode lève une erreur en cas d'échec. */
export interface RemoteStore {
  load(): Promise<UserData>
  saveSettings(s: Settings): Promise<void>
  saveRevision(p: RevisionPrefs): Promise<void>
  saveProgress(p: Progress): Promise<void>
  saveAlphabet(p: AlphabetProgress): Promise<void>
  /** Insertion idempotente : une ligne déjà présente (même id) est ignorée. */
  insert<T extends InsertTable>(table: T, rows: InsertRows[T][]): Promise<void>
}

/** Ce que l'interface utilise pour enregistrer : jamais d'erreur, l'envoi est garanti par la file. */
export interface AppStore {
  saveSettings(s: Settings): void
  saveRevision(p: RevisionPrefs): void
  saveProgress(p: Progress): void
  saveAlphabet(p: AlphabetProgress): void
  addReadingAttempt(a: Omit<ReadingAttempt, 'id'>): void
  addConjugationAttempt(a: Omit<ConjugationAttempt, 'id'>): void
  addConjugationSession(s: Omit<ConjugationSession, 'id'>): void
}

export type SyncStatus = 'saved' | 'saving' | 'pending'
