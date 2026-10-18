import { describe, expect, it } from 'vitest'
import { cheerFor, pointsFor, scoreOf, starsFor } from './game'

describe('gamification', () => {
  it('les points montent avec la série, plafonnés à 30', () => {
    expect([1, 2, 3, 4, 5, 6, 9].map(pointsFor)).toEqual([10, 15, 20, 25, 30, 30, 30])
  })

  it('une erreur remet la série à zéro sans retirer de points', () => {
    expect(scoreOf([true, true, false, true])).toEqual({ points: 10 + 15 + 10, combo: 1, bestCombo: 2 })
    expect(scoreOf([])).toEqual({ points: 0, combo: 0, bestCombo: 0 })
  })

  it('étoiles selon la part de bonnes réponses', () => {
    expect(starsFor(10, 10)).toBe(3)
    expect(starsFor(7, 10)).toBe(2)
    expect(starsFor(4, 10)).toBe(1)
    expect(starsFor(3, 10)).toBe(0)
    expect(starsFor(0, 0)).toBe(0)
  })

  it('encouragements aux paliers seulement', () => {
    expect(cheerFor(2)).toBeNull()
    expect(cheerFor(3)).toBe('Bien joué !')
    expect(cheerFor(5)).toBe('Quelle série !')
    expect(cheerFor(15)).toBe('Inarrêtable !')
    expect(cheerFor(16)).toBeNull()
  })
})
