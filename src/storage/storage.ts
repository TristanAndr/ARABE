/**
 * Persistance locale (localStorage). Les données ne quittent jamais le
 * navigateur. Toute lecture est défensive : une valeur absente, corrompue ou
 * d'un ancien format est remplacée par la valeur par défaut.
 */

const PREFIX = 'qiraa.'

export function loadJSON<T>(key: string, fallback: T, sanitize: (raw: unknown) => T | null): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return sanitize(JSON.parse(raw)) ?? fallback
  } catch {
    return fallback
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Stockage indisponible (navigation privée, quota) : l'application reste utilisable.
  }
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
