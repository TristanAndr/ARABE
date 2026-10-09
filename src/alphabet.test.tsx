// @vitest-environment jsdom
import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LETTERS } from './alphabet/letters'
import { createEnv } from './test/env'

let env: ReturnType<typeof createEnv>
beforeEach(() => {
  env = createEnv()
})
afterEach(cleanup)

type User = ReturnType<typeof userEvent.setup>

async function openAlphabet(user: User) {
  await env.open()
  await user.click(screen.getByRole('button', { name: 'Alphabet' }))
  await screen.findByRole('heading', { level: 1, name: /L’alphabet arabe/ })
}

/** Répond juste à la question affichée (mode Lettre → nom). */
async function answerCurrent(user: User, correct: boolean) {
  const shown = document.querySelector('[class*="promptLetter"]')!.textContent!
  const target = LETTERS.find((l) => l.letter === shown)!
  const radios = screen.getAllByRole('radio') as HTMLInputElement[]
  const pick = radios.find((r) => (r.value === target.letter) === correct)!
  await user.click(pick)
  await user.keyboard('{Enter}')
  return target
}

describe('section Alphabet', () => {
  it('accessible depuis la navigation, sans perturber les autres sections', async () => {
    const user = userEvent.setup()
    await openAlphabet(user)
    expect(screen.getByRole('button', { name: 'Alphabet' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByText(/de droite à gauche/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Lecture' }))
    expect(await screen.findByLabelText('Transcription')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Révision' }))
    expect(screen.getByRole('heading', { level: 1, name: /Le présent/ })).toBeTruthy()
  })

  it('affiche les 28 lettres, de ا à ي', async () => {
    const user = userEvent.setup()
    await openAlphabet(user)
    const grid = screen.getByRole('list', { name: 'Lettres de l’alphabet' })
    const cells = within(grid).getAllByRole('button')
    expect(cells).toHaveLength(28)
    expect(cells[0]!.textContent).toContain('ا')
    expect(cells[27]!.textContent).toContain('ي')
    expect(screen.getByText(/0 acquise · 0 à revoir · 28 à découvrir/)).toBeTruthy()
  })

  it('fiche détaillée, lettre précédente et suivante', async () => {
    const user = userEvent.setup()
    await openAlphabet(user)
    await user.click(screen.getByRole('button', { name: /^Bāʾ/ }))
    const detail = () => screen.getByRole('region', { name: /Bāʾ|Tāʾ|Alif/ })
    expect(detail().textContent).toContain('بَاء')
    expect(detail().textContent).toContain('Lettre 2 sur 28')
    for (const form of ['بـ', 'ـبـ', 'ـب']) expect(detail().textContent).toContain(form)

    await user.click(screen.getByRole('button', { name: /Suivante/ }))
    expect(screen.getByRole('heading', { level: 2, name: /Tāʾ/ })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Précédente/ }))
    await user.click(screen.getByRole('button', { name: /Précédente/ }))
    expect(screen.getByRole('heading', { level: 2, name: /Alif/ })).toBeTruthy()
    expect((screen.getByRole('button', { name: /Précédente/ }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('lettre non liante : formes initiale et médiane signalées comme inexistantes', async () => {
    const user = userEvent.setup()
    await openAlphabet(user)
    await user.click(screen.getByRole('button', { name: /^Dāl/ }))
    const missing = screen.getAllByText('n’existe pas')
    expect(missing).toHaveLength(2)
    expect(screen.getByText(/jamais à la suivante/)).toBeTruthy()
  })

  it('tableau récapitulatif : 28 lignes, « — » pour les six lettres non liantes', async () => {
    const user = userEvent.setup()
    await openAlphabet(user)
    await user.click(screen.getByRole('button', { name: 'Tableau' }))
    const rows = document.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(28)
    const nonJoining = [...rows].filter((r) => r.getAttribute('data-joins') === 'false')
    expect(nonJoining.map((r) => r.getAttribute('data-letter'))).toEqual(['ا', 'د', 'ذ', 'ر', 'ز', 'و'])
    for (const r of nonJoining) expect(within(r as HTMLElement).getAllByLabelText('n’existe pas')).toHaveLength(2)
    const b = document.querySelector('tr[data-letter="ب"]')!
    expect(within(b as HTMLElement).queryByLabelText('n’existe pas')).toBeNull()
  })

  it('révision : correction claire, suivi enregistré dans le compte et retrouvé', async () => {
    const user = userEvent.setup()
    await openAlphabet(user)
    await user.click(screen.getByRole('button', { name: 'S’entraîner' }))
    expect(screen.getByRole('heading', { level: 1, name: /L’alphabet arabe/ })).toBeTruthy()

    const wrong = await answerCurrent(user, false)
    const status = screen.getByRole('status', { name: 'Résultat' })
    expect(status.textContent).toContain('Pas tout à fait.')
    expect(status.textContent).toContain(wrong.name)
    await user.click(screen.getByRole('button', { name: 'Question suivante' }))

    const right = await answerCurrent(user, true)
    expect(screen.getByRole('status', { name: 'Résultat' }).textContent).toContain('Juste.')
    expect(screen.getByText(/Correctes :/).textContent).toContain('1 / 2')

    await env.synced()
    const saved = env.backend.data.get(env.aliceId)!.alphabet!
    expect(saved[wrong.letter]).toEqual({ seen: 1, correct: 0, streak: 0 })
    expect(saved[right.letter]).toEqual({ seen: 1, correct: 1, streak: 1 })

    await env.reload()
    await screen.findByLabelText('Transcription')
    await user.click(screen.getByRole('button', { name: 'Alphabet' }))
    expect(screen.getByText(/0 acquise · 2 à revoir · 26 à découvrir/)).toBeTruthy()
  })

  it('mode Nom → lettre', async () => {
    const user = userEvent.setup()
    await openAlphabet(user)
    await user.click(screen.getByRole('button', { name: 'S’entraîner' }))
    await user.click(screen.getByRole('button', { name: 'Nom → lettre' }))
    const name = document.querySelector('[class*="promptName"]')!.textContent!
    const target = LETTERS.find((l) => l.name === name)!
    const radio = (screen.getAllByRole('radio') as HTMLInputElement[]).find((r) => r.value === target.letter)!
    await user.click(radio)
    await user.click(screen.getByRole('button', { name: 'Valider' }))
    expect(screen.getByRole('status', { name: 'Résultat' }).textContent).toContain('Juste.')
  })

  it('suivi indépendant entre deux comptes', async () => {
    const user = userEvent.setup()
    const bobId = env.auth.addAccount('bob@example.test', 'motdepasse-bob')
    await openAlphabet(user)
    await user.click(screen.getByRole('button', { name: 'S’entraîner' }))
    await answerCurrent(user, true)
    await env.synced()
    expect(env.backend.data.get(bobId)?.alphabet ?? null).toBeNull()
    expect(Object.keys(env.backend.data.get(env.aliceId)!.alphabet!)).toHaveLength(1)
  })

  it('sans la table alphabet_progress : tout fonctionne, le suivi est signalé comme non enregistré', async () => {
    env.backend.alphabetMissing = true
    const user = userEvent.setup()
    await openAlphabet(user)
    await user.click(screen.getByRole('button', { name: 'S’entraîner' }))
    expect(screen.getByText(/pas encore enregistré dans ton compte/)).toBeTruthy()
    await answerCurrent(user, true)
    // Rien n'est mis en file : les autres enregistrements ne sont pas bloqués.
    await env.synced()
    expect(screen.queryByText('Non enregistré')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Lettres' }))
    expect(screen.getByText(/1 à revoir/)).toBeTruthy()
  })
})
