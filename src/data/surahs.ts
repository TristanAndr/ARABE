/**
 * Les 114 sourates.
 *
 * Nom arabe, translittération Tanzil (`tanzilName`), nombre de versets et lieu de révélation :
 * métadonnées du Tanzil Project (Quran Metadata 1.0, © 2008-2009 Tanzil.info, licence Creative
 * Commons Attribution 3.0, https://tanzil.net/res/text/metadata/quran-data.js), recoupées par les
 * tests avec le texte data/tanzil/quran-uthmani.txt.
 * `name` (translittération précise, convention de l'application) et `french` (sens usuel du nom,
 * d'après les titres français courants) ont été ajoutés ici.
 */

export interface SurahInfo {
  number: number
  arabic: string
  name: string
  tanzilName: string
  french: string
  ayahs: number
  revelation: 'mecquoise' | 'médinoise'
}

type Row = [number, string, string, string, string, number, SurahInfo['revelation']]

// [numéro, nom arabe, translittération, translittération Tanzil, nom français, versets, révélation]
const ROWS: Row[] = [
  [1, "الفاتحة", "al-Fātiḥa", "Al-Faatiha", "L’Ouverture", 7, 'mecquoise'],
  [2, "البقرة", "al-Baqara", "Al-Baqara", "La Vache", 286, 'médinoise'],
  [3, "آل عمران", "Āl ʿImrān", "Aal-i-Imraan", "La Famille d’Imrân", 200, 'médinoise'],
  [4, "النساء", "an-Nisāʾ", "An-Nisaa", "Les Femmes", 176, 'médinoise'],
  [5, "المائدة", "al-Māʾida", "Al-Maaida", "La Table servie", 120, 'médinoise'],
  [6, "الأنعام", "al-Anʿām", "Al-An'aam", "Les Bestiaux", 165, 'mecquoise'],
  [7, "الأعراف", "al-Aʿrāf", "Al-A'raaf", "Les Murailles", 206, 'mecquoise'],
  [8, "الأنفال", "al-Anfāl", "Al-Anfaal", "Le Butin", 75, 'médinoise'],
  [9, "التوبة", "at-Tawba", "At-Tawba", "Le Repentir", 129, 'médinoise'],
  [10, "يونس", "Yūnus", "Yunus", "Jonas", 109, 'mecquoise'],
  [11, "هود", "Hūd", "Hud", "Hûd", 123, 'mecquoise'],
  [12, "يوسف", "Yūsuf", "Yusuf", "Joseph", 111, 'mecquoise'],
  [13, "الرعد", "ar-Raʿd", "Ar-Ra'd", "Le Tonnerre", 43, 'médinoise'],
  [14, "ابراهيم", "Ibrāhīm", "Ibrahim", "Abraham", 52, 'mecquoise'],
  [15, "الحجر", "al-Ḥijr", "Al-Hijr", "Al-Hijr", 99, 'mecquoise'],
  [16, "النحل", "an-Naḥl", "An-Nahl", "Les Abeilles", 128, 'mecquoise'],
  [17, "الإسراء", "al-Isrāʾ", "Al-Israa", "Le Voyage nocturne", 111, 'mecquoise'],
  [18, "الكهف", "al-Kahf", "Al-Kahf", "La Caverne", 110, 'mecquoise'],
  [19, "مريم", "Maryam", "Maryam", "Marie", 98, 'mecquoise'],
  [20, "طه", "Ṭā Hā", "Taa-Haa", "Tâ-Hâ", 135, 'mecquoise'],
  [21, "الأنبياء", "al-Anbiyāʾ", "Al-Anbiyaa", "Les Prophètes", 112, 'mecquoise'],
  [22, "الحج", "al-Ḥajj", "Al-Hajj", "Le Pèlerinage", 78, 'médinoise'],
  [23, "المؤمنون", "al-Muʾminūn", "Al-Muminoon", "Les Croyants", 118, 'mecquoise'],
  [24, "النور", "an-Nūr", "An-Noor", "La Lumière", 64, 'médinoise'],
  [25, "الفرقان", "al-Furqān", "Al-Furqaan", "Le Discernement", 77, 'mecquoise'],
  [26, "الشعراء", "aš-Šuʿarāʾ", "Ash-Shu'araa", "Les Poètes", 227, 'mecquoise'],
  [27, "النمل", "an-Naml", "An-Naml", "Les Fourmis", 93, 'mecquoise'],
  [28, "القصص", "al-Qaṣaṣ", "Al-Qasas", "Le Récit", 88, 'mecquoise'],
  [29, "العنكبوت", "al-ʿAnkabūt", "Al-Ankaboot", "L’Araignée", 69, 'mecquoise'],
  [30, "الروم", "ar-Rūm", "Ar-Room", "Les Romains", 60, 'mecquoise'],
  [31, "لقمان", "Luqmān", "Luqman", "Luqmân", 34, 'mecquoise'],
  [32, "السجدة", "as-Sajda", "As-Sajda", "La Prosternation", 30, 'mecquoise'],
  [33, "الأحزاب", "al-Aḥzāb", "Al-Ahzaab", "Les Coalisés", 73, 'médinoise'],
  [34, "سبإ", "Sabaʾ", "Saba", "Saba", 54, 'mecquoise'],
  [35, "فاطر", "Fāṭir", "Faatir", "Le Créateur", 45, 'mecquoise'],
  [36, "يس", "Yā Sīn", "Yaseen", "Yâ-Sîn", 83, 'mecquoise'],
  [37, "الصافات", "aṣ-Ṣāffāt", "As-Saaffaat", "Les Rangés", 182, 'mecquoise'],
  [38, "ص", "Ṣād", "Saad", "Sâd", 88, 'mecquoise'],
  [39, "الزمر", "az-Zumar", "Az-Zumar", "Les Groupes", 75, 'mecquoise'],
  [40, "غافر", "Ġāfir", "Al-Ghaafir", "Le Pardonneur", 85, 'mecquoise'],
  [41, "فصلت", "Fuṣṣilat", "Fussilat", "Les Versets détaillés", 54, 'mecquoise'],
  [42, "الشورى", "aš-Šūrā", "Ash-Shura", "La Consultation", 53, 'mecquoise'],
  [43, "الزخرف", "az-Zuḫruf", "Az-Zukhruf", "L’Ornement", 89, 'mecquoise'],
  [44, "الدخان", "ad-Duḫān", "Ad-Dukhaan", "La Fumée", 59, 'mecquoise'],
  [45, "الجاثية", "al-Jāṯiya", "Al-Jaathiya", "L’Agenouillée", 37, 'mecquoise'],
  [46, "الأحقاف", "al-Aḥqāf", "Al-Ahqaf", "Al-Ahqâf", 35, 'mecquoise'],
  [47, "محمد", "Muḥammad", "Muhammad", "Muhammad", 38, 'médinoise'],
  [48, "الفتح", "al-Fatḥ", "Al-Fath", "La Victoire éclatante", 29, 'médinoise'],
  [49, "الحجرات", "al-Ḥujurāt", "Al-Hujuraat", "Les Appartements", 18, 'médinoise'],
  [50, "ق", "Qāf", "Qaaf", "Qâf", 45, 'mecquoise'],
  [51, "الذاريات", "aḏ-Ḏāriyāt", "Adh-Dhaariyat", "Qui éparpillent", 60, 'mecquoise'],
  [52, "الطور", "aṭ-Ṭūr", "At-Tur", "Le Mont", 49, 'mecquoise'],
  [53, "النجم", "an-Najm", "An-Najm", "L’Étoile", 62, 'mecquoise'],
  [54, "القمر", "al-Qamar", "Al-Qamar", "La Lune", 55, 'mecquoise'],
  [55, "الرحمن", "ar-Raḥmān", "Ar-Rahmaan", "Le Tout Miséricordieux", 78, 'médinoise'],
  [56, "الواقعة", "al-Wāqiʿa", "Al-Waaqia", "L’Événement", 96, 'mecquoise'],
  [57, "الحديد", "al-Ḥadīd", "Al-Hadid", "Le Fer", 29, 'médinoise'],
  [58, "المجادلة", "al-Mujādila", "Al-Mujaadila", "La Discussion", 22, 'médinoise'],
  [59, "الحشر", "al-Ḥašr", "Al-Hashr", "L’Exode", 24, 'médinoise'],
  [60, "الممتحنة", "al-Mumtaḥana", "Al-Mumtahana", "L’Éprouvée", 13, 'médinoise'],
  [61, "الصف", "aṣ-Ṣaff", "As-Saff", "Le Rang", 14, 'médinoise'],
  [62, "الجمعة", "al-Jumuʿa", "Al-Jumu'a", "Le Vendredi", 11, 'médinoise'],
  [63, "المنافقون", "al-Munāfiqūn", "Al-Munaafiqoon", "Les Hypocrites", 11, 'médinoise'],
  [64, "التغابن", "at-Taġābun", "At-Taghaabun", "La Grande Perte", 18, 'médinoise'],
  [65, "الطلاق", "aṭ-Ṭalāq", "At-Talaaq", "Le Divorce", 12, 'médinoise'],
  [66, "التحريم", "at-Taḥrīm", "At-Tahrim", "L’Interdiction", 12, 'médinoise'],
  [67, "الملك", "al-Mulk", "Al-Mulk", "La Royauté", 30, 'mecquoise'],
  [68, "القلم", "al-Qalam", "Al-Qalam", "La Plume", 52, 'mecquoise'],
  [69, "الحاقة", "al-Ḥāqqa", "Al-Haaqqa", "Celle qui montre la vérité", 52, 'mecquoise'],
  [70, "المعارج", "al-Maʿārij", "Al-Ma'aarij", "Les Voies d’ascension", 44, 'mecquoise'],
  [71, "نوح", "Nūḥ", "Nooh", "Noé", 28, 'mecquoise'],
  [72, "الجن", "al-Jinn", "Al-Jinn", "Les Djinns", 28, 'mecquoise'],
  [73, "المزمل", "al-Muzzammil", "Al-Muzzammil", "L’Enveloppé", 20, 'mecquoise'],
  [74, "المدثر", "al-Muddaṯṯir", "Al-Muddaththir", "Le Revêtu d’un manteau", 56, 'mecquoise'],
  [75, "القيامة", "al-Qiyāma", "Al-Qiyaama", "La Résurrection", 40, 'mecquoise'],
  [76, "الانسان", "al-Insān", "Al-Insaan", "L’Homme", 31, 'médinoise'],
  [77, "المرسلات", "al-Mursalāt", "Al-Mursalaat", "Les Envoyés", 50, 'mecquoise'],
  [78, "النبإ", "an-Nabaʾ", "An-Naba", "La Nouvelle", 40, 'mecquoise'],
  [79, "النازعات", "an-Nāziʿāt", "An-Naazi'aat", "Les Anges qui arrachent les âmes", 46, 'mecquoise'],
  [80, "عبس", "ʿAbasa", "Abasa", "Il s’est renfrogné", 42, 'mecquoise'],
  [81, "التكوير", "at-Takwīr", "At-Takwir", "L’Obscurcissement", 29, 'mecquoise'],
  [82, "الإنفطار", "al-Infiṭār", "Al-Infitaar", "La Rupture", 19, 'mecquoise'],
  [83, "المطففين", "al-Muṭaffifīn", "Al-Mutaffifin", "Les Fraudeurs", 36, 'mecquoise'],
  [84, "الإنشقاق", "al-Inšiqāq", "Al-Inshiqaaq", "La Déchirure", 25, 'mecquoise'],
  [85, "البروج", "al-Burūj", "Al-Burooj", "Les Constellations", 22, 'mecquoise'],
  [86, "الطارق", "aṭ-Ṭāriq", "At-Taariq", "L’Astre nocturne", 17, 'mecquoise'],
  [87, "الأعلى", "al-Aʿlā", "Al-A'laa", "Le Très-Haut", 19, 'mecquoise'],
  [88, "الغاشية", "al-Ġāšiya", "Al-Ghaashiya", "L’Enveloppante", 26, 'mecquoise'],
  [89, "الفجر", "al-Fajr", "Al-Fajr", "L’Aube", 30, 'mecquoise'],
  [90, "البلد", "al-Balad", "Al-Balad", "La Cité", 20, 'mecquoise'],
  [91, "الشمس", "aš-Šams", "Ash-Shams", "Le Soleil", 15, 'mecquoise'],
  [92, "الليل", "al-Layl", "Al-Lail", "La Nuit", 21, 'mecquoise'],
  [93, "الضحى", "aḍ-Ḍuḥā", "Ad-Dhuhaa", "Le Jour montant", 11, 'mecquoise'],
  [94, "الشرح", "aš-Šarḥ", "Ash-Sharh", "Le Réconfort", 8, 'mecquoise'],
  [95, "التين", "at-Tīn", "At-Tin", "Le Figuier", 8, 'mecquoise'],
  [96, "العلق", "al-ʿAlaq", "Al-Alaq", "L’Adhérence", 19, 'mecquoise'],
  [97, "القدر", "al-Qadr", "Al-Qadr", "La Destinée", 5, 'mecquoise'],
  [98, "البينة", "al-Bayyina", "Al-Bayyina", "La Preuve", 8, 'médinoise'],
  [99, "الزلزلة", "az-Zalzala", "Az-Zalzala", "La Secousse", 8, 'médinoise'],
  [100, "العاديات", "al-ʿĀdiyāt", "Al-Aadiyaat", "Les Coursiers", 11, 'mecquoise'],
  [101, "القارعة", "al-Qāriʿa", "Al-Qaari'a", "Le Fracas", 11, 'mecquoise'],
  [102, "التكاثر", "at-Takāṯur", "At-Takaathur", "La Course aux richesses", 8, 'mecquoise'],
  [103, "العصر", "al-ʿAṣr", "Al-Asr", "Le Temps", 3, 'mecquoise'],
  [104, "الهمزة", "al-Humaza", "Al-Humaza", "Les Calomniateurs", 9, 'mecquoise'],
  [105, "الفيل", "al-Fīl", "Al-Fil", "L’Éléphant", 5, 'mecquoise'],
  [106, "قريش", "Qurayš", "Quraish", "Quraych", 4, 'mecquoise'],
  [107, "الماعون", "al-Māʿūn", "Al-Maa'un", "L’Ustensile", 7, 'mecquoise'],
  [108, "الكوثر", "al-Kawṯar", "Al-Kawthar", "L’Abondance", 3, 'mecquoise'],
  [109, "الكافرون", "al-Kāfirūn", "Al-Kaafiroon", "Les Infidèles", 6, 'mecquoise'],
  [110, "النصر", "an-Naṣr", "An-Nasr", "Le Secours", 3, 'médinoise'],
  [111, "المسد", "al-Masad", "Al-Masad", "Les Fibres", 5, 'mecquoise'],
  [112, "الإخلاص", "al-Iḫlāṣ", "Al-Ikhlaas", "Le Monothéisme pur", 4, 'mecquoise'],
  [113, "الفلق", "al-Falaq", "Al-Falaq", "L’Aube naissante", 5, 'mecquoise'],
  [114, "الناس", "an-Nās", "An-Naas", "Les Hommes", 6, 'mecquoise'],
]

export const SURAH_LIST: readonly SurahInfo[] = ROWS.map(([number, arabic, name, tanzilName, french, ayahs, revelation]) => ({
  number,
  arabic,
  name,
  tanzilName,
  french,
  ayahs,
  revelation,
}))

/** Accès par numéro (1 à 114). */
export const SURAHS: Record<number, SurahInfo> = Object.fromEntries(SURAH_LIST.map((s) => [s.number, s]))

export function surahName(n: number): string {
  return SURAHS[n]?.name ?? `Sourate ${n}`
}
