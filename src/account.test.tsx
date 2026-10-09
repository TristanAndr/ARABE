// @vitest-environment jsdom
/**
 * Parcours de compte, de bout en bout côté interface, avec un faux Supabase Auth et un
 * stockage en mémoire isolé par compte. La sécurité côté base (RLS) est testée séparément,
 * sur PostgreSQL, dans supabase/tests/rls.test.ts.
 */
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EXERCISES } from './data/corpus'
import { outboxKey } from './sync/syncQueue'
import { ALICE, createEnv } from './test/env'

let env: ReturnType<typeof createEnv>
beforeEach(() => {
  env = createEnv()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

type User = ReturnType<typeof userEvent.setup>

const BOB = { email: 'bob@example.test', password: 'motdepasse-bob' }

async function signIn(user: User, email: string, password: string) {
  await user.clear(screen.getByLabelText('Adresse e-mail'))
  await user.type(screen.getByLabelText('Adresse e-mail'), email)
  await user.type(screen.getByLabelText('Mot de passe'), password)
  await user.click(screen.getByRole('button', { name: 'Se connecter' }))
}

async function signOut(user: User) {
  const account = screen.queryByRole('button', { name: 'Compte' })
  if (account) await user.click(account)
  await user.click(screen.getByRole('button', { name: 'Se déconnecter' }))
  await screen.findByRole('heading', { name: 'Connexion' })
}

/** Vérifie juste la première phrase (basmala) et passe à la suivante. */
async function answerFirst(user: User) {
  await user.type(screen.getByLabelText('Transcription'), 'bismi llaahi rra7maani rra7iim{Enter}')
  await user.click(screen.getByRole('button', { name: 'Phrase suivante' }))
}

describe('accès', () => {
  it("n'affiche aucun exercice sans connexion", async () => {
    env.mount()
    await screen.findByRole('heading', { name: 'Connexion' })
    expect(screen.queryByLabelText('Transcription')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Révision' })).toBeNull()
  })
})

describe('inscription et connexion', () => {
  it('inscription avec confirmation par e-mail, puis connexion', async () => {
    const user = userEvent.setup()
    env.mount()
    await user.click(await screen.findByRole('button', { name: 'Créer un compte' }))
    await user.type(screen.getByLabelText('Adresse e-mail'), BOB.email)
    await user.type(screen.getByLabelText('Mot de passe'), BOB.password)
    await user.click(screen.getByRole('button', { name: 'Créer le compte' }))

    expect(await screen.findByText(/e-mail de confirmation/)).toBeTruthy()
    // Le lien de confirmation renvoie vers la page de l'application.
    expect(env.auth.sentEmails).toEqual([{ to: BOB.email, kind: 'confirm', redirectTo: 'http://localhost/qiraa/' }])

    // Avant confirmation : refus explicite.
    await signIn(user, BOB.email, BOB.password)
    expect((await screen.findByRole('alert')).textContent).toContain('pas encore confirmée')

    env.auth.confirm(BOB.email)
    await user.clear(screen.getByLabelText('Mot de passe'))
    await signIn(user, BOB.email, BOB.password)
    expect(await screen.findByLabelText('Transcription')).toBeTruthy()
  })

  it('inscription sans confirmation : session ouverte directement', async () => {
    env.auth.confirmEmail = false
    const user = userEvent.setup()
    env.mount()
    await user.click(await screen.findByRole('button', { name: 'Créer un compte' }))
    await user.type(screen.getByLabelText('Adresse e-mail'), BOB.email)
    await user.type(screen.getByLabelText('Mot de passe'), BOB.password)
    await user.click(screen.getByRole('button', { name: 'Créer le compte' }))
    expect(await screen.findByLabelText('Transcription')).toBeTruthy()
  })

  it('refuse un mot de passe trop court avant tout appel', async () => {
    const user = userEvent.setup()
    env.mount()
    await user.click(await screen.findByRole('button', { name: 'Créer un compte' }))
    await user.type(screen.getByLabelText('Adresse e-mail'), BOB.email)
    await user.type(screen.getByLabelText('Mot de passe'), 'court')
    await user.click(screen.getByRole('button', { name: 'Créer le compte' }))
    expect(screen.getByRole('alert').textContent).toContain('au moins 8 caractères')
    expect(env.auth.accounts.has(BOB.email)).toBe(false)
  })

  it('adresse déjà inscrite : message neutre, pas de nouveau compte', async () => {
    const user = userEvent.setup()
    env.mount()
    await user.click(await screen.findByRole('button', { name: 'Créer un compte' }))
    await user.type(screen.getByLabelText('Adresse e-mail'), ALICE.email)
    await user.type(screen.getByLabelText('Mot de passe'), 'un-autre-mot-de-passe')
    await user.click(screen.getByRole('button', { name: 'Créer le compte' }))
    expect(await screen.findByText(/existe peut-être déjà/)).toBeTruthy()
  })

  it('mauvais mot de passe et erreur réseau : messages compréhensibles', async () => {
    const user = userEvent.setup()
    env.mount()
    await screen.findByRole('heading', { name: 'Connexion' })
    await signIn(user, ALICE.email, 'faux')
    expect((await screen.findByRole('alert')).textContent).toBe('Adresse e-mail ou mot de passe incorrect.')

    env.auth.failNetwork = true
    await user.clear(screen.getByLabelText('Mot de passe'))
    await signIn(user, ALICE.email, ALICE.password)
    expect((await screen.findByRole('alert')).textContent).toContain('Connexion au serveur impossible')
  })
})

describe('session', () => {
  it('est conservée au rechargement de la page', async () => {
    const user = userEvent.setup()
    env.mount()
    await screen.findByRole('heading', { name: 'Connexion' })
    await signIn(user, ALICE.email, ALICE.password)
    await screen.findByLabelText('Transcription')

    env.mount() // rechargement
    expect(await screen.findByLabelText('Transcription')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Connexion' })).toBeNull()
  })

  it('la déconnexion ramène à la connexion et le rechargement ne rouvre pas la session', async () => {
    const user = userEvent.setup()
    await env.open()
    await user.click(screen.getByRole('button', { name: 'Compte' }))
    expect(screen.getByText(ALICE.email)).toBeTruthy()
    await signOut(user)
    expect(screen.queryByLabelText('Transcription')).toBeNull()
    env.mount()
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeTruthy()
  })

  it('une session expirée renvoie à la connexion avec un message', async () => {
    await env.open()
    env.auth.expire()
    expect(await screen.findByText(/session a expiré/)).toBeTruthy()
    expect(screen.queryByLabelText('Transcription')).toBeNull()
  })
})

describe('mot de passe', () => {
  it('demande de réinitialisation, lien, nouveau mot de passe, connexion avec celui-ci', async () => {
    const user = userEvent.setup()
    env.mount()
    await user.click(await screen.findByRole('button', { name: 'Mot de passe oublié' }))
    await user.type(screen.getByLabelText('Adresse e-mail'), ALICE.email)
    await user.click(screen.getByRole('button', { name: 'Envoyer le lien' }))
    expect(await screen.findByText(/e-mail de réinitialisation/)).toBeTruthy()
    expect(env.auth.sentEmails).toEqual([{ to: ALICE.email, kind: 'reset', redirectTo: 'http://localhost/qiraa/' }])

    // Ouverture du lien : Supabase ouvre une session, l'URL porte type=recovery.
    env.auth.openRecoveryLink(ALICE.email)
    env.mount({ type: 'recovery', error: null, present: true })
    await screen.findByRole('heading', { name: 'Nouveau mot de passe' })
    expect(screen.queryByLabelText('Transcription')).toBeNull()

    await user.type(screen.getByLabelText('Nouveau mot de passe', { selector: 'input' }), 'nouveau-secret')
    await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'nouveau-secret')
    await user.click(screen.getByRole('button', { name: 'Enregistrer le mot de passe' }))
    await screen.findByLabelText('Transcription')

    await signOut(user)
    await signIn(user, ALICE.email, ALICE.password)
    expect((await screen.findByRole('alert')).textContent).toContain('incorrect')
    await user.clear(screen.getByLabelText('Mot de passe'))
    await signIn(user, ALICE.email, 'nouveau-secret')
    expect(await screen.findByLabelText('Transcription')).toBeTruthy()
  })

  it('demande pour une adresse inconnue : même message, aucun e-mail', async () => {
    const user = userEvent.setup()
    env.mount()
    await user.click(await screen.findByRole('button', { name: 'Mot de passe oublié' }))
    await user.type(screen.getByLabelText('Adresse e-mail'), 'personne@example.test')
    await user.click(screen.getByRole('button', { name: 'Envoyer le lien' }))
    expect(await screen.findByText(/Si un compte existe/)).toBeTruthy()
    expect(env.auth.sentEmails).toHaveLength(0)
  })

  it('un lien expiré affiche une erreur sur l’écran de connexion', async () => {
    env.mount({ type: null, error: 'Ce lien a expiré ou a déjà servi. Demande un nouvel e-mail.', present: true })
    expect((await screen.findByRole('alert')).textContent).toContain('expiré')
  })

  it('retour de confirmation d’adresse : invitation à se connecter', async () => {
    env.mount({ type: 'signup', error: null, present: true })
    expect(await screen.findByText(/Adresse confirmée/)).toBeTruthy()
  })

  it('changement de mot de passe depuis le compte', async () => {
    const user = userEvent.setup()
    await env.open()
    await user.click(screen.getByRole('button', { name: 'Compte' }))
    await user.type(screen.getByLabelText('Nouveau mot de passe', { selector: 'input' }), 'encore-un-autre')
    await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'encore-un-autre')
    await user.click(screen.getByRole('button', { name: 'Changer le mot de passe' }))
    expect((await screen.findByText('Mot de passe modifié.'))).toBeTruthy()
    expect(env.auth.accounts.get(ALICE.email)!.password).toBe('encore-un-autre')
  })
})

describe('données du compte', () => {
  it('la progression est retrouvée après déconnexion et reconnexion', async () => {
    const user = userEvent.setup()
    await env.open()
    await answerFirst(user)
    await env.synced()
    await signOut(user)
    await signIn(user, ALICE.email, ALICE.password)
    expect(await screen.findByText(/Phrase 2/)).toBeTruthy()
    expect(screen.getByText(EXERCISES[1]!.arabic)).toBeTruthy()
    expect(screen.getByText(/1 vérifiée · 1 juste/)).toBeTruthy()
    // L'historique des réponses est enregistré.
    const inserts = env.backend.data.get(env.aliceId)!.inserts
    expect(inserts.filter((i) => i.table === 'reading_attempts')).toHaveLength(1)
  })

  it('deux comptes ont des progressions et des paramètres indépendants', async () => {
    const bobId = env.auth.addAccount(BOB.email, BOB.password)
    const user = userEvent.setup()

    // Alice : avance d'une phrase et choisit la translittération précise.
    await env.open()
    await answerFirst(user)
    await user.click(screen.getByRole('button', { name: 'Paramètres' }))
    await user.click(screen.getByLabelText(/Translittération précise/))
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await user.click(screen.getByRole('button', { name: "Retour à l'exercice" }))
    await env.synced()
    await signOut(user)

    // Bob : repart de zéro, avec les réglages par défaut.
    await signIn(user, BOB.email, BOB.password)
    expect(await screen.findByText(/Phrase 1 /)).toBeTruthy()
    expect(screen.getByText(/0 vérifiée · 0 juste/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Paramètres' }))
    expect((screen.getByLabelText(/Simplifié francophone/) as HTMLInputElement).checked).toBe(true)
    await user.click(screen.getByRole('button', { name: "Retour à l'exercice" }))
    await signOut(user)

    // Alice retrouve exactement ses données.
    await signIn(user, ALICE.email, ALICE.password)
    expect(await screen.findByText(/Phrase 2/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Paramètres' }))
    expect((screen.getByLabelText(/Translittération précise/) as HTMLInputElement).checked).toBe(true)

    expect(env.backend.data.get(bobId)?.progress ?? null).toBeNull()
    expect(env.backend.data.get(env.aliceId)!.settings!.profileId).toBe('precise')
  })

  it('les résultats de conjugaison sont enregistrés et retrouvés', async () => {
    const user = userEvent.setup()
    await env.open()
    await user.click(screen.getByRole('button', { name: 'Révision' }))
    expect(screen.getByText(/Aucune session terminée/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Retrouver le pronom' }))
    // Répond (n'importe comment) à toutes les questions de la session.
    for (;;) {
      const radios = screen.queryAllByRole('radio')
      if (radios.length === 0) break
      await user.click(radios[0]!)
      await user.click(screen.getByRole('button', { name: 'Valider' }))
      await user.click(screen.getByRole('button', { name: /Question suivante|Voir le résultat/ }))
    }
    expect(screen.getByText(/1 session terminée dans ce mode/)).toBeTruthy()
    await env.synced()
    await env.reload()
    await screen.findByLabelText('Transcription')
    await user.click(screen.getByRole('button', { name: 'Révision' }))
    // Le mode choisi et l'historique sont retrouvés.
    expect(screen.getByRole('button', { name: 'Retrouver le pronom' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText(/1 session terminée dans ce mode/)).toBeTruthy()
    const inserts = env.backend.data.get(env.aliceId)!.inserts
    expect(inserts.filter((i) => i.table === 'conjugation_attempts')).toHaveLength(11)
    expect(inserts.filter((i) => i.table === 'conjugation_sessions')).toHaveLength(1)
  })
})

describe('réseau', () => {
  it('chargement impossible : message et nouvel essai, jamais de données par défaut', async () => {
    env.backend.failing = true
    env.auth.storage.set('session', ALICE.email)
    env.mount()
    expect((await screen.findByRole('alert')).textContent).toContain('Impossible de charger tes données')
    expect(screen.queryByLabelText('Transcription')).toBeNull()
    env.backend.failing = false
    await userEvent.setup().click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByLabelText('Transcription')).toBeTruthy()
  })

  it('une sauvegarde échouée est conservée, signalée, puis renvoyée', async () => {
    const user = userEvent.setup()
    await env.open()
    env.backend.failing = true
    await answerFirst(user)
    expect(await screen.findByText('Non enregistré')).toBeTruthy()
    // La progression attend dans le navigateur, sous la clé du compte.
    expect(env.local.get(outboxKey(env.aliceId))).toContain('"index":1')

    env.backend.failing = false
    await env.synced()
    await waitFor(() => expect(screen.queryByText('Non enregistré')).toBeNull())
    expect(env.backend.data.get(env.aliceId)!.progress!.index).toBe(1)
  })

  it('modifications non envoyées : renvoyées au prochain chargement', async () => {
    const user = userEvent.setup()
    await env.open()
    env.backend.failing = true
    await answerFirst(user)
    await screen.findByText('Non enregistré')

    // Fermeture de l'onglet, réseau revenu, réouverture.
    env.backend.failing = false
    env.mount()
    expect(await screen.findByText(/Phrase 2/)).toBeTruthy()
    await env.synced()
    expect(env.backend.data.get(env.aliceId)!.progress!.index).toBe(1)
  })

  it('déconnexion avec des modifications en attente : confirmation demandée', async () => {
    const user = userEvent.setup()
    await env.open()
    env.backend.failing = true
    await answerFirst(user)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    await user.click(screen.getByRole('button', { name: 'Compte' }))
    await user.click(screen.getByRole('button', { name: 'Se déconnecter' }))
    await waitFor(() => expect(confirm).toHaveBeenCalled())
    expect(screen.getByRole('heading', { name: 'Compte' })).toBeTruthy()
  })
})

describe('migration du stockage local', () => {
  const legacyProgress = () =>
    JSON.stringify({ order: EXERCISES.map((e) => e.id), index: 3, results: {}, totals: { validated: 3, correct: 2 } })

  it('compte vide : import sur confirmation, copie locale archivée', async () => {
    env.local.set('qiraa.progress.v1', legacyProgress())
    env.local.set('qiraa.settings.v1', JSON.stringify({ profileId: 'precise' }))
    const user = userEvent.setup()
    env.auth.storage.set('session', ALICE.email)
    env.mount()
    await screen.findByRole('heading', { name: 'Progression trouvée sur ce navigateur' })
    expect(screen.getByText(/3 phrases vérifiées/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Importer dans mon compte' }))

    expect(await screen.findByText(/Phrase 4/)).toBeTruthy()
    await env.synced()
    expect(env.backend.data.get(env.aliceId)!.progress!.index).toBe(3)
    expect(env.backend.data.get(env.aliceId)!.settings!.profileId).toBe('precise')
    // Rien n'est effacé : les anciennes clés sont archivées, et ne sont plus proposées.
    expect(env.local.get('qiraa.progress.v1')).toBeNull()
    expect(env.local.get('qiraa.archive.qiraa.progress.v1')).toBe(legacyProgress())
    env.mount()
    expect(await screen.findByText(/Phrase 4/)).toBeTruthy()
  })

  it('compte déjà utilisé : pas de fusion, les données du compte sont gardées par défaut', async () => {
    const user = userEvent.setup()
    await env.open()
    await answerFirst(user)
    await env.synced()
    env.local.set('qiraa.progress.v1', legacyProgress())
    env.mount()
    await screen.findByRole('heading', { name: 'Progression trouvée sur ce navigateur' })
    await user.click(screen.getByRole('button', { name: 'Garder les données du compte' }))
    expect(await screen.findByText(/Phrase 2/)).toBeTruthy()
    expect(env.backend.data.get(env.aliceId)!.progress!.totals).toEqual({ validated: 1, correct: 1 })
    expect(env.local.get('qiraa.archive.qiraa.progress.v1')).toBe(legacyProgress())
  })

  it('compte déjà utilisé : remplacement explicite après confirmation', async () => {
    const user = userEvent.setup()
    await env.open()
    await answerFirst(user)
    await env.synced()
    env.local.set('qiraa.progress.v1', legacyProgress())
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    env.mount()
    await user.click(await screen.findByRole('button', { name: 'Remplacer par celles du navigateur' }))
    expect(await screen.findByText(/Phrase 4/)).toBeTruthy()
    await env.synced()
    expect(env.backend.data.get(env.aliceId)!.progress!.totals).toEqual({ validated: 3, correct: 2 })
  })
})
