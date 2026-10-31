/* Modèle de données de l'écran Live : normalisation des données OpenF1 et calcul de l'état à l'instant t. */
import type { OFSession, OFDriver, OFLap, OFStint, OFPit, OFPosition, OFInterval, OFRaceControl, OFWeather, OFOvertake, OFRadio, OFResult } from './openf1'
import { ms } from './openf1'

export interface Lap { n: number; lap: number; start: number; dur: number | null; s1: number | null; s2: number | null; s3: number | null; i1: number | null; i2: number | null; st: number | null; pitOut: boolean }
export interface Stint { n: number; stint: number; from: number; to: number | null; compound: string; age0: number }
export interface Pit { n: number; t: number; lap: number | null; stop: number | null; lane: number | null }
export interface IntervalRow { t: number; gap: number | string | null; int: number | string | null }
export interface RC { t: number; lap: number | null; cat: string; flag: string | null; scope: string | null; sector: number | null; n: number | null; msg: string }
export interface Weather { t: number; air: number; track: number; hum: number; press: number; rain: number; wind: number; dir: number }
export interface Overtake { t: number; by: number; over: number; pos: number }
export interface Radio { t: number; n: number; url: string }
export interface Result { n: number; pos: number | null; laps: number | null; dnf: boolean; dns: boolean; dsq: boolean }

export interface Store {
  session: OFSession
  isRace: boolean
  drivers: OFDriver[]
  driverByNum: Map<number, OFDriver>
  laps: Map<number, Lap[]>
  positions: Map<number, [number, number][]>
  intervals: Map<number, IntervalRow[]>
  stints: Stint[]
  pits: Pit[]
  rc: RC[]
  weather: Weather[]
  overtakes: Overtake[]
  radio: Radio[]
  results: Result[]
  t0: number
  t1: number
  version: number
  /** données tronquées (simulation du direct) : le nombre de tours total est inconnu */
  partial: boolean
}

export const isRaceType = (s: OFSession) => /race|sprint$/i.test(s.session_name) && !/qualif|shootout/i.test(s.session_name)

export function emptyStore(session: OFSession): Store {
  return {
    session, isRace: isRaceType(session), drivers: [], driverByNum: new Map(), laps: new Map(), positions: new Map(), intervals: new Map(),
    stints: [], pits: [], rc: [], weather: [], overtakes: [], radio: [], results: [],
    t0: ms(session.date_start), t1: ms(session.date_end), version: 0, partial: false,
  }
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** Fusionne des lignes brutes (déjà dédoublonnées côté clé) dans le store. */
export const merge = {
  drivers(s: Store, rows: OFDriver[]) {
    s.drivers = rows.slice().sort((a, b) => a.driver_number - b.driver_number)
    s.driverByNum = new Map(s.drivers.map((d) => [d.driver_number, d]))
  },
  laps(s: Store, rows: OFLap[]) {
    for (const r of rows) {
      const start = ms(r.date_start)
      const lap: Lap = { n: r.driver_number, lap: r.lap_number, start, dur: num(r.lap_duration), s1: num(r.duration_sector_1), s2: num(r.duration_sector_2), s3: num(r.duration_sector_3), i1: num(r.i1_speed), i2: num(r.i2_speed), st: num(r.st_speed), pitOut: !!r.is_pit_out_lap }
      const arr = s.laps.get(r.driver_number) ?? []
      const i = arr.findIndex((l) => l.lap === lap.lap)
      if (i >= 0) arr[i] = lap
      else { arr.push(lap); arr.sort((a, b) => a.lap - b.lap) }
      s.laps.set(r.driver_number, arr)
    }
  },
  series<T extends { driver_number: number; date: string }, V>(map: Map<number, V[]>, rows: T[], conv: (r: T) => V & { t?: number }, key: (v: V) => number) {
    const touched = new Set<number>()
    for (const r of rows) {
      const arr = map.get(r.driver_number) ?? []
      arr.push(conv(r))
      map.set(r.driver_number, arr)
      touched.add(r.driver_number)
    }
    for (const n of touched) {
      const arr = map.get(n)!
      arr.sort((a, b) => key(a) - key(b))
      // dédoublonnage des relectures incrémentales (même horodatage)
      const out: V[] = []
      for (const v of arr) if (!out.length || key(out[out.length - 1]) !== key(v)) out.push(v)
      map.set(n, out)
    }
  },
  positions(s: Store, rows: OFPosition[]) {
    merge.series(s.positions, rows, (r) => [ms(r.date), r.position] as [number, number], (v) => v[0])
  },
  intervals(s: Store, rows: OFInterval[]) {
    merge.series(s.intervals, rows, (r) => ({ t: ms(r.date), gap: r.gap_to_leader, int: r.interval }), (v) => v.t)
  },
  stints(s: Store, rows: OFStint[]) {
    s.stints = rows.map((r) => ({ n: r.driver_number, stint: r.stint_number, from: r.lap_start ?? 1, to: r.lap_end, compound: (r.compound ?? 'UNKNOWN').toUpperCase(), age0: r.tyre_age_at_start ?? 0 })).sort((a, b) => a.n - b.n || a.stint - b.stint)
  },
  pits(s: Store, rows: OFPit[]) {
    s.pits = rows.map((r) => ({ n: r.driver_number, t: ms(r.date), lap: r.lap_number, stop: num(r.stop_duration), lane: num(r.lane_duration ?? r.pit_duration) })).sort((a, b) => a.t - b.t)
  },
  rc(s: Store, rows: OFRaceControl[]) {
    s.rc = rows.map((r) => ({ t: ms(r.date), lap: r.lap_number, cat: r.category, flag: r.flag, scope: r.scope, sector: r.sector, n: r.driver_number, msg: r.message })).sort((a, b) => a.t - b.t)
  },
  weather(s: Store, rows: OFWeather[]) {
    s.weather = rows.map((r) => ({ t: ms(r.date), air: r.air_temperature, track: r.track_temperature, hum: r.humidity, press: r.pressure, rain: r.rainfall, wind: r.wind_speed, dir: r.wind_direction })).sort((a, b) => a.t - b.t)
  },
  overtakes(s: Store, rows: OFOvertake[]) {
    s.overtakes = rows.map((r) => ({ t: ms(r.date), by: r.overtaking_driver_number, over: r.overtaken_driver_number, pos: r.position })).sort((a, b) => a.t - b.t)
  },
  radio(s: Store, rows: OFRadio[]) {
    s.radio = rows.map((r) => ({ t: ms(r.date), n: r.driver_number, url: r.recording_url })).sort((a, b) => a.t - b.t)
  },
  results(s: Store, rows: OFResult[]) {
    s.results = rows.map((r) => ({ n: r.driver_number, pos: r.position, laps: r.number_of_laps, dnf: !!r.dnf, dns: !!r.dns, dsq: !!r.dsq }))
  },
}

/** Bornes de rejeu : du 1er tour au dernier tour terminé (ou fin de session). */
export function finalizeBounds(s: Store) {
  let first = Infinity
  let last = -Infinity
  for (const arr of s.laps.values()) for (const l of arr) {
    if (Number.isFinite(l.start)) { first = Math.min(first, l.start); last = Math.max(last, l.start + (l.dur ?? 0) * 1000) }
  }
  for (const r of s.rc) if (/SESSION (FINISHED|ENDED)|CHEQUERED/i.test(r.msg)) last = Math.max(last, r.t)
  if (Number.isFinite(first)) s.t0 = Math.max(s.t0, first - 20_000)
  if (Number.isFinite(last)) s.t1 = Math.min(Math.max(last + 5_000, s.t0 + 60_000), s.t1 + 30 * 60_000)
  if (s.t1 <= s.t0) s.t1 = s.t0 + 3600_000
  s.version++
}

// ---------- recherche dichotomique ----------
export function lastIdx<T>(arr: T[], t: number, key: (v: T) => number): number {
  let lo = 0, hi = arr.length - 1, r = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (key(arr[mid]) <= t) { r = mid; lo = mid + 1 } else hi = mid - 1
  }
  return r
}

// ---------- formats ----------
export const fmtLap = (s: number | null | undefined) => {
  if (s == null || !Number.isFinite(s)) return '—'
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return m > 0 ? `${m}:${r.toFixed(3).padStart(6, '0')}` : r.toFixed(3)
}
export const fmtSec = (s: number | null | undefined) => (s == null || !Number.isFinite(s) ? '—' : s.toFixed(3))
export const fmtGap = (v: number | string | null | undefined, leader = false): string => {
  if (leader) return 'Leader'
  if (v == null) return '—'
  if (typeof v === 'string') { const m = v.match(/\+?(\d+)\s*LAP/i); return m ? `+${m[1]} T` : v }
  return `+${v.toFixed(3)}`
}
export const fmtClock = (t: number) => new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
export const fmtElapsed = (t: number, t0: number) => {
  const s = Math.max(0, Math.floor((t - t0) / 1000))
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}
export const teamColor = (d?: OFDriver) => (d?.team_colour ? `#${d.team_colour.replace('#', '')}` : '#a1a1aa')

export type SectorState = 'purple' | 'green' | 'yellow' | null
export interface Row {
  n: number; acr: string; name: string; team: string; color: string
  pos: number; gap: string; int: string
  last: number | null; lastState: SectorState; best: number | null; bestOverall: boolean
  sectors: { v: number | null; state: SectorState }[]
  tyre: { compound: string; age: number } | null
  pits: number; speedTrap: number | null; i1: number | null; i2: number | null; pbSec: (number | null)[]; lapNo: number; inPit: boolean; out: boolean
}
export type TrackKind = 'NONE' | 'GREEN' | 'YELLOW' | 'SC' | 'VSC' | 'RED' | 'CHEQUERED'
export interface Snapshot {
  rows: Row[]
  lap: number
  totalLaps: number | null
  track: { kind: TrackKind; yellowSectors: number[] }
  weather: Weather | null
  feed: RC[]
  overtakes: Overtake[]
  radio: Radio[]
  secBest: [number | null, number | null, number | null]
  bestLap: { n: number; v: number } | null
  timingMode: 'race' | 'best'
}

function trackStatus(rc: RC[], t: number) {
  let kind: TrackKind = 'NONE'
  const yellow = new Set<number>()
  const end = lastIdx(rc, t, (r) => r.t)
  for (let i = 0; i <= end; i++) {
    const r = rc[i]
    const m = r.msg.toUpperCase()
    if (r.cat === 'SessionStatus') {
      if (m.includes('STARTED')) kind = 'GREEN'
      else if (m.includes('FINISHED') || m.includes('ENDED')) kind = 'CHEQUERED'
    } else if (r.cat === 'SafetyCar') {
      if (m.includes('VSC') || m.includes('VIRTUAL')) kind = m.includes('ENDING') ? 'GREEN' : 'VSC'
      else if (m.includes('DEPLOYED')) kind = 'SC'
      else if (m.includes('ENDING')) kind = 'GREEN'
    } else if (r.cat === 'Flag') {
      const f = (r.flag ?? '').toUpperCase()
      if (r.scope === 'Track') {
        if (f === 'RED') kind = 'RED'
        else if (f === 'GREEN' || f === 'CLEAR') { if (kind !== 'CHEQUERED') kind = 'GREEN'; yellow.clear() }
        else if (f === 'CHEQUERED') kind = 'CHEQUERED'
        else if (f.includes('YELLOW')) kind = 'YELLOW'
      } else if (r.scope === 'Sector' && r.sector != null) {
        if (f.includes('YELLOW')) yellow.add(r.sector)
        else if (f === 'CLEAR' || f === 'GREEN') yellow.delete(r.sector)
      }
    }
  }
  return { kind, yellowSectors: [...yellow].sort((a, b) => a - b) }
}

export function snapshot(s: Store, t: number): Snapshot {
  const timingMode: 'race' | 'best' = s.isRace && s.intervals.size > 0 ? 'race' : 'best'
  // meilleurs temps de secteur « à l'instant t » (global + perso)
  const secBest: [number | null, number | null, number | null] = [null, null, null]
  const pb = new Map<number, [number, number, number]>()
  let bestLap: { n: number; v: number } | null = null
  const pbLap = new Map<number, number>()
  const cur = new Map<number, { lap: Lap; idx: number }>()
  const done = new Map<number, Lap>()
  const trap = new Map<number, number>()
  const i1m = new Map<number, number>()
  const i2m = new Map<number, number>()
  for (const [n, arr] of s.laps) {
    const p: [number, number, number] = [Infinity, Infinity, Infinity]
    pb.set(n, p)
    for (let i = 0; i < arr.length; i++) {
      const l = arr[i]
      if (!(l.start <= t)) break
      cur.set(n, { lap: l, idx: i })
      let acc = l.start
      const secs = [l.s1, l.s2, l.s3]
      for (let k = 0; k < 3; k++) {
        const v = secs[k]
        if (v == null) break
        acc += v * 1000
        if (acc <= t) {
          if (v < p[k]) p[k] = v
          if (secBest[k] == null || v < (secBest[k] as number)) secBest[k] = v
        } else break
      }
      if (l.dur != null && l.start + l.dur * 1000 <= t) {
        done.set(n, l)
        if (!pbLap.has(n) || l.dur < pbLap.get(n)!) pbLap.set(n, l.dur)
        if (!bestLap || l.dur < bestLap.v) bestLap = { n, v: l.dur }
        if (l.st != null && l.st > (trap.get(n) ?? 0)) trap.set(n, l.st)
        if (l.i1 != null && l.i1 > (i1m.get(n) ?? 0)) i1m.set(n, l.i1)
        if (l.i2 != null && l.i2 > (i2m.get(n) ?? 0)) i2m.set(n, l.i2)
      }
    }
  }

  const rows: Row[] = []
  const nums = s.drivers.length ? s.drivers.map((d) => d.driver_number) : [...s.laps.keys()]
  for (const n of nums) {
    const d = s.driverByNum.get(n)
    const c = cur.get(n)
    const lapNo = c?.lap.lap ?? 0
    // secteurs : tour en cours (s'il a déjà des secteurs validés) sinon dernier tour terminé
    let ref = c?.lap
    const pickDone = () => (ref = done.get(n))
    if (ref) {
      const done1 = ref.s1 != null && ref.start + ref.s1 * 1000 <= t
      if (!done1) pickDone()
    }
    const sectors: Row['sectors'] = [0, 1, 2].map((k) => {
      if (!ref) return { v: null, state: null }
      const secs = [ref.s1, ref.s2, ref.s3]
      let acc = ref.start
      for (let j = 0; j <= k; j++) acc += (secs[j] ?? 0) * 1000
      const v = secs[k]
      if (v == null || acc > t) return { v: null, state: null }
      const state: SectorState = secBest[k] != null && v <= (secBest[k] as number) + 1e-9 ? 'purple' : v <= (pb.get(n)?.[k] ?? Infinity) + 1e-9 ? 'green' : 'yellow'
      return { v, state }
    })
    const last = done.get(n)
    const lastV = last?.dur ?? null
    const best = pbLap.get(n) ?? null
    const lastState: SectorState = lastV == null ? null : bestLap && lastV <= bestLap.v + 1e-9 ? 'purple' : best != null && lastV <= best + 1e-9 ? 'green' : 'yellow'
    // pneus
    const stint = s.stints.filter((x) => x.n === n && x.from <= Math.max(1, lapNo)).pop()
    const tyre = stint ? { compound: stint.compound, age: stint.age0 + Math.max(0, lapNo - stint.from) } : null
    const pits = s.pits.filter((p) => p.n === n && p.t <= t)
    const lastPit = pits[pits.length - 1]
    const inPit = !!lastPit && t - lastPit.t < (lastPit.lane ?? 22) * 1000
    // position / écarts
    let pos = 0, gap = '—', int = '—'
    if (timingMode === 'race') {
      const pa = s.positions.get(n)
      const pi = pa ? lastIdx(pa, t, (v) => v[0]) : -1
      pos = pi >= 0 ? pa![pi][1] : 0
      const ia = s.intervals.get(n)
      const ii = ia ? lastIdx(ia, t, (v) => v.t) : -1
      if (ii >= 0) {
        const r = ia![ii]
        gap = pos === 1 ? 'Leader' : fmtGap(r.gap)
        int = pos === 1 ? '—' : fmtGap(r.int)
      } else if (pos === 1) gap = 'Leader'
    }
    const res = s.results.find((r) => r.n === n)
    const out = !!res && (res.dnf || res.dns || res.dsq) && t >= s.t1 - 60_000
    rows.push({ n, acr: d?.name_acronym ?? String(n), name: d?.full_name ?? String(n), team: d?.team_name ?? '', color: teamColor(d), pos, gap, int, last: lastV, lastState, best, bestOverall: !!bestLap && best != null && best <= bestLap.v + 1e-9, sectors, tyre, pits: pits.length, speedTrap: trap.get(n) ?? null, i1: i1m.get(n) ?? null, i2: i2m.get(n) ?? null, pbSec: (pb.get(n) ?? []).map((v) => (Number.isFinite(v) ? v : null)), lapNo, inPit, out })
  }

  if (timingMode === 'race') {
    // les pilotes sans position connue passent derrière, dans l'ordre des numéros
    rows.sort((a, b) => (a.pos || 99) - (b.pos || 99) || a.n - b.n)
    rows.forEach((r, i) => { if (!r.pos) r.pos = i + 1 })
  } else {
    rows.sort((a, b) => (a.best ?? 1e9) - (b.best ?? 1e9) || a.n - b.n)
    const lead = rows[0]?.best ?? null
    rows.forEach((r, i) => {
      r.pos = i + 1
      if (r.best == null) { r.gap = '—'; r.int = '—'; return }
      r.gap = i === 0 ? 'Meilleur' : fmtGap(r.best - (lead as number))
      r.int = i === 0 ? '—' : fmtGap(r.best - (rows[i - 1].best as number))
    })
  }

  let lap = 0
  for (const r of rows) lap = Math.max(lap, r.lapNo)
  const leaderLap = rows.find((r) => r.pos === 1)?.lapNo
  if (s.isRace && leaderLap) lap = leaderLap
  let totalLaps: number | null = null
  if (s.isRace) {
    const fromRes = Math.max(0, ...s.results.map((r) => r.laps ?? 0))
    if (fromRes > 0) totalLaps = fromRes
    else if (!s.partial && s.t1 < Date.now() - 3600_000) { for (const arr of s.laps.values()) for (const l of arr) totalLaps = Math.max(totalLaps ?? 0, l.lap) }
  }
  if (totalLaps) lap = Math.min(lap, totalLaps)

  const wi = lastIdx(s.weather, t, (w) => w.t)
  const fi = lastIdx(s.rc, t, (r) => r.t)
  const oi = lastIdx(s.overtakes, t, (o) => o.t)
  const ri = lastIdx(s.radio, t, (r) => r.t)
  return {
    rows, lap, totalLaps, timingMode,
    track: trackStatus(s.rc, t),
    weather: s.weather[wi] ?? s.weather[0] ?? null,
    feed: s.rc.slice(Math.max(0, fi - 79), fi + 1).reverse(),
    overtakes: s.overtakes.slice(Math.max(0, oi - 39), oi + 1).reverse(),
    radio: s.radio.slice(Math.max(0, ri - 29), ri + 1).reverse(),
    secBest, bestLap,
  }
}

// ---------- séries par tour (graphiques) : calculées une fois par version du store ----------
export interface LapSeries { laps: number[]; pos: Map<number, (number | null)[]>; gap: Map<number, (number | null)[]> }
export function lapSeries(s: Store): LapSeries {
  let maxLap = 0
  for (const arr of s.laps.values()) for (const l of arr) maxLap = Math.max(maxLap, l.lap)
  const laps = Array.from({ length: maxLap }, (_, i) => i + 1)
  const pos = new Map<number, (number | null)[]>()
  const gap = new Map<number, (number | null)[]>()
  for (const d of s.drivers) {
    const n = d.driver_number
    const la = s.laps.get(n) ?? []
    const pa = s.positions.get(n) ?? []
    const ia = s.intervals.get(n) ?? []
    const p: (number | null)[] = []
    const g: (number | null)[] = []
    for (const lap of laps) {
      const l = la.find((x) => x.lap === lap)
      if (!l || !Number.isFinite(l.start)) { p.push(null); g.push(null); continue }
      // fin du tour = début du suivant (ou départ + durée)
      const nx = la.find((x) => x.lap === lap + 1)
      const tEnd = nx && Number.isFinite(nx.start) ? nx.start : l.dur != null ? l.start + l.dur * 1000 : NaN
      if (!Number.isFinite(tEnd)) { p.push(null); g.push(null); continue }
      const pi = lastIdx(pa, tEnd, (v) => v[0])
      p.push(pi >= 0 ? pa[pi][1] : null)
      const ii = lastIdx(ia, tEnd, (v) => v.t)
      const gv = ii >= 0 ? ia[ii].gap : null
      g.push(typeof gv === 'number' ? gv : pi >= 0 && pa[pi][1] === 1 ? 0 : null)
    }
    pos.set(n, p)
    gap.set(n, g)
  }
  return { laps, pos, gap }
}
