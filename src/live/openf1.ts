/* Client OpenF1 (https://openf1.org) : file d'attente respectueuse des limites, erreurs typées, cache de l'historique. */

const BASE = 'https://api.openf1.org/v1'

export type OFErrorKind = 'auth' | 'rate' | 'network' | 'http' | 'abort'

export class OpenF1Error extends Error {
  kind: OFErrorKind
  status: number
  constructor(kind: OFErrorKind, message: string, status = 0) {
    super(message)
    this.kind = kind
    this.status = status
  }
}

export interface OFSession {
  session_key: number
  session_name: string
  session_type: string
  date_start: string
  date_end: string
  meeting_key: number
  circuit_key: number
  circuit_short_name: string
  country_name: string
  country_code: string
  location: string
  year: number
  gmt_offset?: string
  is_cancelled?: boolean
}
export interface OFDriver {
  driver_number: number
  name_acronym: string
  full_name: string
  first_name: string
  last_name: string
  team_name: string
  team_colour: string
  headshot_url?: string | null
}
export interface OFLap {
  driver_number: number
  lap_number: number
  date_start: string | null
  lap_duration: number | null
  duration_sector_1: number | null
  duration_sector_2: number | null
  duration_sector_3: number | null
  i1_speed: number | null
  i2_speed: number | null
  st_speed: number | null
  is_pit_out_lap: boolean | null
}
export interface OFStint { driver_number: number; stint_number: number; lap_start: number | null; lap_end: number | null; compound: string | null; tyre_age_at_start: number | null }
export interface OFPit { driver_number: number; date: string; lap_number: number | null; lane_duration?: number | null; pit_duration?: number | null; stop_duration?: number | null }
export interface OFPosition { driver_number: number; date: string; position: number }
export interface OFInterval { driver_number: number; date: string; gap_to_leader: number | string | null; interval: number | string | null }
export interface OFRaceControl { date: string; lap_number: number | null; category: string; flag: string | null; scope: string | null; sector: number | null; driver_number: number | null; message: string }
export interface OFWeather { date: string; air_temperature: number; track_temperature: number; humidity: number; pressure: number; rainfall: number; wind_speed: number; wind_direction: number }
export interface OFOvertake { date: string; overtaking_driver_number: number; overtaken_driver_number: number; position: number }
export interface OFRadio { date: string; driver_number: number; recording_url: string }
export interface OFResult { driver_number: number; position: number | null; number_of_laps: number | null; dnf?: boolean; dns?: boolean; dsq?: boolean; gap_to_leader?: number | string | null; duration?: number | number[] | null }
export interface OFLocation { driver_number: number; date: string; x: number; y: number }
export interface OFCarData { driver_number: number; date: string; speed: number; throttle: number; brake: number; n_gear: number; rpm: number; drs: number | null }

type Params = Record<string, string | number>
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Construit la query : `date>=` / `date<` etc. sont acceptés tels quels comme clés. */
export function buildUrl(path: string, params: Params): string {
  const qs = Object.entries(params)
    .map(([k, v]) => `${/[<>]=?$/.test(k) ? k : k + '='}${encodeURIComponent(String(v))}`)
    .join('&')
  return `${BASE}/${path}${qs ? '?' + qs : ''}`
}

// --- file d'attente : au plus ~3 requêtes / seconde, jamais plus de 3 en vol ---
const GAP_MS = 340
let nextSlot = 0
let inflight = 0
async function slot(signal?: AbortSignal) {
  const now = Date.now()
  nextSlot = Math.max(nextSlot, now) + GAP_MS
  const wait = nextSlot - GAP_MS - now
  if (wait > 0) await sleep(wait)
  while (inflight >= 3) await sleep(60)
  if (signal?.aborted) throw new OpenF1Error('abort', 'annulé')
}

export async function rawGet<T>(path: string, params: Params, signal?: AbortSignal): Promise<T[]> {
  const url = buildUrl(path, params)
  let lastErr: OpenF1Error | null = null
  for (let attempt = 0; attempt < 4; attempt++) {
    await slot(signal)
    inflight++
    try {
      const res = await fetch(url, { signal })
      if (res.status === 404) return [] // « No results found »
      if (res.status === 401 || res.status === 403) throw new OpenF1Error('auth', 'Accès refusé (données en direct réservées aux abonnés OpenF1)', res.status)
      if (res.status === 429) {
        lastErr = new OpenF1Error('rate', 'Trop de requêtes (limite OpenF1)', 429)
        const ra = Number(res.headers.get('retry-after'))
        await sleep(Math.min(8000, (ra > 0 ? ra * 1000 : 1500) * (attempt + 1)))
        continue
      }
      if (res.status >= 500) { lastErr = new OpenF1Error('http', `Erreur serveur OpenF1 (${res.status})`, res.status); await sleep(800 * (attempt + 1)); continue }
      if (!res.ok) throw new OpenF1Error('http', `Erreur OpenF1 (${res.status})`, res.status)
      const data = await res.json()
      return Array.isArray(data) ? (data as T[]) : []
    } catch (e) {
      if (e instanceof OpenF1Error) { if (e.kind === 'auth') throw e; lastErr = e; if (e.kind === 'http' && e.status < 500) throw e; continue }
      if ((e as Error)?.name === 'AbortError') throw new OpenF1Error('abort', 'annulé')
      lastErr = new OpenF1Error('network', 'Réseau indisponible')
      await sleep(600 * (attempt + 1))
    } finally {
      inflight--
    }
  }
  throw lastErr ?? new OpenF1Error('network', 'Réseau indisponible')
}

// --- cache de l'historique (Cache API, persistant ; + mémoire) ---
const CACHE_NAME = 'openf1-hist-v1'
const mem = new Map<string, unknown[]>()
const pending = new Map<string, Promise<unknown[]>>()
let cachePruned = false

async function pruneCache(c: Cache) {
  if (cachePruned) return
  cachePruned = true
  const keys = await c.keys()
  if (keys.length > 700) await Promise.all(keys.slice(0, keys.length - 500).map((k) => c.delete(k)))
}

/** Données d'une session terminée : lues du cache si possible, sinon réseau puis mise en cache. */
export async function histGet<T>(path: string, params: Params, signal?: AbortSignal): Promise<T[]> {
  const url = buildUrl(path, params)
  const m = mem.get(url)
  if (m) return m as T[]
  const p = pending.get(url)
  if (p) return p as Promise<T[]>
  const job = (async () => {
    let cache: Cache | null = null
    try { cache = 'caches' in globalThis ? await caches.open(CACHE_NAME) : null } catch { cache = null }
    if (cache) {
      pruneCache(cache).catch(() => {})
      const hit = await cache.match(url).catch(() => undefined)
      if (hit) { try { const d = (await hit.json()) as T[]; mem.set(url, d); return d } catch { /* cache corrompu : on retélécharge */ } }
    }
    const data = await rawGet<T>(path, params, signal)
    if (data.length < 150_000) mem.set(url, data)
    if (cache) cache.put(url, new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } })).catch(() => {})
    return data
  })()
  pending.set(url, job)
  try { return await job } finally { pending.delete(url) }
}

// --- sessions d'une année (liste légère, rafraîchie si l'année est en cours) ---
export async function getSessions(year: number, signal?: AbortSignal): Promise<OFSession[]> {
  const key = `f1-of-sessions-${year}`
  const cur = new Date().getFullYear()
  let cached: { t: number; data: OFSession[] } | null = null
  try { cached = JSON.parse(localStorage.getItem(key) ?? 'null') } catch { cached = null }
  const fresh = cached && (year < cur ? true : Date.now() - cached.t < 30 * 60_000)
  if (cached && fresh) return cached.data
  try {
    const data = await rawGet<OFSession>('sessions', { year }, signal)
    data.sort((a, b) => a.date_start.localeCompare(b.date_start))
    if (data.length) { try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), data })) } catch { /* quota */ } }
    return data
  } catch (e) {
    if (cached) return cached.data // hors ligne : dernière liste connue
    throw e
  }
}

export const iso = (ms: number) => new Date(ms).toISOString()
export const ms = (s: string | null | undefined) => (s ? Date.parse(s) : NaN)
