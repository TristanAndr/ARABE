import { describe, expect, it } from 'vitest'
import { newProgress } from '../state/progress'
import { DEFAULT_SETTINGS } from '../state/settings'
import { MemoryBackend, memoryStorage } from '../test/memoryBackend'
import { outboxKey, SyncQueue } from './syncQueue'

const USER = 'u1'
let n = 0
const ids = () => `id-${++n}`
const opts = (storage = memoryStorage()) => ({ storage, newId: ids, debounceMs: 0, retryDelays: [5] })

describe('SyncQueue', () => {
  it('envoie la dernière version des documents et les insertions', async () => {
    const backend = new MemoryBackend()
    const q = new SyncQueue(backend.storeFor(USER), USER, opts())
    q.saveSettings({ ...DEFAULT_SETTINGS, order: 'random' })
    q.saveSettings({ ...DEFAULT_SETTINGS, theme: 'dark' })
    q.addReadingAttempt({ exercise_id: '1:1', verdict: 'correct', answer: 'x' })
    expect(await q.flush()).toBe(true)
    expect(backend.data.get(USER)!.settings!.theme).toBe('dark')
    expect(backend.data.get(USER)!.settings!.order).toBe('mushaf')
    expect(backend.data.get(USER)!.inserts).toHaveLength(1)
    expect(q.getStatus()).toBe('saved')
  })

  it('en cas d’échec : conserve tout dans le stockage local, puis réessaie', async () => {
    const backend = new MemoryBackend()
    const storage = memoryStorage()
    backend.failing = true
    const q = new SyncQueue(backend.storeFor(USER), USER, opts(storage))
    q.saveProgress(newProgress('mushaf'))
    q.addConjugationSession({ mode: 'verbe', method: 'choix', correct: 3, total: 14 })
    expect(await q.flush()).toBe(false)
    expect(q.getStatus()).toBe('pending')
    expect(JSON.parse(storage.get(outboxKey(USER))!).inserts).toHaveLength(1)

    backend.failing = false
    await new Promise((r) => setTimeout(r, 30)) // nouvel essai automatique
    expect(q.hasPending()).toBe(false)
    expect(storage.get(outboxKey(USER))).toBeNull()
    expect(backend.data.get(USER)!.progress).not.toBeNull()
    q.pause()
  })

  it('une nouvelle file pour le même compte reprend les envois en attente', async () => {
    const backend = new MemoryBackend()
    const storage = memoryStorage()
    backend.failing = true
    const first = new SyncQueue(backend.storeFor(USER), USER, opts(storage))
    first.saveSettings({ ...DEFAULT_SETTINGS, theme: 'light' })
    await first.flush()
    first.pause()

    backend.failing = false
    const second = new SyncQueue(backend.storeFor(USER), USER, opts(storage))
    // Les modifications non envoyées priment sur la version (plus ancienne) du serveur.
    const merged = second.withPending({ settings: null, revision: null, progress: null, conjugationSessions: [] })
    expect(merged.settings!.theme).toBe('light')
    await second.flush()
    expect(backend.data.get(USER)!.settings!.theme).toBe('light')
  })

  it('la file d’un compte n’est jamais reprise par un autre compte', () => {
    const storage = memoryStorage()
    storage.set(outboxKey('autre'), JSON.stringify({ settings: { ...DEFAULT_SETTINGS, theme: 'dark' }, inserts: [] }))
    const q = new SyncQueue(new MemoryBackend().storeFor(USER), USER, opts(storage))
    expect(q.hasPending()).toBe(false)
    expect(q.withPending({ settings: null, revision: null, progress: null, conjugationSessions: [] }).settings).toBeNull()
  })

  it('une insertion renvoyée après une coupure ne crée pas de doublon', async () => {
    const backend = new MemoryBackend()
    const store = backend.storeFor(USER)
    const row = { id: 'fixe', exercise_id: '1:1', verdict: 'correct' as const, answer: '' }
    await store.insert('reading_attempts', [row])
    await store.insert('reading_attempts', [row])
    expect(backend.data.get(USER)!.inserts).toHaveLength(1)
  })

  it('une modification faite pendant un envoi n’est pas perdue', async () => {
    const backend = new MemoryBackend()
    const remote = backend.storeFor(USER)
    let release!: () => void
    const slow = { ...remote, saveSettings: async (s: typeof DEFAULT_SETTINGS) => { await new Promise<void>((r) => (release = r)); await remote.saveSettings(s) } }
    const q = new SyncQueue(slow, USER, opts())
    q.saveSettings({ ...DEFAULT_SETTINGS, theme: 'light' })
    const sending = q.flush()
    await Promise.resolve()
    q.saveSettings({ ...DEFAULT_SETTINGS, theme: 'dark' })
    release()
    await new Promise((r) => setTimeout(r, 0))
    release()
    await sending
    await q.flush()
    expect(backend.data.get(USER)!.settings!.theme).toBe('dark')
  })
})
