#!/usr/bin/env node
/**
 * Vérification de l'isolation sur le VRAI projet Supabase, avec deux comptes de test existants
 * et confirmés, et la seule clé publishable (exactement ce dont dispose un navigateur).
 *
 *   VITE_SUPABASE_URL=… VITE_SUPABASE_PUBLISHABLE_KEY=… \
 *   RLS_A_EMAIL=… RLS_A_PASSWORD=… RLS_B_EMAIL=… RLS_B_PASSWORD=… \
 *   npm run check:rls
 *
 * Le script écrit puis supprime des lignes de test dans les tables d'historique des deux comptes
 * et ne modifie pas leur progression ni leurs réglages. Il échoue (code 1) au premier écart.
 */
import { createClient } from '@supabase/supabase-js'

const env = (k) => {
  const v = process.env[k]
  if (!v) {
    console.error(`Variable manquante : ${k}`)
    process.exit(2)
  }
  return v
}

const url = env('VITE_SUPABASE_URL')
const key = env('VITE_SUPABASE_PUBLISHABLE_KEY')
const TABLES = ['user_settings', 'reading_progress', 'reading_attempts', 'conjugation_attempts', 'conjugation_sessions']
const opts = { auth: { persistSession: false, autoRefreshToken: false } }

let failures = 0
const ok = (cond, label) => {
  console.log(`${cond ? '✓' : '✗'} ${label}`)
  if (!cond) failures++
}

async function login(email, password) {
  const client = createClient(url, key, opts)
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Connexion impossible pour ${email} : ${error.message}`)
  return { client, id: data.user.id }
}

const a = await login(env('RLS_A_EMAIL'), env('RLS_A_PASSWORD'))
const b = await login(env('RLS_B_EMAIL'), env('RLS_B_PASSWORD'))
ok(a.id !== b.id, 'deux comptes distincts')
const anon = createClient(url, key, opts)

// Une ligne de test par compte.
const mark = `rls-check-${Date.now()}`
for (const u of [a, b]) {
  const { error } = await u.client.from('conjugation_attempts').insert({ mode: 'verbe', prompt: mark, answer: '', correct: true })
  ok(!error, `insertion de sa propre ligne (${u === a ? 'A' : 'B'})${error ? ' : ' + error.message : ''}`)
}

for (const table of TABLES) {
  const { data, error } = await a.client.from(table).select('user_id')
  ok(!error && data.every((r) => r.user_id === a.id), `${table} : A ne lit que ses lignes`)
  const other = await a.client.from(table).select('user_id').eq('user_id', b.id)
  ok(!other.error && other.data.length === 0, `${table} : filtrer sur l'identifiant de B ne renvoie rien`)
  const pub = await anon.from(table).select('user_id').limit(1)
  ok(!!pub.error || pub.data.length === 0, `${table} : aucun accès sans connexion`)
}

const forged = await a.client.from('conjugation_attempts').insert({ user_id: b.id, mode: 'verbe', prompt: mark, answer: '', correct: true })
ok(!!forged.error, 'A ne peut pas créer une ligne au nom de B')

const upd = await a.client.from('reading_progress').update({ session_index: 0 }).eq('user_id', b.id).select()
ok(!upd.error ? upd.data.length === 0 : true, 'A ne peut pas modifier la progression de B')

const del = await a.client.from('conjugation_attempts').delete().eq('prompt', mark).eq('user_id', b.id).select()
ok(!del.error ? del.data.length === 0 : true, 'A ne peut pas supprimer les lignes de B')
const bStill = await b.client.from('conjugation_attempts').select('id').eq('prompt', mark)
ok(bStill.data?.length === 1, 'la ligne de test de B est intacte')

const anonWrite = await anon.from('conjugation_attempts').insert({ user_id: a.id, mode: 'verbe', prompt: mark, answer: '', correct: true })
ok(!!anonWrite.error, 'écriture refusée sans connexion')

// Nettoyage : chacun supprime ses lignes de test.
for (const u of [a, b]) await u.client.from('conjugation_attempts').delete().eq('prompt', mark)

console.log(failures ? `\n${failures} vérification(s) en échec.` : '\nIsolation vérifiée sur le projet Supabase.')
process.exit(failures ? 1 : 0)
