import { describe, expect, it } from 'vitest'
import { distinctVerbs, FORMS, formsForVerb, verbOf } from './conjugation'
import { buildSession, shuffle, verbOptions } from './quiz'

/** Générateur déterministe pour des tests reproductibles. */
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32
    return s / 2 ** 32
  }
}

describe('sessions', () => {
  it('mode verbe : une question par forme de la fiche, réponse tirée des données', () => {
    const qs = buildSession('verbe', seeded(1))
    expect(qs).toHaveLength(FORMS.length)
    expect(new Set(qs.map((q) => (q.kind === 'verbe' ? q.form.id : ''))).size).toBe(FORMS.length)
    for (const q of qs) {
      if (q.kind !== 'verbe') throw new Error()
      expect(q.expected).toBe(verbOf(q.form))
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options).size).toBe(4)
      expect(q.options.filter((o) => o === q.expected)).toHaveLength(1)
      for (const o of q.options) expect(distinctVerbs()).toContain(o)
    }
  })

  it('mode pronom : une question par forme distincte, avec tous les pronoms acceptés', () => {
    const qs = buildSession('pronom', seeded(2))
    expect(qs).toHaveLength(distinctVerbs().length)
    for (const q of qs) {
      if (q.kind !== 'pronom') throw new Error()
      expect(q.accepted).toEqual(formsForVerb(q.verb))
      expect(q.accepted.length).toBeGreaterThan(0)
    }
  })

  it('options : les rivales partagent en priorité le préfixe ou la terminaison', () => {
    const f = FORMS.find((x) => x.id === '3mp')! // يَفْعَلُونَ
    const opts = verbOptions(f, seeded(3)).filter((o) => o !== verbOf(f))
    expect(opts.every((o) => o.startsWith('يَ') || o.endsWith('ونَ'))).toBe(true)
  })

  it('shuffle conserve les éléments', () => {
    expect(shuffle([1, 2, 3, 4, 5], seeded(4)).sort()).toEqual([1, 2, 3, 4, 5])
  })
})
