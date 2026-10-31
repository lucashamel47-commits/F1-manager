-- F1 Manager — rappels par email avant les sessions.
-- À coller UNE FOIS dans Supabase › SQL Editor › New query › Run. Peut être relancé sans risque.

-- 1) Préférences de rappel : une ligne par utilisateur.
create table if not exists public.reminder_prefs (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,                                   -- rempli automatiquement par le trigger ci-dessous
  enabled    boolean not null default false,         -- opt-in : rien n'est envoyé tant que l'utilisateur ne l'active pas
  kinds      text[]  not null default '{race,quali,sprint}',
  leads      int[]   not null default '{60}',        -- minutes avant le début de la session
  tz         text    not null default 'Europe/Paris',
  updated_at timestamptz not null default now(),
  constraint reminder_prefs_kinds_ok check (kinds <@ array['race','quali','sprint','fp']),
  constraint reminder_prefs_leads_ok check (leads <@ array[15,60,180,1440] and cardinality(leads) <= 4),
  constraint reminder_prefs_tz_ok    check (char_length(tz) <= 64)
);

-- 2) L'email vient toujours du compte connecté (jamais du client) : impossible d'envoyer des rappels à quelqu'un d'autre.
create or replace function public.reminder_prefs_fill()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.email := (select u.email from auth.users u where u.id = new.user_id);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists reminder_prefs_fill on public.reminder_prefs;
create trigger reminder_prefs_fill
  before insert or update on public.reminder_prefs
  for each row execute function public.reminder_prefs_fill();

-- 3) Sécurité : chacun ne voit et ne modifie que sa propre ligne.
alter table public.reminder_prefs enable row level security;

drop policy if exists "prefs: lire la sienne"       on public.reminder_prefs;
drop policy if exists "prefs: créer la sienne"      on public.reminder_prefs;
drop policy if exists "prefs: modifier la sienne"   on public.reminder_prefs;
drop policy if exists "prefs: supprimer la sienne"  on public.reminder_prefs;

create policy "prefs: lire la sienne"      on public.reminder_prefs for select to authenticated using (auth.uid() = user_id);
create policy "prefs: créer la sienne"     on public.reminder_prefs for insert to authenticated with check (auth.uid() = user_id);
create policy "prefs: modifier la sienne"  on public.reminder_prefs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "prefs: supprimer la sienne" on public.reminder_prefs for delete to authenticated using (auth.uid() = user_id);

revoke all on public.reminder_prefs from anon;

-- 4) Journal des envois (anti-doublon). Réservé au robot d'envoi (clé service_role) : aucune policy = personne d'autre n'y accède.
create table if not exists public.reminder_log (
  user_id    uuid not null references auth.users (id) on delete cascade,
  session_id text not null,                          -- ex. « 2026-20-Qualifying »
  lead_min   int  not null,
  sent_at    timestamptz not null default now(),
  primary key (user_id, session_id, lead_min)
);

alter table public.reminder_log enable row level security;
revoke all on public.reminder_log from anon, authenticated;
