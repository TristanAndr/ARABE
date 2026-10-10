import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compareAnswer } from '../compare/compare'
import { DEFAULT_NORMALIZATION } from '../compare/normalize'
import { EXERCISES } from '../data/corpus'
import { parseTanzil, verseView } from '../quran/text'
import { generateReading } from './autoReading'
import { PRESETS } from './profiles'
import { expandVariants, parseReading, renderReading } from './reference'

const QURAN = parseTanzil(readFileSync(join(__dirname, '../../data/tanzil/quran-uthmani.txt'), 'utf8'))
const strip = (s: string) => s.replace(/-/g, '')
const words = (surah: number, ayah: number) => verseView(QURAN, surah, ayah).text.split(' ')
const verse = (surah: number, ayah: number) => generateReading(words(surah, ayah), { verseStart: true })

describe('lecture générée : contrôle sur le corpus écrit à la main', () => {
  it.each(EXERCISES)('$id : retrouve la lecture écrite à la main', (e) => {
    const w = words(e.surah, e.ayah).slice(e.words[0] - 1, e.words[1])
    expect(strip(generateReading(w, { verseStart: e.words[0] === 1 }))).toBe(strip(e.reading))
  })
})

describe('lecture générée : tout le Coran', () => {
  it('chaque verset donne une lecture bien formée, sans caractère étranger à l’inventaire', () => {
    let count = 0
    for (const [s, list] of QURAN) {
      for (let a = 1; a <= list.length; a++) {
        const r = verse(s, a)
        expect(r, `${s}:${a}`).toMatch(/^[\sʾbtṯjḥḫdḏrzsšṣḍṭẓʿġfqklmnhwyaiuāīū\-[\]{}|]+$/)
        for (const v of expandVariants(r)) expect(parseReading(v).units.length).toBeGreaterThan(0)
        count++
      }
    }
    expect(count).toBe(6236)
  })

  it('la référence affichée est jugée juste dans chaque profil (un verset sur 25)', () => {
    const strict = { ...DEFAULT_NORMALIZATION, optionalInitialHamza: false, acceptWaslEndings: false }
    let i = 0
    for (const [s, list] of QURAN) {
      for (let a = 1; a <= list.length; a++) {
        if (i++ % 25) continue
        const r = verse(s, a)
        for (const preset of Object.values(PRESETS)) {
          const shown = renderReading(expandVariants(r)[0]!, preset.spellings)
          expect(compareAnswer(r, shown, preset.spellings, strict).verdict, `${s}:${a}`).toBe('correct')
        }
      }
    }
  })
})

describe('lecture générée : cas particuliers', () => {
  const cases: [string, number, number, string][] = [
    ['lettres isolées', 2, 1, 'ʾalif-lām-mīm'],
    ['lettres isolées', 19, 1, 'kāf-hā-yā-ʿayn-ṣād'],
    ['lettres isolées', 36, 1, 'yā-sīn'],
    ['tanwīn + alif maqṣūra muet, assimilation', 2, 2, 'ḏālika l-kitābu lā rayba fīhi huda{l|n} li-l-muttaqīn[a]'],
    ['nom d’Allah après quli', 3, 26, 'quli llāhumma'],
    ['ṣād lu s (petit sīn)', 2, 245, 'wayabsuṭu'],
    ['petit nūn, voyelle abrégée devant l’alif waṣla', 21, 88, 'nunj{i|ī} l-muʾminīn'],
    ['iqlāb', 2, 27, 'mi{m|n} baʿdi'],
    ['même lettre assimilée : gémination simple', 2, 10, 'fī qulūbihim maraḍun'],
    ['šadda initiale d’un verset', 2, 177, 'laysa l-birra'],
    ['tanwīn devant alif waṣla', 11, 42, 'nūḥuni bnahū'],
    ['alif suscrit sur wāw', 2, 3, 'ṣ-ṣalāta'],
    ['lettre muette (petit cercle)', 2, 5, 'ʾulāʾika'],
    ['petit yāʾ suscrit', 2, 177, 'n-nabiyyīna'],
    ['fin de verset avec -an', 4, 11, 'ʿalīman ḥakīm{ā|an}'],
  ]
  it.each(cases)('%s (%i:%i)', (_, s, a, expected) => {
    expect(verse(s, a)).toContain(expected)
  })

  it('tāʾ marbūṭa en fin de segment : h à la pause', () => {
    expect(generateReading(['رَحْمَةً'])).toBe('raḥma{h|t[an]}')
    expect(generateReading(['ٱلْجَنَّةِ'])).toBe('ʾal-janna{h|t[i]}')
  })
})
