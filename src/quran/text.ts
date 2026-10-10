/**
 * Texte du Coran : le fichier Tanzil du dépôt (data/tanzil/quran-uthmani.txt), utilisé tel quel.
 *
 * Il est chargé à la demande, dans un fichier séparé du reste de l'application (≈ 1,3 Mo, une
 * seule fois, ensuite en cache du navigateur) : changer de verset ne fait aucune requête.
 * Aucun caractère n'est modifié. Seule la présentation sépare la basmala que Tanzil place en
 * tête du premier verset des sourates (sauf al-Fātiḥa, où elle est le verset 1, et at-Tawba,
 * qui n'en a pas) : elle est affichée au-dessus, comme dans un muṣḥaf.
 */

export type QuranText = Map<number, string[]>

export function parseTanzil(raw: string): QuranText {
  const text: QuranText = new Map()
  for (const line of raw.split('\n')) {
    if (!line || line.startsWith('#')) continue
    const [s, a, verse] = line.split('|')
    const surah = Number(s)
    const ayah = Number(a)
    if (!Number.isInteger(surah) || !Number.isInteger(ayah) || verse === undefined) continue
    const list = text.get(surah) ?? []
    if (ayah !== list.length + 1) throw new Error(`Texte du Coran incohérent en ${surah}:${ayah}`)
    list.push(verse.replace(/\r$/, ''))
    text.set(surah, list)
  }
  return text
}

export interface VerseView {
  /** Basmala à afficher au-dessus du verset 1, si Tanzil l'y a placée. */
  basmala: string | null
  text: string
}

const SHADDA = /\u0651/g

export function verseView(text: QuranText, surah: number, ayah: number): VerseView {
  const raw = text.get(surah)?.[ayah - 1]
  if (raw === undefined) throw new Error(`Verset introuvable : ${surah}:${ayah}`)
  if (ayah === 1 && surah !== 1) {
    // Comparaison sans la šadda : Tanzil écrit بِّسْمِ en tête des sourates 95 et 97.
    const basmala = text.get(1)![0]!.split(' ')
    const words = raw.split(' ')
    const head = words.slice(0, basmala.length)
    if (words.length > basmala.length && head.join(' ').replace(SHADDA, '') === basmala.join(' ').replace(SHADDA, '')) {
      return { basmala: head.join(' '), text: words.slice(basmala.length).join(' ') }
    }
  }
  return { basmala: null, text: raw }
}

let loading: Promise<QuranText> | null = null

/** Charge le texte une seule fois ; un échec permet de réessayer. */
export function loadQuranText(): Promise<QuranText> {
  loading ??= import('../../data/tanzil/quran-uthmani.txt?raw')
    .then((m) => parseTanzil(m.default))
    .catch((e: unknown) => {
      loading = null
      throw e
    })
  return loading
}
