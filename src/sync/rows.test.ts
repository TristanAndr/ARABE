import { describe, expect, it } from 'vitest'
import { newProgress, recordResult } from '../state/progress'
import { progressFromRow, progressToRow, sessionFromRow, settingsFromRow } from './rows'

describe('conversion ligne SQL ↔ état', () => {
  it('progression : aller-retour sans perte', () => {
    const p = recordResult(newProgress('mushaf'), '1:1', 'partial')
    expect(progressFromRow(progressToRow(p))).toEqual(p)
  })

  it('données inattendues venant de la base : nettoyées comme l’ancien stockage', () => {
    const p = progressFromRow({ session_order: ['999:9'], session_index: 999, session_results: { x: 1 }, totals_validated: 2, totals_correct: 1 })!
    expect(p.order).not.toContain('999:9')
    expect(p.index).toBe(p.order.length)
    expect(p.results).toEqual({})
    expect(progressFromRow(null)).toBeNull()
  })

  it('réglages absents : null (valeurs par défaut côté interface)', () => {
    expect(settingsFromRow(null)).toEqual({ settings: null, revision: null })
    expect(settingsFromRow({ settings: { profileId: 'precise' }, revision_prefs: null }).settings!.profileId).toBe('precise')
  })

  it('session de conjugaison', () => {
    expect(sessionFromRow({ mode: 'pronom', method: 'choix', correct: 9, total: 11, completed_at: 'x' })).toEqual({
      mode: 'pronom', method: 'choix', correct: 9, total: 11, completedAt: 'x',
    })
    expect(sessionFromRow({ mode: '???', method: 'choix', correct: 1, total: 1, completed_at: 'x' })).toBeNull()
  })
})
