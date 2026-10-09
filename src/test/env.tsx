import { render, screen, waitFor } from '@testing-library/react'
import { expect } from 'vitest'
import type { AuthRedirect } from '../auth/redirect'
import { Root } from '../Root'
import { outboxKey } from '../sync/syncQueue'
import { FakeAuth, MemoryBackend, memoryStorage } from './memoryBackend'

export const NO_REDIRECT: AuthRedirect = { type: null, error: null, present: false }
export const ALICE = { email: 'alice@example.test', password: 'motdepasse-alice' }

/**
 * Environnement d'un navigateur : faux Supabase Auth (session conservée entre deux
 * chargements), données du compte en mémoire, localStorage simulé.
 */
export function createEnv() {
  const auth = new FakeAuth({ storage: memoryStorage() })
  const backend = new MemoryBackend()
  const local = memoryStorage()
  const createRemote = (u: { id: string }) => backend.storeFor(u.id)
  const client = auth.client()
  let unmount: (() => void) | null = null
  const aliceId = auth.addAccount(ALICE.email, ALICE.password)
  const synced = async (userId: string = aliceId): Promise<void> => {
    await waitFor(() => expect(local.get(outboxKey(userId))).toBeNull())
  }
  const env = {
    auth,
    backend,
    local,
    aliceId,
    synced,
    /** Ouvre l'application (comme un chargement de page). */
    mount(redirect: AuthRedirect = NO_REDIRECT): void {
      unmount?.()
      unmount = render(
        <Root
          authClient={client}
          createRemote={createRemote}
          redirect={redirect}
          redirectTo={() => 'http://localhost/qiraa/'}
          storage={local}
          syncOptions={{ debounceMs: 0, retryDelays: [20] }}
        />,
      ).unmount
    },
    /** Connecte Alice d'avance puis ouvre l'application sur l'exercice. */
    async open(): Promise<void> {
      auth.storage.set('session', ALICE.email)
      env.mount()
      await screen.findByLabelText('Transcription')
    },
    /** Attend que tout soit envoyé, puis recharge la page. */
    async reload(): Promise<void> {
      await synced()
      env.mount()
    },
  }
  return env
}

