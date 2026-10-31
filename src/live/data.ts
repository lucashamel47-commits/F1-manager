/* Chargement d'une session, polling live, positions des voitures (location) et télémétrie (car_data). */
import { histGet, rawGet, iso, ms } from './openf1'
import type { OFSession, OFDriver, OFLap, OFStint, OFPit, OFPosition, OFInterval, OFRaceControl, OFWeather, OFOvertake, OFRadio, OFResult, OFLocation, OFCarData } from './openf1'
import { emptyStore, merge, finalizeBounds } from './model'
import type { Store } from './model'

/** Une session terminée depuis plus de 6 h est figée → on peut la garder durablement en cache. */
export const isSettled = (s: OFSession) => ms(s.date_end) < Date.now() - 6 * 3600_000

export type Progress = { done: number; total: number; label: string }

export async function loadStore(session: OFSession, opts: { onProgress?: (p: Progress) => void; signal?: AbortSignal; until?: number } = {}): Promise<Store> {
  const { onProgress, signal, until } = opts
  const get = isSettled(session) && until == null ? histGet : rawGet
  const key = { session_key: session.session_key }
  const up: Record<string, string> = until != null ? { 'date<': iso(until) } : {}
  const store = emptyStore(session)
  store.partial = until != null
  const steps: [string, () => Promise<void>][] = [
    ['pilotes', async () => merge.drivers(store, await get<OFDriver>('drivers', key, signal))],
    ['tours', async () => merge.laps(store, await get<OFLap>('laps', until != null ? { ...key, 'date_start<': iso(until) } : key, signal))],
    ['pneus', async () => merge.stints(store, await get<OFStint>('stints', key, signal))],
    ['stands', async () => merge.pits(store, await get<OFPit>('pit', { ...key, ...up }, signal))],
    ['direction de course', async () => merge.rc(store, await get<OFRaceControl>('race_control', { ...key, ...up }, signal))],
    ['météo', async () => merge.weather(store, await get<OFWeather>('weather', { ...key, ...up }, signal))],
    ['positions', async () => merge.positions(store, await get<OFPosition>('position', { ...key, ...up }, signal))],
    ['dépassements', async () => merge.overtakes(store, await get<OFOvertake>('overtakes', { ...key, ...up }, signal))],
    ['radios', async () => merge.radio(store, await get<OFRadio>('team_radio', { ...key, ...up }, signal))],
    ['résultats', async () => { if (until == null) merge.results(store, await get<OFResult>('session_result', key, signal)) }],
    ['écarts', async () => { if (store.isRace) merge.intervals(store, await get<OFInterval>('intervals', { ...key, ...up }, signal)) }],
  ]
  let done = 0
  for (const [label, run] of steps) {
    onProgress?.({ done, total: steps.length, label })
    await run()
    done++
  }
  onProgress?.({ done, total: steps.length, label: 'terminé' })
  if (until == null) finalizeBounds(store)
  else { store.t0 = ms(session.date_start); store.version++ }
  if (!store.drivers.length && !store.laps.size) throw new Error('Aucune donnée disponible pour cette session')
  return store
}

// ---------------- polling live ----------------
export interface LiveHandle { stop: () => void }
export interface LivePollOpts {
  store: Store
  now: () => number
  onUpdate: () => void
  onError: (e: unknown) => void
  onOk: () => void
  loc?: LocationStore
  carWatch?: () => number | null
  car?: CarDataStore
  simulated?: boolean
}

export function startLivePolling(o: LivePollOpts): LiveHandle {
  const { store } = o
  const key = { session_key: store.session.session_key }
  let stopped = false
  let tick = 0
  const upper = (k: string): Record<string, string> => (o.simulated ? { [k]: iso(o.now()) } : {})
  const cursor = { pos: 0, int: 0, rc: 0 }
  for (const arr of store.positions.values()) for (const v of arr) cursor.pos = Math.max(cursor.pos, v[0])
  for (const arr of store.intervals.values()) for (const v of arr) cursor.int = Math.max(cursor.int, v.t)
  for (const r of store.rc) cursor.rc = Math.max(cursor.rc, r.t)
  const from = (c: number, fallbackBack: number) => iso(c > 0 ? c : o.now() - fallbackBack)

  const run = async () => {
    if (stopped) return
    try {
      const jobs: Promise<void>[] = []
      jobs.push((async () => {
        const rows = await rawGet<OFPosition>('position', { ...key, 'date>': from(cursor.pos, 120_000), ...upper('date<') })
        if (rows.length) { merge.positions(store, rows); cursor.pos = Math.max(cursor.pos, ...rows.map((r) => ms(r.date))) }
      })())
      if (store.isRace) jobs.push((async () => {
        const rows = await rawGet<OFInterval>('intervals', { ...key, 'date>': from(cursor.int, 120_000), ...upper('date<') })
        if (rows.length) { merge.intervals(store, rows); cursor.int = Math.max(cursor.int, ...rows.map((r) => ms(r.date))) }
      })())
      if (o.loc) jobs.push(o.loc.pollLive(store.session.session_key, o.now(), o.simulated))
      if (tick % 2 === 0) {
        jobs.push((async () => {
          const rows = await rawGet<OFRaceControl>('race_control', { ...key, 'date>': from(cursor.rc, 600_000), ...upper('date<') })
          if (rows.length) {
            const seen = new Set(store.rc.map((r) => r.t + r.msg))
            const fresh = rows.filter((r) => !seen.has(ms(r.date) + r.message))
            if (fresh.length) {
              const old = store.rc
              merge.rc(store, rows)
              store.rc = [...old, ...store.rc.filter((r) => !seen.has(r.t + r.msg))].sort((a, b) => a.t - b.t)
            }
            cursor.rc = Math.max(cursor.rc, ...rows.map((r) => ms(r.date)))
          }
        })())
        jobs.push((async () => {
          merge.laps(store, await rawGet<OFLap>('laps', { ...key, 'date_start>': iso(o.now() - 5 * 60_000), ...upper('date_start<') }))
        })())
      }
      if (tick % 4 === 1) {
        jobs.push((async () => merge.stints(store, await rawGet<OFStint>('stints', key)))())
        jobs.push((async () => merge.pits(store, await rawGet<OFPit>('pit', { ...key, ...upper('date<') })))())
      }
      if (tick % 6 === 3) {
        jobs.push((async () => merge.overtakes(store, await rawGet<OFOvertake>('overtakes', { ...key, ...upper('date<') })))())
        jobs.push((async () => merge.radio(store, await rawGet<OFRadio>('team_radio', { ...key, ...upper('date<') })))())
      }
      if (tick % 12 === 5) jobs.push((async () => merge.weather(store, await rawGet<OFWeather>('weather', { ...key, ...upper('date<') })))())
      const car = o.carWatch?.()
      if (car != null && o.car) jobs.push(o.car.pollLive(store.session.session_key, car, o.now(), o.simulated))
      await Promise.all(jobs)
      store.t1 = Math.max(store.t1, o.now())
      store.version++
      o.onOk()
      o.onUpdate()
    } catch (e) {
      o.onError(e)
    }
    tick++
  }
  run()
  const id = setInterval(run, 4500)
  return { stop: () => { stopped = true; clearInterval(id) } }
}

// ---------------- tracé du circuit + positions des voitures ----------------
export interface Outline { pts: [number, number][]; cum: number[]; total: number; minX: number; maxX: number; minY: number; maxY: number }
export interface LocSample { t: number; x: number; y: number; p?: number }

export function makeOutline(rows: OFLocation[]): Outline | null {
  const pts: [number, number][] = []
  for (const r of rows) {
    if (r.x === 0 && r.y === 0) continue
    const l = pts[pts.length - 1]
    if (!l || l[0] !== r.x || l[1] !== r.y) pts.push([r.x, r.y])
  }
  if (pts.length < 40) return null
  pts.push(pts[0])
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  return { pts, cum, total: cum[cum.length - 1], minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
}

function nearestProgress(o: Outline, x: number, y: number): number {
  let best = Infinity, bi = 0
  for (let i = 0; i < o.pts.length - 1; i++) {
    const dx = o.pts[i][0] - x, dy = o.pts[i][1] - y
    const d = dx * dx + dy * dy
    if (d < best) { best = d; bi = i }
  }
  return o.cum[bi] / o.total
}
function pointAt(o: Outline, p: number): [number, number] {
  const target = ((p % 1) + 1) % 1 * o.total
  let lo = 0, hi = o.cum.length - 1
  while (lo < hi - 1) { const mid = (lo + hi) >> 1; if (o.cum[mid] <= target) lo = mid; else hi = mid }
  const seg = o.cum[hi] - o.cum[lo] || 1
  const f = (target - o.cum[lo]) / seg
  return [o.pts[lo][0] + (o.pts[hi][0] - o.pts[lo][0]) * f, o.pts[lo][1] + (o.pts[hi][1] - o.pts[lo][1]) * f]
}

const BLOCK = 60_000
const WINDOWS = { full: 60_000, mid: 20_000, sparse: 4_000 } as const

export class LocationStore {
  per = new Map<number, LocSample[]>()
  loaded = new Map<number, number>() // bloc → taille de la fenêtre chargée
  inflight = new Set<number>()
  outline: Outline | null = null
  version = 0
  settled: boolean
  error: unknown = null
  sessionKey: number
  t0: number
  constructor(sessionKey: number, t0: number, settled: boolean) { this.sessionKey = sessionKey; this.t0 = t0; this.settled = settled }

  add(rows: OFLocation[]) {
    const touched = new Set<number>()
    for (const r of rows) {
      const arr = this.per.get(r.driver_number) ?? []
      const s: LocSample = { t: ms(r.date), x: r.x, y: r.y }
      if (arr.length && s.t <= arr[arr.length - 1].t) touched.add(r.driver_number)
      arr.push(s)
      this.per.set(r.driver_number, arr)
    }
    for (const n of touched) {
      const arr = this.per.get(n)!.sort((a, b) => a.t - b.t)
      this.per.set(n, arr.filter((v, i) => i === 0 || v.t !== arr[i - 1].t))
    }
    this.version++
  }

  /** Charge les blocs utiles autour de t, avec une qualité adaptée à la vitesse de lecture. */
  ensure(t: number, speed: number, playing: boolean) {
    const cur = Math.floor((t - this.t0) / BLOCK)
    const win = speed <= 1 ? WINDOWS.full : speed <= 10 ? WINDOWS.mid : WINDOWS.sparse
    const ahead = playing ? Math.min(14, Math.ceil((14 * speed * 1000) / BLOCK)) : 0
    for (let b = cur; b <= cur + ahead; b++) {
      if (b < 0) continue
      const have = this.loaded.get(b) ?? 0
      if (have >= win || this.inflight.has(b)) continue
      if (this.inflight.size >= 3) return
      this.inflight.add(b)
      const start = this.t0 + b * BLOCK
      const get = this.settled ? histGet : rawGet
      get<OFLocation>('location', { session_key: this.sessionKey, 'date>=': iso(start), 'date<': iso(start + win) })
        .then((rows) => { this.add(rows); this.loaded.set(b, win); this.error = null })
        .catch((e) => { this.error = e })
        .finally(() => this.inflight.delete(b))
    }
    // libère la mémoire loin de la position de lecture
    if (this.loaded.size > 40) {
      const lo = this.t0 + (cur - 14) * BLOCK, hi = this.t0 + (cur + 30) * BLOCK
      for (const [n, arr] of this.per) this.per.set(n, arr.filter((v) => v.t >= lo && v.t <= hi))
      for (const b of [...this.loaded.keys()]) if (b < cur - 14 || b > cur + 30) this.loaded.delete(b)
    }
  }

  async pollLive(sessionKey: number, now: number, simulated?: boolean) {
    const rows = await rawGet<OFLocation>('location', { session_key: sessionKey, 'date>': iso(now - 7000), ...(simulated ? { 'date<': iso(now) } : {}) })
    if (rows.length) this.add(rows)
    const cut = now - 120_000
    for (const [n, arr] of this.per) if (arr.length > 800) this.per.set(n, arr.filter((v) => v.t >= cut))
  }

  async buildOutline(s: Store, signal?: AbortSignal) {
    if (this.outline) return
    let best: { n: number; start: number; dur: number } | null = null
    for (const [n, arr] of s.laps) for (const l of arr) {
      if (l.dur != null && !l.pitOut && Number.isFinite(l.start) && l.lap > 1 && (!best || l.dur < best.dur)) best = { n, start: l.start, dur: l.dur }
    }
    if (!best) return
    const get = this.settled ? histGet : rawGet
    const rows = await get<OFLocation>('location', { session_key: this.sessionKey, driver_number: best.n, 'date>=': iso(best.start), 'date<': iso(best.start + best.dur * 1000 + 800) }, signal)
    this.outline = makeOutline(rows)
    this.version++
  }

  /** Position (x, y) d'un pilote à l'instant t : interpolation, ou projection sur le tracé si les échantillons sont espacés. */
  at(n: number, t: number): [number, number] | null {
    const arr = this.per.get(n)
    if (!arr || !arr.length) return null
    let lo = 0, hi = arr.length - 1, i = -1
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (arr[mid].t <= t) { i = mid; lo = mid + 1 } else hi = mid - 1 }
    if (i < 0) return arr[0].t - t < 3000 ? [arr[0].x, arr[0].y] : null
    const a = arr[i], b = arr[i + 1]
    if (t - a.t > 130_000) return null
    if (!b) return [a.x, a.y]
    const gap = b.t - a.t
    if (gap <= 2500) { const f = (t - a.t) / gap; return [a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f] }
    const o = this.outline
    if (!o || gap > 130_000) return [a.x, a.y]
    a.p ??= nearestProgress(o, a.x, a.y)
    b.p ??= nearestProgress(o, b.x, b.y)
    let dp = ((b.p - a.p) % 1 + 1) % 1
    if (dp > 0.85) dp -= 1
    return pointAt(o, a.p + dp * ((t - a.t) / gap))
  }
}

// ---------------- télémétrie d'un pilote ----------------
export interface CarSample { t: number; speed: number; thr: number; brk: number; gear: number; rpm: number; drs: number }
export class CarDataStore {
  per = new Map<number, CarSample[]>()
  loaded = new Set<string>()
  inflight = new Set<string>()
  version = 0
  sessionKey: number
  settled: boolean
  constructor(sessionKey: number, settled: boolean) { this.sessionKey = sessionKey; this.settled = settled }

  private add(rows: OFCarData[]) {
    const touched = new Set<number>()
    for (const r of rows) {
      const arr = this.per.get(r.driver_number) ?? []
      const s: CarSample = { t: ms(r.date), speed: r.speed, thr: r.throttle, brk: r.brake, gear: r.n_gear, rpm: r.rpm, drs: r.drs ?? 0 }
      if (arr.length && s.t <= arr[arr.length - 1].t) touched.add(r.driver_number)
      arr.push(s)
      this.per.set(r.driver_number, arr)
    }
    for (const n of touched) {
      const arr = this.per.get(n)!.sort((a, b) => a.t - b.t)
      this.per.set(n, arr.filter((v, i) => i === 0 || v.t !== arr[i - 1].t))
    }
    this.version++
  }

  ensure(n: number, t: number, t0: number) {
    const b = Math.floor((t - t0) / BLOCK)
    for (const bb of [b, b + 1]) {
      const k = `${n}:${bb}`
      if (bb < 0 || this.loaded.has(k) || this.inflight.has(k)) continue
      this.inflight.add(k)
      const start = t0 + bb * BLOCK
      const get = this.settled ? histGet : rawGet
      get<OFCarData>('car_data', { session_key: this.sessionKey, driver_number: n, 'date>=': iso(start), 'date<': iso(start + BLOCK) })
        .then((rows) => { this.add(rows); this.loaded.add(k) })
        .catch(() => {})
        .finally(() => this.inflight.delete(k))
    }
  }

  async pollLive(sessionKey: number, n: number, now: number, simulated?: boolean) {
    const rows = await rawGet<OFCarData>('car_data', { session_key: sessionKey, driver_number: n, 'date>': iso(now - 25_000), ...(simulated ? { 'date<': iso(now) } : {}) })
    if (rows.length) this.add(rows)
  }

  window(n: number, t0: number, t1: number): CarSample[] {
    const arr = this.per.get(n)
    if (!arr) return []
    let lo = 0, hi = arr.length
    while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m].t < t0) lo = m + 1; else hi = m }
    const out: CarSample[] = []
    for (let i = lo; i < arr.length && arr[i].t <= t1; i++) out.push(arr[i])
    return out
  }
}
