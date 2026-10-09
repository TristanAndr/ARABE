/**
 * Conversion entre l'état de l'application et les lignes PostgreSQL. Tout ce qui vient de la
 * base repasse par les mêmes fonctions de validation que l'ancien stockage local.
 */
import { sanitizeRevisionPrefs, type RevisionPrefs } from '../revision/prefs'
import { sanitizeProgress, type Progress } from '../state/progress'
import { sanitizeSettings, type Settings } from '../state/settings'
import type { ConjugationSessionRecord } from './types'

export interface SettingsRow {
  settings: unknown
  revision_prefs: unknown
}

export interface ProgressRow {
  session_order: string[]
  session_index: number
  session_results: Record<string, unknown>
  totals_validated: number
  totals_correct: number
}

export interface SessionRow {
  mode: string
  method: string
  correct: number
  total: number
  completed_at: string
}

export function progressToRow(p: Progress): ProgressRow {
  return {
    session_order: p.order,
    session_index: p.index,
    session_results: p.results,
    totals_validated: p.totals.validated,
    totals_correct: Math.min(p.totals.correct, p.totals.validated),
  }
}

export function progressFromRow(row: ProgressRow | null): Progress | null {
  if (!row) return null
  return sanitizeProgress({
    order: row.session_order,
    index: row.session_index,
    results: row.session_results,
    totals: { validated: row.totals_validated, correct: row.totals_correct },
  })
}

export function settingsFromRow(row: SettingsRow | null): { settings: Settings | null; revision: RevisionPrefs | null } {
  return {
    settings: row?.settings ? sanitizeSettings(row.settings) : null,
    revision: row?.revision_prefs ? sanitizeRevisionPrefs(row.revision_prefs) : null,
  }
}

export function sessionFromRow(row: SessionRow): ConjugationSessionRecord | null {
  if (row.mode !== 'verbe' && row.mode !== 'pronom') return null
  return {
    mode: row.mode,
    method: row.method === 'saisie' ? 'saisie' : 'choix',
    correct: row.correct,
    total: row.total,
    completedAt: row.completed_at,
  }
}
