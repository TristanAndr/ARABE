/**
 * Lecture de référence générée à partir du texte uthmani de Tanzil (lecture de Ḥafṣ ʿan ʿĀṣim),
 * pour les versets qui n'ont pas de lecture écrite à la main dans le corpus.
 *
 * Le texte uthmani note presque tout ce qui se prononce, ce qui permet une conversion par
 * règles, dans le même format que les lectures du corpus (voir reference.ts) :
 *
 *   - voyelles brèves, tanwīn, šadda, soukoun ; alif / wāw / yāʾ sans signe après la voyelle
 *     correspondante = voyelle longue ; alif suscrit (ٰ), petits wāw et yāʾ (ۥ ۦ ۧ) = voyelle longue ;
 *   - lettre muette : petit cercle (۟) ; muette sauf à la pause : petit rectangle (۠) ;
 *   - lettre sans aucun signe suivie d'une lettre portant la šadda = assimilation (idġām) :
 *     article (r-raḥmān), nūn et tanwīn (yaku{l|n} lahū), autres consonnes (ʿaba{t|d}tum) ;
 *   - petit mīm (ۢ ۭ) = iqlāb (n prononcé m) ;
 *   - alif waṣla (ٱ) : élidé dans la liaison, prononcé ʾa / ʾi / ʾu en début de segment ;
 *     voyelle longue finale abrégée devant lui (f{i|ī} l-ʿuqad) ;
 *   - fin de segment lue à la pause (waqf) : voyelle finale entre crochets, -an → ā, ة → h ;
 *   - lettres isolées en tête de sourate (الٓمٓ…) : lues par leur nom.
 *
 * Limites connues (non notées, comme dans le corpus) : durées de madd, ġunna, iḫfāʾ, qalqala ;
 * quelques cas rares (imāla de 11:41, išmām de 12:11, tashīl de 41:44) sont lus sans leur
 * particularité. Un test vérifie que les 35 lectures écrites à la main sont retrouvées.
 */

const CONSONANT: Record<string, string> = {
  ء: 'ʾ', أ: 'ʾ', إ: 'ʾ', ؤ: 'ʾ', ئ: 'ʾ',
  ب: 'b', ت: 't', ث: 'ṯ', ج: 'j', ح: 'ḥ', خ: 'ḫ', د: 'd', ذ: 'ḏ', ر: 'r', ز: 'z', س: 's', ش: 'š',
  ص: 'ṣ', ض: 'ḍ', ط: 'ṭ', ظ: 'ẓ', ع: 'ʿ', غ: 'ġ', ف: 'f', ق: 'q', ك: 'k', ل: 'l', م: 'm', ن: 'n',
  ه: 'h', و: 'w', ي: 'y', ى: 'y', ة: 't',
}

const FATHA = 'َ', DAMMA = 'ُ', KASRA = 'ِ'
const FATHATAN = 'ً', DAMMATAN = 'ٌ', KASRATAN = 'ٍ'
const SHADDA = 'ّ', SUKUN = 'ْ', HAMZA_ABOVE = 'ٔ', DAGGER_ALIF = 'ٰ'
const SILENT = '۟', SILENT_EXCEPT_PAUSE = '۠', IQLAB_HIGH = 'ۢ', IQLAB_LOW = 'ۭ'
const SMALL_HIGH_SEEN = 'ۜ', SMALL_HIGH_YEH = 'ۧ', SMALL_HIGH_NOON = 'ۨ'
const SMALL_WAW = 'ۥ', SMALL_YEH = 'ۦ', TATWEEL = 'ـ', WASLA = 'ٱ'

/** Signes sans effet sur les sons notés : madda, arrêts, ḥizb, sajda, imāla/išmām/tashīl, petit sīn bas. */
const IGNORED = /[ٓۖ-ۛ۞ۣ۩۪-۬]/g

const MARK = /[ً-ٰۭٔۜ۟۠ۢۧۨ]/

interface Tok {
  ch: string
  marks: Set<string>
}

function tokenize(word: string): Tok[] {
  const toks: Tok[] = []
  for (const ch of word.replace(IGNORED, '')) {
    if (MARK.test(ch)) {
      // Signe isolé (ex. ۜ marque de saktah, séparée par une espace) : sans effet sur les sons.
      if (toks.length) toks[toks.length - 1]!.marks.add(ch)
    } else toks.push({ ch, marks: new Set() })
  }
  return toks
}

const vowelOf = (m: Set<string>) => (m.has(FATHA) ? 'a' : m.has(DAMMA) ? 'u' : m.has(KASRA) ? 'i' : null)
const tanwinOf = (m: Set<string>) => (m.has(FATHATAN) ? 'a' : m.has(DAMMATAN) ? 'u' : m.has(KASRATAN) ? 'i' : null)
const LONG: Record<string, string> = { a: 'ā', i: 'ī', u: 'ū' }
const SHORT: Record<string, string> = { ā: 'a', ī: 'i', ū: 'u' }

/** Morceau de lecture d'un mot ; le type sert aux règles de liaison et de pause. */
type Piece =
  | { k: 'c'; s: string; tm?: boolean }
  | { k: 'v'; s: string }
  | { k: 'V'; s: string; silah?: boolean }
  | { k: 'tan'; v: string; iqlab: boolean }
  | { k: 'raw'; s: string }

const MUQATTAAT: Record<string, string> = {
  الم: 'ʾalif-lām-mīm',
  المص: 'ʾalif-lām-mīm-ṣād',
  الر: 'ʾalif-lām-rā',
  المر: 'ʾalif-lām-mīm-rā',
  كهيعص: 'kāf-hā-yā-ʿayn-ṣād',
  طه: 'ṭā-hā',
  طسم: 'ṭā-sīn-mīm',
  طس: 'ṭā-sīn',
  يس: 'yā-sīn',
  ص: 'ṣād',
  حم: 'ḥā-mīm',
  عسق: 'ʿayn-sīn-qāf',
  ق: 'qāf',
  ن: 'nūn',
}

/** Mots contenant le nom d'Allah, dont le ā n'est pas écrit : ٱللَّه، لِلَّه، بِٱللَّه، تَٱللَّه، ٱللَّهُمَّ… */
const ALLAH = /^(?:[وف]?[بتل]?ا?|ءا|ءاا)لله(?:م)?$/

const skeleton = (toks: Tok[]) =>
  toks
    .map((t) => (t.ch === WASLA ? 'ا' : t.ch))
    .filter((c) => c !== TATWEEL)
    .join('')

const unmarked = (t: Tok) =>
  !vowelOf(t.marks) && !tanwinOf(t.marks) && !t.marks.has(SUKUN) && !t.marks.has(SHADDA)

/** Premier vrai caractère prononçable d'un mot (pour l'assimilation par le mot suivant). */
function firstLetter(toks: Tok[] | undefined): Tok | undefined {
  return toks?.find((t) => t.ch !== TATWEEL)
}

interface WordContext {
  first: boolean
  last: boolean
  next?: Tok[]
  /** Le mot précédent a déjà écrit la consonne assimilée : la šadda initiale ne la double pas. */
  assimilatedStart: boolean
}

interface WordResult {
  pieces: Piece[]
  /** Le mot suivant commence par une consonne déjà écrite ici (assimilation). */
  assimilatesNext: boolean
}

function readWord(toks: Tok[], ctx: WordContext): WordResult {
  const pieces: Piece[] = []
  const last = () => pieces[pieces.length - 1]
  let assimilatedNextLetter = ctx.assimilatedStart
  let assimilatesNext = false
  let afterArticle = false
  const isAllah = ALLAH.test(skeleton(toks))

  const lengthen = (long: string) => {
    const p = last()
    if (p && p.k === 'v' && LONG[p.s] === long) pieces[pieces.length - 1] = { k: 'V', s: long }
    else pieces.push({ k: 'V', s: long })
  }

  for (let i = 0; i < toks.length; i++) {
    let { ch } = toks[i]!
    const m = toks[i]!.marks
    const nextTok = toks.slice(i + 1).find((t) => t.ch !== TATWEEL)
    const lastLetter = !nextTok

    if (m.has(SILENT)) continue
    if (m.has(SILENT_EXCEPT_PAUSE)) {
      if (ctx.last && lastLetter) lengthen('ā')
      continue
    }

    if (ch === TATWEEL) {
      if (m.has(HAMZA_ABOVE)) ch = 'ء'
      else {
        if (m.has(DAGGER_ALIF)) lengthen('ā')
        if (m.has(SMALL_HIGH_YEH)) lengthen('ī')
        // نُـۨجِى (21:88) : nūn prononcé, écrit en petit sur un tatwīl.
        if (m.has(SMALL_HIGH_NOON)) pieces.push({ k: 'c', s: 'n' })
        continue
      }
    }
    if (m.has(HAMZA_ABOVE)) ch = 'ء'

    if (ch === WASLA) {
      if (i === 0 && ctx.first) {
        const second = toks[1]
        const article = second?.ch === 'ل'
        const third = toks.slice(2).find((t) => t.ch !== TATWEEL)
        const vowel = article ? 'a' : third && vowelOf(third.marks) === 'u' ? 'u' : 'i'
        pieces.push({ k: 'c', s: 'ʾ' }, { k: 'v', s: vowel })
      } else if (i > 0) {
        pieces.push({ k: 'raw', s: '-' })
      }
      // Article : la lettre suivante est le lām.
      afterArticle = toks[i + 1]?.ch === 'ل'
      continue
    }

    if (ch === SMALL_WAW || ch === SMALL_YEH) {
      const long = ch === SMALL_WAW ? 'ū' : 'ī'
      const p = last()
      if (p && p.k === 'v' && LONG[p.s] === long) pieces[pieces.length - 1] = { k: 'V', s: long, silah: true }
      else pieces.push({ k: 'V', s: long, silah: true })
      continue
    }

    const vowel = vowelOf(m)
    const tanwin = tanwinOf(m)
    const bare = unmarked(toks[i]!)
    // Article après la préposition li-, écrit sans alif waṣla : لِلذَّكَرِ، لِلْمُتَّقِينَ.
    if (i === 1 && ch === 'ل' && toks[0]!.ch === 'ل' && vowelOf(toks[0]!.marks) === 'i') {
      pieces.push({ k: 'raw', s: '-' })
      afterArticle = true
    }

    // Lettres de prolongation.
    if (bare && (ch === 'ا' || ch === 'و' || ch === 'ي' || ch === 'ى')) {
      const p = last()
      const prevShort = p && p.k === 'v' ? p.s : null
      // Alif (ou alif maqṣūra) après un tanwīn -an : muet (هُدًى، كُفُوًا).
      if ((ch === 'ا' || ch === 'ى') && p?.k === 'tan' && !m.has(DAGGER_ALIF)) continue
      if (ch === 'ا') {
        if (m.has(DAGGER_ALIF) || prevShort === 'a') lengthen('ā')
        continue
      }
      if (m.has(DAGGER_ALIF)) {
        lengthen('ā')
        continue
      }
      if (ch === 'و' && prevShort === 'u') {
        lengthen('ū')
        continue
      }
      if ((ch === 'ي' || ch === 'ى') && prevShort === 'i') {
        lengthen('ī')
        continue
      }
      if (ch === 'ى') {
        lengthen('ā')
        continue
      }
      // Sinon : consonne sans voyelle (traitée plus bas).
    }

    let c = CONSONANT[ch]
    if (c === undefined) {
      if (ch === 'ا') continue // alif sans rôle (après tanwīn -an, etc.)
      throw new Error(`Caractère non pris en charge : ${ch} (U+${ch.codePointAt(0)!.toString(16)})`)
    }
    // Petit sīn sur ṣād : lu s en Ḥafṣ (يَبْصُۜطُ، بَصْۜطَةً).
    if (ch === 'ص' && m.has(SMALL_HIGH_SEEN)) c = 's'
    const tm = ch === 'ة'

    // Consonne nue suivie d'une lettre à šadda (dans le mot ou au début du suivant) : assimilation.
    if (bare) {
      const target = lastLetter ? firstLetter(ctx.next) : nextTok
      const iqlab = m.has(IQLAB_HIGH) || m.has(IQLAB_LOW)
      if (iqlab) {
        pieces.push({ k: 'raw', s: '{m|n}' })
      } else if (target && target.marks.has(SHADDA) && target.ch !== WASLA) {
        const into = CONSONANT[target.ch] ?? ''
        if (afterArticle && ch === 'ل') {
          pieces.push({ k: 'c', s: into })
          if (target.ch !== 'ل') pieces.push({ k: 'raw', s: '-' })
        } else if (into === c) {
          // Même lettre (قُلُوبِهِم مَّرَضٌ، يَجْعَل لَّهُۥ) : simple gémination, sans variante.
          pieces.push({ k: 'c', s: c })
        } else {
          pieces.push({ k: 'raw', s: `{${into}|${c}}` })
        }
        if (lastLetter) assimilatesNext = true
        else assimilatedNextLetter = true
      } else {
        pieces.push({ k: 'c', s: c, tm })
        if (afterArticle && ch === 'ل') pieces.push({ k: 'raw', s: '-' })
      }
      afterArticle = false
      if (m.has(DAGGER_ALIF)) lengthen('ā')
      continue
    }

    // Consonne (géminée si šadda, sauf si sa première moitié a été écrite par assimilation, ou si
    // le segment commence par une lettre assimilée à la fin du verset précédent : لَّيْسَ en 2:177).
    const segmentStart = ctx.first && pieces.length === 0
    if (m.has(SHADDA) && !assimilatedNextLetter && !segmentStart) pieces.push({ k: 'c', s: c })
    pieces.push({ k: 'c', s: c, tm })
    assimilatedNextLetter = false
    if (afterArticle && ch === 'ل' && m.has(SUKUN)) pieces.push({ k: 'raw', s: '-' })
    afterArticle = false

    if (m.has(SMALL_HIGH_NOON)) {
      // نُۨجِى : un nūn prononcé, non écrit en pleine lettre.
      if (vowel) pieces.push({ k: 'v', s: vowel })
      pieces.push({ k: 'c', s: 'n' })
      continue
    }

    if (tanwin) {
      pieces.push({ k: 'tan', v: tanwin, iqlab: m.has(IQLAB_HIGH) || m.has(IQLAB_LOW) })
    } else if (vowel) {
      const allahLong = isAllah && ch === 'ل' && m.has(SHADDA) && vowel === 'a' && nextTok?.ch === 'ه'
      if (m.has(DAGGER_ALIF) || allahLong) pieces.push({ k: 'V', s: LONG[vowel]! })
      else pieces.push({ k: 'v', s: vowel })
    } else if (m.has(DAGGER_ALIF)) {
      pieces.push({ k: 'V', s: 'ā' })
    }
    if (m.has(SMALL_HIGH_YEH)) lengthen('ī')
  }

  return { pieces, assimilatesNext }
}

function render(pieces: Piece[]): string {
  return pieces
    .map((p) => {
      switch (p.k) {
        case 'c':
        case 'v':
        case 'V':
        case 'raw':
          return p.s
        case 'tan':
          return p.v + 'n'
      }
    })
    .join('')
}

/** Fin de mot lue à la pause (waqf). */
function pausal(pieces: Piece[]): string {
  const out = [...pieces]
  const lastIdx = out.length - 1
  const p = out[lastIdx]
  if (!p) return ''
  const prev = out[lastIdx - 1]
  const tmBefore = prev?.k === 'c' && prev.tm

  if (p.k === 'v' || p.k === 'tan') {
    const ending = p.k === 'v' ? p.s : p.v + 'n'
    if (tmBefore) return render(out.slice(0, lastIdx - 1)) + `{h|t[${ending}]}`
    if (p.k === 'tan' && p.v === 'a') return render(out.slice(0, lastIdx)) + '{ā|an}'
    return render(out.slice(0, lastIdx)) + `[${ending}]`
  }
  if (p.k === 'V' && p.silah) {
    return render(out.slice(0, lastIdx)) + `[${p.s}]`
  }
  if (p.k === 'c' && p.tm) return render(out.slice(0, lastIdx)) + 'h'
  return render(out)
}

/**
 * Lecture d'un segment (mots consécutifs d'un verset). `verseStart` : le segment commence au
 * premier mot du verset (lettres isolées possibles).
 */
export function generateReading(arabicWords: string[], opts: { verseStart?: boolean } = {}): string {
  const words = arabicWords.map(tokenize).filter((t) => t.length > 0)
  const out: string[] = []
  let assimilatedStart = false

  for (let w = 0; w < words.length; w++) {
    const toks = words[w]!
    const first = w === 0
    const isLast = w === words.length - 1
    const next = words[w + 1]

    // Lettres isolées (الٓمٓ, يسٓ…) : aucune voyelle écrite.
    const sk = skeleton(toks)
    if (opts.verseStart && first && MUQATTAAT[sk] && toks.every((t) => !vowelOf(t.marks) && !t.marks.has(SUKUN))) {
      out.push(MUQATTAAT[sk]!)
      assimilatedStart = false
      continue
    }

    const { pieces, assimilatesNext } = readWord(toks, { first, last: isLast, next, assimilatedStart })
    assimilatedStart = assimilatesNext

    if (isLast) {
      out.push(pausal(pieces))
      continue
    }

    const nextStartsWithWasla = next?.[0]?.ch === WASLA
    const tail = pieces[pieces.length - 1]
    if (tail?.k === 'tan') {
      // Tanwīn en liaison : assimilé, changé en m (iqlāb), ou suivi d'une voyelle d'appui devant l'alif waṣla.
      const target = firstLetter(next)
      pieces.pop()
      if (nextStartsWithWasla) pieces.push({ k: 'raw', s: `${tail.v}ni` })
      else if (tail.iqlab) pieces.push({ k: 'raw', s: `${tail.v}{m|n}` })
      else if (target && target.marks.has(SHADDA)) {
        pieces.push({ k: 'raw', s: `${tail.v}{${CONSONANT[target.ch] ?? ''}|n}` })
        assimilatedStart = true
      } else pieces.push({ k: 'raw', s: `${tail.v}n` })
    } else if (tail?.k === 'V' && nextStartsWithWasla) {
      // Voyelle longue abrégée devant la consonne sans voyelle qui suit l'alif waṣla.
      pieces.pop()
      pieces.push({ k: 'raw', s: `{${SHORT[tail.s]}|${tail.s}}` })
    }
    out.push(render(pieces))
  }
  return out.join(' ')
}
