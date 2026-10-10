// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { EXERCISES } from './data/corpus'
import { AUTO_NOTE } from './quran/practice'
import { parseTanzil, verseView } from './quran/text'
import { createEnv } from './test/env'

const QURAN = parseTanzil(readFileSync(join(__dirname, '../data/tanzil/quran-uthmani.txt'), 'utf8'))

let env: ReturnType<typeof createEnv>
beforeEach(() => {
  env = createEnv()
})
afterEach(cleanup)

type User = ReturnType<typeof userEvent.setup>

const input = () => screen.getByLabelText('Transcription') as HTMLInputElement
const result = () => screen.queryByRole('region', { name: 'Résultat' })
const verseBar = () => within(screen.getByRole('navigation', { name: 'Versets' }))
const prevVerse = () => verseBar().getByRole('button', { name: /Verset précédent/ }) as HTMLButtonElement
const nextVerse = () => verseBar().getByRole('button', { name: /Verset suivant/ }) as HTMLButtonElement
const counter = () => screen.getByText(/^Verset \d+/).textContent!.replace(/\s+/g, ' ')

/** Le verset affiché est exactement le texte Tanzil (sans la basmala). */
async function expectVerse(surah: number, ayah: number) {
  const text = verseView(QURAN, surah, ayah).text
  await screen.findByText(text)
  expect(counter()).toBe(`Verset ${ayah} / ${QURAN.get(surah)!.length}`)
}

async function pickSurah(user: User, query: string) {
  await user.click(screen.getByRole('button', { name: /Changer de sourate/ }))
  await user.type(screen.getByLabelText('Rechercher une sourate'), `${query}{Enter}`)
}

describe('entraînement : fonctionnement d’origine conservé', () => {
  it('par défaut, la sélection d’exercices habituelle, avec la barre de sourate', async () => {
    await env.open()
    expect(screen.getByText(EXERCISES[0]!.arabic)).toBeTruthy()
    expect(screen.getByText(/Phrase 1/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Changer de sourate/ }).textContent).toContain('al-Fātiḥa')
    expect(counter()).toBe('Verset 1 / 7')
    expect(prevVerse().disabled).toBe(true)
    expect(screen.queryByRole('button', { name: /Revenir à la sélection/ })).toBeNull()
  })
})

describe('entraînement verset par verset', () => {
  it('choisir une sourate au milieu du Coran : premier verset, vérification inchangée', async () => {
    const user = userEvent.setup()
    await env.open()
    await pickSurah(user, 'Yā Sīn')
    await expectVerse(36, 1)
    expect(screen.queryByText(/Phrase \d+ sur/)).toBeNull()
    expect(prevVerse().disabled).toBe(true)

    // Lettres isolées « yā-sīn », profil simplifié : voyelles longues doublées.
    await user.type(input(), 'yaa siin{Enter}')
    expect(result()!.textContent).toContain('Juste.')
    // Lecture générée : signalée après vérification.
    expect(result()!.textContent).toContain(AUTO_NOTE)
  })

  it('versets consécutifs, précédent, champ et résultat réinitialisés', async () => {
    const user = userEvent.setup()
    await env.open()
    await pickSurah(user, '36')
    await user.type(input(), 'yaa siin{Enter}')
    for (let a = 2; a <= 4; a++) {
      await user.click(nextVerse())
      await expectVerse(36, a)
    }
    expect(input().value).toBe('')
    expect(result()).toBeNull()
    await user.click(prevVerse())
    await expectVerse(36, 3)
  })

  it('« Verset suivant » après vérification passe au verset suivant', async () => {
    const user = userEvent.setup()
    await env.open()
    await pickSurah(user, '112')
    await user.type(input(), `qul huwa llaahu 'a7ad{Enter}`)
    expect(result()!.textContent).toContain('Juste.')
    await user.click(within(result()!).getByRole('button', { name: 'Verset suivant' }))
    await expectVerse(112, 2)
  })

  it('dernier verset : premier verset de la sourate suivante', async () => {
    const user = userEvent.setup()
    await env.open()
    await pickSurah(user, 'fatiha')
    for (let a = 1; a < 7; a++) await user.click(nextVerse())
    await expectVerse(1, 7)
    await user.click(nextVerse())
    await expectVerse(2, 1)
    expect(screen.getByRole('button', { name: /Changer de sourate/ }).textContent).toContain('al-Baqara')
    expect(prevVerse().disabled).toBe(true)
  })

  it('fin du Coran : « Verset suivant » désactivé, y compris après vérification', async () => {
    const user = userEvent.setup()
    await env.open()
    await pickSurah(user, '114')
    for (let a = 1; a < 6; a++) await user.click(nextVerse())
    await expectVerse(114, 6)
    expect(nextVerse().disabled).toBe(true)
    await user.type(input(), 'mina ljinnati wannaas{Enter}')
    expect(result()!.textContent).toContain('Juste.')
    expect((within(result()!).getByRole('button', { name: 'Verset suivant' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('changer de sourate repart de son premier verset', async () => {
    const user = userEvent.setup()
    await env.open()
    await pickSurah(user, 'vache')
    await user.click(nextVerse())
    await user.click(nextVerse())
    await expectVerse(2, 3)
    await pickSurah(user, 'الكهف')
    await expectVerse(18, 1)
  })

  it('recherche par nom français, arabe, translittération ou numéro', async () => {
    const user = userEvent.setup()
    await env.open()
    await user.click(screen.getByRole('button', { name: /Changer de sourate/ }))
    const search = screen.getByLabelText('Rechercher une sourate')
    const firstResult = () => within(screen.getByRole('list', { name: 'Sourates' })).getAllByRole('button')[0]!.textContent
    for (const [q, name] of [
      ['caverne', 'al-Kahf'],
      ['البقرة', 'al-Baqara'],
      ['kawthar', 'al-Kawṯar'],
      ['55', 'ar-Raḥmān'],
    ] as const) {
      await user.clear(search)
      await user.type(search, q)
      expect(firstResult()).toContain(name)
    }
  })

  it('verset du corpus : lecture écrite à la main, sans mention automatique', async () => {
    const user = userEvent.setup()
    await env.open()
    await pickSurah(user, '113')
    for (let a = 1; a < 4; a++) await user.click(nextVerse())
    await expectVerse(113, 4)
    await user.type(input(), "wa-min charri n-naffaathaati fi l-3uqad{Enter}")
    expect(result()!.textContent).toContain('Juste.')
    expect(result()!.textContent).not.toContain(AUTO_NOTE)
  })

  it('depuis la sélection d’exercices, « Verset suivant » passe au verset suivant', async () => {
    const user = userEvent.setup()
    await env.open()
    await user.click(nextVerse())
    await expectVerse(1, 2)
    expect(screen.getByRole('button', { name: /Revenir à la sélection/ })).toBeTruthy()
  })

  it('position et résultats conservés ; retour à la sélection d’exercices là où elle en était', async () => {
    const user = userEvent.setup()
    await env.open()
    await user.type(input(), 'bismi llaahi rra7maani rra7iim{Enter}')
    await user.click(screen.getByRole('button', { name: 'Phrase suivante' }))
    await screen.findByText(/Phrase 2/)

    await pickSurah(user, '112')
    await user.type(input(), `qul huwa llaahu 'a7ad{Enter}`)
    await env.synced()
    expect(env.backend.data.get(env.aliceId)!.settings!.trainingVerse).toEqual({ surah: 112, ayah: 1 })
    expect(env.backend.data.get(env.aliceId)!.progress!.results['112:1']).toEqual({ first: 'correct', last: 'correct' })
    const attempts = env.backend.data.get(env.aliceId)!.inserts.filter((i) => i.table === 'reading_attempts')
    expect(attempts.map((a) => (a.row as { exercise_id: string }).exercise_id)).toEqual(['1:1', '112:1'])

    await env.reload()
    await expectVerse(112, 1)
    // Autre section puis retour : même verset.
    await user.click(await screen.findByRole('button', { name: 'Alphabet' }))
    await user.click(screen.getByRole('button', { name: 'Lecture' }))
    await expectVerse(112, 1)

    await user.click(screen.getByRole('button', { name: /Revenir à la sélection/ }))
    expect(await screen.findByText(/Phrase 2/)).toBeTruthy()
    expect(screen.getByText(EXERCISES[1]!.arabic)).toBeTruthy()
  })

  it('clics rapides : chaque clic compte, affichage cohérent', async () => {
    const user = userEvent.setup()
    await env.open()
    await pickSurah(user, 'vache')
    await expectVerse(2, 1)
    const btn = nextVerse()
    for (let i = 0; i < 10; i++) btn.click()
    await waitFor(() => expect(counter()).toBe('Verset 11 / 286'))
    await expectVerse(2, 11)
  })
})
