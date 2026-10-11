/**
 * File d'envoi vers le compte : l'interface enregistre sans attendre, la file envoie.
 *
 * - Les documents (réglages, préférences, progression) sont regroupés : seule la dernière
 *   version est envoyée (écriture complète, donc rejouable sans risque).
 * - Les historiques (tentatives, sessions) portent un identifiant généré ici : un envoi
 *   répété après une coupure n'insère pas de doublon.
 * - Tant qu'un envoi n'a pas réussi, la file est conservée dans le localStorage, sous une clé
 *   propre au compte : rien n'est perdu si l'onglet est fermé ou la connexion coupée, et les
 *   modifications repartent à la prochaine ouverture par le même compte.
 */
import type { RevisionPrefs } from '../revision/prefs'
import type { Progress } from '../state/progress'
import type { Settings } from '../state/settings'
import { isRecord } from '../storage/storage'
import type { AppStore, InsertRows, InsertTable, RemoteStore, SyncStatus, UserData } from './types'

type PendingInsert = { [T in InsertTable]: { table: T; row: InsertRows[T] } }[InsertTable]

export interface Outbox {
  settings?: Settings
  revision?: RevisionPrefs
  progress?: Progress
  inserts: PendingInsert[]
}

export interface KeyValue {
  get(key: string): string | null
  set(key: string, value: string): void
  remove(key: string): void
}

export const browserStorage: KeyValue = {
  get: (k) => {
    try {
      return window.localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set: (k, v) => {
    try {
      window.localStorage.setItem(k, v)
    } catch {
      // Stockage plein ou indisponible : la file reste en mémoire.
    }
  },
  remove: (k) => {
    try {
      window.localStorage.removeItem(k)
    } catch {
      // idem
    }
  },
}

export const outboxKey = (userId: string) => `qiraa.outbox.${userId}`

const RETRY_DELAYS = [2_000, 5_000, 15_000, 30_000, 60_000]
const DEBOUNCE = 600

function readOutbox(storage: KeyValue, key: string): Outbox {
  try {
    const raw = JSON.parse(storage.get(key) ?? 'null') as unknown
    if (!isRecord(raw)) return { inserts: [] }
    return {
      settings: raw.settings as Settings | undefined,
      revision: raw.revision as RevisionPrefs | undefined,
      progress: raw.progress as Progress | undefined,
      inserts: Array.isArray(raw.inserts) ? (raw.inserts as PendingInsert[]) : [],
    }
  } catch {
    return { inserts: [] }
  }
}

export interface SyncQueueOptions {
  storage?: KeyValue
  newId?: () => string
  /** Délais injectables pour les tests. */
  debounceMs?: number
  retryDelays?: number[]
}

export class SyncQueue implements AppStore {
  private outbox: Outbox
  private status: SyncStatus
  private listeners = new Set<() => void>()
  private timer: ReturnType<typeof setTimeout> | null = null
  private failures = 0
  private flushing: Promise<boolean> | null = null
  private paused = false
  private readonly storage: KeyValue
  private readonly key: string
  private readonly newId: () => string
  private readonly debounceMs: number
  private readonly retryDelays: number[]

  constructor(
    private readonly remote: RemoteStore,
    userId: string,
    opts: SyncQueueOptions = {},
  ) {
    this.storage = opts.storage ?? browserStorage
    this.key = outboxKey(userId)
    this.newId = opts.newId ?? (() => crypto.randomUUID())
    this.debounceMs = opts.debounceMs ?? DEBOUNCE
    this.retryDelays = opts.retryDelays ?? RETRY_DELAYS
    this.outbox = readOutbox(this.storage, this.key)
    this.status = this.hasPending() ? 'pending' : 'saved'
  }

  /**
   * Applique aux données du serveur les modifications de ce navigateur qui n'ont pas encore
   * été envoyées (elles sont plus récentes), puis lance leur envoi.
   */
  withPending(data: UserData): UserData {
    const merged = {
      ...data,
      settings: this.outbox.settings ?? data.settings,
      revision: this.outbox.revision ?? data.revision,
      progress: this.outbox.progress ?? data.progress,
    }
    if (this.hasPending()) void this.flush()
    return merged
  }

  saveSettings(s: Settings) {
    this.change((o) => ({ ...o, settings: s }))
  }
  saveRevision(p: RevisionPrefs) {
    this.change((o) => ({ ...o, revision: p }))
  }
  saveProgress(p: Progress) {
    this.change((o) => ({ ...o, progress: p }))
  }
  addReadingAttempt(a: Omit<InsertRows['reading_attempts'], 'id'>) {
    this.add({ table: 'reading_attempts', row: { id: this.newId(), ...a } })
  }
  addConjugationAttempt(a: Omit<InsertRows['conjugation_attempts'], 'id'>) {
    this.add({ table: 'conjugation_attempts', row: { id: this.newId(), ...a } })
  }
  addConjugationSession(s: Omit<InsertRows['conjugation_sessions'], 'id'>) {
    this.add({ table: 'conjugation_sessions', row: { id: this.newId(), ...s } })
  }

  hasPending(): boolean {
    const o = this.outbox
    return !!(o.settings || o.revision || o.progress || o.inserts.length)
  }

  getStatus = (): SyncStatus => this.status

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Envoie tout ce qui est en attente. Renvoie true si plus rien n'est en attente. */
  flush(): Promise<boolean> {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (!this.flushing) {
      this.flushing = this.send().finally(() => {
        this.flushing = null
      })
    }
    return this.flushing
  }

  /** Suspend les envois automatiques (déconnexion, démontage). La file reste conservée pour ce compte. */
  pause() {
    this.paused = true
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  resume() {
    this.paused = false
    if (this.hasPending()) this.schedule(0)
  }

  private change(fn: (o: Outbox) => Outbox) {
    this.outbox = fn(this.outbox)
    this.persist()
    this.setStatus(this.failures > 0 ? 'pending' : 'saving')
    this.schedule(this.debounceMs)
  }

  private add(item: PendingInsert) {
    this.change((o) => ({ ...o, inserts: [...o.inserts, item] }))
  }

  private persist() {
    if (this.hasPending()) this.storage.set(this.key, JSON.stringify(this.outbox))
    else this.storage.remove(this.key)
  }

  private setStatus(s: SyncStatus) {
    if (s === this.status) return
    this.status = s
    for (const l of this.listeners) l()
  }

  private schedule(ms: number) {
    if (this.paused) return
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.timer = null
      void this.flush()
    }, ms)
  }

  private async send(): Promise<boolean> {
    // Un envoi déjà en cours a pu laisser de nouvelles modifications : on boucle jusqu'à vider.
    while (this.hasPending()) {
      const snapshot = this.outbox
      this.setStatus(this.failures > 0 ? 'pending' : 'saving')
      try {
        if (snapshot.settings) await this.remote.saveSettings(snapshot.settings)
        if (snapshot.revision) await this.remote.saveRevision(snapshot.revision)
        if (snapshot.progress) await this.remote.saveProgress(snapshot.progress)
        const tables = [...new Set(snapshot.inserts.map((i) => i.table))]
        for (const table of tables) {
          const rows = snapshot.inserts.filter((i) => i.table === table).map((i) => i.row)
          await this.remote.insert(table, rows as never)
        }
      } catch {
        this.failures++
        this.setStatus('pending')
        const delay = this.retryDelays[Math.min(this.failures - 1, this.retryDelays.length - 1)]!
        this.schedule(delay)
        return false
      }
      // Ne retirer que ce qui a été envoyé : une modification arrivée pendant l'envoi reste.
      const sent = new Set(snapshot.inserts)
      this.outbox = {
        settings: this.outbox.settings === snapshot.settings ? undefined : this.outbox.settings,
        revision: this.outbox.revision === snapshot.revision ? undefined : this.outbox.revision,
        progress: this.outbox.progress === snapshot.progress ? undefined : this.outbox.progress,
        inserts: this.outbox.inserts.filter((i) => !sent.has(i)),
      }
      this.failures = 0
      this.persist()
    }
    this.setStatus('saved')
    return true
  }
}
