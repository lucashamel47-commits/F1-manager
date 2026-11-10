// Championnat en direct : classements + calendrier Jolpica-F1, et détection automatique du titre
// (mathématiquement joué quand l'avance du leader dépasse les points encore en jeu, ou saison terminée).
import { useCallback, useEffect, useState } from 'react'

const API = 'https://api.jolpi.ca/ergast/f1/current'
/** Barème 2026 : plus de point du meilleur tour. */
export const PTS = { race: 25, raceTeam: 25 + 18, sprint: 8, sprintTeam: 8 + 7 }

export interface Title {
  decided: boolean
  seasonOver: boolean
  lead: number
  /** points encore attribuables au leader poursuivi (max pour le 2e) */
  remaining: number
  racesLeft: number
  sprintsLeft: number
  leaderName: string
  leaderTeam: string
}
export interface Championship {
  season: string
  round: number
  totalRounds: number
  lastRaceName: string
  drivers: any[]
  constructors: any[]
  driverTitle: Title | null
  constructorTitle: Title | null
  updatedAt: number
}

const raceTime = (r: any) => Date.parse(`${r.date}T${r.time ?? '23:59:00Z'}`)

/** Calcul pur, exporté pour être testable. */
export function computeTitle(
  list: { points: string; name: string; team: string }[],
  calendar: any[],
  round: number,
  team: boolean,
  now = Date.now(),
): Title | null {
  if (list.length < 2 || !calendar.length) return null
  // une manche compte comme « à venir » si elle est après la manche des classements,
  // ou si c'est la manche en cours et que la course n'a pas encore eu lieu (sprint déjà couru).
  const left = calendar.filter((r) => Number(r.round) > round || (Number(r.round) === round && raceTime(r) > now))
  const racesLeft = left.length
  const sprintsLeft = left.filter((r) => r.Sprint && Number(r.round) > round).length
  const remaining = racesLeft * (team ? PTS.raceTeam : PTS.race) + sprintsLeft * (team ? PTS.sprintTeam : PTS.sprint)
  const lead = Number(list[0].points) - Number(list[1].points)
  const seasonOver = racesLeft === 0 && round >= Number(calendar[calendar.length - 1].round)
  return { decided: seasonOver || lead > remaining, seasonOver, lead, remaining, racesLeft, sprintsLeft, leaderName: list[0].name, leaderTeam: list[0].team }
}

async function j(path: string) {
  const r = await fetch(`${API}${path}`, { cache: 'no-store' })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

export async function fetchChampionship(): Promise<Championship> {
  const [d, c, cal] = await Promise.all([j('/driverStandings.json'), j('/constructorStandings.json'), j('.json?limit=40')])
  const ds = d.MRData.StandingsTable.StandingsLists[0]
  const cs = c.MRData.StandingsTable.StandingsLists[0]
  const races: any[] = cal.MRData.RaceTable.Races ?? []
  const drivers: any[] = ds?.DriverStandings ?? []
  const constructors: any[] = cs?.ConstructorStandings ?? []
  const round = Number(ds?.round ?? 0)
  const now = Date.now()
  return {
    season: ds?.season ?? cal.MRData.RaceTable.season,
    round,
    totalRounds: races.length,
    lastRaceName: races.find((r) => Number(r.round) === round)?.raceName ?? '',
    drivers,
    constructors,
    driverTitle: computeTitle(drivers.map((x) => ({ points: x.points, name: `${x.Driver.givenName} ${x.Driver.familyName}`, team: x.Constructors.at(-1)?.name ?? '' })), races, round, false, now),
    constructorTitle: computeTitle(constructors.map((x) => ({ points: x.points, name: x.Constructor.name, team: x.Constructor.name })), races, Number(cs?.round ?? round), true, now),
    updatedAt: now,
  }
}

/** Classements en direct : chargés à l'ouverture, rafraîchis toutes les 5 min et au retour sur l'onglet. */
export function useChampionship() {
  const [data, setData] = useState<Championship | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const load = useCallback(() => {
    fetchChampionship().then((x) => { setData(x); setState('ok') }, () => setState((s) => (s === 'ok' ? 'ok' : 'error')))
  }, [])
  useEffect(() => {
    load()
    const id = setInterval(load, 5 * 60_000)
    const vis = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', vis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis) }
  }, [load])
  const reload = useCallback(() => { setState('loading'); load() }, [load])
  return { data, state, reload }
}
