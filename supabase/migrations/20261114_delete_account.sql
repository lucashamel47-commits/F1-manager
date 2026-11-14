-- F1 Manager — suppression de compte instantanée depuis l'app (bouton « Supprimer mon compte » dans Rappels).
-- FACULTATIF : sans ce script, la suppression marche quand même (le robot GitHub delete-accounts.yml supprime
-- les comptes marqués, en général dans l'heure). Avec ce script, la suppression est immédiate.
-- À coller UNE FOIS dans Supabase › SQL Editor › New query › Run. Peut être relancé sans risque.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  delete from public.reminder_log   where user_id = uid;
  delete from public.reminder_prefs where user_id = uid;
  delete from auth.users            where id = uid;  -- chacun ne peut supprimer que son propre compte
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
