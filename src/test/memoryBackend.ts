/**
 * Doublures de test : un faux Supabase Auth et un stockage de données en mémoire, isolé par
 * compte. Elles servent aux tests d'interface ; la sécurité réelle (RLS) est testée sur
 * PostgreSQL dans supabase/tests/rls.test.ts.
 */
import type { Session, User } from '@supabase/supabase-js'
import type { AuthClient } from '../auth/useAuth'
import type { KeyValue } from '../sync/syncQueue'
import type { InsertRows, InsertTable, RemoteStore, UserData } from '../sync/types'

export function memoryStorage(): KeyValue & { dump(): Record<string, string> } {
  const m = new Map<string, string>()
  return {
    get: (k) => m.get(k) ?? null,
    set: (k, v) => void m.set(k, v),
    remove: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
  }
}

interface Account {
  id: string
  email: string
  password: string
  confirmed: boolean
}

type Listener = Parameters<AuthClient['onAuthStateChange']>[0]

export interface FakeAuthOptions {
  /** Confirmation d'e-mail exigée à l'inscription (comportement Supabase par défaut). */
  confirmEmail?: boolean
  /** Stockage de session, partagé entre deux « chargements de page ». */
  storage?: KeyValue
}

/** Faux Supabase Auth : comptes en mémoire, session persistée dans `storage`. */
export class FakeAuth {
  accounts = new Map<string, Account>()
  listeners = new Set<Listener>()
  sentEmails: { to: string; kind: 'confirm' | 'reset'; redirectTo?: string }[] = []
  storage: KeyValue
  confirmEmail: boolean
  failNetwork = false
  private seq = 0

  constructor(opts: FakeAuthOptions = {}) {
    this.storage = opts.storage ?? memoryStorage()
    this.confirmEmail = opts.confirmEmail ?? true
  }

  /** Crée directement un compte confirmé. */
  addAccount(email: string, password: string): string {
    const id = `00000000-0000-4000-8000-${String(++this.seq).padStart(12, '0')}`
    this.accounts.set(email, { id, email, password, confirmed: true })
    return id
  }

  confirm(email: string) {
    this.accounts.get(email)!.confirmed = true
  }

  /** Simule l'expiration définitive de la session (jeton de rafraîchissement refusé). */
  expire() {
    this.storage.remove('session')
    this.emit('SIGNED_OUT', null)
  }

  private session(a: Account): Session {
    const user = { id: a.id, email: a.email, identities: [{}] } as unknown as User
    return { access_token: 't', refresh_token: 'r', expires_in: 3600, token_type: 'bearer', user } as Session
  }

  private current(): Session | null {
    const email = this.storage.get('session')
    const a = email ? this.accounts.get(email) : undefined
    return a ? this.session(a) : null
  }

  private emit(event: Parameters<Listener>[0], session: Session | null) {
    for (const l of this.listeners) void l(event, session)
  }

  private networkError() {
    return { name: 'AuthRetryableFetchError', message: 'Failed to fetch', status: 0 }
  }

  /** Implémentation de l'interface utilisée par l'application. */
  client(): AuthClient {
    const self = this
    const api = {
      async getSession() {
        return { data: { session: self.current() }, error: null }
      },
      onAuthStateChange(cb: Listener) {
        self.listeners.add(cb)
        return { data: { subscription: { id: 'x', callback: cb, unsubscribe: () => self.listeners.delete(cb) } } }
      },
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        if (self.failNetwork) return { data: { user: null, session: null }, error: self.networkError() }
        const a = self.accounts.get(email)
        if (!a || a.password !== password) {
          return { data: { user: null, session: null }, error: { code: 'invalid_credentials', message: 'Invalid login credentials' } }
        }
        if (!a.confirmed) return { data: { user: null, session: null }, error: { code: 'email_not_confirmed', message: 'Email not confirmed' } }
        self.storage.set('session', email)
        const s = self.session(a)
        self.emit('SIGNED_IN', s)
        return { data: { user: s.user, session: s }, error: null }
      },
      async signUp({ email, password, options }: { email: string; password: string; options?: { emailRedirectTo?: string } }) {
        if (password.length < 6) return { data: { user: null, session: null }, error: { code: 'weak_password', message: 'weak' } }
        if (self.accounts.has(email)) {
          // Supabase masque les adresses existantes : utilisateur sans identité, pas de session.
          return { data: { user: { id: 'masked', identities: [] }, session: null }, error: null }
        }
        const id = `00000000-0000-4000-8000-${String(++self.seq).padStart(12, '0')}`
        const a = { id, email, password, confirmed: !self.confirmEmail }
        self.accounts.set(email, a)
        if (self.confirmEmail) {
          self.sentEmails.push({ to: email, kind: 'confirm', redirectTo: options?.emailRedirectTo })
          return { data: { user: { id, email, identities: [{}] }, session: null }, error: null }
        }
        self.storage.set('session', email)
        const s = self.session(a)
        self.emit('SIGNED_IN', s)
        return { data: { user: s.user, session: s }, error: null }
      },
      async signOut() {
        self.storage.remove('session')
        self.emit('SIGNED_OUT', null)
        return { error: null }
      },
      async resetPasswordForEmail(email: string, opts?: { redirectTo?: string }) {
        if (self.accounts.has(email)) self.sentEmails.push({ to: email, kind: 'reset', redirectTo: opts?.redirectTo })
        return { data: {}, error: null }
      },
      async updateUser({ password }: { password?: string }) {
        const s = self.current()
        if (!s) return { data: { user: null }, error: { code: 'session_not_found', message: 'no session' } }
        const a = self.accounts.get(s.user.email!)!
        if (password === a.password) return { data: { user: null }, error: { code: 'same_password', message: 'same' } }
        if (password) a.password = password
        self.emit('USER_UPDATED', s)
        return { data: { user: s.user }, error: null }
      },
    }
    return api as unknown as AuthClient
  }

  /** Simule l'ouverture d'un lien de réinitialisation : session ouverte + événement de récupération. */
  openRecoveryLink(email: string) {
    this.storage.set('session', email)
  }
}

/** Données en mémoire, une entrée par compte : chaque RemoteStore n'accède qu'à son compte. */
export class MemoryBackend {
  data = new Map<string, UserData & { inserts: { table: InsertTable; row: unknown }[] }>()
  failing = false
  calls = 0

  private of(userId: string) {
    let d = this.data.get(userId)
    if (!d) {
      d = { settings: null, revision: null, progress: null, conjugationSessions: [], inserts: [] }
      this.data.set(userId, d)
    }
    return d
  }

  storeFor(userId: string): RemoteStore {
    const guard = () => {
      this.calls++
      if (this.failing) throw new Error('réseau indisponible')
    }
    const clone = <T,>(v: T): T => (v === null || v === undefined ? v : structuredClone(v))
    return {
      load: async () => {
        guard()
        const d = this.of(userId)
        return {
          settings: clone(d.settings),
          revision: clone(d.revision),
          progress: clone(d.progress),
          conjugationSessions: clone(d.conjugationSessions),
        }
      },
      saveSettings: async (s) => {
        guard()
        this.of(userId).settings = clone(s)
      },
      saveRevision: async (p) => {
        guard()
        this.of(userId).revision = clone(p)
      },
      saveProgress: async (p) => {
        guard()
        this.of(userId).progress = clone(p)
      },
      insert: async <T extends InsertTable>(table: T, rows: InsertRows[T][]) => {
        guard()
        const d = this.of(userId)
        for (const row of rows) {
          if (d.inserts.some((i) => (i.row as { id: string }).id === row.id)) continue
          d.inserts.push({ table, row: clone(row) })
          if (table === 'conjugation_sessions') {
            const s = row as InsertRows['conjugation_sessions']
            d.conjugationSessions.unshift({ mode: s.mode, method: s.method, correct: s.correct, total: s.total, completedAt: new Date().toISOString() })
          }
        }
      },
    }
  }
}
