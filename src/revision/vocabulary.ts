/**
 * Fiches de vocabulaire : les fruits et les couleurs.
 *
 * Mots repris du support de cours « Fawakih » (arabe littéraire, entièrement
 * vocalisé, tanwīn compris). Le mot principal (`ar`) sert aux exercices ; les autres formes sont
 * données à côté sur la fiche : pour les fruits l'unité et le duel, pour les couleurs le féminin.
 */

export interface VocabWord {
  id: string
  ar: string
  fr: string
  /** Formes suivantes, dans l'ordre de `columns` (après la première colonne). */
  others?: readonly string[]
  /** Précision affichée sous la traduction. */
  note?: string
}

export interface VocabCategory {
  id: 'fruits' | 'couleurs'
  title: string
  titleAr: string
  intro: string
  /** Libellés des colonnes arabes de la fiche, mot principal compris. */
  columns: readonly string[]
  words: readonly VocabWord[]
}

const word = (id: string, fr: string, ar: string, others: string[], note?: string): VocabWord => ({
  id,
  fr,
  ar,
  others,
  ...(note ? { note } : {}),
})

export const FRUITS: VocabCategory = {
  id: 'fruits',
  title: 'Les fruits',
  titleAr: 'فَوَاكِهُ',
  intro:
    'Le mot de base est un collectif : il désigne l’espèce ou les fruits en général (« la pomme, des pommes ») et il est masculin singulier. On ajoute ـَةٌ pour désigner un seul fruit, qui devient féminin : تُفَّاحٌ → تُفَّاحَةٌ. Pour exactement deux fruits, le ة s’ouvre en ت suivi du duel ـَتَانِ : تُفَّاحَتَانِ.',
  columns: ['Collectif', 'Un fruit', 'Deux fruits'],
  words: [
    word('pomme', 'pomme', 'تُفَّاحٌ', ['تُفَّاحَةٌ', 'تُفَّاحَتَانِ']),
    word('banane', 'banane', 'مَوْزٌ', ['مَوْزَةٌ', 'مَوْزَتَانِ']),
    word('orange', 'orange', 'بُرْتُقَالٌ', ['بُرْتُقَالَةٌ', 'بُرْتُقَالَتَانِ']),
    word('raisin', 'raisin', 'عِنَبٌ', ['عِنَبَةٌ', 'عِنَبَتَانِ'], 'un grain de raisin : عِنَبَةٌ ou, très couramment, حَبَّةُ عِنَبٍ'),
    word('datte', 'datte', 'تَمْرٌ', ['تَمْرَةٌ', 'تَمْرَتَانِ']),
    word('grenade', 'grenade', 'رُمَّانٌ', ['رُمَّانَةٌ', 'رُمَّانَتَانِ']),
    word('pasteque', 'pastèque', 'بِطِّيخٌ', ['بِطِّيخَةٌ', 'بِطِّيخَتَانِ']),
    word('citron', 'citron', 'لَيْمُونٌ', ['لَيْمُونَةٌ', 'لَيْمُونَتَانِ']),
    word('figue', 'figue', 'تِينٌ', ['تِينَةٌ', 'تِينَتَانِ']),
    word('peche', 'pêche', 'خَوْخٌ', ['خَوْخَةٌ', 'خَوْخَتَانِ']),
    word('cerise', 'cerise', 'كَرَزٌ', ['كَرَزَةٌ', 'كَرَزَتَانِ']),
    word(
      'fraise',
      'fraise',
      'فَرَاوِلَةٌ',
      ['حَبَّةُ فَرَاوِلَةٍ', 'حَبَّتَا فَرَاوِلَةٍ'],
      'emprunt déjà terminé par ـَةٌ : pour « une fraise », on dit حَبَّةُ, « un grain de »',
    ),
    word('poire', 'poire', 'كُمَّثْرَى', ['كُمَّثْرَاةٌ', 'كُمَّثْرَاتَانِ'], 'au Levant, on dit aussi إِجَّاصٌ'),
    word('framboise', 'framboise', 'تُوتٌ', ['تُوتَةٌ', 'تُوتَتَانِ'], 'تُوتٌ désigne les baies (framboise, mûre) ; la framboise précisément : تُوتُ العُلَّيْقِ'),
    word('kiwi', 'kiwi', 'كِيوِي', ['حَبَّةُ كِيوِي', 'حَبَّتَا كِيوِي'], 'emprunt invariable : l’unité se forme avec حَبَّةُ'),
    word('mangue', 'mangue', 'مَانْجُو', ['حَبَّةُ مَانْجُو', 'حَبَّتَا مَانْجُو'], 'emprunt invariable : l’unité se forme avec حَبَّةُ'),
    word('ananas', 'ananas', 'أَنَانَاسٌ', ['أَنَانَاسَةٌ', 'أَنَانَاسَتَانِ']),
    word('abricot', 'abricot', 'مِشْمِشٌ', ['مِشْمِشَةٌ', 'مِشْمِشَتَانِ']),
    word('melon', 'melon', 'شَمَّامٌ', ['شَمَّامَةٌ', 'شَمَّامَتَانِ']),
  ],
}

export const COLORS: VocabCategory = {
  id: 'couleurs',
  title: 'Les couleurs',
  titleAr: 'أَلْوَانٌ',
  intro:
    'Les couleurs de base suivent le schème أَفْعَلُ au masculin et فَعْلَاءُ au féminin. Les autres se forment sur un nom avec le suffixe nisba ـِيٌّ, et ـِيَّةٌ au féminin.',
  columns: ['Masculin', 'Féminin'],
  words: [
    word('rouge', 'rouge', 'أَحْمَرُ', ['حَمْرَاءُ']),
    word('bleu', 'bleu', 'أَزْرَقُ', ['زَرْقَاءُ']),
    word('vert', 'vert', 'أَخْضَرُ', ['خَضْرَاءُ']),
    word('jaune', 'jaune', 'أَصْفَرُ', ['صَفْرَاءُ']),
    word('blanc', 'blanc', 'أَبْيَضُ', ['بَيْضَاءُ']),
    word('noir', 'noir', 'أَسْوَدُ', ['سَوْدَاءُ']),
    word('marron', 'marron', 'بُنِّيٌّ', ['بُنِّيَّةٌ'], 'de بُنٌّ, le café'),
    word('orange', 'orange', 'بُرْتُقَالِيٌّ', ['بُرْتُقَالِيَّةٌ'], 'de بُرْتُقَالٌ, l’orange'),
    word('rose', 'rose', 'وَرْدِيٌّ', ['وَرْدِيَّةٌ'], 'de وَرْدٌ, les roses'),
    word('gris', 'gris', 'رَمَادِيٌّ', ['رَمَادِيَّةٌ'], 'de رَمَادٌ, la cendre'),
    word('violet', 'violet', 'بَنَفْسَجِيٌّ', ['بَنَفْسَجِيَّةٌ'], 'de بَنَفْسَجٌ, la violette'),
    word('argente', 'argenté', 'فِضِّيٌّ', ['فِضِّيَّةٌ'], 'de فِضَّةٌ, l’argent (le métal)'),
    word('dore', 'doré', 'ذَهَبِيٌّ', ['ذَهَبِيَّةٌ'], 'de ذَهَبٌ, l’or'),
  ],
}

export const VOCAB_CATEGORIES = [FRUITS, COLORS] as const
