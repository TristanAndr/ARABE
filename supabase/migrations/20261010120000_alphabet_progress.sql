-- Suivi de la révision de l'alphabet, une ligne par compte.
-- letters : { "<lettre>": { "seen": n, "correct": n, "streak": n }, … }
-- Le contenu de l'alphabet lui-même reste dans le frontend, commun à tous.

create table public.alphabet_progress (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  letters jsonb not null default '{}' check (jsonb_typeof(letters) = 'object'),
  updated_at timestamptz not null default now()
);

create trigger alphabet_progress_touch before insert or update on public.alphabet_progress
  for each row execute function public.touch_updated_at();

revoke all on public.alphabet_progress from anon;
grant select, insert, update, delete on public.alphabet_progress to authenticated;

alter table public.alphabet_progress enable row level security;

create policy "alphabet_progress: lire le sien" on public.alphabet_progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "alphabet_progress: créer le sien" on public.alphabet_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "alphabet_progress: modifier le sien" on public.alphabet_progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "alphabet_progress: supprimer le sien" on public.alphabet_progress
  for delete to authenticated using ((select auth.uid()) = user_id);
