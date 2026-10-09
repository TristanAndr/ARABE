import { describe, expect, it } from 'vitest'
import { checkPronoun, checkVerb, normalizeArabic, stripVowels } from './check'
import { FORMS } from './conjugation'

const form = (id: string) => FORMS.find((f) => f.id === id)!

describe('checkVerb', () => {
  it('accepte la forme exacte', () => {
    expect(checkVerb('تَفْعَلِينَ', 'تَفْعَلِينَ')).toBe('correct')
  })

  it('ignore espaces, tatwīl et caractères invisibles', () => {
    expect(checkVerb('  تَفْـعَلُونَ ‏', 'تَفْعَلُونَ')).toBe('correct')
    expect(checkVerb('ي‍َفْعَلُ', 'يَفْعَلُ')).toBe('correct')
  })

  it('ignore la composition Unicode (hamza combinante, ordre des signes)', () => {
    expect(checkVerb('أَفْعَلُ', 'أَفْعَلُ')).toBe('correct')
    expect(checkVerb('أَفْعَلُ', 'أَفْعَلُ')).toBe('correct')
  })

  it('exige la vocalisation : sans voyelles ou avec une mauvaise voyelle, ce n’est pas juste', () => {
    expect(checkVerb('يفعل', 'يَفْعَلُ')).toBe('vowels')
    expect(checkVerb('يَفْعُلُ', 'يَفْعَلُ')).toBe('vowels')
    expect(checkVerb('يَفْعَلَ', 'يَفْعَلُ')).toBe('vowels')
    expect(checkVerb('تَفْعَلُنَ', 'تَفْعَلْنَ')).toBe('vowels')
  })

  it('une autre lettre ou une autre forme est fausse', () => {
    expect(checkVerb('تَفْعَلُ', 'يَفْعَلُ')).toBe('wrong')
    expect(checkVerb('يَفْعَلْنَ', 'تَفْعَلْنَ')).toBe('wrong')
    expect(checkVerb('افْعَلُ', 'أَفْعَلُ')).toBe('wrong')
    expect(checkVerb('', 'أَفْعَلُ')).toBe('wrong')
  })
})

describe('normalisation', () => {
  it('stripVowels ne garde que les lettres', () => {
    expect(stripVowels('تَفْعَلَانِ')).toBe('تفعلان')
    expect(stripVowels('أَنْتُنَّ')).toBe('أنتن')
  })

  it('normalizeArabic conserve tous les signes', () => {
    expect(normalizeArabic(' أَفْعَلُ ')).toBe('أَفْعَلُ')
  })
})

describe('checkPronoun', () => {
  it('accepte chaque pronom dont la forme est identique', () => {
    expect(checkPronoun(form('2ms'), 'تَفْعَلُ')).toBe(true)
    expect(checkPronoun(form('3fs'), 'تَفْعَلُ')).toBe(true)
    expect(checkPronoun(form('3ms'), 'تَفْعَلُ')).toBe(false)
    for (const id of ['2md', '2fd', '3fd']) expect(checkPronoun(form(id), 'تَفْعَلَانِ')).toBe(true)
    expect(checkPronoun(form('3md'), 'تَفْعَلَانِ')).toBe(false)
  })
})
