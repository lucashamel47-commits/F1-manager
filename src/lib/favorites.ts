// Pilote et écurie favoris : copie locale (localStorage, mêmes clés qu'avant) + copie dans les métadonnées du compte
// Supabase (user_metadata, aucune table ni service en plus) pour les retrouver sur tous les appareils.
import { useEffect, useState } from 'react'
import { DRIVERS, TEAMS, normTeamId } from '../data/grid'
import { supabase } from './supabase'

const EVENT = 'f1-favs-change'
const driverKey = (email: string) => `f1-fav-drivers-${email}`
const teamKey = (email: string) => `f1-fav-team-${email}`

export interface Favorites { driverId: string; teamId: string }

export function readFavorites(email: string): Favorites {
  let driverId = ''
  try { driverId = (JSON.parse(localStorage.getItem(driverKey(email)) ?? '[]') as string[])[0] ?? '' } catch { /* illisible → aucun */ }
  const team = normTeamId(localStorage.getItem(teamKey(email)))
  return { driverId: DRIVERS.some((d) => d.id === driverId) ? driverId : '', teamId: team && TEAMS.some((t) => t.id === team) ? team : '' }
}

const notify = () => window.dispatchEvent(new Event(EVENT))

/** Enregistre en local (le pilote choisi passe en premier, les autres pilotes éventuels sont conservés). */
export function writeFavorites(email: string, next: Partial<Favorites>) {
  if (next.driverId !== undefined) {
    let list: string[] = []
    try { list = JSON.parse(localStorage.getItem(driverKey(email)) ?? '[]') } catch { /* repart de zéro */ }
    const rest = list.filter((x) => x !== next.driverId)
    localStorage.setItem(driverKey(email), JSON.stringify(next.driverId ? [next.driverId, ...rest] : []))
  }
  if (next.teamId !== undefined) {
    if (next.teamId) localStorage.setItem(teamKey(email), next.teamId)
    else localStorage.removeItem(teamKey(email))
  }
  if (next.driverId || next.teamId) localStorage.setItem(`${driverKey(email)}-onboarded`, '1')
  notify()
  queuePush(email)
}

let timer: ReturnType<typeof setTimeout> | undefined
/** Envoie les favoris vers le compte, sans bloquer l'écran ; en cas d'échec la copie locale reste valable. */
export function queuePush(email: string) {
  if (!supabase) return
  clearTimeout(timer)
  timer = setTimeout(() => {
    const f = readFavorites(email)
    const d = DRIVERS.find((x) => x.id === f.driverId)
    supabase?.auth.updateUser({
      data: { fav_driver: f.driverId || null, fav_driver_name: d ? `${d.givenName} ${d.familyName}` : null, fav_team: f.teamId || null },
    }).catch(() => {})
  }, 800)
}

/** À la connexion : les favoris du compte (s'il y en a) sont repris en local ; sinon ceux de cet appareil sont envoyés. */
export async function pullFavorites(email: string) {
  if (!supabase || !email) return
  try {
    const { data } = await supabase.auth.getUser()
    const m = data.user?.user_metadata ?? {}
    const remoteDriver = typeof m.fav_driver === 'string' && DRIVERS.some((d) => d.id === m.fav_driver) ? (m.fav_driver as string) : ''
    const remoteTeam = typeof m.fav_team === 'string' ? normTeamId(m.fav_team) ?? '' : ''
    const teamOk = remoteTeam && TEAMS.some((t) => t.id === remoteTeam) ? remoteTeam : ''
    if (!remoteDriver && !teamOk) { if (readFavorites(email).driverId || readFavorites(email).teamId) queuePush(email); return }
    const local = readFavorites(email)
    const next: Partial<Favorites> = {}
    if (remoteDriver && remoteDriver !== local.driverId) next.driverId = remoteDriver
    if (teamOk && teamOk !== local.teamId) next.teamId = teamOk
    if (next.driverId !== undefined || next.teamId !== undefined) {
      if (next.driverId !== undefined) {
        let list: string[] = []
        try { list = JSON.parse(localStorage.getItem(driverKey(email)) ?? '[]') } catch { /* repart de zéro */ }
        localStorage.setItem(driverKey(email), JSON.stringify([next.driverId, ...list.filter((x) => x !== next.driverId)]))
      }
      if (next.teamId) localStorage.setItem(teamKey(email), next.teamId)
      localStorage.setItem(`${driverKey(email)}-onboarded`, '1')
      notify()
    }
  } catch { /* hors ligne : on garde la copie locale */ }
}

/** Favoris à jour dans un composant (se met à jour quand ils changent ailleurs dans l'app). */
export function useFavorites(email: string): Favorites {
  const [fav, setFav] = useState(() => readFavorites(email))
  useEffect(() => {
    const on = () => setFav(readFavorites(email))
    on()
    window.addEventListener(EVENT, on)
    return () => window.removeEventListener(EVENT, on)
  }, [email])
  return fav
}
