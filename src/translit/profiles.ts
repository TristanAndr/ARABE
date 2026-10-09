import { PHONEMES, type Phoneme } from './phonemes'

/**
 * Un profil associe à chaque phonème une liste de graphies acceptées.
 * La première graphie est celle utilisée pour afficher la référence ;
 * les suivantes sont des variantes de saisie équivalentes.
 *
 * Deux phonèmes qui partagent une graphie ne sont plus distingués par la
 * validation : c'est un choix assumé du profil (voir `findConflicts`).
 */
export type Spellings = Record<Phoneme, string[]>

export type PresetId = 'simple' | 'precise'
export type ProfileId = PresetId | 'custom'

export interface Preset {
  id: PresetId
  label: string
  summary: string
  spellings: Spellings
}

function withIdentity(partial: Partial<Spellings>): Spellings {
  const out = {} as Spellings
  for (const p of PHONEMES) out[p] = partial[p] ?? [p]
  return out
}

/**
 * Translittération précise : proche de la norme DIN 31635 (un caractère par
 * son). Les digrammes anglo-saxons usuels (th, kh, sh…) restent acceptés
 * en saisie car ils ne créent aucune confusion avec un autre son du profil.
 */
const PRECISE = withIdentity({
  'ʾ': ['ʾ', '’', "'"],
  'ʿ': ['ʿ', '‘', '`'],
  'ṯ': ['ṯ', 'th'],
  'j': ['j', 'ǧ'],
  'ḫ': ['ḫ', 'kh', 'ḵ'],
  'ḏ': ['ḏ', 'dh'],
  'š': ['š', 'sh'],
  'ġ': ['ġ', 'gh'],
  'ā': ['ā', 'â'],
  'ī': ['ī', 'î'],
  'ū': ['ū', 'û'],
})

/**
 * Simplifié francophone : tout se tape sur un clavier AZERTY sans touche morte
 * exotique. Conventions empruntées à l'« arabizi » pour ʿ (3) et ḥ (7).
 * Ce n'est pas une norme : les emphatiques ṣ ḍ ṭ ẓ y sont volontairement
 * confondues avec s d t z, et ne sont donc pas vérifiées.
 */
const SIMPLE = withIdentity({
  'ʾ': ["'", '’', 'ʾ'],
  'ʿ': ['3', 'ʿ', '‘'],
  'ṯ': ['th', 'ṯ'],
  'j': ['j', 'dj'],
  'ḥ': ['7', 'ḥ'],
  'ḫ': ['kh', 'ḫ'],
  'ḏ': ['dh', 'ḏ'],
  'š': ['ch', 'sh', 'š'],
  'ṣ': ['s', 'ṣ'],
  'ḍ': ['d', 'ḍ'],
  'ṭ': ['t', 'ṭ'],
  'ẓ': ['z', 'ẓ'],
  'ġ': ['gh', 'ġ'],
  'u': ['u', 'ou'],
  'ā': ['aa', 'â', 'ā'],
  'ī': ['ii', 'î', 'ī'],
  'ū': ['uu', 'û', 'oû', 'ū'],
})

export const PRESETS: Record<PresetId, Preset> = {
  simple: {
    id: 'simple',
    label: 'Simplifié francophone',
    summary:
      "Saisie au clavier français, sans caractère spécial : 3 pour ع, 7 pour ح, ch pour ش, voyelles longues doublées (aa, ii, uu). Les emphatiques ص ض ط ظ s'écrivent comme s d t z et ne sont donc pas distinguées. Convention d'usage, pas une norme.",
    spellings: SIMPLE,
  },
  precise: {
    id: 'precise',
    label: 'Translittération précise',
    summary:
      'Un signe par son, proche de la norme DIN 31635 : ḥ ṣ ḍ ṭ ẓ, ʿ pour ع, ʾ pour la hamza, macron pour les voyelles longues (ā ī ū). Toutes les distinctions sont vérifiées.',
    spellings: PRECISE,
  },
}

export type Overrides = Partial<Record<Phoneme, string[]>>

export interface ProfileSettings {
  profileId: ProfileId
  customBase: PresetId
  overrides: Overrides
}

/** Graphies effectives du profil actif (préréglage ou personnalisé). */
export function resolveSpellings(settings: ProfileSettings): Spellings {
  if (settings.profileId !== 'custom') return PRESETS[settings.profileId].spellings
  const base = PRESETS[settings.customBase].spellings
  const out = {} as Spellings
  for (const p of PHONEMES) {
    const o = settings.overrides[p]
    out[p] = o && o.length > 0 ? o : base[p]
  }
  return out
}

/** Caractères réservés : séparateurs ignorés à la saisie et syntaxe de la liste. */
const FORBIDDEN = /[\s\-_,]/

/**
 * Transforme la saisie « a, â , ā » d'une cellule en liste de graphies.
 * Les entrées vides ou contenant un séparateur sont rejetées.
 */
export function parseSpellingList(text: string): { spellings: string[]; invalid: string[] } {
  const spellings: string[] = []
  const invalid: string[] = []
  for (const raw of text.split(',')) {
    const s = raw.trim().normalize('NFC')
    if (!s) continue
    if (FORBIDDEN.test(s)) invalid.push(s)
    else if (!spellings.includes(s)) spellings.push(s)
  }
  return { spellings, invalid }
}

export function formatSpellingList(spellings: string[]): string {
  return spellings.join(', ')
}

/**
 * Graphies partagées par plusieurs phonèmes. Ces sons ne seront pas
 * distingués par la validation ; l'interface le signale.
 */
export function findConflicts(spellings: Spellings, ignoreCase: boolean): Map<string, Phoneme[]> {
  const owners = new Map<string, Phoneme[]>()
  for (const p of PHONEMES) {
    for (const s of spellings[p]) {
      const key = ignoreCase ? s.toLowerCase() : s
      const list = owners.get(key) ?? []
      if (!list.includes(p)) list.push(p)
      owners.set(key, list)
    }
  }
  return new Map([...owners].filter(([, ps]) => ps.length > 1))
}
