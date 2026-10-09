export interface NormalizationOptions {
  /** Ignorer la casse (B = b). Désactiver si un profil personnalisé utilise des majuscules. */
  ignoreCase: boolean
  /** Accepter l'omission de la hamza en début de mot (aḥad pour ʾaḥad), usage courant à l'écrit. */
  optionalInitialHamza: boolean
  /** Accepter les terminaisons de liaison en fin de segment (r-raḥīmi pour r-raḥīm). */
  acceptWaslEndings: boolean
}

export const DEFAULT_NORMALIZATION: NormalizationOptions = {
  ignoreCase: true,
  optionalInitialHamza: true,
  acceptWaslEndings: true,
}

/** Séparateurs : ignorés partout dans la saisie (bismillah = bismi llāh = bismi-llāh). */
export const SEPARATOR = /[\s\-_]/

const INVISIBLE = /[​-‏⁠﻿]/g

/**
 * Normalisation purement typographique de la saisie : forme Unicode composée
 * (h + point souscrit combinant = ḥ), caractères invisibles retirés, espaces
 * réduits, casse unifiée si demandé. Aucune lettre n'est remplacée par une
 * autre ici : les équivalences de prononciation relèvent du profil.
 */
export function normalizeAnswer(input: string, opts: Pick<NormalizationOptions, 'ignoreCase'>): string {
  let s = input.normalize('NFC').replace(INVISIBLE, '').replace(/\s+/g, ' ').trim()
  if (opts.ignoreCase) s = s.toLowerCase()
  return s
}

export function isBlank(input: string): boolean {
  return input.replace(INVISIBLE, '').trim() === ''
}
