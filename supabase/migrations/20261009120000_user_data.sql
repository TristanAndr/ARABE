-- Données personnelles de Qirāʾa.
--
-- Le contenu pédagogique (segments du Coran, fiche de conjugaison) reste dans le frontend et
-- est commun à tous : seules les données propres à chaque compte sont stockées ici.
-- Chaque ligne appartient à un utilisateur (user_id → auth.users) et la Row Level Security
-- garantit qu'un compte ne lit ni ne modifie jamais les lignes d'un autre, quelle que soit
-- la requête envoyée par le client.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Réglages : profil de translittération, normalisation, thème, ordre ; préférences de révision.
create table public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  settings jsonb,
  revision_prefs jsonb,
  updated_at timestamptz not null default now(),
  constraint user_settings_settings_object check (settings is null or jsonb_typeof(settings) = 'object'),
  constraint user_settings_revision_object check (revision_prefs is null or jsonb_typeof(revision_prefs) = 'object')
);

-- Session de lecture en cours et cumul des statistiques.
create table public.reading_progress (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  session_order text[] not null default '{}',
  session_index integer not null default 0 check (session_index >= 0),
  session_results jsonb not null default '{}' check (jsonb_typeof(session_results) = 'object'),
  totals_validated integer not null default 0 check (totals_validated >= 0),
  totals_correct integer not null default 0 check (totals_correct >= 0),
  updated_at timestamptz not null default now(),
  constraint reading_progress_totals check (totals_correct <= totals_validated)
);

-- Historique des vérifications de lecture (ajout seul).
create table public.reading_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exercise_id text not null check (char_length(exercise_id) between 1 and 32),
  verdict text not null check (verdict in ('correct', 'partial', 'incorrect')),
  answer text not null check (char_length(answer) <= 2000),
  created_at timestamptz not null default now()
);

-- Réponses de l'exercice de conjugaison (ajout seul).
create table public.conjugation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mode text not null check (mode in ('verbe', 'pronom')),
  prompt text not null check (char_length(prompt) between 1 and 64),
  answer text not null check (char_length(answer) <= 200),
  correct boolean not null,
  created_at timestamptz not null default now()
);

-- Sessions de conjugaison terminées.
create table public.conjugation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mode text not null check (mode in ('verbe', 'pronom')),
  method text not null check (method in ('choix', 'saisie')),
  correct integer not null check (correct >= 0),
  total integer not null check (total > 0),
  completed_at timestamptz not null default now(),
  constraint conjugation_sessions_score check (correct <= total)
);

create index reading_attempts_user_created_idx on public.reading_attempts (user_id, created_at desc);
create index conjugation_attempts_user_created_idx on public.conjugation_attempts (user_id, created_at desc);
create index conjugation_sessions_user_completed_idx on public.conjugation_sessions (user_id, completed_at desc);

-- updated_at tenu par la base, pas par le client.
create function public.touch_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger user_settings_touch before insert or update on public.user_settings
  for each row execute function public.touch_updated_at();
create trigger reading_progress_touch before insert or update on public.reading_progress
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Droits : aucun accès anonyme ; les comptes connectés passent par la RLS.
-- ---------------------------------------------------------------------------

revoke all on public.user_settings, public.reading_progress, public.reading_attempts,
  public.conjugation_attempts, public.conjugation_sessions from anon;

grant select, insert, update, delete on public.user_settings, public.reading_progress to authenticated;
-- Historiques : pas de modification après coup.
grant select, insert, delete on public.reading_attempts, public.conjugation_attempts,
  public.conjugation_sessions to authenticated;
revoke update on public.reading_attempts, public.conjugation_attempts, public.conjugation_sessions
  from authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- (select auth.uid()) est évalué une seule fois par requête (recommandation Supabase).
-- ---------------------------------------------------------------------------

alter table public.user_settings enable row level security;
alter table public.reading_progress enable row level security;
alter table public.reading_attempts enable row level security;
alter table public.conjugation_attempts enable row level security;
alter table public.conjugation_sessions enable row level security;

-- user_settings
create policy "user_settings: lire les siennes" on public.user_settings
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_settings: créer les siennes" on public.user_settings
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_settings: modifier les siennes" on public.user_settings
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_settings: supprimer les siennes" on public.user_settings
  for delete to authenticated using ((select auth.uid()) = user_id);

-- reading_progress
create policy "reading_progress: lire la sienne" on public.reading_progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "reading_progress: créer la sienne" on public.reading_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "reading_progress: modifier la sienne" on public.reading_progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "reading_progress: supprimer la sienne" on public.reading_progress
  for delete to authenticated using ((select auth.uid()) = user_id);

-- reading_attempts
create policy "reading_attempts: lire les siennes" on public.reading_attempts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "reading_attempts: créer les siennes" on public.reading_attempts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "reading_attempts: supprimer les siennes" on public.reading_attempts
  for delete to authenticated using ((select auth.uid()) = user_id);

-- conjugation_attempts
create policy "conjugation_attempts: lire les siennes" on public.conjugation_attempts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "conjugation_attempts: créer les siennes" on public.conjugation_attempts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "conjugation_attempts: supprimer les siennes" on public.conjugation_attempts
  for delete to authenticated using ((select auth.uid()) = user_id);

-- conjugation_sessions
create policy "conjugation_sessions: lire les siennes" on public.conjugation_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "conjugation_sessions: créer les siennes" on public.conjugation_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "conjugation_sessions: supprimer les siennes" on public.conjugation_sessions
  for delete to authenticated using ((select auth.uid()) = user_id);
