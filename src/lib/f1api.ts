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

// ---------- Historique : classement final d'une saison (mis en cache, y compris localStorage) ----------
export interface SeasonTop {
  name: string
  team?: string
  points: string
  wins: string
}
export interface SeasonSummary {
  year: number
  kind: 'drivers' | 'constructors'
  round: string
  top: SeasonTop[]
}

const LS_PREFIX = 'f1-hist-v1-'

function readLs(key: string): SeasonSummary | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    return raw ? (JSON.parse(raw) as SeasonSummary) : null
  } catch {
    return null
  }
}

/** Top 3 final d'une saison passée (immuable → cache permanent). Saison en cours → cache court. */
export async function getSeasonTop(year: number, kind: 'drivers' | 'constructors'): Promise<SeasonSummary> {
  const key = `${kind}-${year}`
  const current = year >= SEASON
  if (!current) {
    const hit = readLs(key)
    if (hit) return hit
  }
  const path = kind === 'drivers' ? 'driverStandings' : 'constructorStandings'
  const attempt = async (): Promise<SeasonSummary> => {
    const d = await get<{ MRData: { StandingsTable: { StandingsLists: { round: string; DriverStandings?: DriverStanding[]; ConstructorStandings?: ConstructorStanding[] }[] } } }>(`/${year}/${path}.json`)
    const s = d.MRData.StandingsTable.StandingsLists[0]
    if (!s) throw new Error('Aucune donnée')
    const top: SeasonTop[] =
      kind === 'drivers'
        ? (s.DriverStandings ?? []).slice(0, 3).map((x) => ({
            name: `${x.Driver.givenName} ${x.Driver.familyName}`,
            team: x.Constructors[x.Constructors.length - 1]?.name,
            points: x.points,
            wins: x.wins,
          }))
        : (s.ConstructorStandings ?? []).slice(0, 3).map((x) => ({ name: x.Constructor.name, points: x.points, wins: x.wins }))
    return { year, kind, round: s.round, top }
  }
  let res: SeasonSummary
  try {
    res = await attempt()
  } catch {
    await new Promise((r) => setTimeout(r, 1200))
    res = await attempt()
  }
  if (!current) {
    try {
      localStorage.setItem(LS_PREFIX + key, JSON.stringify(res))
    } catch {
      /* stockage plein ou indisponible : on ignore */
    }
  }
  return res
}

// ---------- Vainqueurs des courses de la saison (une seule requête) ----------
export interface RaceWinner {
  name: string
  team?: string
}
export async function getSeasonWinners(): Promise<Record<number, RaceWinner>> {
  const d = await get<{
    MRData: { RaceTable: { Races: { round: string; Results: { Driver: { givenName: string; familyName: string }; Constructor: { name: string } }[] }[] } }
  }>(`/${SEASON}/results/1.json?limit=30`)
  const out: Record<number, RaceWinner> = {}
  for (const r of d.MRData.RaceTable.Races) {
    const w = r.Results[0]
    if (w) out[Number(r.round)] = { name: `${w.Driver.givenName} ${w.Driver.familyName}`, team: w.Constructor.name }
  }
  return out
}
