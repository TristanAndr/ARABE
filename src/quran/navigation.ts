import { SURAH_LIST, SURAHS } from '../data/surahs'

export interface Position {
  surah: number
  ayah: number
}

export const FIRST: Position = { surah: 1, ayah: 1 }

export function isValid(p: Position): boolean {
  const s = SURAHS[p.surah]
  return !!s && Number.isInteger(p.ayah) && p.ayah >= 1 && p.ayah <= s.ayahs
}

/** Verset précédent dans la sourate ; null au premier verset (on ne remonte pas à la sourate précédente). */
export function previous(p: Position): Position | null {
  return p.ayah > 1 ? { surah: p.surah, ayah: p.ayah - 1 } : null
}

/** Verset suivant ; au dernier verset, premier verset de la sourate suivante ; null à la fin du Coran. */
export function next(p: Position): Position | null {
  if (p.ayah < SURAHS[p.surah]!.ayahs) return { surah: p.surah, ayah: p.ayah + 1 }
  if (p.surah < SURAH_LIST.length) return { surah: p.surah + 1, ayah: 1 }
  return null
}

/** Position enregistrée, validée (sourate ou verset hors limites : début du Coran). */
export function sanitizePosition(raw: unknown): Position | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { surah, ayah } = raw as Record<string, unknown>
  const p = { surah: Number(surah), ayah: Number(ayah) }
  return isValid(p) ? p : null
}
