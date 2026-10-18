-- Nouveau mode de révision : retrouver le pronom arabe à partir du pronom français.

alter table public.conjugation_attempts drop constraint conjugation_attempts_mode_check;
alter table public.conjugation_attempts
  add constraint conjugation_attempts_mode_check check (mode in ('verbe', 'pronom', 'pronom-arabe'));

alter table public.conjugation_sessions drop constraint conjugation_sessions_mode_check;
alter table public.conjugation_sessions
  add constraint conjugation_sessions_mode_check check (mode in ('verbe', 'pronom', 'pronom-arabe'));
