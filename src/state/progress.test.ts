import { describe, expect, it } from 'vitest'
import { EXERCISES } from '../data/corpus'
import { makeOrder, newProgress, recordResult, sanitizeProgress } from './progress'

describe('progression', () => {
  it('ne compte que la première vérification de chaque exercice', () => {
    let p = newProgress('mushaf')
    p = recordResult(p, '1:1', 'partial')
    p = recordResult(p, '1:1', 'correct')
    p = recordResult(p, '1:2', 'correct')
    expect(p.totals).toEqual({ validated: 2, correct: 1 })
    expect(p.results['1:1']).toEqual({ first: 'partial', last: 'correct' })
  })

  it('mélange sans perdre d’exercice', () => {
    const ids = makeOrder('random', () => 0.3)
    expect([...ids].sort()).toEqual(EXERCISES.map((e) => e.id).sort())
  })

  it('répare un état stocké incomplet ou obsolète', () => {
    const p = sanitizeProgress({ order: ['999:1', '1:1'], index: 99, results: { '1:1': { first: 'x', last: 'correct' } } })!
    expect(p.order[0]).toBe('1:1')
    expect(p.order).toHaveLength(EXERCISES.length)
    expect(p.index).toBe(EXERCISES.length)
    expect(p.results).toEqual({})
    expect(sanitizeProgress('nope')).toBeNull()
  })
})
