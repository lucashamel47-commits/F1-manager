// Suppression de compte, faite par l'utilisateur lui-même depuis l'app (aucune action manuelle).
//
// 1) On efface tout de suite ses réglages de rappel (plus aucun email ne part).
// 2) Si la fonction SQL `delete_my_account()` est installée (supabase/migrations/20261114_delete_account.sql),
//    le compte est supprimé immédiatement.
// 3) Sinon, le compte est marqué « à supprimer » (user_metadata.delete_requested_at) et le robot GitHub
//    (.github/workflows/delete-accounts.yml) le supprime définitivement au passage suivant.
//    Un compte marqué ne peut plus se reconnecter : l'app le déconnecte aussitôt.
// Dans les deux cas, la suppression du compte efface aussi reminder_prefs et reminder_log (on delete cascade).
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export const DELETE_FLAG = 'delete_requested_at'

export const isPendingDeletion = (u: User | null | undefined): boolean => Boolean(u?.user_metadata?.[DELETE_FLAG])

export async function deleteMyAccount(userId: string): Promise<void> {
  if (!supabase) throw new Error('Comptes en ligne indisponibles')
  await supabase.from('reminder_prefs').delete().eq('user_id', userId)
  const { error: rpcError } = await supabase.rpc('delete_my_account')
  if (rpcError) {
    const { error } = await supabase.auth.updateUser({ data: { [DELETE_FLAG]: new Date().toISOString() } })
    if (error) throw error
  }
  await supabase.auth.signOut({ scope: 'local' })
}
