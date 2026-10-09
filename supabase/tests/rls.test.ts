/**
 * Tests d'intégration de sécurité : la migration réelle est appliquée à un vrai moteur
 * PostgreSQL (PGlite, PostgreSQL compilé en WebAssembly), précédée d'une reproduction de ce
 * que Supabase fournit : schéma auth, fonction auth.uid() lisant les claims du JWT, rôles
 * anon et authenticated, et les droits par défaut que Supabase accorde à ces rôles sur le
 * schéma public (tout, la RLS faisant barrière).
 *
 * Ce que ces tests prouvent : les politiques et les droits de la migration isolent les
 * comptes. Ce qu'ils ne prouvent pas : la configuration du projet Supabase hébergé (voir
 * scripts/check-rls.mjs, à lancer contre le vrai projet).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const ALICE = '11111111-1111-4111-8111-111111111111'
const BOB = '22222222-2222-4222-8222-222222222222'

const SUPABASE_STUB = `
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key, email text not null);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(
    current_setting('request.jwt.claim.sub', true),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  ), '')::uuid
$$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
`

const TABLES = [
  'user_settings',
  'reading_progress',
  'reading_attempts',
  'conjugation_attempts',
  'conjugation_sessions',
  'alphabet_progress',
] as const

let db: PGlite

/** Exécute une requête sous l'identité d'un compte (comme PostgREST avec un JWT), ou en anonyme. */
async function as<T = Record<string, unknown>>(user: string | null, sql: string, params: unknown[] = []) {
  const role = user ? 'authenticated' : 'anon'
  const claims = user ? JSON.stringify({ sub: user, role }) : JSON.stringify({ role })
  await db.exec('reset role')
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [claims])
  await db.exec(`set role ${role}`)
  try {
    return await db.query<T>(sql, params)
  } finally {
    await db.exec('reset role')
  }
}

/** Erreur attendue : refus de droit ou violation de politique RLS. */
async function denied(user: string | null, sql: string, params: unknown[] = []) {
  await expect(as(user, sql, params)).rejects.toThrow(/permission denied|row-level security/)
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(SUPABASE_STUB)
  const dir = join(__dirname, '..', 'migrations')
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(join(dir, file), 'utf8'))
  }
  await db.query(`insert into auth.users (id, email) values ($1, 'alice@example.test'), ($2, 'bob@example.test')`, [
    ALICE,
    BOB,
  ])

  // Chaque compte crée ses données, sans fournir user_id : la valeur par défaut auth.uid() s'applique.
  for (const [user, ex] of [
    [ALICE, '1:1'],
    [BOB, '2:255'],
  ] as const) {
    await as(user, `insert into public.user_settings (settings) values ('{"profileId":"simple"}')`)
    await as(user, `insert into public.reading_progress (session_order, session_index) values (array[$1], 1)`, [ex])
    await as(user, `insert into public.reading_attempts (exercise_id, verdict, answer) values ($1, 'correct', 'x')`, [ex])
    await as(user, `insert into public.conjugation_attempts (mode, prompt, answer, correct) values ('verbe', '1cs', 'a', true)`)
    await as(user, `insert into public.conjugation_sessions (mode, method, correct, total) values ('verbe', 'choix', 3, 14)`)
    await as(user, `insert into public.alphabet_progress (letters) values ('{"ب":{"seen":1,"correct":1,"streak":1}}')`)
  }
})

afterAll(async () => {
  await db?.close()
})

describe('RLS activée', () => {
  it('sur toutes les tables personnelles', async () => {
    const { rows } = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'`,
    )
    expect(rows.map((r) => r.relname).sort()).toEqual([...TABLES].sort())
    for (const r of rows) expect(r.relrowsecurity, r.relname).toBe(true)
  })
})

describe('isolation entre deux comptes', () => {
  it.each(TABLES)('%s : chaque compte ne voit que ses lignes', async (table) => {
    const a = await as<{ user_id: string }>(ALICE, `select user_id from public.${table}`)
    const b = await as<{ user_id: string }>(BOB, `select user_id from public.${table}`)
    expect(a.rows.length).toBeGreaterThan(0)
    expect(a.rows.every((r) => r.user_id === ALICE)).toBe(true)
    expect(b.rows.every((r) => r.user_id === BOB)).toBe(true)
  })

  it("filtrer explicitement sur l'identifiant de l'autre ne renvoie rien", async () => {
    for (const table of TABLES) {
      const r = await as(ALICE, `select * from public.${table} where user_id = $1`, [BOB])
      expect(r.rows, table).toHaveLength(0)
    }
  })

  it("impossible de créer une ligne au nom de l'autre", async () => {
    await denied(ALICE, `insert into public.reading_attempts (user_id, exercise_id, verdict, answer) values ($1, '1:1', 'correct', '')`, [BOB])
    await denied(ALICE, `insert into public.conjugation_sessions (user_id, mode, method, correct, total) values ($1, 'verbe', 'choix', 1, 1)`, [BOB])
    await denied(ALICE, `insert into public.conjugation_attempts (user_id, mode, prompt, answer, correct) values ($1, 'verbe', '1cs', '', true)`, [BOB])
  })

  it("un upsert sur la ligne de l'autre échoue sans la modifier", async () => {
    await denied(
      ALICE,
      `insert into public.user_settings (user_id, settings) values ($1, '{"pirate":true}')
       on conflict (user_id) do update set settings = excluded.settings`,
      [BOB],
    )
    const b = await as<{ settings: unknown }>(BOB, `select settings from public.user_settings`)
    expect(b.rows[0]!.settings).toEqual({ profileId: 'simple' })
  })

  it("modifier ou supprimer les lignes de l'autre n'a aucun effet", async () => {
    const upd = await as(ALICE, `update public.reading_progress set session_index = 99 where user_id = $1`, [BOB])
    expect(upd.affectedRows).toBe(0)
    const alpha = await as(ALICE, `update public.alphabet_progress set letters = '{}' where user_id = $1`, [BOB])
    expect(alpha.affectedRows).toBe(0)
    const del = await as(ALICE, `delete from public.reading_attempts where user_id = $1`, [BOB])
    expect(del.affectedRows).toBe(0)
    const b = await as<{ session_index: number }>(BOB, `select session_index from public.reading_progress`)
    expect(b.rows[0]!.session_index).toBe(1)
    const attempts = await as(BOB, `select id from public.reading_attempts`)
    expect(attempts.rows).toHaveLength(1)
  })

  it("impossible de s'approprier une ligne puis de la transférer à l'autre", async () => {
    await denied(ALICE, `update public.reading_progress set user_id = $1`, [BOB])
    await denied(ALICE, `update public.alphabet_progress set user_id = $1`, [BOB])
  })

  it('les historiques ne se modifient pas après coup', async () => {
    await denied(ALICE, `update public.reading_attempts set verdict = 'correct'`)
    await denied(ALICE, `update public.conjugation_sessions set correct = 14`)
  })

  it('chaque compte peut modifier et supprimer ses propres données', async () => {
    const upd = await as(ALICE, `update public.reading_progress set session_index = 0`)
    expect(upd.affectedRows).toBe(1)
    const del = await as(ALICE, `delete from public.conjugation_attempts`)
    expect(del.affectedRows).toBe(1)
    expect((await as(BOB, `select id from public.conjugation_attempts`)).rows).toHaveLength(1)
  })
})

describe("requêtes envoyées par l'application (forme PostgREST)", () => {
  it('upsert partiel : enregistrer les préférences ne touche pas aux réglages', async () => {
    const upsert = (col: 'settings' | 'revision_prefs', value: string) =>
      as(
        ALICE,
        `insert into public.user_settings (user_id, ${col}) values ($1, $2::jsonb)
         on conflict (user_id) do update set ${col} = excluded.${col}`,
        [ALICE, value],
      )
    await upsert('settings', '{"profileId":"precise"}')
    await upsert('revision_prefs', '{"mode":"pronom"}')
    const r = await as<{ settings: unknown; revision_prefs: unknown }>(ALICE, 'select settings, revision_prefs from public.user_settings')
    expect(r.rows).toEqual([{ settings: { profileId: 'precise' }, revision_prefs: { mode: 'pronom' } }])
  })

  it('insertion idempotente des historiques (on conflict do nothing) sans droit de mise à jour', async () => {
    const id = '33333333-3333-4333-8333-333333333333'
    const insert = () =>
      as(
        ALICE,
        `insert into public.reading_attempts (id, user_id, exercise_id, verdict, answer)
         values ($1, $2, '1:2', 'partial', 'x') on conflict (id) do nothing`,
        [id, ALICE],
      )
    await insert()
    await insert()
    const r = await as(ALICE, 'select id from public.reading_attempts where id = $1', [id])
    expect(r.rows).toHaveLength(1)
    // Rejouer l'identifiant d'une ligne d'un autre compte ne révèle ni ne modifie rien.
    const bobRow = (await as<{ id: string }>(BOB, 'select id from public.reading_attempts')).rows[0]!.id
    await as(
      ALICE,
      `insert into public.reading_attempts (id, user_id, exercise_id, verdict, answer)
       values ($1, $2, '1:1', 'incorrect', 'pirate') on conflict (id) do nothing`,
      [bobRow, ALICE],
    )
    const b = await as<{ answer: string; user_id: string }>(BOB, 'select answer, user_id from public.reading_attempts where id = $1', [bobRow])
    expect(b.rows).toEqual([{ answer: 'x', user_id: BOB }])
    await as(ALICE, 'delete from public.reading_attempts where id = $1', [id])
  })
})

describe('accès sans connexion', () => {
  it.each(TABLES)('%s : lecture refusée', async (table) => {
    await denied(null, `select * from public.${table}`)
  })

  it('écriture refusée', async () => {
    await denied(null, `insert into public.reading_attempts (user_id, exercise_id, verdict, answer) values ($1, '1:1', 'correct', '')`, [ALICE])
    await denied(null, `update public.user_settings set settings = '{}'`)
    await denied(null, `delete from public.reading_progress`)
  })

  it('un JWT authentifié sans identifiant ne voit rien et ne crée rien', async () => {
    await db.exec('reset role')
    await db.query(`select set_config('request.jwt.claims', '{"role":"authenticated"}', false)`)
    await db.exec('set role authenticated')
    try {
      expect((await db.query('select * from public.reading_progress')).rows).toHaveLength(0)
      await expect(
        db.query(`insert into public.reading_attempts (exercise_id, verdict, answer) values ('1:1', 'correct', '')`),
      ).rejects.toThrow()
    } finally {
      await db.exec('reset role')
    }
  })
})

describe('contraintes', () => {
  it('rejette les valeurs incohérentes', async () => {
    await expect(as(ALICE, `insert into public.reading_attempts (exercise_id, verdict, answer) values ('1:1', 'parfait', '')`)).rejects.toThrow(/check/)
    await expect(as(ALICE, `insert into public.conjugation_sessions (mode, method, correct, total) values ('verbe', 'choix', 5, 4)`)).rejects.toThrow(/check/)
    await expect(as(ALICE, `update public.reading_progress set totals_correct = 5, totals_validated = 2`)).rejects.toThrow(/check/)
  })

  it('la suppression du compte supprime ses données', async () => {
    await db.query(`delete from auth.users where id = $1`, [BOB])
    for (const table of TABLES) {
      const { rows } = await db.query(`select 1 from public.${table} where user_id = $1`, [BOB])
      expect(rows, table).toHaveLength(0)
    }
  })
})
