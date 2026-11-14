/*
 * Direct GRATUIT : flux officiel « F1 Live Timing » (livetiming.formula1.com, SignalR Core).
 *
 * - Le navigateur s'y connecte directement en WebSocket (pas de CORS pour les WebSockets, pas de compte,
 *   pas de clé) : aucun relais ni serveur n'est nécessaire, ça marche depuis GitHub Pages.
 * - Sujets publics reçus : pilotes, chronos (positions, écarts, secteurs, tours), pneus, direction de course,
 *   météo, état de la piste, compteur de tours. Les positions GPS (Position.z) et la télémétrie (CarData.z)
 *   sont réservées aux abonnés F1 TV : la carte affiche donc des positions ESTIMÉES à partir des mini-secteurs.
 * - Le flux est converti dans la même forme que les données OpenF1 (Store) : tout l'écran Live fonctionne tel quel.
 */
import type { OFSession, OFDriver, OFLap, OFStint, OFPit, OFPosition, OFInterval, OFRaceControl, OFWeather, OFLocation } from './openf1'
import { OpenF1Error, getSessions, histGet, iso } from './openf1'
import { merge } from './model'
import type { Store } from './model'
import { makeOutline, pointAt } from './data'
import type { LocationStore, Outline } from './data'

const URL_WS = 'wss://livetiming.formula1.com/signalrcore'
const RS = '\x1e'
export const F1_TOPICS = ['Heartbeat', 'SessionInfo', 'SessionStatus', 'DriverList', 'TimingData', 'TimingAppData', 'TrackStatus', 'LapCount', 'RaceControlMessages', 'WeatherData', 'ExtrapolatedClock']

type Json = Record<string, unknown>
export type FeedState = Record<string, Json>

/** Fusion des mises à jour du flux : les tableaux sont « patchés » par des objets à clés numériques ({"3": {...}}). */
export function deepMerge(target: unknown, patch: unknown): unknown {
  if (patch === null || typeof patch !== 'object') return patch
  if (Array.isArray(patch)) {
    if (!Array.isArray(target)) return patch.map((v) => deepMerge(undefined, v))
    const out = target.slice()
    patch.forEach((v, i) => { out[i] = deepMerge(out[i], v) })
    return out
  }
  const p = patch as Json
  if (Array.isArray(target)) {
    const out = target.slice()
    for (const [k, v] of Object.entries(p)) { if (k === '_deleted') continue; const i = Number(k); if (Number.isInteger(i)) out[i] = deepMerge(out[i], v) }
    return out
  }
  const base: Json = target && typeof target === 'object' ? { ...(target as Json) } : {}
  for (const [k, v] of Object.entries(p)) {
    if (k === '_deleted' && Array.isArray(v)) { for (const d of v) delete base[String(d)]; continue }
    base[k] = deepMerge(base[k], v)
  }
  return base
}

/** Connexion WebSocket SignalR Core (négociation sautée : connexion directe, compatible navigateur). */
export class F1Feed {
  state: FeedState = {}
  private ws: WebSocket | null = null
  private ping: ReturnType<typeof setInterval> | null = null
  private retry: ReturnType<typeof setTimeout> | null = null
  private closed = false
  private attempts = 0
  onChange: (topics: string[]) => void = () => {}
  onStatus: (ok: boolean, err?: Error) => void = () => {}

  connect() {
    if (this.closed) return
    let ws: WebSocket
    try { ws = new WebSocket(URL_WS) } catch (e) { this.onStatus(false, e as Error); this.schedule(); return }
    this.ws = ws
    ws.onopen = () => {
      ws.send(JSON.stringify({ protocol: 'json', version: 1 }) + RS)
      ws.send(JSON.stringify({ type: 1, invocationId: '1', target: 'Subscribe', arguments: [F1_TOPICS] }) + RS)
      this.ping = setInterval(() => { if (ws.readyState === 1) ws.send(JSON.stringify({ type: 6 }) + RS) }, 15_000)
    }
    ws.onmessage = (ev) => {
      const changed: string[] = []
      for (const frame of String(ev.data).split(RS)) {
        if (!frame.trim()) continue
        let m: Json
        try { m = JSON.parse(frame) } catch { continue }
        if (m.type === 3 && m.result && typeof m.result === 'object') {
          for (const [k, v] of Object.entries(m.result as Json)) { this.state[k] = v as Json; changed.push(k) }
          this.attempts = 0
          this.onStatus(true)
        } else if (m.type === 1 && m.target === 'feed' && Array.isArray(m.arguments)) {
          const [topic, data] = m.arguments as [string, unknown]
          this.state[topic] = deepMerge(this.state[topic], data) as Json
          changed.push(topic)
        } else if (m.type === 7) {
          this.onStatus(false, new Error(String(m.error ?? 'Connexion fermée par le serveur')))
        }
      }
      if (changed.length) this.onChange(changed)
    }
    ws.onerror = () => this.onStatus(false, new Error('Flux F1 Live Timing injoignable'))
    ws.onclose = () => { if (this.ping) clearInterval(this.ping); this.ping = null; if (!this.closed) { this.onStatus(false, new Error('Connexion au direct perdue, reconnexion…')); this.schedule() } }
  }
  private schedule() {
    if (this.closed || this.retry) return
    const wait = Math.min(30_000, 2000 * 2 ** this.attempts++)
    this.retry = setTimeout(() => { this.retry = null; this.connect() }, wait)
  }
  close() {
    this.closed = true
    if (this.retry) clearTimeout(this.retry)
    if (this.ping) clearInterval(this.ping)
    try { this.ws?.close() } catch { /* déjà fermé */ }
  }
}

// ---------------------------------------------------------------- conversion vers le Store (forme OpenF1)
const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))
const numOrNull = (v: unknown) => { const n = typeof v === 'number' ? v : parseFloat(str(v)); return Number.isFinite(n) ? n : null }
/** « 1:27.621 » → 87.621 s */
export const parseLapTime = (v: unknown): number | null => {
  const s = str(v).trim()
  if (!s) return null
  const m = s.match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/)
  return m ? (m[1] ? Number(m[1]) * 60 : 0) + Number(m[2]) : null
}
/** « +1.234 » → 1.234 ; « 1L » / « +1 LAP » → « +1 LAP » ; « » → null */
export const parseGap = (v: unknown): number | string | null => {
  const s = str(v).trim()
  if (!s) return null
  const l = s.match(/(\d+)\s*L/i)
  if (l) return `+${l[1]} LAP`
  const n = parseFloat(s.replace('+', ''))
  return Number.isFinite(n) ? n : null
}
const titleCase = (s: string) => s.toLowerCase().replace(/(^|[\s-])\p{L}/gu, (m) => m.toUpperCase())
/** « 2026-11-08T14:00:00 » + « -03:00:00 » → instant UTC */
const localToUtc = (local: string, offset: string) => {
  const m = offset.match(/^(-)?(\d+):(\d+)/)
  const off = m ? (m[1] ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0
  return Date.parse(local + 'Z') - off * 60_000
}

/** Session au format OpenF1 à partir de SessionInfo (les clés de session F1 et OpenF1 sont identiques). */
export function sessionFromFeed(st: FeedState): OFSession | null {
  const si = st.SessionInfo as Json | undefined
  if (!si?.Key) return null
  const meet = (si.Meeting ?? {}) as Json
  const country = (meet.Country ?? {}) as Json
  const circuit = (meet.Circuit ?? {}) as Json
  const off = str(si.GmtOffset) || '00:00:00'
  const start = localToUtc(str(si.StartDate), off), end = localToUtc(str(si.EndDate), off)
  return {
    session_key: Number(si.Key), session_name: str(si.Name), session_type: str(si.Type), date_start: iso(start), date_end: iso(end),
    meeting_key: Number(meet.Key), circuit_key: Number(circuit.Key), circuit_short_name: str(circuit.ShortName), country_name: str(country.Name),
    country_code: str(country.Code), location: str(meet.Location), year: new Date(start).getUTCFullYear(), gmt_offset: off,
  }
}

interface Track { laps: number; curStart: number | null; sec: string[]; pits: number; pos: number; gap: string; int: string; inPit: boolean }

/** Applique l'état du flux au Store. Garde en mémoire ce qu'il faut pour détecter les nouveaux tours / arrêts. */
export class FeedAdapter {
  private tr = new Map<number, Track>()
  private pitRows: OFPit[] = []
  private weatherRows: OFWeather[] = []
  private rcCount = -1
  private wKey = ''
  status = ''
  private store: Store
  constructor(store: Store) { this.store = store }

  apply(st: FeedState, now: number) {
    const s = this.store
    const dl = (st.DriverList ?? {}) as Record<string, Json>
    const drivers: OFDriver[] = Object.entries(dl).filter(([k, v]) => /^\d+$/.test(k) && v && typeof v === 'object' && v.Tla).map(([k, v]) => ({
      driver_number: Number(k), name_acronym: str(v.Tla), first_name: str(v.FirstName), last_name: titleCase(str(v.LastName)),
      full_name: `${str(v.FirstName)} ${titleCase(str(v.LastName))}`.trim(), team_name: str(v.TeamName), team_colour: str(v.TeamColour) || 'a1a1aa', headshot_url: str(v.HeadshotUrl) || null,
    }))
    if (drivers.length && drivers.length !== s.drivers.length) merge.drivers(s, drivers)
    else if (drivers.length) { for (const d of drivers) { const o = s.driverByNum.get(d.driver_number); if (o) Object.assign(o, d) } }

    const lines = (((st.TimingData ?? {}) as Json).Lines ?? {}) as Record<string, Json>
    const app = (((st.TimingAppData ?? {}) as Json).Lines ?? {}) as Record<string, Json>
    const pos: OFPosition[] = [], ints: OFInterval[] = [], laps: OFLap[] = [], stints: OFStint[] = []
    const date = iso(now)
    const flags = new Map<number, { inPit: boolean; out: boolean }>()
    for (const [k, L] of Object.entries(lines)) {
      const n = Number(k)
      if (!Number.isFinite(n)) continue
      const sectors = (Array.isArray(L.Sectors) ? L.Sectors : Object.values((L.Sectors ?? {}) as Json)) as Json[]
      const secVal = (i: number) => parseLapTime(sectors[i]?.Value)
      const speeds = (L.Speeds ?? {}) as Record<string, Json>
      const nLaps = Number(L.NumberOfLaps ?? 0) || 0
      const last = parseLapTime((L.LastLapTime as Json | undefined)?.Value)
      let t = this.tr.get(n)
      const first = !t
      if (!t) { t = { laps: nLaps, curStart: null, sec: sectors.map((x) => str(x?.Value)), pits: 0, pos: 0, gap: '', int: '', inPit: false }; this.tr.set(n, t) }
      const mkLap = (lap: number, start: number, dur: number | null, s123: (number | null)[], withSpeeds: boolean): OFLap => ({
        driver_number: n, lap_number: lap, date_start: iso(start), lap_duration: dur, duration_sector_1: s123[0] ?? null, duration_sector_2: s123[1] ?? null, duration_sector_3: s123[2] ?? null,
        i1_speed: withSpeeds ? numOrNull(speeds.I1?.Value) : null, i2_speed: withSpeeds ? numOrNull(speeds.I2?.Value) : null, st_speed: withSpeeds ? numOrNull(speeds.ST?.Value) : null, is_pit_out_lap: !!L.PitOut,
      })
      if (first) {
        // arrivée en cours de session : on reconstitue le dernier tour et le meilleur tour
        if (nLaps > 0 && last != null) {
          const end = now
          laps.push(mkLap(nLaps, end - last * 1000, last, [secVal(0), secVal(1), secVal(2)], true))
          const best = (L.BestLapTime ?? {}) as Json
          const bv = parseLapTime(best.Value), bl = Number(best.Lap)
          if (bv != null && bl > 0 && bl < nLaps) laps.push(mkLap(bl, end - last * 1000 - (nLaps - bl) * (bv * 1000 + 1500), bv, [null, null, null], false))
        }
        t.curStart = now - segProgress(sectors) * (last ?? 90) * 1000
        laps.push(mkLap(nLaps + 1, t.curStart, null, [null, null, null], false))
      } else if (nLaps > t.laps) {
        // nouveau tour bouclé
        const dur = last
        const start = dur != null ? now - dur * 1000 : t.curStart ?? now - 90_000
        laps.push(mkLap(nLaps, start, dur, [secVal(0), secVal(1), secVal(2)], true))
        t.laps = nLaps
        t.curStart = now
        t.sec = sectors.map((x) => str(x?.Value))
        laps.push(mkLap(nLaps + 1, now, null, [null, null, null], false))
      } else {
        // secteurs 1 et 2 du tour en cours
        const s1 = str(sectors[0]?.Value), s2 = str(sectors[1]?.Value)
        if ((s1 && s1 !== t.sec[0]) || (s2 && s2 !== t.sec[1])) {
          const c = t.curStart ?? now
          const v1 = s1 && s1 !== t.sec[0] ? parseLapTime(s1) : null
          const v2 = s2 && s2 !== t.sec[1] ? parseLapTime(s2) : null
          const cur = s.laps.get(n)?.find((l) => l.lap === nLaps + 1)
          laps.push(mkLap(nLaps + 1, c, null, [v1 ?? cur?.s1 ?? null, v2 ?? cur?.s2 ?? null, null], false))
          t.sec = [s1 || t.sec[0], s2 || t.sec[1], t.sec[2]]
        }
      }
      // position et écarts
      const p = Number(L.Position)
      if (p > 0 && p !== t.pos) { pos.push({ driver_number: n, date, position: p }); t.pos = p }
      const g = str(L.GapToLeader), iv = str(((L.IntervalToPositionAhead ?? {}) as Json).Value)
      if (s.isRace && (g !== t.gap || iv !== t.int)) { ints.push({ driver_number: n, date, gap_to_leader: parseGap(g), interval: parseGap(iv) }); t.gap = g; t.int = iv }
      // arrêts aux stands
      const np = Number(L.NumberOfPitStops ?? 0) || 0
      if (np > t.pits) {
        for (let i = t.pits; i < np; i++) this.pitRows.push({ driver_number: n, date: first ? iso(s.t0) : date, lap_number: first ? null : nLaps + 1, lane_duration: null, stop_duration: null })
        t.pits = np
      }
      t.inPit = !!L.InPit
      flags.set(n, { inPit: !!L.InPit, out: !!L.Retired || !!L.Stopped })
      // pneus
      const raw = app[k]?.Stints
      const list = (Array.isArray(raw) ? raw : Object.values((raw ?? {}) as Json)) as Json[]
      let from = 1
      list.forEach((x, i) => {
        if (!x) return
        const total = Number(x.TotalLaps ?? 0), age0 = Number(x.StartLaps ?? 0)
        const len = Math.max(0, total - age0)
        stints.push({ driver_number: n, stint_number: i + 1, lap_start: from, lap_end: i < list.length - 1 ? from + Math.max(0, len - 1) : null, compound: str(x.Compound) || 'UNKNOWN', tyre_age_at_start: age0 })
        from += len
      })
    }
    if (laps.length) merge.laps(s, laps)
    if (pos.length) merge.positions(s, pos)
    if (ints.length) merge.intervals(s, ints)
    if (stints.length) merge.stints(s, stints)
    merge.pits(s, this.pitRows)

    // direction de course
    const rcRaw = ((st.RaceControlMessages ?? {}) as Json).Messages
    const msgs = (Array.isArray(rcRaw) ? rcRaw : Object.values((rcRaw ?? {}) as Json)) as Json[]
    if (msgs.length !== this.rcCount) {
      this.rcCount = msgs.length
      merge.rc(s, msgs.filter(Boolean).map((m): OFRaceControl => ({
        date: str(m.Utc).endsWith('Z') ? str(m.Utc) : str(m.Utc) + 'Z', lap_number: numOrNull(m.Lap), category: str(m.Category), flag: m.Flag ? str(m.Flag) : null,
        scope: m.Scope ? str(m.Scope) : null, sector: numOrNull(m.Sector), driver_number: numOrNull(m.RacingNumber), message: str(m.Message),
      })))
    }
    // météo
    const w = st.WeatherData as Json | undefined
    if (w) {
      const key = JSON.stringify(w)
      if (key !== this.wKey) {
        this.wKey = key
        this.weatherRows.push({ date, air_temperature: Number(w.AirTemp), track_temperature: Number(w.TrackTemp), humidity: Number(w.Humidity), pressure: Number(w.Pressure), rainfall: Number(w.Rainfall), wind_speed: Number(w.WindSpeed), wind_direction: Number(w.WindDirection) })
        merge.weather(s, this.weatherRows)
      }
    }
    const lc = st.LapCount as Json | undefined
    this.status = str((st.SessionStatus as Json | undefined)?.Status) || str((st.SessionInfo as Json | undefined)?.SessionStatus)
    s.live = { source: 'f1', flags, totalLaps: lc ? numOrNull(lc.TotalLaps) : null, status: this.status, track: str((st.TrackStatus as Json | undefined)?.Status) }
    s.t1 = Math.max(s.t1, now)
    s.version++
  }

  /** Positions estimées sur le tracé : mini-secteurs franchis + temps écoulé dans le tour. */
  estimate(loc: LocationStore, st: FeedState, now: number) {
    const o = loc.outline
    if (!o || !/started/i.test(this.status)) return
    const lines = (((st.TimingData ?? {}) as Json).Lines ?? {}) as Record<string, Json>
    const rows: OFLocation[] = []
    for (const [k, L] of Object.entries(lines)) {
      const n = Number(k)
      const t = this.tr.get(n)
      if (!t || L.Retired || L.Stopped || L.InPit) continue
      const sectors = (Array.isArray(L.Sectors) ? L.Sectors : Object.values((L.Sectors ?? {}) as Json)) as Json[]
      const total = sectors.reduce((a, x) => a + segList(x).length, 0) || 1
      const segP = segProgress(sectors)
      const ref = (this.store.laps.get(n) ?? []).filter((l) => l.dur != null).at(-1)?.dur ?? 90
      const timeP = t.curStart != null ? (now - t.curStart) / (ref * 1000) : segP
      const p = Math.min(Math.max(timeP, segP), segP + 0.98 / total, 0.995)
      for (const [dt, pp] of [[0, p], [1000, Math.min(p + 1 / ref, segP + 0.98 / total, 0.995)]] as const) {
        const [x, y] = pointAt(o, pp)
        rows.push({ driver_number: n, date: iso(now + dt), x, y })
      }
    }
    if (rows.length) loc.add(rows)
    const cut = now - 120_000
    for (const [n, arr] of loc.per) if (arr.length > 400) loc.per.set(n, arr.filter((v) => v.t >= cut))
  }
}

const segList = (sec: Json | undefined) => { const r = sec?.Segments; return (Array.isArray(r) ? r : Object.values((r ?? {}) as Json)) as Json[] }
/** Part du tour déjà parcourue d'après les mini-secteurs allumés (remis à 0 à chaque nouveau tour). */
function segProgress(sectors: Json[]): number {
  let total = 0, done = 0
  for (const s of sectors) for (const g of segList(s)) { total++; if (Number(g?.Status ?? 0) > 0) done = total }
  return total ? done / total : 0
}

/** Tracé du circuit : meilleur tour d'une édition précédente sur le même circuit (OpenF1, données historiques gratuites). */
export async function referenceOutline(session: OFSession, signal?: AbortSignal): Promise<Outline | null> {
  for (const y of [session.year, session.year - 1, session.year - 2]) {
    let list: OFSession[] = []
    try { list = await getSessions(y, signal) } catch { continue }
    const past = list.filter((x) => x.circuit_key === session.circuit_key && x.session_key !== session.session_key && Date.parse(x.date_end) < Date.now() - 6 * 3600_000)
    const ref = past.reverse().find((x) => /race|qualifying/i.test(x.session_name)) ?? past[0]
    if (!ref) continue
    try {
      const laps = await histGet<OFLap>('laps', { session_key: ref.session_key, lap_number: 8 }, signal)
      const best = laps.filter((l) => l.lap_duration && l.date_start).sort((a, b) => (a.lap_duration ?? 0) - (b.lap_duration ?? 0))[0]
      if (!best?.date_start) continue
      const t = Date.parse(best.date_start)
      const rows = await histGet<OFLocation>('location', { session_key: ref.session_key, driver_number: best.driver_number, 'date>=': iso(t), 'date<': iso(t + (best.lap_duration ?? 90) * 1000 + 800) }, signal)
      const o = makeOutline(rows)
      if (o) return o
    } catch (e) {
      if (e instanceof OpenF1Error && e.kind === 'abort') throw e
    }
  }
  return null
}

export interface F1LiveHandle { stop: () => void; feed: F1Feed; ready: Promise<FeedState> }

/** Démarre le direct gratuit pour `store` (mêmes rappels que le polling OpenF1). */
export function startF1Live(o: { store: Store; loc: LocationStore; now: () => number; onUpdate: () => void; onOk: () => void; onError: (e: Error) => void }): F1LiveHandle {
  const feed = new F1Feed()
  const ad = new FeedAdapter(o.store)
  let resolveReady: (s: FeedState) => void = () => {}
  let rejectReady: (e: Error) => void = () => {}
  const ready = new Promise<FeedState>((res, rej) => { resolveReady = res; rejectReady = rej })
  let got = false
  let pending = false
  feed.onChange = () => {
    if (!got) { got = true; resolveReady(feed.state) }
    if (pending) return
    pending = true
    // regroupe les rafales de messages (jusqu'à plusieurs dizaines par seconde)
    setTimeout(() => { pending = false; ad.apply(feed.state, o.now()); o.onUpdate() }, 250)
  }
  feed.onStatus = (ok, err) => { if (ok) o.onOk(); else { if (!got && err) rejectReady(err); if (err) o.onError(err) } }
  feed.connect()
  const est = setInterval(() => { if (got) ad.estimate(o.loc, feed.state, o.now()) }, 1000)
  const timeout = setTimeout(() => { if (!got) rejectReady(new Error('Le flux F1 Live Timing ne répond pas')) }, 12_000)
  return { feed, ready, stop: () => { clearInterval(est); clearTimeout(timeout); feed.close() } }
}
