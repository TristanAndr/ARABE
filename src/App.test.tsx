// @vitest-environment jsdom
import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { EXERCISES } from './data/corpus'
import { formsForVerb, FORMS, grammarLabel, verbOf } from './revision/conjugation'
import { createEnv } from './test/env'

let env: ReturnType<typeof createEnv>
beforeEach(() => {
  env = createEnv()
})
afterEach(cleanup)

const input = () => screen.getByLabelText('Transcription') as HTMLInputElement
const result = () => screen.queryByRole('region', { name: 'Résultat' })

describe('exercice', () => {
  it('affiche le premier segment en arabe vocalisé, de droite à gauche', async () => {
    await env.open()
    const verse = screen.getByText(EXERCISES[0]!.arabic)
    expect(verse.getAttribute('dir')).toBe('rtl')
    expect(verse.getAttribute('lang')).toBe('ar')
    expect(screen.getByText(/Phrase 1/)).toBeTruthy()
    // La référence n'est pas révélée avant la vérification.
    expect(screen.queryByText('r-ra7maani')).toBeNull()
  })

  it('ne vérifie pas une saisie vide', async () => {
    const user = userEvent.setup()
    await env.open()
    await user.type(input(), '   {Enter}')
    expect(result()).toBeNull()
    expect((screen.getByRole('button', { name: 'Vérifier' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('Entrée et le bouton Vérifier donnent le même résultat, sans vider le champ', async () => {
    const user = userEvent.setup()
    await env.open()
    await user.type(input(), 'bismi llahi rra7maani rra7iim{Enter}')
    const viaEnter = result()!.textContent
    expect(viaEnter).toContain('Presque.')
    expect(input().value).toBe('bismi llahi rra7maani rra7iim')

    await user.click(screen.getByRole('button', { name: 'Vérifier' }))
    expect(result()!.textContent).toBe(viaEnter)
    expect(input().value).toBe('bismi llahi rra7maani rra7iim')
  })

  it('phrase suivante : nouvel exercice, champ et résultat réinitialisés, progression conservée', async () => {
    const user = userEvent.setup()
    await env.open()
    await user.type(input(), 'bismi llaahi rra7maani rra7iim{Enter}')
    expect(result()!.textContent).toContain('Juste.')
    await user.click(screen.getByRole('button', { name: 'Phrase suivante' }))

    expect(screen.getByText(EXERCISES[1]!.arabic)).toBeTruthy()
    expect(input().value).toBe('')
    expect(result()).toBeNull()
    expect(screen.getByText(/1 vérifiée · 1 juste/)).toBeTruthy()

    await env.reload()
    expect(await screen.findByText(/Phrase 2/)).toBeTruthy()
  })
})

describe('paramètres', () => {
  it('changer de profil change la vérification et survit au rechargement', async () => {
    const user = userEvent.setup()
    await env.open()
    await user.click(screen.getByRole('button', { name: 'Paramètres' }))
    await user.click(screen.getByLabelText(/Translittération précise/))
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await user.click(screen.getByRole('button', { name: "Retour à l'exercice" }))

    await user.type(input(), 'bismi llāhi r-raḥmāni r-raḥīm{Enter}')
    expect(result()!.textContent).toContain('Juste.')

    await env.reload()
    await screen.findByLabelText('Transcription')
    await user.click(screen.getByRole('button', { name: 'Paramètres' }))
    expect((screen.getByLabelText(/Translittération précise/) as HTMLInputElement).checked).toBe(true)
  })

  it('une correspondance personnalisée influence réellement la validation', async () => {
    const user = userEvent.setup()
    await env.open()
    await user.click(screen.getByRole('button', { name: 'Paramètres' }))
    await user.type(screen.getByLabelText('Graphie personnalisée pour ḥāʾ'), 'H')
    expect((screen.getByLabelText(/Personnalisé/) as HTMLInputElement).checked).toBe(true)
    await user.click(screen.getByLabelText(/Ignorer les majuscules/))
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await user.click(screen.getByRole('button', { name: "Retour à l'exercice" }))

    await user.type(input(), 'bismi llaahi rraHmaani rraHiim{Enter}')
    expect(result()!.textContent).toContain('Juste.')
    expect(within(result()!).getByText('r-raHmaani')).toBeTruthy()

    await user.clear(input())
    await user.type(input(), 'bismi llaahi rra7maani rra7iim{Enter}')
    expect(result()!.textContent).toContain('2 écarts')
  })

  it('refuse une graphie contenant un séparateur', async () => {
    const user = userEvent.setup()
    await env.open()
    await user.click(screen.getByRole('button', { name: 'Paramètres' }))
    await user.type(screen.getByLabelText('Graphie personnalisée pour ʿayn'), 'a-a')
    expect(screen.getByText(/Refusé : a-a/)).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Enregistrer' }) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('révision', () => {
  const openRevision = async (user: ReturnType<typeof userEvent.setup>) => {
    await env.open()
    await user.click(screen.getByRole('button', { name: 'Révision' }))
  }

  it('la navigation mène à la fiche et revient à la lecture sans la perturber', async () => {
    const user = userEvent.setup()
    await openRevision(user)
    expect(screen.getByRole('heading', { level: 1, name: /Le présent/ })).toBeTruthy()
    expect(screen.queryByLabelText('Transcription')).toBeNull()
    expect(screen.getByRole('button', { name: 'Révision' }).getAttribute('aria-current')).toBe('page')

    await user.click(screen.getByRole('button', { name: 'Lecture' }))
    expect(screen.getByText(EXERCISES[0]!.arabic)).toBeTruthy()
    expect(screen.getByText(/Phrase 1/)).toBeTruthy()
  })

  it('la fiche affiche les 14 formes avec les segments colorés', async () => {
    const user = userEvent.setup()
    await openRevision(user)
    const rows = document.querySelectorAll('tr[data-form]')
    expect(rows).toHaveLength(14)
    const row = document.querySelector('tr[data-form="2fs"]')!
    expect(row.textContent).toContain('أَنْتِ')
    expect(row.textContent).toContain('تَفْعَلِينَ')
    expect(row.textContent).toContain('tu fais')
  })

  it('les paramètres ramènent à la révision', async () => {
    const user = userEvent.setup()
    await openRevision(user)
    await user.click(screen.getByRole('button', { name: 'Paramètres' }))
    await user.click(screen.getByRole('button', { name: 'Retour à la révision' }))
    expect(screen.getByRole('heading', { level: 1, name: /Le présent/ })).toBeTruthy()
  })

  it('mode verbe : choisir, valider avec Entrée, voir le retour, passer à la suite', async () => {
    const user = userEvent.setup()
    await openRevision(user)
    expect(screen.getByText(/Question 1/)).toBeTruthy()
    const options = screen.getAllByRole('radio') as HTMLInputElement[]
    expect(options).toHaveLength(4)

    // Choisir une mauvaise réponse pour voir la correction.
    const wrong = options.find((o) => o.value !== verbOf(currentForm()))!
    await user.click(wrong)
    await user.keyboard('{Enter}')

    const status = screen.getByRole('status', { name: 'Résultat' })
    expect(status.textContent).toContain('Pas tout à fait.')
    expect(screen.getByText(/Correctes :/).textContent).toContain('0 / 1')

    await user.click(screen.getByRole('button', { name: 'Question suivante' }))
    expect(screen.getByText(/Question 2/)).toBeTruthy()
    expect(screen.queryByRole('status', { name: 'Résultat' })).toBeNull()
  })

  it('mode verbe, saisie : la bonne forme vocalisée est jugée juste', async () => {
    const user = userEvent.setup()
    await openRevision(user)
    await user.click(screen.getByRole('button', { name: 'Écrire' }))
    const answer = verbOf(currentForm())
    await user.type(screen.getByLabelText(/Forme verbale/), `${answer}{Enter}`)
    expect(screen.getByRole('status', { name: 'Résultat' }).textContent).toContain('Juste.')
    expect(screen.getByText(/Correctes :/).textContent).toContain('1 / 1')
  })

  it('mode pronom : un pronom compatible est juste, recommencer remet le compteur à zéro', async () => {
    const user = userEvent.setup()
    await openRevision(user)
    await user.click(screen.getByRole('button', { name: 'Retrouver le pronom' }))
    const verb = document.querySelector('[class*="promptAr"]')!.textContent!
    const id = formsForVerb(verb)[0]!.id
    const radio = (screen.getAllByRole('radio') as HTMLInputElement[]).find((r) => r.value === id)!
    await user.click(radio)
    await user.click(screen.getByRole('button', { name: 'Valider' }))
    expect(screen.getByRole('status', { name: 'Résultat' }).textContent).toContain('Juste.')

    await user.click(screen.getByRole('button', { name: 'Recommencer' }))
    expect(screen.getByText(/Correctes :/).textContent).toContain('0 / 0')
    expect(screen.getByText(/Question 1/)).toBeTruthy()
  })
})

/** Forme attendue pour la question affichée (pronom arabe + description grammaticale). */
function currentForm() {
  const pronoun = document.querySelector('[class*="promptAr"]')!.textContent!
  const label = document.querySelector('[class*="promptFr"]')!.textContent!
  return FORMS.find((f) => f.pronoun === pronoun && label === `${f.pronounFr} · ${grammarLabel(f)}`)!
}
