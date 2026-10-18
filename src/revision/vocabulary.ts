/**
 * Fiches de vocabulaire : les fruits et les couleurs.
 *
 * Chaque mot est entièrement vocalisé, cité à l'indéfini comme dans un manuel. Pour les couleurs,
 * le masculin sert aux exercices et le féminin est donné à côté ; pour les fruits, le pluriel.
 */

export interface VocabWord {
  id: string
  ar: string
  fr: string
  /** Deuxième forme, nommée par `columns.second` : féminin des couleurs, pluriel des fruits. */
  ar2?: string
  /** Précision affichée sous la traduction. */
  note?: string
}

export interface VocabCategory {
  id: 'fruits' | 'couleurs'
  title: string
  titleAr: string
  intro: string
  /** Libellés des colonnes de la fiche : chaque mot a une deuxième forme. */
  columns?: { main: string; second: string }
  words: readonly VocabWord[]
}

export const FRUITS: VocabCategory = {
  id: 'fruits',
  title: 'Les fruits',
  titleAr: 'الفَوَاكِهُ',
  intro:
    'Beaucoup de noms de fruits sont des collectifs (« des pommes », le fruit en général) ; on obtient « un fruit » en ajoutant un ة : تُفَّاحٌ → تُفَّاحَةٌ. Ce nom d’unité fait son pluriel en ـَاتٌ : تُفَّاحَاتٌ, « des pommes » (qu’on peut compter).',
  columns: { main: 'Singulier', second: 'Pluriel' },
  words: [
    { id: 'pomme', ar: 'تُفَّاحَةٌ', ar2: 'تُفَّاحَاتٌ', fr: 'une pomme' },
    { id: 'banane', ar: 'مَوْزَةٌ', ar2: 'مَوْزَاتٌ', fr: 'une banane' },
    { id: 'orange', ar: 'بُرْتُقَالَةٌ', ar2: 'بُرْتُقَالَاتٌ', fr: 'une orange' },
    { id: 'raisin', ar: 'عِنَبٌ', ar2: 'أَعْنَابٌ', fr: 'du raisin', note: 'collectif ; le pluriel désigne des variétés de raisin ou des vignes' },
    { id: 'fraise', ar: 'فَرَاوِلَةٌ', ar2: 'فَرَاوِلَاتٌ', fr: 'une fraise' },
    { id: 'citron', ar: 'لَيْمُونَةٌ', ar2: 'لَيْمُونَاتٌ', fr: 'un citron' },
    { id: 'pasteque', ar: 'بِطِّيخَةٌ', ar2: 'بِطِّيخَاتٌ', fr: 'une pastèque' },
    { id: 'peche', ar: 'خَوْخَةٌ', ar2: 'خَوْخَاتٌ', fr: 'une pêche' },
    { id: 'poire', ar: 'كُمَّثْرَى', ar2: 'كُمَّثْرَيَاتٌ', fr: 'une poire' },
    { id: 'datte', ar: 'تَمْرَةٌ', ar2: 'تَمَرَاتٌ', fr: 'une datte', note: 'autre pluriel courant : تُمُورٌ' },
    { id: 'figue', ar: 'تِينَةٌ', ar2: 'تِينَاتٌ', fr: 'une figue' },
    { id: 'grenade', ar: 'رُمَّانَةٌ', ar2: 'رُمَّانَاتٌ', fr: 'une grenade' },
    { id: 'abricot', ar: 'مِشْمِشَةٌ', ar2: 'مِشْمِشَاتٌ', fr: 'un abricot' },
    { id: 'cerise', ar: 'كَرَزَةٌ', ar2: 'كَرَزَاتٌ', fr: 'une cerise' },
    { id: 'ananas', ar: 'أَنَانَاسٌ', ar2: 'أَنَانَاسَاتٌ', fr: 'un ananas' },
    { id: 'melon', ar: 'شَمَّامَةٌ', ar2: 'شَمَّامَاتٌ', fr: 'un melon' },
    { id: 'kiwi', ar: 'كِيوِي', ar2: 'كِيوِي', fr: 'un kiwi', note: 'mot d’emprunt, invariable' },
    { id: 'mangue', ar: 'مَانْجُو', ar2: 'مَانْجُو', fr: 'une mangue', note: 'mot d’emprunt, invariable' },
    { id: 'framboise', ar: 'حَبَّةُ تُوتِ العُلَّيْقِ', ar2: 'تُوتُ العُلَّيْقِ', fr: 'une framboise', note: 'mot à mot « un grain de framboises »' },
  ],
}

export const COLORS: VocabCategory = {
  id: 'couleurs',
  title: 'Les couleurs',
  titleAr: 'الأَلْوَانُ',
  intro:
    'Les couleurs de base suivent le schème أَفْعَلُ au masculin et فَعْلَاءُ au féminin. Les autres se forment sur un nom avec ـِيٌّ, et ـِيَّةٌ au féminin.',
  columns: { main: 'Masculin', second: 'Féminin' },
  words: [
    { id: 'rouge', ar: 'أَحْمَرُ', ar2: 'حَمْرَاءُ', fr: 'rouge' },
    { id: 'bleu', ar: 'أَزْرَقُ', ar2: 'زَرْقَاءُ', fr: 'bleu' },
    { id: 'vert', ar: 'أَخْضَرُ', ar2: 'خَضْرَاءُ', fr: 'vert' },
    { id: 'jaune', ar: 'أَصْفَرُ', ar2: 'صَفْرَاءُ', fr: 'jaune' },
    { id: 'blanc', ar: 'أَبْيَضُ', ar2: 'بَيْضَاءُ', fr: 'blanc' },
    { id: 'noir', ar: 'أَسْوَدُ', ar2: 'سَوْدَاءُ', fr: 'noir' },
    { id: 'marron', ar: 'بُنِّيٌّ', ar2: 'بُنِّيَّةٌ', fr: 'marron', note: 'de بُنٌّ, le café' },
    { id: 'orange', ar: 'بُرْتُقَالِيٌّ', ar2: 'بُرْتُقَالِيَّةٌ', fr: 'orange', note: 'de بُرْتُقَالٌ, l’orange' },
    { id: 'rose', ar: 'وَرْدِيٌّ', ar2: 'وَرْدِيَّةٌ', fr: 'rose', note: 'de وَرْدٌ, les roses' },
    { id: 'gris', ar: 'رَمَادِيٌّ', ar2: 'رَمَادِيَّةٌ', fr: 'gris', note: 'de رَمَادٌ, la cendre' },
    { id: 'violet', ar: 'بَنَفْسَجِيٌّ', ar2: 'بَنَفْسَجِيَّةٌ', fr: 'violet', note: 'de بَنَفْسَجٌ, la violette' },
    { id: 'argente', ar: 'فِضِّيٌّ', ar2: 'فِضِّيَّةٌ', fr: 'argenté', note: 'de فِضَّةٌ, l’argent (le métal)' },
    { id: 'dore', ar: 'ذَهَبِيٌّ', ar2: 'ذَهَبِيَّةٌ', fr: 'doré', note: 'de ذَهَبٌ, l’or' },
  ],
}

export const VOCAB_CATEGORIES = [FRUITS, COLORS] as const
