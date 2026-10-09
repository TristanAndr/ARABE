/**
 * Vérification des réponses de l'exercice de conjugaison.
 *
 * Règles de comparaison d'une forme verbale saisie :
 * - la vocalisation complète est exigée : chaque voyelle et chaque soukoun comptent ;
 * - sont ignorés : espaces en trop, tatwīl (ـ), caractères invisibles (marques de direction,
 *   ZWJ/ZWNJ) et différences de composition Unicode (أ précomposé ou ا + hamza ; ordre des
 *   signes combinés), ce qui ne change rien à l'écrit ;
 * - si seules les voyelles diffèrent (mêmes lettres), la réponse reste fausse mais le retour
 *   le précise.
 *
 * Pour le pronom, toute forme de la fiche ayant exactement la même forme verbale est juste :
 * تَفْعَلُ vaut pour أَنْتَ comme pour هِيَ.
 */

import { formsForVerb, type ConjugatedForm } from './conjugation'

const INVISIBLE = /[​-‏‪-‮⁦-⁩⁠﻿]/g
const TATWEEL = /ـ/g
/** Voyelles brèves, tanwīn, šadda, soukoun, alif suscrit. */
const HARAKAT = /[ً-ْٰ]/g

export function normalizeArabic(input: string): string {
  return input.normalize('NFC').replace(INVISIBLE, '').replace(TATWEEL, '').replace(/\s+/g, ' ').trim()
}

export function stripVowels(input: string): string {
  return normalizeArabic(input).normalize('NFD').replace(HARAKAT, '').normalize('NFC')
}

export type VerbCheck = 'correct' | 'vowels' | 'wrong'

export function checkVerb(input: string, expected: string): VerbCheck {
  const given = normalizeArabic(input)
  if (given === normalizeArabic(expected)) return 'correct'
  if (given !== '' && stripVowels(given) === stripVowels(expected)) return 'vowels'
  return 'wrong'
}

export function checkPronoun(chosen: ConjugatedForm, verb: string): boolean {
  return formsForVerb(verb).some((f) => f.id === chosen.id)
}
