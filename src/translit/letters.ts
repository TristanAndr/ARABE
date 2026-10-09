import type { Phoneme } from './phonemes'

/**
 * Lignes de la table de correspondance affichée dans les paramètres.
 *
 * `phoneme` relie une lettre ou un signe à un son de l'inventaire : c'est ce
 * son qui est configurable. Les signes sans son propre (alif, shadda, sukūn…)
 * ont `phoneme: null` et une règle explicative.
 */
export interface LetterRow {
  arabic: string
  name: string
  phoneme: Phoneme | null
  hint: string
}

export interface LetterGroup {
  title: string
  note?: string
  rows: LetterRow[]
}

export const LETTER_GROUPS: LetterGroup[] = [
  {
    title: 'Consonnes',
    note: "Les 28 lettres de l'alphabet, auxquelles s'ajoute la hamza. L'alif n'a pas de son consonantique propre.",
    rows: [
      { arabic: 'ء', name: 'hamza', phoneme: 'ʾ', hint: "Coup de glotte, comme l'attaque de « a » dans « ah ! ». En début de mot, il est souvent omis à l'écrit (réglable)." },
      { arabic: 'ا', name: 'alif', phoneme: null, hint: 'Support de la hamza, ou marque du ā long. Ne se prononce pas seul.' },
      { arabic: 'ب', name: 'bāʾ', phoneme: 'b', hint: '' },
      { arabic: 'ت', name: 'tāʾ', phoneme: 't', hint: '' },
      { arabic: 'ث', name: 'ṯāʾ', phoneme: 'ṯ', hint: 'Interdentale sourde, th anglais de « think ».' },
      { arabic: 'ج', name: 'jīm', phoneme: 'j', hint: 'dj de « djinn ».' },
      { arabic: 'ح', name: 'ḥāʾ', phoneme: 'ḥ', hint: 'h soufflé, gorge resserrée. Distinct de ه et de خ.' },
      { arabic: 'خ', name: 'ḫāʾ', phoneme: 'ḫ', hint: 'Raclement, comme la jota espagnole.' },
      { arabic: 'د', name: 'dāl', phoneme: 'd', hint: '' },
      { arabic: 'ذ', name: 'ḏāl', phoneme: 'ḏ', hint: 'Interdentale sonore, th anglais de « this ».' },
      { arabic: 'ر', name: 'rāʾ', phoneme: 'r', hint: 'r roulé.' },
      { arabic: 'ز', name: 'zāy', phoneme: 'z', hint: '' },
      { arabic: 'س', name: 'sīn', phoneme: 's', hint: 's, toujours sourd (jamais z).' },
      { arabic: 'ش', name: 'šīn', phoneme: 'š', hint: 'ch de « chat ».' },
      { arabic: 'ص', name: 'ṣād', phoneme: 'ṣ', hint: 's emphatique : langue abaissée, son plus sourd.' },
      { arabic: 'ض', name: 'ḍād', phoneme: 'ḍ', hint: 'd emphatique.' },
      { arabic: 'ط', name: 'ṭāʾ', phoneme: 'ṭ', hint: 't emphatique.' },
      { arabic: 'ظ', name: 'ẓāʾ', phoneme: 'ẓ', hint: 'Interdentale sonore emphatique.' },
      { arabic: 'ع', name: 'ʿayn', phoneme: 'ʿ', hint: 'Constriction du pharynx, sonore. Sans équivalent en français ; distinct de la hamza.' },
      { arabic: 'غ', name: 'ġayn', phoneme: 'ġ', hint: 'r grasseyé, proche du r parisien.' },
      { arabic: 'ف', name: 'fāʾ', phoneme: 'f', hint: '' },
      { arabic: 'ق', name: 'qāf', phoneme: 'q', hint: 'k articulé au fond de la gorge (luette).' },
      { arabic: 'ك', name: 'kāf', phoneme: 'k', hint: '' },
      { arabic: 'ل', name: 'lām', phoneme: 'l', hint: '' },
      { arabic: 'م', name: 'mīm', phoneme: 'm', hint: '' },
      { arabic: 'ن', name: 'nūn', phoneme: 'n', hint: '' },
      { arabic: 'ه', name: 'hāʾ', phoneme: 'h', hint: 'h expiré, toujours prononcé, même en fin de mot.' },
      { arabic: 'و', name: 'wāw', phoneme: 'w', hint: 'w consonne ; marque aussi le ū long.' },
      { arabic: 'ي', name: 'yāʾ', phoneme: 'y', hint: 'y consonne ; marque aussi le ī long.' },
    ],
  },
  {
    title: 'Voyelles',
    note: 'Brèves (signes au-dessus ou au-dessous de la lettre) et longues (lettre de prolongation). La durée est vérifiée.',
    rows: [
      { arabic: 'بَ', name: 'fatḥa', phoneme: 'a', hint: 'a bref.' },
      { arabic: 'بِ', name: 'kasra', phoneme: 'i', hint: 'i bref.' },
      { arabic: 'بُ', name: 'ḍamma', phoneme: 'u', hint: 'ou bref.' },
      { arabic: 'بَا', name: 'fatḥa + alif', phoneme: 'ā', hint: 'a long. Aussi : alif suscrit ـٰ et alif maqṣūra ى.' },
      { arabic: 'بِي', name: 'kasra + yāʾ', phoneme: 'ī', hint: 'i long.' },
      { arabic: 'بُو', name: 'ḍamma + wāw', phoneme: 'ū', hint: 'ou long.' },
    ],
  },
  {
    title: 'Signes',
    note: 'Ces signes ne correspondent pas à un son isolé : ils modifient la lecture. Leur traitement découle des graphies ci-dessus.',
    rows: [
      { arabic: 'بّ', name: 'šadda', phoneme: null, hint: 'Consonne doublée (gémination) : on écrit deux fois sa graphie, ex. rabbi. Son absence compte comme une erreur.' },
      { arabic: 'بْ', name: 'sukūn', phoneme: null, hint: "Absence de voyelle : rien n'est écrit après la consonne." },
      { arabic: 'بً بٍ بٌ', name: 'tanwīn', phoneme: null, hint: 'Voyelle brève suivie de n : an, in, un. À la pause, il tombe (sauf -an qui devient ā).' },
      { arabic: 'ٱ', name: 'alif waṣla', phoneme: null, hint: "Voyelle d'appui élidée dans la liaison : bismi llāhi. Prononcée seulement en début de lecture." },
      { arabic: 'ة', name: 'tāʾ marbūṭa', phoneme: null, hint: 'Se lit t en liaison, h à la pause.' },
      { arabic: 'ٓ', name: 'madda', phoneme: null, hint: 'Allongement prolongé ; la durée précise (madd) n\'est pas notée dans la transcription.' },
    ],
  },
]
