/**
 * Fiches de vocabulaire : les fruits, les légumes et les couleurs.
 *
 * Mots repris des supports de cours « Fawakih » et « Khudar » (arabe littéraire, entièrement
 * vocalisé, tanwīn compris). Le mot principal (`ar`) sert aux exercices ; les autres formes sont
 * données à côté sur la fiche : pour les fruits et les légumes l'unité et le duel, pour les couleurs
 * le féminin.
 */

export interface VocabWord {
  id: string
  ar: string
  fr: string
  /** Formes suivantes, dans l'ordre de `columns` (après la première colonne). */
  others?: readonly string[]
  /** Précision affichée sous la traduction. */
  note?: string
  /** Illustration à côté du français ; absente quand Unicode n'a pas d'emoji pour le fruit. */
  emoji?: string
  /** Couleur du mot français : celle du fruit, ou la couleur elle-même (sauf blanc et noir). */
  tint?: string
}

/**
 * Mot découpé pour le mémo : la partie qui varie (préfixe, terminaison) est colorée. `tail` est la
 * voyelle de la terminaison posée sur la dernière lettre du radical (le ـَ de تُفَّاحَةٌ).
 */
export interface WordParts {
  prefix?: string
  stem: string
  tail?: string
  suffix?: string
}

export const partsText = (p: WordParts): string => (p.prefix ?? '') + p.stem + (p.tail ?? '') + (p.suffix ?? '')

export interface ThemeGuide {
  /** Formes successives d'un mot exemple, avec leur rôle. */
  steps: readonly { label: string; parts: WordParts }[]
  tips: readonly string[]
}

export interface VocabCategory {
  id: 'fruits' | 'legumes' | 'couleurs'
  title: string
  titleAr: string
  /** Mémo du thème : les formes d'un mot exemple, puis deux ou trois rappels courts. */
  guide: ThemeGuide
  /** Libellés des colonnes arabes de la fiche, mot principal compris. */
  columns: readonly string[]
  words: readonly VocabWord[]
}

const word = (
  id: string,
  fr: string,
  emoji: string,
  tint: string,
  ar: string,
  others: string[],
  note?: string,
): VocabWord => ({
  id,
  fr,
  ar,
  others,
  ...(tint ? { tint } : {}),
  ...(emoji ? { emoji } : {}),
  ...(note ? { note } : {}),
})

export const FRUITS: VocabCategory = {
  id: 'fruits',
  title: 'Les fruits',
  titleAr: 'فَوَاكِهُ',
  guide: {
    steps: [
      { label: 'Le fruit en général', parts: { stem: 'تُفَّاحٌ' } },
      { label: 'Un fruit : + ـَةٌ', parts: { stem: 'تُفَّاح', tail: 'َ', suffix: 'ةٌ' } },
      { label: 'Deux fruits : + ـَتَانِ', parts: { stem: 'تُفَّاح', tail: 'َ', suffix: 'تَانِ' } },
    ],
    tips: [
      'Le collectif est masculin, l’unité féminine.',
      'Mots empruntés (kiwi, mangue) : on compte avec حَبَّةُ, « un grain ».',
    ],
  },
  columns: ['Collectif', 'Un fruit', 'Deux fruits'],
  words: [
    word('pomme', 'pomme', '🍎', '#d62828', 'تُفَّاحٌ', ['تُفَّاحَةٌ', 'تُفَّاحَتَانِ']),
    word('banane', 'banane', '🍌', '#c99700', 'مَوْزٌ', ['مَوْزَةٌ', 'مَوْزَتَانِ']),
    word('orange', 'orange', '🍊', '#e8710a', 'بُرْتُقَالٌ', ['بُرْتُقَالَةٌ', 'بُرْتُقَالَتَانِ']),
    word('raisin', 'raisin', '🍇', '#7b2d8e', 'عِنَبٌ', ['عِنَبَةٌ', 'عِنَبَتَانِ'], 'un grain de raisin : عِنَبَةٌ ou, très couramment, حَبَّةُ عِنَبٍ'),
    word('datte', 'datte', '🌴', '#8b5a2b', 'تَمْرٌ', ['تَمْرَةٌ', 'تَمْرَتَانِ']),
    word('grenade', 'grenade', '', '#b3122e', 'رُمَّانٌ', ['رُمَّانَةٌ', 'رُمَّانَتَانِ']),
    word('pasteque', 'pastèque', '🍉', '#e03a4e', 'بِطِّيخٌ', ['بِطِّيخَةٌ', 'بِطِّيخَتَانِ']),
    word('citron', 'citron', '🍋', '#b8a200', 'لَيْمُونٌ', ['لَيْمُونَةٌ', 'لَيْمُونَتَانِ']),
    word('figue', 'figue', '', '#6b2f7a', 'تِينٌ', ['تِينَةٌ', 'تِينَتَانِ']),
    word('peche', 'pêche', '🍑', '#e8794f', 'خَوْخٌ', ['خَوْخَةٌ', 'خَوْخَتَانِ']),
    word('cerise', 'cerise', '🍒', '#c1121f', 'كَرَزٌ', ['كَرَزَةٌ', 'كَرَزَتَانِ']),
    word(
      'fraise',
      'fraise',
      '🍓',
      '#e5383b',
      'فَرَاوِلَةٌ',
      ['حَبَّةُ فَرَاوِلَةٍ', 'حَبَّتَا فَرَاوِلَةٍ'],
      'emprunt déjà terminé par ـَةٌ : pour « une fraise », on dit حَبَّةُ, « un grain de »',
    ),
    word('poire', 'poire', '🍐', '#7fa310', 'كُمَّثْرَى', ['كُمَّثْرَاةٌ', 'كُمَّثْرَاتَانِ'], 'au Levant, on dit aussi إِجَّاصٌ'),
    word('framboise', 'framboise', '🫐', '#d6336c', 'تُوتٌ', ['تُوتَةٌ', 'تُوتَتَانِ'], 'تُوتٌ désigne les baies (framboise, mûre) ; la framboise précisément : تُوتُ العُلَّيْقِ'),
    word('kiwi', 'kiwi', '🥝', '#5f9420', 'كِيوِي', ['حَبَّةُ كِيوِي', 'حَبَّتَا كِيوِي'], 'emprunt invariable : l’unité se forme avec حَبَّةُ'),
    word('mangue', 'mangue', '🥭', '#ef9000', 'مَانْجُو', ['حَبَّةُ مَانْجُو', 'حَبَّتَا مَانْجُو'], 'emprunt invariable : l’unité se forme avec حَبَّةُ'),
    word('ananas', 'ananas', '🍍', '#c99000', 'أَنَانَاسٌ', ['أَنَانَاسَةٌ', 'أَنَانَاسَتَانِ']),
    word('abricot', 'abricot', '', '#ee8a2a', 'مِشْمِشٌ', ['مِشْمِشَةٌ', 'مِشْمِشَتَانِ']),
    word('melon', 'melon', '🍈', '#74a032', 'شَمَّامٌ', ['شَمَّامَةٌ', 'شَمَّامَتَانِ']),
  ],
}

export const VEGETABLES: VocabCategory = {
  id: 'legumes',
  title: 'Les légumes',
  titleAr: 'خُضَارٌ',
  guide: {
    steps: [
      { label: 'Le légume en général', parts: { stem: 'جَزَرٌ' } },
      { label: 'Un légume : + ـَةٌ', parts: { stem: 'جَزَر', tail: 'َ', suffix: 'ةٌ' } },
      { label: 'Deux légumes : + ـَتَانِ', parts: { stem: 'جَزَر', tail: 'َ', suffix: 'تَانِ' } },
    ],
    tips: [
      'Sinon, un mot de mesure : حَبَّةُ une pièce · فَصُّ une gousse · رَأْسُ une tête · وَرَقَةُ une feuille.',
      'Au duel, ce mot perd son ن : حَبَّتَا طَمَاطِمَ.',
    ],
  },
  columns: ['Collectif', 'Un légume', 'Deux légumes'],
  words: [
    word('carotte', 'carotte', '🥕', '#e8710a', 'جَزَرٌ', ['جَزَرَةٌ', 'جَزَرَتَانِ']),
    word('concombre', 'concombre', '🥒', '#2b8a3e', 'خِيَارٌ', ['خِيَارَةٌ', 'خِيَارَتَانِ'], '« un concombre », خِيَارَةٌ, est féminin : خِيَارَةٌ خَضْرَاءُ'),
    word('oignon', 'oignon', '🧅', '#c98a00', 'بَصَلٌ', ['بَصَلَةٌ', 'بَصَلَتَانِ']),
    word('aubergine', 'aubergine', '🍆', '#6a2c91', 'بَاذِنْجَانٌ', ['بَاذِنْجَانَةٌ', 'بَاذِنْجَانَتَانِ'], 'de بَاذِنْجَان, passé par le catalan albergínia : « aubergine »'),
    word('laitue', 'laitue', '🥬', '#2f9e44', 'خَسٌّ', ['خَسَّةٌ', 'خَسَّتَانِ'], 'une salade entière : خَسَّةٌ ou رَأْسُ خَسٍّ'),
    word('poivron', 'poivron', '🫑', '#d62828', 'فُلْفُلٌ', ['فُلْفُلَةٌ', 'فُلْفُلَتَانِ'], 'un poivron : فُلْفُلَةٌ ou حَبَّةُ فُلْفُلٍ ; le piment fort : فُلْفُلٌ حَارٌّ'),
    word('radis', 'radis', '', '#d6336c', 'فُجْلٌ', ['فُجْلَةٌ', 'فُجْلَتَانِ']),
    word('citrouille', 'citrouille', '🎃', '#e8590c', 'يَقْطِينٌ', ['يَقْطِينَةٌ', 'يَقْطِينَتَانِ'], 'dans l’usage courant, aussi قَرْعٌ'),
    word('champignon', 'champignon', '🍄', '#8b5a2b', 'فُطْرٌ', ['فُطْرَةٌ', 'فُطْرَتَانِ'], 'un champignon : فُطْرَةٌ ou حَبَّةُ فُطْرٍ'),
    word('olive', 'olive', '🫒', '#5c7f1a', 'زَيْتُونٌ', ['زَيْتُونَةٌ', 'زَيْتُونَتَانِ'], 'même racine que زَيْتٌ, l’huile ; une olive : زَيْتُونَةٌ ou حَبَّةُ زَيْتُونٍ'),
    word('navet', 'navet', '', '#8e44ad', 'لِفْتٌ', ['لِفْتَةٌ', 'لِفْتَتَانِ'], 'un navet : لِفْتَةٌ ou حَبَّةُ لِفْتٍ'),
    word('betterave', 'betterave', '', '#9d174d', 'شَمَنْدَرٌ', ['شَمَنْدَرَةٌ', 'شَمَنْدَرَتَانِ'], 'aussi بَنْجَرٌ en Égypte et بَارْبَا au Maghreb'),
    word('tomate', 'tomate', '🍅', '#e03131', 'طَمَاطِمُ', ['حَبَّةُ طَمَاطِمَ', 'حَبَّتَا طَمَاطِمَ'], 'diptote, sans tanwīn : حَبَّةُ طَمَاطِمَ ; au Levant, بَنْدُورَةٌ'),
    word('patate', 'pomme de terre', '🥔', '#b8860b', 'بَطَاطِسُ', ['حَبَّةُ بَطَاطِسَ', 'حَبَّتَا بَطَاطِسَ'], 'même schème que طَمَاطِمُ ; aussi بَطَاطَا au Levant et au Maghreb'),
    word('ail', 'ail', '🧄', '#868e96', 'ثُومٌ', ['فَصُّ ثُومٍ', 'فَصَّا ثُومٍ'], 'une gousse : فَصُّ ثُومٍ ; une tête entière : رَأْسُ ثُومٍ'),
    word('courgette', 'courgette', '', '#2b7a3a', 'كُوسَا', ['حَبَّةُ كُوسَا', 'حَبَّتَا كُوسَا'], 'invariable (parfois كُوسَى) : l’unité se forme avec حَبَّةُ'),
    word('petitspois', 'petits pois', '🫛', '#5f9420', 'بَازِلَّاءُ', ['حَبَّةُ بَازِلَّاءَ', 'حَبَّتَا بَازِلَّاءَ'], 'aussi بَسِلَّةٌ en Égypte'),
    word('epinard', 'épinard', '', '#2b8a3e', 'سَبَانِخُ', ['وَرَقَةُ سَبَانِخَ', 'وَرَقَتَا سَبَانِخَ'], 'une feuille : وَرَقَةُ سَبَانِخَ ; du persan, puis de l’espagnol espinaca : « épinard »'),
    word('chou', 'chou', '', '#3b9b4a', 'مَلْفُوفٌ', ['رَأْسُ مَلْفُوفٍ', 'رَأْسَا مَلْفُوفٍ'], '« enroulé sur lui-même » (racine ل ف ف) ; aussi كُرُنْبٌ ; se compte par tête'),
    word('choufleur', 'chou-fleur', '', '#7c8794', 'قَرْنَبِيطٌ', ['رَأْسُ قَرْنَبِيطٍ', 'رَأْسَا قَرْنَبِيطٍ'], 'se compte par tête ; au Levant, aussi زَهْرَةٌ'),
    word('brocoli', 'brocoli', '🥦', '#2b8a3e', 'بْرُوكُولِي', ['رَأْسُ بْرُوكُولِي', 'رَأْسَا بْرُوكُولِي'], 'emprunt invariable : se compte par tête'),
    word('endive', 'endive', '', '#b89a00', 'هِنْدِبَاءُ', ['وَرَقَةُ هِنْدِبَاءَ', 'وَرَقَتَا هِنْدِبَاءَ'], 'par feuille, ou par tête : رَأْسُ هِنْدِبَاءَ'),
    word('mais', 'maïs', '🌽', '#d4a900', 'ذُرَةٌ', ['حَبَّةُ ذُرَةٍ', 'حَبَّتَا ذُرَةٍ'], 'ذُرَةٌ finit déjà par ـَةٌ : il est féminin (ذُرَةٌ صَفْرَاءُ) ; un épi : كُوزُ ذُرَةٍ'),
    word('celeri', 'céleri', '', '#6a9e1f', 'كَرَفْسٌ', ['وَرَقَةُ كَرَفْسٍ', 'وَرَقَتَا كَرَفْسٍ'], 'une tige : عُودُ كَرَفْسٍ'),
  ],
}

export const COLORS: VocabCategory = {
  id: 'couleurs',
  title: 'Les couleurs',
  titleAr: 'أَلْوَانٌ',
  guide: {
    steps: [
      { label: 'Masculin : أَـ', parts: { prefix: 'أَ', stem: 'حْمَرُ' } },
      { label: 'Féminin : ـَاءُ', parts: { stem: 'حَمْر', tail: 'َ', suffix: 'اءُ' } },
    ],
    tips: [
      'Couleurs de base : أَفْعَلُ au masculin, فَعْلَاءُ au féminin.',
      'Les autres viennent d’un nom + ـِيٌّ : بُنٌّ, le café → بُنِّيٌّ, marron.',
    ],
  },
  columns: ['Masculin', 'Féminin'],
  words: [
    word('rouge', 'rouge', '❤️', '#d62828', 'أَحْمَرُ', ['حَمْرَاءُ']),
    word('bleu', 'bleu', '💙', '#1f6fd6', 'أَزْرَقُ', ['زَرْقَاءُ']),
    word('vert', 'vert', '💚', '#2b9348', 'أَخْضَرُ', ['خَضْرَاءُ']),
    word('jaune', 'jaune', '💛', '#d4a900', 'أَصْفَرُ', ['صَفْرَاءُ']),
    word('blanc', 'blanc', '🤍', '', 'أَبْيَضُ', ['بَيْضَاءُ']),
    word('noir', 'noir', '🖤', '', 'أَسْوَدُ', ['سَوْدَاءُ']),
    word('marron', 'marron', '🤎', '#8b5a2b', 'بُنِّيٌّ', ['بُنِّيَّةٌ'], 'de بُنٌّ, le café'),
    word('orange', 'orange', '🧡', '#e8710a', 'بُرْتُقَالِيٌّ', ['بُرْتُقَالِيَّةٌ'], 'de بُرْتُقَالٌ, l’orange'),
    word('rose', 'rose', '🩷', '#e0569a', 'وَرْدِيٌّ', ['وَرْدِيَّةٌ'], 'de وَرْدٌ, les roses'),
    word('gris', 'gris', '🩶', '#868e96', 'رَمَادِيٌّ', ['رَمَادِيَّةٌ'], 'de رَمَادٌ, la cendre'),
    word('violet', 'violet', '💜', '#7b3fbf', 'بَنَفْسَجِيٌّ', ['بَنَفْسَجِيَّةٌ'], 'de بَنَفْسَجٌ, la violette'),
    word('argente', 'argenté', '🥈', '#98a2ab', 'فِضِّيٌّ', ['فِضِّيَّةٌ'], 'de فِضَّةٌ, l’argent (le métal)'),
    word('dore', 'doré', '🥇', '#c49a1b', 'ذَهَبِيٌّ', ['ذَهَبِيَّةٌ'], 'de ذَهَبٌ, l’or'),
  ],
}

export const VOCAB_CATEGORIES = [FRUITS, VEGETABLES, COLORS] as const
