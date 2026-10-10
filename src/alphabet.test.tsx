// @vitest-environment jsdom
import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FLASHCARDS } from './alphabet/flashcards'
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

const shownForm = () => screen.getByTestId('flashcard-letter').textContent!

function cardOf(form: string) {
  const card = FLASHCARDS.find((c) => c.form === form)
  if (!card) throw new Error(`Forme inconnue : ${form}`)
  return card
}

async function openTraining(user: User) {
  await openAlphabet(user)
  await user.click(screen.getByRole('button', { name: 'S’entraîner' }))
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

  it('entraînement : une lettre tout de suite, réponse masquée, « Suivant » seulement après la réponse', async () => {
    const user = userEvent.setup()
    await openTraining(user)
    expect(screen.getByRole('heading', { level: 1, name: /L’alphabet arabe/ })).toBeTruthy()

    const card = cardOf(shownForm())
    expect(screen.getByTestId('flashcard-letter').getAttribute('dir')).toBe('rtl')
    expect(screen.queryByRole('region', { name: 'Réponse' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Suivant' })).toBeNull()
    // Ni score ni fin de série.
    expect(screen.queryByText(/sur 10|Correctes|Question \d/)).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Afficher la réponse' }))
    const answer = screen.getByRole('region', { name: 'Réponse' })
    expect(answer.textContent).toContain(card.letter.name)
    expect(answer.textContent).toContain(card.letter.nameAr)
    expect(answer.textContent).toMatch(/Forme (isolée|initiale|médiane|finale)/)
    expect(screen.queryByRole('button', { name: 'Afficher la réponse' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Suivant' }))
    expect(screen.queryByRole('region', { name: 'Réponse' })).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Afficher la réponse' }))
  })

  it('cycle sans fin, au clavier : jamais deux fois de suite la même carte', async () => {
    const user = userEvent.setup()
    await openTraining(user)
    let previous = cardOf(shownForm())
    for (let i = 0; i < 40; i++) {
      await user.click(screen.getByRole('button', { name: 'Afficher la réponse' }))
      expect(screen.getByRole('region', { name: 'Réponse' }).textContent).toContain(previous.letter.name)
      // Le focus est sur « Suivant » : Entrée passe à la carte suivante.
      await user.keyboard('{Enter}')
      const card = cardOf(shownForm())
      expect(card.letter === previous.letter && card.position === previous.position).toBe(false)
      previous = card
    }
  })

  it('le suivi déjà enregistré reste affiché dans la fiche ; l’entraînement n’écrit rien', async () => {
    const user = userEvent.setup()
    await env.open()
    await env.synced()
    env.backend.data.get(env.aliceId)!.alphabet = {
      ب: { seen: 2, correct: 2, streak: 2 },
      ت: { seen: 1, correct: 0, streak: 0 },
    }
    await env.reload()
    await screen.findByLabelText('Transcription')
    await user.click(screen.getByRole('button', { name: 'Alphabet' }))
    expect(screen.getByText(/1 acquise · 1 à revoir · 26 à découvrir/)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'S’entraîner' }))
    for (let i = 0; i < 5; i++) {
      await user.click(screen.getByRole('button', { name: 'Afficher la réponse' }))
      await user.click(screen.getByRole('button', { name: 'Suivant' }))
    }
    await env.synced()
    expect(Object.keys(env.backend.data.get(env.aliceId)!.alphabet!)).toHaveLength(2)
  })
})
