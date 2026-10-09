import { describe, expect, it } from 'vitest'
import { formOf, LETTERS, LOOKALIKES, NON_CONNECTORS, POSITIONS, TATWEEL } from './letters'

/**
 * Référence indépendante : points de code Unicode (bloc Arabe, U+0600–U+06FF) des 28 lettres,
 * dans l'ordre hijāʾī, avec leur type de jonction Unicode (ArabicShaping.txt) :
 * R = se lie seulement à la lettre précédente, D = se lie des deux côtés.
 */
const REFERENCE: [codePoint: number, joining: 'R' | 'D', name: string][] = [
  [0x0627, 'R', 'Alif'],
  [0x0628, 'D', 'Bāʾ'],
  [0x062a, 'D', 'Tāʾ'],
  [0x062b, 'D', 'Thāʾ'],
  [0x062c, 'D', 'Jīm'],
  [0x062d, 'D', 'Ḥāʾ'],
  [0x062e, 'D', 'Khāʾ'],
  [0x062f, 'R', 'Dāl'],
  [0x0630, 'R', 'Dhāl'],
  [0x0631, 'R', 'Rāʾ'],
  [0x0632, 'R', 'Zāy'],
  [0x0633, 'D', 'Sīn'],
  [0x0634, 'D', 'Shīn'],
  [0x0635, 'D', 'Ṣād'],
  [0x0636, 'D', 'Ḍād'],
  [0x0637, 'D', 'Ṭāʾ'],
  [0x0638, 'D', 'Ẓāʾ'],
  [0x0639, 'D', 'ʿAyn'],
  [0x063a, 'D', 'Ghayn'],
  [0x0641, 'D', 'Fāʾ'],
  [0x0642, 'D', 'Qāf'],
  [0x0643, 'D', 'Kāf'],
  [0x0644, 'D', 'Lām'],
  [0x0645, 'D', 'Mīm'],
  [0x0646, 'D', 'Nūn'],
  [0x0647, 'D', 'Hāʾ'],
  [0x0648, 'R', 'Wāw'],
  [0x064a, 'D', 'Yāʾ'],
]

describe('les 28 lettres', () => {
  it('sont toutes présentes, une seule fois, dans l’ordre de ا à ي', () => {
    expect(LETTERS).toHaveLength(28)
    expect(new Set(LETTERS.map((l) => l.letter)).size).toBe(28)
    expect(LETTERS[0]!.letter).toBe('ا')
    expect(LETTERS[27]!.letter).toBe('ي')
    expect(LETTERS.map((l) => l.index)).toEqual(Array.from({ length: 28 }, (_, i) => i + 1))
  })

  it.each(REFERENCE.map((r, i) => [i, ...r] as const))(
    'n°%i : bon caractère Unicode, bon nom, bonne jonction',
    (i, codePoint, joining, name) => {
      const l = LETTERS[i]!
      expect(l.letter.length).toBe(1)
      expect(l.letter.codePointAt(0)).toBe(codePoint)
      expect(l.name).toBe(name)
      expect(l.joinsNext).toBe(joining === 'D')
    },
  )

  it('n’utilise ni formes de présentation ni lettres persanes ou ourdoues semblables', () => {
    for (const l of LETTERS) {
      const cp = l.letter.codePointAt(0)!
      expect(cp >= 0xfb50 && cp <= 0xfeff).toBe(false) // formes de présentation
      expect(['ی', 'ى', 'ک', 'ە', 'ہ', 'ھ']).not.toContain(l.letter)
    }
  })

  it('exactement six lettres ne se lient pas à la suivante : ا د ذ ر ز و', () => {
    expect(LETTERS.filter((l) => !l.joinsNext).map((l) => l.letter)).toEqual(['ا', 'د', 'ذ', 'ر', 'ز', 'و'])
    expect([...NON_CONNECTORS]).toEqual(['ا', 'د', 'ذ', 'ر', 'ز', 'و'])
  })

  it('noms arabes vocalisés et commençant par la lettre elle-même (sauf alif, écrit avec hamza)', () => {
    for (const l of LETTERS) {
      expect(l.nameAr).toMatch(/[ً-ْ]/)
      const first = l.nameAr[0]!
      expect(l.letter === 'ا' ? first === 'أ' : first === l.letter).toBe(true)
    }
  })

  it('son relié à l’inventaire de translittération (sauf alif)', () => {
    for (const l of LETTERS) {
      if (l.letter === 'ا') expect(l.phoneme).toBeNull()
      else expect(l.phoneme).not.toBeNull()
      expect(l.sound.length).toBeGreaterThan(0)
    }
  })

  it('les sosies ne citent que des lettres de l’alphabet', () => {
    const known = new Set(LETTERS.map((l) => l.letter))
    for (const g of LOOKALIKES) for (const ch of g) expect(known.has(ch)).toBe(true)
  })
})

describe('formes positionnelles', () => {
  const byLetter = (ch: string) => LETTERS.find((l) => l.letter === ch)!

  it('exemples du modèle', () => {
    expect(POSITIONS.map((p) => formOf(byLetter('ب'), p.position))).toEqual(['ب', 'بـ', 'ـبـ', 'ـب'])
    expect(POSITIONS.map((p) => formOf(byLetter('ا'), p.position))).toEqual(['ا', null, null, 'ـا'])
  })

  it('lettres non liantes : formes initiale et médiane signalées comme inexistantes', () => {
    for (const ch of NON_CONNECTORS) {
      const l = byLetter(ch)
      expect(formOf(l, 'initial')).toBeNull()
      expect(formOf(l, 'medial')).toBeNull()
      expect(formOf(l, 'final')).toBe(TATWEEL + ch)
    }
  })

  it('toutes les autres lettres ont leurs quatre formes, construites sur la même lettre', () => {
    for (const l of LETTERS.filter((x) => x.joinsNext)) {
      expect(formOf(l, 'isolated')).toBe(l.letter)
      expect(formOf(l, 'initial')).toBe(l.letter + TATWEEL)
      expect(formOf(l, 'medial')).toBe(TATWEEL + l.letter + TATWEEL)
      expect(formOf(l, 'final')).toBe(TATWEEL + l.letter)
    }
  })
})
