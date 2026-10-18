/**
 * Fiches de vocabulaire : les fruits et les couleurs.
 *
 * Chaque mot est entièrement vocalisé, cité à l'indéfini comme dans un manuel. Pour les couleurs,
 * le masculin sert aux exercices et le féminin est donné à côté sur la fiche.
 */

export interface VocabWord {
  id: string
  ar: string
  fr: string
  /** Forme féminine (adjectifs de couleur). */
  arFem?: string
  /** Précision affichée sous la traduction. */
  note?: string
}

export interface VocabCategory {
  id: 'fruits' | 'couleurs'
  title: string
  titleAr: string
  intro: string
  /** Libellés des colonnes de la fiche quand le mot a deux formes. */
  columns?: { main: string; fem: string }
  words: readonly VocabWord[]
}

export const FRUITS: VocabCategory = {
  id: 'fruits',
  title: 'Les fruits',
  titleAr: 'الفَوَاكِهُ',
  intro:
    'Beaucoup de noms de fruits sont des collectifs (« des pommes », le fruit en général) ; on obtient « un fruit » en ajoutant un ة : تُفَّاحٌ → تُفَّاحَةٌ.',
  words: [
    { id: 'pomme', ar: 'تُفَّاحَةٌ', fr: 'une pomme' },
    { id: 'banane', ar: 'مَوْزَةٌ', fr: 'une banane' },
    { id: 'orange', ar: 'بُرْتُقَالَةٌ', fr: 'une orange' },
    { id: 'raisin', ar: 'عِنَبٌ', fr: 'du raisin', note: 'collectif' },
    { id: 'fraise', ar: 'فَرَاوِلَةٌ', fr: 'une fraise' },
    { id: 'citron', ar: 'لَيْمُونَةٌ', fr: 'un citron' },
    { id: 'pasteque', ar: 'بِطِّيخَةٌ', fr: 'une pastèque' },
    { id: 'peche', ar: 'خَوْخَةٌ', fr: 'une pêche' },
    { id: 'poire', ar: 'كُمَّثْرَى', fr: 'une poire' },
    { id: 'datte', ar: 'تَمْرَةٌ', fr: 'une datte' },
    { id: 'figue', ar: 'تِينَةٌ', fr: 'une figue' },
    { id: 'grenade', ar: 'رُمَّانَةٌ', fr: 'une grenade' },
    { id: 'abricot', ar: 'مِشْمِشَةٌ', fr: 'un abricot' },
    { id: 'cerise', ar: 'كَرَزَةٌ', fr: 'une cerise' },
  ],
}

export const COLORS: VocabCategory = {
  id: 'couleurs',
  title: 'Les couleurs',
  titleAr: 'الأَلْوَانُ',
  intro:
    'Les couleurs de base suivent le schème أَفْعَلُ au masculin et فَعْلَاءُ au féminin. Les autres se forment sur un nom avec ـِيٌّ, et ـِيَّةٌ au féminin.',
  columns: { main: 'Masculin', fem: 'Féminin' },
  words: [
    { id: 'rouge', ar: 'أَحْمَرُ', arFem: 'حَمْرَاءُ', fr: 'rouge' },
    { id: 'bleu', ar: 'أَزْرَقُ', arFem: 'زَرْقَاءُ', fr: 'bleu' },
    { id: 'vert', ar: 'أَخْضَرُ', arFem: 'خَضْرَاءُ', fr: 'vert' },
    { id: 'jaune', ar: 'أَصْفَرُ', arFem: 'صَفْرَاءُ', fr: 'jaune' },
    { id: 'blanc', ar: 'أَبْيَضُ', arFem: 'بَيْضَاءُ', fr: 'blanc' },
    { id: 'noir', ar: 'أَسْوَدُ', arFem: 'سَوْدَاءُ', fr: 'noir' },
    { id: 'marron', ar: 'بُنِّيٌّ', arFem: 'بُنِّيَّةٌ', fr: 'marron', note: 'de بُنٌّ, le café' },
    { id: 'orange', ar: 'بُرْتُقَالِيٌّ', arFem: 'بُرْتُقَالِيَّةٌ', fr: 'orange', note: 'de بُرْتُقَالٌ, l’orange' },
    { id: 'rose', ar: 'وَرْدِيٌّ', arFem: 'وَرْدِيَّةٌ', fr: 'rose', note: 'de وَرْدٌ, les roses' },
    { id: 'gris', ar: 'رَمَادِيٌّ', arFem: 'رَمَادِيَّةٌ', fr: 'gris', note: 'de رَمَادٌ, la cendre' },
    { id: 'violet', ar: 'بَنَفْسَجِيٌّ', arFem: 'بَنَفْسَجِيَّةٌ', fr: 'violet', note: 'de بَنَفْسَجٌ, la violette' },
  ],
}

export const VOCAB_CATEGORIES = [FRUITS, COLORS] as const
