/**
 * Données de la version sans compte, restées dans le localStorage de ce navigateur.
 *
 * Règle : elles ne sont jamais fusionnées automatiquement avec un compte. Après connexion, on
 * propose de les importer (compte vide) ou de remplacer celles du compte (compte déjà utilisé).
 * Quel que soit le choix, elles sont ensuite archivées sous un autre nom, sans être effacées,
 * pour ne plus être proposées (ni à ce compte, ni à un autre compte ouvert sur ce navigateur).
 */
import { sanitizeRevisionPrefs, type RevisionPrefs } from '../revision/prefs'
import { sanitizeProgress, type Progress } from '../state/progress'
import { sanitizeSettings, type Settings } from '../state/settings'
import { browserStorage, type KeyValue } from './syncQueue'
import type { UserData } from './types'

const KEYS = {
  settings: 'qiraa.settings.v1',
  progress: 'qiraa.progress.v1',
  revision: 'qiraa.revision.v1',
} as const

export const ARCHIVE_PREFIX = 'qiraa.archive.'

export interface LegacyData {
  settings: Settings | null
  progress: Progress | null
  revision: RevisionPrefs | null
}

function parse<T>(storage: KeyValue, key: string, sanitize: (raw: unknown) => T | null): T | null {
  try {
    const raw = storage.get(key)
    return raw === null ? null : sanitize(JSON.parse(raw))
  } catch {
    return null
  }
}

export function readLegacy(storage: KeyValue = browserStorage): LegacyData | null {
  const data: LegacyData = {
    settings: parse(storage, KEYS.settings, sanitizeSettings),
    progress: parse(storage, KEYS.progress, sanitizeProgress),
    revision: parse(storage, KEYS.revision, sanitizeRevisionPrefs),
  }
  const meaningful = data.settings || data.revision || (data.progress && hasActivity(data.progress))
  return meaningful ? data : null
}

/** Une progression jamais utilisée (aucune phrase vérifiée) ne vaut pas la peine d'être importée. */
function hasActivity(p: Progress): boolean {
  return p.totals.validated > 0 || p.index > 0 || Object.keys(p.results).length > 0
}

/** Déplace les anciennes clés sous le préfixe d'archive (aucune donnée n'est effacée). */
export function archiveLegacy(storage: KeyValue = browserStorage): void {
  for (const key of Object.values(KEYS)) {
    const value = storage.get(key)
    if (value === null) continue
    storage.set(ARCHIVE_PREFIX + key, value)
    storage.remove(key)
  }
}

/** Le compte contient-il déjà des données ? */
export function accountHasData(d: UserData): boolean {
  return !!(d.settings || d.revision || d.progress || d.conjugationSessions.length)
}

export function summarizeLegacy(d: LegacyData): string {
  const parts: string[] = []
  if (d.progress) {
    const n = d.progress.totals.validated
    parts.push(`${n} phrase${n > 1 ? 's' : ''} vérifiée${n > 1 ? 's' : ''}`)
  }
  if (d.settings) parts.push('paramètres de translittération')
  if (d.revision) parts.push('préférences de révision')
  return parts.join(', ')
}
