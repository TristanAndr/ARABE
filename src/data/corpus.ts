/**
 * Corpus d'exercices.
 *
 * Texte arabe : Tanzil Quran Text (Uthmani, version 1.1), © 2007-2026 Tanzil
 * Project, CC BY 3.0, https://tanzil.net. Chaque champ `arabic` est une copie
 * verbatim des mots `words` (bornes incluses, à partir de 1) du verset, tel
 * qu'il figure dans `data/tanzil/quran-uthmani.txt` ; un test le vérifie.
 * Le fichier Tanzil préfixe la basmala au verset 1 des sourates (sauf 1 et 9) :
 * elle n'est pas comptée dans `words`.
 *
 * Lectures de référence (`reading`) : établies à la main pour la lecture de
 * Ḥafṣ ʿan ʿĀṣim, segment lu à la pause (waqf), puis recoupées avec la
 * translittération anglaise de Tanzil (en.transliteration). Format décrit
 * dans `src/translit/reference.ts`. Elles notent les phonèmes (consonnes,
 * voyelles, durée, gémination, élision de l'alif waṣla, assimilations écrites
 * par la šadda) mais pas les durées de madd, la ġunna, l'iḫfāʾ ni la qalqala.
 */

export interface Exercise {
  /** Identifiant stable : « sourate:verset » ou « sourate:verset:début-fin ». */
  id: string
  surah: number
  ayah: number
  words: [number, number]
  arabic: string
  reading: string
  notes?: string[]
}

export const CORPUS_SOURCE = {
  name: 'Tanzil Quran Text',
  edition: 'Uthmani, version 1.1',
  license: 'Creative Commons Attribution 3.0 (copie verbatim uniquement)',
  url: 'https://tanzil.net',
} as const

export const EXERCISES: Exercise[] = [
  {
    id: "1:1",
    surah: 1,
    ayah: 1,
    words: [1, 4],
    arabic: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
    reading: "bismi llāhi r-raḥmāni r-raḥīm[i]",
  },
  {
    id: "1:2",
    surah: 1,
    ayah: 2,
    words: [1, 4],
    arabic: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ",
    reading: "ʾal-ḥamdu li-llāhi rabbi l-ʿālamīn[a]",
  },
  {
    id: "1:3",
    surah: 1,
    ayah: 3,
    words: [1, 2],
    arabic: "ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
    reading: "ʾar-raḥmāni r-raḥīm[i]",
  },
  {
    id: "1:4",
    surah: 1,
    ayah: 4,
    words: [1, 3],
    arabic: "مَـٰلِكِ يَوْمِ ٱلدِّينِ",
    reading: "māliki yawmi d-dīn[i]",
    notes: ["Lecture de Ḥafṣ : māliki, avec ā long (alif suscrit)."],
  },
  {
    id: "1:5",
    surah: 1,
    ayah: 5,
    words: [1, 4],
    arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    reading: "ʾiyyāka naʿbudu wa-ʾiyyāka nastaʿīn[u]",
  },
  {
    id: "1:6",
    surah: 1,
    ayah: 6,
    words: [1, 3],
    arabic: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ",
    reading: "ʾihdin{a|ā} ṣ-ṣirāṭa l-mustaqīm[a]",
    notes: ["Dans la liaison, une voyelle longue suivie d'une consonne sans voyelle s'abrège à l'oral (ihdina ṣ-ṣirāṭa). La forme longue, conforme à l'écrit, est acceptée."],
  },
  {
    id: "1:7:1-4",
    surah: 1,
    ayah: 7,
    words: [1, 4],
    arabic: "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ",
    reading: "ṣirāṭa llaḏīna ʾanʿamta ʿalayhim",
    notes: ["Segment : début du verset."],
  },
  {
    id: "1:7:5-9",
    surah: 1,
    ayah: 7,
    words: [5, 9],
    arabic: "غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ",
    reading: "ġayri l-maġḍūbi ʿalayhim wa-l{a|ā} ḍ-ḍāllīn[a]",
    notes: ["Segment : fin du verset.", "Dans la liaison, une voyelle longue suivie d'une consonne sans voyelle s'abrège à l'oral (wa-la ḍ-ḍāllīn). La forme longue, conforme à l'écrit, est acceptée."],
  },
  {
    id: "103:1",
    surah: 103,
    ayah: 1,
    words: [1, 1],
    arabic: "وَٱلْعَصْرِ",
    reading: "wa-l-ʿaṣr[i]",
  },
  {
    id: "103:2",
    surah: 103,
    ayah: 2,
    words: [1, 4],
    arabic: "إِنَّ ٱلْإِنسَـٰنَ لَفِى خُسْرٍ",
    reading: "ʾinna l-ʾinsāna la-fī ḫusr[in]",
  },
  {
    id: "103:3:1-5",
    surah: 103,
    ayah: 3,
    words: [1, 5],
    arabic: "إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّـٰلِحَـٰتِ",
    reading: "ʾill{a|ā} llaḏīna ʾāmanū wa-ʿamil{u|ū} ṣ-ṣāliḥāt[i]",
    notes: ["Segment : début du verset.", "Dans la liaison, une voyelle longue suivie d'une consonne sans voyelle s'abrège à l'oral (ʾilla llaḏīna, ʿamilu ṣ-ṣāliḥāt). La forme longue, conforme à l'écrit, est acceptée."],
  },
  {
    id: "103:3:6-9",
    surah: 103,
    ayah: 3,
    words: [6, 9],
    arabic: "وَتَوَاصَوْا۟ بِٱلْحَقِّ وَتَوَاصَوْا۟ بِٱلصَّبْرِ",
    reading: "wa-tawāṣaw bi-l-ḥaqqi wa-tawāṣaw bi-ṣ-ṣabr[i]",
    notes: ["Segment : fin du verset."],
  },
  {
    id: "108:1",
    surah: 108,
    ayah: 1,
    words: [1, 3],
    arabic: "إِنَّآ أَعْطَيْنَـٰكَ ٱلْكَوْثَرَ",
    reading: "ʾinnā ʾaʿṭaynāka l-kawṯar[a]",
  },
  {
    id: "108:2",
    surah: 108,
    ayah: 2,
    words: [1, 3],
    arabic: "فَصَلِّ لِرَبِّكَ وَٱنْحَرْ",
    reading: "fa-ṣalli li-rabbika wa-nḥar",
  },
  {
    id: "108:3",
    surah: 108,
    ayah: 3,
    words: [1, 4],
    arabic: "إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ",
    reading: "ʾinna šāniʾaka huwa l-ʾabtar[u]",
  },
  {
    id: "109:1",
    surah: 109,
    ayah: 1,
    words: [1, 3],
    arabic: "قُلْ يَـٰٓأَيُّهَا ٱلْكَـٰفِرُونَ",
    reading: "qul yā-ʾayyuh{a|ā} l-kāfirūn[a]",
    notes: ["Dans la liaison, une voyelle longue suivie d'une consonne sans voyelle s'abrège à l'oral (ʾayyuha l-kāfirūn). La forme longue, conforme à l'écrit, est acceptée."],
  },
  {
    id: "109:2",
    surah: 109,
    ayah: 2,
    words: [1, 4],
    arabic: "لَآ أَعْبُدُ مَا تَعْبُدُونَ",
    reading: "lā ʾaʿbudu mā taʿbudūn[a]",
  },
  {
    id: "109:3",
    surah: 109,
    ayah: 3,
    words: [1, 5],
    arabic: "وَلَآ أَنتُمْ عَـٰبِدُونَ مَآ أَعْبُدُ",
    reading: "wa-lā ʾantum ʿābidūna mā ʾaʿbud[u]",
  },
  {
    id: "109:4",
    surah: 109,
    ayah: 4,
    words: [1, 5],
    arabic: "وَلَآ أَنَا۠ عَابِدٌ مَّا عَبَدتُّمْ",
    reading: "wa-lā ʾana ʿābidu{m|n} mā ʿaba{t|d}tum",
    notes: ["Le petit cercle sur l'alif de أَنَا۠ indique qu'il ne se prononce pas : ʾana, voyelle brève.", "Assimilations notées par la šadda dans l'écriture uthmanie : ʿābidun + mā se lit ʿābidum-mā, ʿabadtum se lit ʿabattum. Les formes non assimilées sont acceptées."],
  },
  {
    id: "109:6",
    surah: 109,
    ayah: 6,
    words: [1, 4],
    arabic: "لَكُمْ دِينُكُمْ وَلِىَ دِينِ",
    reading: "lakum dīnukum wa-liya dīn[i]",
  },
  {
    id: "112:1",
    surah: 112,
    ayah: 1,
    words: [1, 4],
    arabic: "قُلْ هُوَ ٱللَّهُ أَحَدٌ",
    reading: "qul huwa llāhu ʾaḥad[un]",
  },
  {
    id: "112:2",
    surah: 112,
    ayah: 2,
    words: [1, 2],
    arabic: "ٱللَّهُ ٱلصَّمَدُ",
    reading: "ʾallāhu ṣ-ṣamad[u]",
  },
  {
    id: "112:3",
    surah: 112,
    ayah: 3,
    words: [1, 4],
    arabic: "لَمْ يَلِدْ وَلَمْ يُولَدْ",
    reading: "lam yalid wa-lam yūlad",
  },
  {
    id: "112:4",
    surah: 112,
    ayah: 4,
    words: [1, 5],
    arabic: "وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ",
    reading: "wa-lam yaku{l|n} lahū kufuwan ʾaḥad[un]",
    notes: ["Assimilation (idġām) notée par la šadda sur le lām : yakun lahū se lit yakul-lahū. La forme non assimilée est acceptée.", "Le petit wāw après lahu (ۥ) allonge la voyelle : lahū."],
  },
  {
    id: "113:1",
    surah: 113,
    ayah: 1,
    words: [1, 4],
    arabic: "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ",
    reading: "qul ʾaʿūḏu bi-rabbi l-falaq[i]",
  },
  {
    id: "113:2",
    surah: 113,
    ayah: 2,
    words: [1, 4],
    arabic: "مِن شَرِّ مَا خَلَقَ",
    reading: "min šarri mā ḫalaq[a]",
  },
  {
    id: "113:3",
    surah: 113,
    ayah: 3,
    words: [1, 5],
    arabic: "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ",
    reading: "wa-min šarri ġāsiqin ʾiḏā waqab[a]",
  },
  {
    id: "113:4",
    surah: 113,
    ayah: 4,
    words: [1, 5],
    arabic: "وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ",
    reading: "wa-min šarri n-naffāṯāti f{i|ī} l-ʿuqad[i]",
    notes: ["Dans la liaison, une voyelle longue suivie d'une consonne sans voyelle s'abrège à l'oral (fi l-ʿuqad). La forme longue, conforme à l'écrit, est acceptée."],
  },
  {
    id: "113:5",
    surah: 113,
    ayah: 5,
    words: [1, 5],
    arabic: "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
    reading: "wa-min šarri ḥāsidin ʾiḏā ḥasad[a]",
  },
  {
    id: "114:1",
    surah: 114,
    ayah: 1,
    words: [1, 4],
    arabic: "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ",
    reading: "qul ʾaʿūḏu bi-rabbi n-nās[i]",
  },
  {
    id: "114:2",
    surah: 114,
    ayah: 2,
    words: [1, 2],
    arabic: "مَلِكِ ٱلنَّاسِ",
    reading: "maliki n-nās[i]",
    notes: ["Ici malik (roi), avec a bref : à ne pas confondre avec māliki de la Fātiḥa."],
  },
  {
    id: "114:3",
    surah: 114,
    ayah: 3,
    words: [1, 2],
    arabic: "إِلَـٰهِ ٱلنَّاسِ",
    reading: "ʾilāhi n-nās[i]",
  },
  {
    id: "114:4",
    surah: 114,
    ayah: 4,
    words: [1, 4],
    arabic: "مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ",
    reading: "min šarri l-waswāsi l-ḫannās[i]",
  },
  {
    id: "114:5",
    surah: 114,
    ayah: 5,
    words: [1, 5],
    arabic: "ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ",
    reading: "ʾallaḏī yuwaswisu fī ṣudūri n-nās[i]",
  },
  {
    id: "114:6",
    surah: 114,
    ayah: 6,
    words: [1, 3],
    arabic: "مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ",
    reading: "mina l-jinnati wa-n-nās[i]",
  },
]
