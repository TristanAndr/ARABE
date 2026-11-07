// @vitest-environment jsdom
import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LEXICON, WBW_TEXTS } from './data/wordByWord'
import { textKeys } from './revision/wordQuiz'
import { createEnv } from './test/env'

let env: ReturnType<typeof createEnv>
beforeEach(() => {
  env = createEnv()
  window.localStorage.clear()
})
afterEach(cleanup)

type User = ReturnType<typeof userEvent.setup>

const KEY_BY_WORD = new Map(WBW_TEXTS.flatMap((t) => t.verses.flatMap((v) => v.words.map((w) => [w.ar, w.key] as const))))

async function open(user: User) {
  await env.open()
  await user.click(screen.getByRole('button', { name: 'Mot à mot' }))
  await screen.findByRole('heading', { level: 1, name: /Mot à mot/ })
}

/** Le mot demandé, d'après le mot surligné dans le verset. */
const askedKey = () => KEY_BY_WORD.get(document.querySelector('mark')!.textContent!)!

describe('section Mot à mot', () => {
  it('le cours : chaque verset mot par mot, un mot touché montre son découpage', async () => {
    const user = userEvent.setup()
    await open(user)
    const gauge = `0 / ${textKeys(WBW_TEXTS[0]!).length} mots acquis`
    expect(screen.getByText((_, el) => el?.tagName === 'SPAN' && el.textContent === gauge)).toBeTruthy()
    const verse = screen.getByRole('region', { name: 'Verset 1:1' })
    expect(within(verse).getAllByRole('button', { expanded: false })).toHaveLength(4)
    expect(verse.textContent).toContain('au nom de')
    expect(verse.textContent).toContain('Au nom d’Allah, le Tout Miséricordieux')

    await user.click(within(verse).getByRole('button', { name: /بِسْمِ/ }))
    const detail = within(verse).getByRole('status')
    expect(detail.textContent).toContain('par, au')
    expect(detail.textContent).toContain('nom de')

    await user.click(screen.getByRole('button', { name: /Āyat al-Kursi/ }))
    expect(screen.getAllByRole('region', { name: /^Verset/ })).toHaveLength(1)
    expect(screen.getByRole('region', { name: 'Verset 2:255' }).textContent).toContain('le Vivant')

    await user.click(screen.getByRole('button', { name: /Al-Mulk/ }))
    expect(screen.getAllByRole('region', { name: /^Verset 67:/ })).toHaveLength(30)

    await user.click(screen.getByRole('button', { name: /At-Tashahhud/ }))
    const part1 = screen.getByRole('region', { name: 'Tashahhud, partie 1' })
    expect(part1.textContent).toContain('التَّحِيَّاتُ')
    expect(part1.textContent).toContain('les salutations')
    expect(part1.textContent).toContain('Tashahhud · partie 1')
    expect(screen.getAllByRole('region', { name: /^Tashahhud/ })).toHaveLength(5)
  })

  it('le jeu : le sens du mot surligné parmi trois ; une erreur le fait revenir en fin de série', async () => {
    const user = userEvent.setup()
    await open(user)
    await user.click(screen.getByRole('button', { name: /Al-Ikhlāṣ/ }))
    await user.click(screen.getByRole('button', { name: 'S’entraîner' }))
    expect(screen.getByText(/Question 1/).textContent).toContain('sur 10')

    const options = () => screen.getAllByRole('radio')
    expect(options()).toHaveLength(3)

    // Bonne réponse.
    const right = askedKey()
    await user.click(screen.getByRole('radio', { name: LEXICON[right]!.fr }))
    await user.click(screen.getByRole('button', { name: 'Valider' }))
    expect(screen.getByRole('status', { name: 'Résultat' }).textContent).toContain('Juste')
    await user.click(screen.getByRole('button', { name: 'Question suivante' }))

    // Mauvaise réponse : le mot est ajouté à la fin.
    const asked = askedKey()
    const wrong = options().find((o) => o.getAttribute('value') !== asked)!
    await user.click(wrong)
    await user.click(screen.getByRole('button', { name: 'Valider' }))
    expect(screen.getByRole('status', { name: 'Résultat' }).textContent).toContain('Pas tout à fait')
    expect(screen.getByText(/Question 2/).textContent).toContain('sur 11')

    // La maîtrise est retenue : le mot juste compte dans la jauge après trois bonnes réponses.
    expect(JSON.parse(window.localStorage.getItem('qiraa.motamot.maitrise')!)).toMatchObject({ [right]: 1, [asked]: 0 })
  })

  it('Al-Mulk : l’entraînement se limite aux versets choisis, et la plage est retenue', async () => {
    const user = userEvent.setup()
    await open(user)
    await user.click(screen.getByRole('button', { name: /Al-Mulk/ }))
    await user.click(screen.getByRole('button', { name: 'S’entraîner' }))
    const picker = screen.getByRole('group', { name: 'Versets travaillés' })
    await user.selectOptions(within(picker).getByRole('combobox', { name: /au verset/ }), '2')
    expect(picker.textContent).toContain('Tout le texte')

    const ref = () => screen.getByText(/al-Mulk · 67:/).textContent!
    for (let i = 0; i < 6; i++) {
      expect(['al-Mulk · 67:1', 'al-Mulk · 67:2']).toContain(ref())
      const key = askedKey()
      await user.click(screen.getByRole('radio', { name: LEXICON[key]!.fr }))
      await user.click(screen.getByRole('button', { name: 'Valider' }))
      await user.click(screen.getByRole('button', { name: /Question suivante|Voir le résultat/ }))
    }
    expect(JSON.parse(window.localStorage.getItem('qiraa.motamot.plage')!)).toEqual({ mulk: { from: 1, to: 2 } })

    // Les textes courts se font en entier.
    await user.click(screen.getByRole('button', { name: /Al-Ikhlāṣ/ }))
    expect(screen.queryByRole('group', { name: /travaillés/ })).toBeNull()
  })
})
