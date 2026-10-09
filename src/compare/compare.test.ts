import { describe, expect, it } from 'vitest'
import { PRESETS, resolveSpellings } from '../translit/profiles'
import { compareAnswer } from './compare'
import { DEFAULT_NORMALIZATION, type NormalizationOptions } from './normalize'

const precise = PRESETS.precise.spellings
const simple = PRESETS.simple.spellings
const opts = DEFAULT_NORMALIZATION
const BASMALA = 'bismi llāhi r-raḥmāni r-raḥīm[i]'

const check = (reading: string, answer: string, spellings = precise, o: NormalizationOptions = opts) =>
  compareAnswer(reading, answer, spellings, o)

describe('compareAnswer — tolérance typographique', () => {
  it('accepte la référence exacte', () => {
    expect(check(BASMALA, 'bismi llāhi r-raḥmāni r-raḥīm').verdict).toBe('correct')
  })
  it('ignore espaces, tirets et casse', () => {
    expect(check(BASMALA, '  Bismillāhi  r-Raḥmānir-raḥīm ').verdict).toBe('correct')
    expect(check(BASMALA, 'bis mil lā hir raḥ mā nir ra ḥīm').verdict).toBe('correct')
  })
  it('accepte les variantes de graphie du profil (â, sh, th…)', () => {
    expect(check(BASMALA, 'bismi llâhi r-raḥmâni r-raḥîm').verdict).toBe('correct')
    expect(check('min šarri mā ḫalaq[a]', 'min sharri mā khalaq').verdict).toBe('correct')
  })
  it('accepte les diacritiques saisis en caractères combinants', () => {
    expect(check(BASMALA, 'bismi llāhi r-raḥmāni r-raḥīm').verdict).toBe('correct')
  })
  it('respecte la casse si l’option est désactivée', () => {
    expect(check(BASMALA, 'Bismi llāhi r-raḥmāni r-raḥīm', precise, { ...opts, ignoreCase: false }).verdict).not.toBe('correct')
  })
})

describe('compareAnswer — rigueur phonétique', () => {
  it('signale une voyelle longue écrite brève', () => {
    const r = check(BASMALA, 'bismi llahi r-raḥmāni r-raḥīm')
    expect(r.verdict).toBe('partial')
    expect(r.errors).toBe(1)
    expect(r.words[1]).toMatchObject({ ok: false, issues: ['length'], typed: 'llahi' })
    expect(r.words[0]!.ok).toBe(true)
  })
  it('signale une šadda oubliée', () => {
    const r = check('ʾal-ḥamdu li-llāhi rabbi l-ʿālamīn[a]', 'al-ḥamdu lillāhi rabi l-ʿālamīn')
    expect(r.errors).toBe(1)
    expect(r.words[2]).toMatchObject({ ok: false, issues: ['gemination'] })
  })
  it('distingue ḥ et h dans le profil précis', () => {
    const r = check(BASMALA, 'bismi llāhi r-rahmāni r-raḥīm')
    expect(r.errors).toBe(1)
    expect(r.words[2]!.issues).toEqual(['substitution'])
  })
  it('distingue ʿayn et hamza', () => {
    expect(check('ʾal-ḥamdu li-llāhi rabbi l-ʿālamīn[a]', 'al-ḥamdu li-llāhi rabbi l-ʾālamīn').errors).toBe(1)
  })
  it('ne déclare pas correcte une lecture voisine mais différente (malik / mālik)', () => {
    expect(check('maliki n-nās[i]', 'māliki n-nās').verdict).not.toBe('correct')
    expect(check('māliki yawmi d-dīn[i]', 'maliki yawmi d-dīn').verdict).not.toBe('correct')
  })
  it('signale un son manquant et un son en trop', () => {
    expect(check('qul huwa llāhu ʾaḥad[un]', 'qul huwa llāhu ḥad').words[3]!.issues).toContain('missing')
    expect(check('lam yalid wa-lam yūlad', 'lam yalid wa-lam yūladu').words[3]!.issues).toContain('extra')
  })
  it('juge incorrecte une réponse très éloignée', () => {
    expect(check(BASMALA, 'al-ḥamdu').verdict).toBe('incorrect')
  })
})

describe('compareAnswer — règles de lecture', () => {
  it('rend la hamza initiale facultative selon le réglage', () => {
    expect(check('qul huwa llāhu ʾaḥad[un]', 'qul huwa llāhu aḥad').verdict).toBe('correct')
    const strict = { ...opts, optionalInitialHamza: false }
    expect(check('qul huwa llāhu ʾaḥad[un]', 'qul huwa llāhu aḥad', precise, strict).errors).toBe(1)
    expect(check('qul huwa llāhu ʾaḥad[un]', 'qul huwa llāhu ʾaḥad', precise, strict).verdict).toBe('correct')
  })
  it('accepte la terminaison de liaison selon le réglage', () => {
    expect(check(BASMALA, 'bismi llāhi r-raḥmāni r-raḥīmi').verdict).toBe('correct')
    const strict = { ...opts, acceptWaslEndings: false }
    expect(check(BASMALA, 'bismi llāhi r-raḥmāni r-raḥīmi', precise, strict).errors).toBe(1)
    expect(check(BASMALA, 'bismi llāhi r-raḥmāni r-raḥīm', precise, strict).verdict).toBe('correct')
  })
  it('accepte une variante documentée et indique laquelle', () => {
    const reading = 'ġayri l-maġḍūbi ʿalayhim wa-l{a|ā} ḍ-ḍāllīn[a]'
    expect(check(reading, 'ġayri l-maġḍūbi ʿalayhim wa-la ḍ-ḍāllīn')).toMatchObject({ verdict: 'correct', variantIndex: 0 })
    expect(check(reading, 'ġayri l-maġḍūbi ʿalayhim wa-lā ḍ-ḍāllīn')).toMatchObject({ verdict: 'correct', variantIndex: 1 })
  })
  it('gère la gémination par assimilation à travers les mots', () => {
    const reading = 'wa-lā ʾana ʿābidu{m|n} mā ʿaba{t|d}tum'
    expect(check(reading, 'wa lā ana ʿābidum mā ʿabattum').verdict).toBe('correct')
    expect(check(reading, 'wa lā ana ʿābidun mā ʿabadtum').verdict).toBe('correct')
  })
})

describe('compareAnswer — profils', () => {
  it('le profil simplifié accepte sa propre convention', () => {
    expect(check(BASMALA, 'bismi llaahi rra7maani rra7iim', simple).verdict).toBe('correct')
    expect(check('qul ʾaʿūḏu bi-rabbi l-falaq[i]', "qoul a3uudhu birabbi lfalaq", simple).verdict).toBe('correct')
  })
  it('le profil simplifié vérifie toujours la distinction ḥ / h', () => {
    expect(check(BASMALA, 'bismi llaahi rrahmaani rra7iim', simple).errors).toBe(1)
  })
  it('le profil simplifié ne vérifie pas les emphatiques, comme documenté', () => {
    expect(check('ʾallāhu ṣ-ṣamad[u]', 'allaahu ssamad', simple).verdict).toBe('correct')
    expect(check('ʾallāhu ṣ-ṣamad[u]', 'allāhu ssamad', precise).verdict).not.toBe('correct')
  })
  it('une correspondance personnalisée change réellement la validation', () => {
    const custom = resolveSpellings({ profileId: 'custom', customBase: 'precise', overrides: { 'ʿ': ['c'] } })
    const reading = 'lā ʾaʿbudu mā taʿbudūn[a]'
    expect(check(reading, 'lā ʾacbudu mā tacbudūn', custom).verdict).toBe('correct')
    expect(check(reading, 'lā ʾaʿbudu mā taʿbudūn', custom).verdict).not.toBe('correct')
    expect(check(reading, 'lā ʾacbudu mā tacbudūn', precise).verdict).not.toBe('correct')
  })
  it('affiche la référence dans les graphies du profil', () => {
    const r = check(BASMALA, 'x', simple)
    expect(r.words.map((w) => w.expected)).toEqual(['bismi', 'llaahi', 'r-ra7maani', 'r-ra7iim'])
  })
})
