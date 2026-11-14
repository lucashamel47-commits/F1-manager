// Supprime définitivement les comptes que leurs propriétaires ont demandé à supprimer depuis l'app
// (bouton « Supprimer mon compte » → user_metadata.delete_requested_at). Lancé par .github/workflows/delete-accounts.yml.
// La suppression du compte efface aussi ses réglages et son journal de rappels (on delete cascade).
//
// Variables : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (secret GitHub). DRY_RUN=1 : affiche sans supprimer.
// Seul l'utilisateur connecté peut poser ce marqueur sur SON compte : personne ne peut faire supprimer le compte d'un autre.
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '')
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const DRY = process.env.DRY_RUN === '1'

if (!SUPABASE_URL || !KEY) {
  console.error('Configuration incomplète : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.')
  process.exit(1)
}

const auth = (path, init = {}) =>
  fetch(`${SUPABASE_URL}/auth/v1/${path}`, { ...init, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, ...init.headers } })

const pending = []
for (let page = 1; ; page++) {
  const res = await auth(`admin/users?page=${page}&per_page=1000`)
  if (!res.ok) throw new Error(`Liste des comptes : ${res.status} ${await res.text()}`)
  const { users = [] } = await res.json()
  for (const u of users) if (u.user_metadata?.delete_requested_at) pending.push(u.id)
  if (users.length < 1000) break
}

let done = 0
for (const id of pending) {
  if (DRY) { console.log(`[simulation] suppression du compte ${id.slice(0, 8)}…`); continue }
  const res = await auth(`admin/users/${id}`, { method: 'DELETE' })
  if (res.ok || res.status === 404) done++
  else console.error(`Échec pour ${id.slice(0, 8)}… : ${res.status} ${await res.text()}`)
}
console.log(`${pending.length} demande(s) de suppression, ${DRY ? 0 : done} compte(s) supprimé(s).`)
if (done < pending.length && !DRY) process.exit(1)
