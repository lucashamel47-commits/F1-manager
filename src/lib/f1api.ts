// Accès à l'API publique Jolpica (Ergast) – aucune clé, aucun secret côté client.
const BASE = 'https://api.jolpi.ca/ergast/f1'
const SEASON = new Date().getFullYear()
const TTL = 5 * 60 * 1000

export interface Driver {
  driverId: string
  permanentNumber?: string
  code?: string
  givenName: string
  familyName: string
  dateOfBirth?: string
  nationality?: string
}
export interface Constructor {
  constructorId: string
  name: string
  nationality?: string
}
export interface DriverStanding {
  position: string
  points: string
  wins: string
  Driver: Driver
  Constructors: Constructor[]
}
export interface ConstructorStanding {
  position: string
  points: string
  wins: string
  Constructor: Constructor
}
export interface RaceResult {
  position: string
  points: string
  grid: string
  status: string
  Driver: Driver
  Constructor: Constructor
  Time?: { time: string }
  FastestLap?: { rank?: string; Time?: { time: string } }
}
export interface QualiResult {
  position: string
  Driver: Driver
  Constructor: Constructor
  Q1?: string
  Q2?: string
  Q3?: string
}
export interface Race {
  season: string
  round: string
  raceName: string
  date: string
  time?: string
  Circuit: { circuitName: string; Location: { locality: string; country: string } }
  Results?: RaceResult[]
  QualifyingResults?: QualiResult[]
}

const cache = new Map<string, { t: number; p: Promise<unknown> }>()

async function get<T>(path: string): Promise<T> {
  const hit = cache.get(path)
  if (hit && Date.now() - hit.t < TTL) return hit.p as Promise<T>
  const p = fetch(`${BASE}${path}`).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })
  cache.set(path, { t: Date.now(), p })
  p.catch(() => cache.delete(path))
  return p as Promise<T>
}

export const season = SEASON

export async function getDriverStandings(): Promise<{ round: string; list: DriverStanding[] }> {
  const d = await get<{ MRData: { StandingsTable: { StandingsLists: { round: string; DriverStandings: DriverStanding[] }[] } } }>(`/${SEASON}/driverStandings.json`)
  const s = d.MRData.StandingsTable.StandingsLists[0]
  return { round: s?.round ?? '0', list: s?.DriverStandings ?? [] }
}

export async function getConstructorStandings(): Promise<{ round: string; list: ConstructorStanding[] }> {
  const d = await get<{ MRData: { StandingsTable: { StandingsLists: { round: string; ConstructorStandings: ConstructorStanding[] }[] } } }>(`/${SEASON}/constructorStandings.json`)
  const s = d.MRData.StandingsTable.StandingsLists[0]
  return { round: s?.round ?? '0', list: s?.ConstructorStandings ?? [] }
}

export async function getCalendar(): Promise<Race[]> {
  const d = await get<{ MRData: { RaceTable: { Races: Race[] } } }>(`/${SEASON}.json`)
  return d.MRData.RaceTable.Races
}

export async function getResults(round: string | number): Promise<Race | null> {
  const d = await get<{ MRData: { RaceTable: { Races: Race[] } } }>(`/${SEASON}/${round}/results.json`)
  return d.MRData.RaceTable.Races[0] ?? null
}

export async function getQualifying(round: string | number): Promise<Race | null> {
  const d = await get<{ MRData: { RaceTable: { Races: Race[] } } }>(`/${SEASON}/${round}/qualifying.json`)
  return d.MRData.RaceTable.Races[0] ?? null
}
