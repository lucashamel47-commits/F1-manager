/* Historique Jolpica-F1 (gratuit, sans clé) : secours quand OpenF1 est verrouillé
   pendant une séance en direct — y compris pour les courses déjà courues. */
import { teamByName } from '../data/grid'
import type { Race, RaceResult, QualiResult } from './f1api'
import { allSessions, type Session } from './sessions'
import type { OFDriver, OFLap, OFPosition, OFResult, OFSession } from '../live/openf1'

const BASE = 'https://api.jolpi.ca/ergast/f1'
const PAGE = 100
const mem = new Map<string, unknown>()
const pending = new Map<string, Promise<unknown>>()

export class HistError extends Error {
  reason: 'pending-live' | 'pending-upcoming' | 'pending-publish' | 'no-laps' | 'unavailable'
  constructor(reason: HistError['reason'], message: string) {
    super(message)
    this.reason = reason
  }
}

export const isHistError = (e: unknown): e is HistError => e instanceof HistError

const KIND_CODE: Record<string, number> = { Race: 1, Qualifying: 2, Sprint: 3, 'Sprint Qualifying': 4, 'Sprint Shootout': 4 }
const CODE_KIND: Record<number, string> = { 1: 'Race', 2: 'Qualifying', 3: 'Sprint', 4: 'Sprint Qualifying' }

/** Clé synthétique (négative) pour reconnaître une séance construite depuis Jolpica. */
export function jolpicaSessionKey(year: number, round: number, kind: string): number {
  const c = KIND_CODE[kind]
  if (!c) throw new Error(`séance inconnue: ${kind}`)
  return -(year * 10_000 + round * 10 + c)
}

export function parseJolpicaKey(key: number): { year: number; round: number; kind: string } | null {
  if (key >= 0) return null
  const n = -key
  const year = Math.floor(n / 10_000)
  const rem = n % 10_000
  const round = Math.floor(rem / 10)
  const kind = CODE_KIND[rem % 10]
  return kind ? { year, round, kind } : null
}

export const isJolpicaSession = (s: OFSession) => s.session_key < 0

type MrData<T> = { MRData: { limit: string; offset: string; total: string } & T }

const headers: Record<string, string> = { Accept: 'application/json' }
if (typeof window === 'undefined') headers['User-Agent'] = 'F1Manager/1.0 (https://f1-manager-kappa.vercel.app)'

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const hit = mem.get(path)
  if (hit) return hit as T
  const wait = pending.get(path)
  if (wait) return wait as Promise<T>
  const job = (async () => {
    let last = 0
    for (let attempt = 0; attempt < 6; attempt++) {
      const res = await fetch(`${BASE}${path}`, { signal, headers })
      last = res.status
      if (res.status === 404) {
        const empty = { MRData: { limit: '0', offset: '0', total: '0' } } as T
        return empty
      }
      if (res.status === 429 || res.status >= 500) {
        const ra = Number(res.headers.get('retry-after'))
        const wait = Math.min(20_000, (ra > 0 ? ra * 1000 : 1500) * (attempt + 1))
        await new Promise((r) => setTimeout(r, wait))
        continue
      }
      if (!res.ok) throw new HistError('unavailable', 'Impossible de charger cette séance. Vérifie ta connexion.')
      const data = (await res.json()) as T
      mem.set(path, data)
      return data
    }
    throw new HistError('unavailable', last === 429 ? 'Trop de requêtes, réessaie dans un instant.' : 'Impossible de charger cette séance. Vérifie ta connexion.')
  })()
  pending.set(path, job)
  try { return await job } finally { pending.delete(path) }
}

async function getRaceTable(path: string, signal?: AbortSignal): Promise<{ total: number; races: Array<Record<string, unknown>> }> {
  const d = await getJson<MrData<{ RaceTable?: { Races?: Array<Record<string, unknown>> } }>>(path, signal)
  return { total: Number(d.MRData?.total ?? 0), races: d.MRData?.RaceTable?.Races ?? [] }
}

function mergeLapPages(into: JolpicaLap[], add: JolpicaLap[]) {
  for (const lap of add) {
    const existing = into.find((l) => l.number === lap.number)
    if (existing) existing.Timings.push(...(lap.Timings ?? []))
    else into.push({ number: lap.number, Timings: [...(lap.Timings ?? [])] })
  }
}

/** Toutes les pages d'un endpoint paginé (tours : 100 lignes max par requête). */
async function getAllRaces(path: string, signal?: AbortSignal): Promise<Record<string, unknown> | null> {
  const base = path.split('?')[0]
  let offset = 0
  let total = Infinity
  let acc: Record<string, unknown> | null = null
  while (offset < total) {
    if (signal?.aborted) throw new DOMException('aborted', 'AbortError')
    const page = await getRaceTable(`${base}?limit=${PAGE}&offset=${offset}`, signal)
    total = page.total
    if (!page.races[0]) break
    if (!acc) acc = structuredClone(page.races[0])
    else mergeLapPages((acc.Laps as JolpicaLap[]) ?? ((acc.Laps = []) as JolpicaLap[]), (page.races[0].Laps as JolpicaLap[]) ?? [])
    offset += PAGE
    if (offset < total) await new Promise((r) => setTimeout(r, 220))
  }
  return acc
}

export function parseLapTime(s?: string | null): number | null {
  if (!s) return null
  const parts = s.trim().split(':')
  let n = NaN
  if (parts.length === 3) n = Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2])
  else if (parts.length === 2) n = Number(parts[0]) * 60 + Number(parts[1])
  else n = Number(parts[0])
  return Number.isFinite(n) ? n : null
}

const iso = (ms: number) => new Date(ms).toISOString()

const norm = (s: string | null | undefined) =>
  (s ?? '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, ' ').trim()

/** Associe une séance OpenF1 (cache) à une manche Jolpica, sans se fier au pays (USA = 3 GP). */
export function matchRace(session: OFSession, races: Race[]): Race | null {
  const year = String(session.year)
  const ref = parseJolpicaKey(session.session_key)
  if (ref) return races.find((r) => r.season === String(ref.year) && Number(r.round) === ref.round) ?? null
  const loc = norm(session.location)
  const circuit = norm(session.circuit_short_name)
  const scored = races.filter((r) => r.season === year)
  const hit = scored.find((r) => {
    const locality = norm(r.Circuit.Location.locality)
    const cname = norm(r.Circuit.circuitName)
    const rname = norm(r.raceName)
    if (loc && (loc === locality || locality.includes(loc) || loc.includes(locality))) return true
    if (circuit && (circuit === locality || cname.includes(circuit) || locality.includes(circuit))) return true
    if (loc && rname.includes(loc)) return true
    return false
  })
  return hit ?? null
}

export function openf1LikelyLocked(races: Race[], now = Date.now()): boolean {
  return allSessions(races).some((s) => {
    const start = s.start.getTime() - 5 * 60_000
    const end = s.start.getTime() + s.minutes * 60_000 + 45 * 60_000
    return now >= start && now <= end
  })
}

export function isCurrentWeekend(race: Race, now = Date.now()): boolean {
  const list = allSessions([race])
  if (!list.length) return false
  const start = list[0].start.getTime() - 12 * 3600_000
  const last = list[list.length - 1]
  const end = last.start.getTime() + last.minutes * 60_000 + 18 * 3600_000
  return now >= start && now <= end
}

const BY_CITY: Record<string, string> = {
  'miami gardens': 'Miami', miami: 'Miami', 'las vegas': 'Las Vegas', austin: 'États-Unis',
  madrid: 'Madrid', 'kuala lumpur': 'Kuala Lumpur', imola: 'Émilie-Romagne', lusail: 'Qatar',
}
const COUNTRY_SHORT: Record<string, string> = {
  Australia: 'Australie', China: 'Chine', Japan: 'Japon', Bahrain: 'Bahreïn', 'Saudi Arabia': 'Arabie saoudite',
  'United States': 'États-Unis', Italy: 'Italie', Monaco: 'Monaco', Spain: 'Espagne', Canada: 'Canada',
  Austria: 'Autriche', 'United Kingdom': 'Grande-Bretagne', UK: 'Grande-Bretagne', Belgium: 'Belgique',
  Hungary: 'Hongrie', Netherlands: 'Pays-Bas', Azerbaijan: 'Azerbaïdjan', Singapore: 'Singapour',
  Mexico: 'Mexique', Brazil: 'Brésil', Qatar: 'Qatar', Malaysia: 'Malaisie', 'United Arab Emirates': 'Abu Dhabi',
  'Abu Dhabi': 'Abu Dhabi',
}

export function meetingName(location: string, country: string): string {
  return BY_CITY[norm(location)] ?? COUNTRY_SHORT[country] ?? country
}

function ofSession(race: Race, kind: string, start: Date, minutes: number): OFSession {
  const year = Number(race.season)
  const loc = race.Circuit.Location.locality
  const country = race.Circuit.Location.country
  const end = new Date(start.getTime() + minutes * 60_000)
  return {
    session_key: jolpicaSessionKey(year, Number(race.round), kind),
    session_name: kind,
    session_type: kind,
    date_start: start.toISOString(),
    date_end: end.toISOString(),
    meeting_key: year * 100 + Number(race.round),
    circuit_key: 0,
    circuit_short_name: race.Circuit.circuitName,
    country_name: country,
    country_code: '',
    location: loc,
    year,
    is_cancelled: false,
  }
}

function sessionForKind(race: Race, kind: string): OFSession | null {
  const list = allSessions([race])
  const pick = (pred: (s: Session) => boolean, minutes: number, fallbackStart?: Date) => {
    const s = list.find(pred)
    if (s) return ofSession(race, kind, s.start, s.minutes || minutes)
    if (fallbackStart) return ofSession(race, kind, fallbackStart, minutes)
    return null
  }
  if (kind === 'Race') return pick((s) => s.kind === 'race', 180)
  if (kind === 'Qualifying') return pick((s) => s.kind === 'quali', 75)
  if (kind === 'Sprint') return pick((s) => s.label === 'Sprint' || (s.kind === 'sprint' && /^(Sprint)$/i.test(s.label)), 70)
  if (kind === 'Sprint Qualifying' || kind === 'Sprint Shootout') {
    return pick((s) => /qualif/i.test(s.label) && s.kind === 'sprint', 45)
  }
  return null
}

export interface JolpicaMeeting { key: number; name: string; short: string; sessions: OFSession[] }

/** Week-ends déjà courus (plus le week-end en cours), du plus récent au plus ancien. */
export function meetingsFromJolpica(races: Race[], kinds: string[], now = Date.now()): JolpicaMeeting[] {
  const out: JolpicaMeeting[] = []
  for (const race of races) {
    const sessions: OFSession[] = []
    for (const kind of kinds) {
      const s = sessionForKind(race, kind)
      if (!s) continue
      const ended = Date.parse(s.date_end) < now - 6 * 3600_000
      if (ended || isCurrentWeekend(race, now)) sessions.push(s)
    }
    if (!sessions.length) continue
    const loc = race.Circuit.Location.locality
    const country = race.Circuit.Location.country
    const name = meetingName(loc, country)
    out.push({ key: Number(race.season) * 100 + Number(race.round), name, short: name, sessions })
  }
  out.sort((a, b) => b.key - a.key)
  return out
}

/** Ajoute le week-end en cours s'il manque dans la liste OpenF1 (séances pas encore « settled »). */
export function mergeCurrentWeekend(meetings: JolpicaMeeting[], races: Race[], kinds: string[], now = Date.now()): JolpicaMeeting[] {
  const extras = meetingsFromJolpica(races, kinds, now).filter((m) => {
    const race = races.find((r) => Number(r.season) * 100 + Number(r.round) === m.key)
    return race && isCurrentWeekend(race, now)
  })
  const have = new Set(meetings.map((m) => norm(m.name) + '|' + m.sessions.map((s) => s.session_name).join(',')))
  const add = extras.filter((m) => !meetings.some((x) => norm(x.name) === norm(m.name) || x.key === m.key) && !have.has(norm(m.name)))
  return add.length ? [...add, ...meetings] : meetings
}

function toDriver(d: { givenName: string; familyName: string; code?: string; permanentNumber?: string }, number: string, ctorName: string, ctorId: string): OFDriver {
  const team = teamByName(ctorName) ?? teamByName(ctorId)
  return {
    driver_number: Number(number),
    name_acronym: d.code ?? (d.familyName.slice(0, 3).toUpperCase()),
    full_name: `${d.givenName} ${d.familyName}`,
    first_name: d.givenName,
    last_name: d.familyName,
    team_name: team?.name ?? ctorName,
    team_colour: (team?.color ?? '#a1a1aa').replace('#', ''),
  }
}

function statusFlags(r: RaceResult): { dnf: boolean; dns: boolean; dsq: boolean; position: number | null } {
  const st = (r.status ?? '').toLowerCase()
  const pt = String((r as RaceResult & { positionText?: string }).positionText ?? r.position ?? '')
  const dsq = pt === 'D' || st.includes('disqualif')
  const dns = pt === 'W' || /did not start|dns/.test(st)
  const classified = /^\d+$/.test(pt) || /^(finished|lapped)$/.test(st) || /^\+\d+ laps?$/.test(st)
  const pos = /^\d+$/.test(String(r.position)) && classified && !dsq ? Number(r.position) : null
  return { dsq, dns, dnf: !dsq && !dns && !classified, position: pos }
}

function resultsFrom(rows: RaceResult[]): { drivers: OFDriver[]; results: OFResult[]; grid: Map<number, number> } {
  const drivers: OFDriver[] = []
  const results: OFResult[] = []
  const grid = new Map<number, number>()
  for (const r of rows) {
    const num = r.Driver.permanentNumber || (r as RaceResult & { number?: string }).number || ''
    if (!num) continue
    const d = toDriver(r.Driver, String((r as RaceResult & { number?: string }).number || num), r.Constructor.name, r.Constructor.constructorId)
    drivers.push(d)
    const fl = statusFlags(r)
    results.push({ driver_number: d.driver_number, position: fl.position, number_of_laps: Number((r as RaceResult & { laps?: string }).laps ?? 0) || null, dnf: fl.dnf, dns: fl.dns, dsq: fl.dsq })
    const g = Number(r.grid)
    if (Number.isFinite(g) && g > 0) grid.set(d.driver_number, g)
  }
  return { drivers, results, grid }
}

interface Timing { driverId: string; time: string; position: string }
interface JolpicaLap { number: string; Timings: Timing[] }

function fromRaceLaps(
  race: { date?: string; time?: string; Results?: RaceResult[]; Laps?: JolpicaLap[] },
  t0: number,
): { drivers: OFDriver[]; laps: OFLap[]; results: OFResult[]; positions: OFPosition[] } {
  const { drivers, results, grid } = resultsFrom(race.Results ?? [])
  const byId = new Map<string, OFDriver>()
  for (const r of race.Results ?? []) {
    const num = String((r as RaceResult & { number?: string }).number || r.Driver.permanentNumber || '')
    const d = drivers.find((x) => x.driver_number === Number(num))
    if (d) byId.set(r.Driver.driverId, d)
  }
  const accum = new Map<number, number>()
  const laps: OFLap[] = []
  const positions: OFPosition[] = []
  for (const d of drivers) {
    const g = grid.get(d.driver_number)
    if (g) positions.push({ driver_number: d.driver_number, date: iso(t0), position: g })
    accum.set(d.driver_number, t0)
  }
  const ordered = [...(race.Laps ?? [])].sort((a, b) => Number(a.number) - Number(b.number))
  for (const lap of ordered) {
    const n = Number(lap.number)
    for (const t of lap.Timings ?? []) {
      const d = byId.get(t.driverId)
      if (!d) continue
      const dur = parseLapTime(t.time)
      const start = accum.get(d.driver_number) ?? t0
      laps.push({
        driver_number: d.driver_number,
        lap_number: n,
        date_start: iso(start),
        lap_duration: dur,
        duration_sector_1: null,
        duration_sector_2: null,
        duration_sector_3: null,
        i1_speed: null,
        i2_speed: null,
        st_speed: null,
        is_pit_out_lap: false,
      })
      const end = dur != null ? start + dur * 1000 : start
      accum.set(d.driver_number, end)
      const pos = Number(t.position)
      if (Number.isFinite(pos) && pos > 0) positions.push({ driver_number: d.driver_number, date: iso(end), position: pos })
    }
  }
  return { drivers, laps, results, positions }
}

function fromQuali(race: { QualifyingResults?: QualiResult[] }, t0: number): { drivers: OFDriver[]; laps: OFLap[]; results: OFResult[]; positions: OFPosition[] } {
  const rows = race.QualifyingResults ?? []
  const drivers: OFDriver[] = []
  const laps: OFLap[] = []
  const results: OFResult[] = []
  const positions: OFPosition[] = []
  rows.forEach((r, i) => {
    const num = String((r as QualiResult & { number?: string }).number || r.Driver.permanentNumber || '')
    if (!num) return
    const d = toDriver(r.Driver, num, r.Constructor.name, r.Constructor.constructorId)
    drivers.push(d)
    const pos = Number(r.position) || i + 1
    results.push({ driver_number: d.driver_number, position: pos, number_of_laps: null })
    positions.push({ driver_number: d.driver_number, date: iso(t0), position: pos })
    ;(['Q1', 'Q2', 'Q3'] as const).forEach((k, li) => {
      const dur = parseLapTime(r[k])
      if (dur == null) return
      const start = t0 + li * 20 * 60_000
      laps.push({
        driver_number: d.driver_number, lap_number: li + 1, date_start: iso(start), lap_duration: dur,
        duration_sector_1: null, duration_sector_2: null, duration_sector_3: null,
        i1_speed: null, i2_speed: null, st_speed: null, is_pit_out_lap: false,
      })
    })
  })
  return { drivers, laps, results, positions }
}

export interface HistBundle { drivers: OFDriver[]; laps: OFLap[]; results: OFResult[]; positions: OFPosition[] }

const bundles = new Map<number, HistBundle>()
const bundlePend = new Map<number, Promise<HistBundle>>()

function whenFr(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(d)
}

function kindLabel(kind: string): { the: string; mid: string } {
  if (kind === 'Race') return { the: 'La course', mid: 'course' }
  if (kind === 'Sprint') return { the: 'Le sprint', mid: 'sprint' }
  if (kind === 'Qualifying') return { the: 'Les qualifications', mid: 'qualifications' }
  return { the: 'Les qualifications sprint', mid: 'qualifications sprint' }
}

function liveOrUpcomingMessage(session: OFSession, now = Date.now()): string | null {
  const start = Date.parse(session.date_start)
  const end = Date.parse(session.date_end)
  const name = meetingName(session.location, session.country_name)
  const kind = session.session_name
  const when = Number.isFinite(start) ? whenFr(new Date(start)) : ''
  if (Number.isFinite(start) && now < start) {
    if (kind === 'Race') return `La course du ${name} n'a pas encore eu lieu. Elle est prévue ${when} (heure de Paris). En attendant, tu peux consulter une course déjà courue.`
    if (kind === 'Sprint') return `Le sprint du ${name} n'a pas encore eu lieu. Il est prévu ${when} (heure de Paris). En attendant, tu peux consulter une séance déjà terminée.`
    if (kind === 'Qualifying') return `Les qualifications du ${name} n'ont pas encore commencé. C’est prévu ${when} (heure de Paris).`
    return `Les qualifications sprint du ${name} n'ont pas encore commencé. C’est prévu ${when} (heure de Paris).`
  }
  if (Number.isFinite(start) && now <= (Number.isFinite(end) ? end : start) + 15 * 60_000) {
    if (kind === 'Race') return `La course du ${name} est en cours. Les positions tour par tour seront disponibles une fois l’arrivée donnée.`
    if (kind === 'Sprint') return `Le sprint du ${name} est en cours. Les tours détaillés seront disponibles une fois la séance terminée.`
    if (kind === 'Qualifying') return `Les qualifications du ${name} sont en cours. Les tours détaillés seront disponibles une fois la séance terminée.`
    return `Les qualifications sprint du ${name} sont en cours. Les tours détaillés seront disponibles une fois la séance terminée.`
  }
  return null
}

export function emptySessionMessage(session: OFSession, reason: HistError['reason']): string {
  const pending = liveOrUpcomingMessage(session)
  if (pending && (reason === 'pending-live' || reason === 'pending-upcoming' || reason === 'pending-publish')) return pending
  const name = meetingName(session.location, session.country_name)
  if (reason === 'no-laps' && session.session_name === 'Sprint') {
    return `Les temps au tour du sprint du ${name} ne sont pas disponibles pour le moment. Choisis l’onglet Course, ou réessaie plus tard.`
  }
  if (reason === 'no-laps' && session.session_name !== 'Race') {
    return `Le détail tour par tour des ${kindLabel(session.session_name).mid} du ${name} n'est pas disponible pour le moment. Réessaie plus tard, ou choisis l’onglet Course.`
  }
  return `Les données de cette séance (${name}) ne sont pas encore publiées. Réessaie un peu plus tard.`
}

async function fetchBundle(session: OFSession, races: Race[], signal?: AbortSignal): Promise<HistBundle> {
  const race = matchRace(session, races)
  if (!race) throw new HistError('unavailable', 'Données indisponibles pour cette session.')
  const kind = parseJolpicaKey(session.session_key)?.kind ?? session.session_name
  const year = race.season
  const round = race.round
  const t0 = Date.parse(session.date_start)
  const soon = liveOrUpcomingMessage(session)
  if (kind === 'Race') {
    const raw = await getAllRaces(`/${year}/${round}/laps.json`, signal)
    const res = await getRaceTable(`/${year}/${round}/results.json?limit=40`, signal)
    const results = (res.races[0]?.Results ?? []) as RaceResult[]
    if (!results.length) throw new HistError(soon ? (Date.now() < Date.parse(session.date_start) ? 'pending-upcoming' : 'pending-live') : 'pending-publish', emptySessionMessage(session, soon && Date.now() < Date.parse(session.date_start) ? 'pending-upcoming' : soon ? 'pending-live' : 'pending-publish'))
    const bundled = fromRaceLaps({ ...res.races[0], Results: results, Laps: (raw?.Laps ?? []) as JolpicaLap[] }, t0)
    if (bundled.laps.length < 2) throw new HistError('pending-publish', emptySessionMessage(session, 'pending-publish'))
    return bundled
  }
  if (kind === 'Qualifying') {
    const res = await getRaceTable(`/${year}/${round}/qualifying.json?limit=40`, signal)
    const q = (res.races[0]?.QualifyingResults ?? []) as QualiResult[]
    if (!q.length) throw new HistError(soon ? (Date.now() < Date.parse(session.date_start) ? 'pending-upcoming' : 'pending-live') : 'pending-publish', emptySessionMessage(session, soon && Date.now() < Date.parse(session.date_start) ? 'pending-upcoming' : soon ? 'pending-live' : 'pending-publish'))
    return fromQuali({ QualifyingResults: q }, t0)
  }
  if (kind === 'Sprint') {
    const res = await getRaceTable(`/${year}/${round}/sprint.json?limit=40`, signal)
    const rows = (res.races[0]?.SprintResults ?? []) as RaceResult[]
    if (!rows.length) throw new HistError(soon ? (Date.now() < Date.parse(session.date_start) ? 'pending-upcoming' : 'pending-live') : 'pending-publish', emptySessionMessage(session, soon && Date.now() < Date.parse(session.date_start) ? 'pending-upcoming' : soon ? 'pending-live' : 'pending-publish'))
    // Jolpica fournit le classement du sprint, pas les temps au tour.
    throw new HistError('no-laps', emptySessionMessage(session, 'no-laps'))
  }
  throw new HistError('no-laps', emptySessionMessage(session, 'no-laps'))
}

/** Charge (et met en cache) pilotes, tours, résultats et positions pour une séance. */
export async function loadJolpicaBundle(session: OFSession, races: Race[], signal?: AbortSignal): Promise<HistBundle> {
  const hit = bundles.get(session.session_key)
  if (hit) return hit
  const wait = bundlePend.get(session.session_key)
  if (wait) return wait
  const job = fetchBundle(session, races, signal)
  bundlePend.set(session.session_key, job)
  try {
    const data = await job
    bundles.set(session.session_key, data)
    return data
  } finally {
    bundlePend.delete(session.session_key)
  }
}

