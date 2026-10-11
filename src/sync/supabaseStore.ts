import type { SupabaseClient } from '@supabase/supabase-js'
import type { RevisionPrefs } from '../revision/prefs'
import type { Progress } from '../state/progress'
import type { Settings } from '../state/settings'
import {
  progressFromRow,
  progressToRow,
  sessionFromRow,
  settingsFromRow,
  type ProgressRow,
  type SessionRow,
  type SettingsRow,
} from './rows'
import type { ConjugationSessionRecord, InsertRows, InsertTable, RemoteStore } from './types'

/** Nombre de sessions de conjugaison récentes chargées pour les statistiques. */
const SESSION_HISTORY = 200

function check<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message)
  return r.data
}

/**
 * Données du compte connecté dans Supabase. Le filtre user_id n'est qu'une optimisation :
 * c'est la RLS qui garantit qu'aucune autre ligne n'est accessible.
 */
export function createSupabaseStore(client: SupabaseClient, userId: string): RemoteStore {
  return {
    async load() {
      const [settings, progress, sessions] = await Promise.all([
        client.from('user_settings').select('settings, revision_prefs').eq('user_id', userId).maybeSingle(),
        client
          .from('reading_progress')
          .select('session_order, session_index, session_results, totals_validated, totals_correct')
          .eq('user_id', userId)
          .maybeSingle(),
        client
          .from('conjugation_sessions')
          .select('mode, method, correct, total, completed_at')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false })
          .limit(SESSION_HISTORY),
      ])
      const s = settingsFromRow(check(settings) as SettingsRow | null)
      return {
        settings: s.settings,
        revision: s.revision,
        progress: progressFromRow(check(progress) as ProgressRow | null),
        conjugationSessions: ((check(sessions) ?? []) as SessionRow[])
          .map(sessionFromRow)
          .filter((x): x is ConjugationSessionRecord => x !== null),
      }
    },

    async saveSettings(settings: Settings) {
      check(await client.from('user_settings').upsert({ user_id: userId, settings }, { onConflict: 'user_id' }))
    },

    async saveRevision(prefs: RevisionPrefs) {
      check(
        await client.from('user_settings').upsert({ user_id: userId, revision_prefs: prefs }, { onConflict: 'user_id' }),
      )
    },

    async saveProgress(p: Progress) {
      check(
        await client
          .from('reading_progress')
          .upsert({ user_id: userId, ...progressToRow(p) }, { onConflict: 'user_id' }),
      )
    },

    async insert<T extends InsertTable>(table: T, rows: InsertRows[T][]) {
      if (rows.length === 0) return
      check(
        await client
          .from(table)
          .upsert(
            rows.map((r) => ({ ...r, user_id: userId })),
            { onConflict: 'id', ignoreDuplicates: true },
          ),
      )
    },
  }
}
