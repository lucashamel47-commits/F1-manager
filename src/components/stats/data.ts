/* Données des outils d'analyse (Duel, Positions) : historique OpenF1 gratuit, avec secours Jolpica-F1 si OpenF1 est verrouillé pendant une séance en direct. */
import { useEffect, useRef, useState } from 'react'
import { getSessions, histGet, type OFDriver, type OFLap, type OFPosition, type OFResult, type OFSession } from '../../live/openf1'
import { isSettled } from '../../live/data'
import { getCalendar, type Race } from '../../lib/f1api'
import {
  HistError, isHistError, isJolpicaSession, loadJolpicaBundle, matchRace,
  meetingName, meetingsFromJolpica, mergeCurrentWeekend, openf1LikelyLocked,
} from '../../lib/jolpicaHist'

export const SEASON = 2026

export type Kind = 'Race' | 'Sprint' | 'Qualifying' | 'Sprint Qualifying'
export const KIND_FR: Record<string, string> = { Race: 'Course', Sprint: 'Sprint', Qualifying: 'Qualifications', 'Sprint Qualifying': 'Qualifs sprint', 'Sprint Shootout': 'Qualifs sprint' }

export interface Meeting { key: number; name: string; short: string; sessions: OFSession[] }

function groupOpenF1(all: OFSession[], kinds: string[]): Meeting[] {
  const keep = all.filter((s) => !s.is_cancelled && isSettled(s) && kinds.includes(s.session_name))
  const by = new Map<number, Meeting>()
  for (const s of keep) {
    const m = by.get(s.meeting_key) ?? { key: s.meeting_key, name: meetingName(s.location, s.country_name), short: s.location, sessions: [] }
    m.sessions.push(s)
    by.set(s.meeting_key, m)
  }
  return [...by.values()].reverse()
}

/** Week-ends terminés de la saison (plus le week-end en cours), du plus récent au plus ancien. */
export function useMeetings(kinds: string[]) {
  const [meetings, setMeetings] = useState<Meeting[] | null>(null)
  const [error, setError] = useState(false)
  const kk = kinds.join('|')
  useEffect(() => {
    let alive = true
    const kindsList = kk.split('|')
    ;(async () => {
      try {
        const calendar = await getCalendar()
        const locked = openf1LikelyLocked(calendar)
        let list: Meeting[] | null = null
        if (!locked) {
          try { list = groupOpenF1(await getSessions(SEASON), kindsList) } catch { list = null }
        }
        if (!list || !list.length) list = meetingsFromJolpica(calendar, kindsList)
        else list = mergeCurrentWeekend(list, calendar, kindsList)
        if (alive) setMeetings(list)
      } catch {
        if (alive) setError(true)
      }
    })()
    return () => { alive = false }
  }, [kk])
  return { meetings, error }
}

/** Première manche déjà courue (pour ne pas ouvrir l'outil sur un GP en cours sans données). */
export function firstReadyMeeting(meetings: Meeting[] | null, now = Date.now()): Meeting | null {
  if (!meetings?.length) return null
  return meetings.find((m) => m.sessions.some((s) => Date.parse(s.date_end) < now - 6 * 3600_000)) ?? meetings[0]
}

export interface SessionData { drivers: OFDriver[]; laps: OFLap[]; results: OFResult[] }

let calendarP: Promise<Race[]> | null = null
const calendar = () => (calendarP ??= getCalendar().catch((e) => { calendarP = null; throw e }))

async function fromJolpica(s: OFSession, signal?: AbortSignal): Promise<SessionData> {
  const races = await calendar()
  const b = await loadJolpicaBundle(s, races, signal)
  return { drivers: b.drivers, laps: b.laps, results: b.results }
}

export async function loadSession(s: OFSession, signal?: AbortSignal): Promise<SessionData> {
  if (isJolpicaSession(s)) return fromJolpica(s, signal)
  try {
    const key = { session_key: s.session_key }
    const drivers = await histGet<OFDriver>('drivers', key, signal)
    const laps = await histGet<OFLap>('laps', key, signal)
    const results = await histGet<OFResult>('session_result', key, signal).catch(() => [] as OFResult[])
    if (drivers.length && laps.length) return { drivers, laps, results }
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e
    if (typeof e === 'object' && e && 'kind' in e && (e as { kind: string }).kind === 'abort') throw e
  }
  return fromJolpica(s, signal)
}

export async function loadPositions(s: OFSession, signal?: AbortSignal): Promise<OFPosition[]> {
  if (isJolpicaSession(s)) {
    const races = await calendar()
    return (await loadJolpicaBundle(s, races, signal)).positions
  }
  try {
    const rows = await histGet<OFPosition>('position', { session_key: s.session_key }, signal)
    if (rows.length) return rows
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e
    if (typeof e === 'object' && e && 'kind' in e && (e as { kind: string }).kind === 'abort') throw e
  }
  const races = await calendar()
  // Si le cache OpenF1 n'a pas de clé Jolpica, on associe par lieu (Austin ≠ Miami ≠ Las Vegas).
  const race = matchRace(s, races)
  if (!race) throw new HistError('unavailable', 'Données indisponibles pour cette course.')
  return (await loadJolpicaBundle(s, races, signal)).positions
}

/** Petit état « chargement → données / erreur » pour une session choisie. */
export function useSessionData<T>(s: OFSession | null, load: (s: OFSession, sig: AbortSignal) => Promise<T>) {
  const [st, setSt] = useState<{ key: number; data: T | null; error: boolean; message?: string } | null>(null)
  useEffect(() => {
    if (!s) return
    const ac = new AbortController()
    let alive = true
    load(s, ac.signal).then(
      (data) => alive && setSt({ key: s.session_key, data, error: false }),
      (e) => {
        if (!alive) return
        const message = isHistError(e) ? e.message : undefined
        setSt({ key: s.session_key, data: null, error: true, message })
      },
    )
    return () => { alive = false; ac.abort() }
  }, [s, load])
  const cur = st && s && st.key === s.session_key ? st : null
  return { data: cur?.data ?? null, error: !!cur?.error, loading: !!s && !cur, message: cur?.message }
}

export const color = (d?: OFDriver) => (d?.team_colour ? `#${d.team_colour.replace('#', '')}` : '#a1a1aa')

export const fmt = (s: number | null | undefined) => {
  if (s == null || !Number.isFinite(s)) return '—'
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return m ? `${m}:${r.toFixed(3).padStart(6, '0')}` : r.toFixed(3)
}
export const fmtDelta = (d: number) => `${d > 0 ? '+' : d < 0 ? '−' : '±'}${Math.abs(d).toFixed(3)}`

export const panel = 'rounded-[1.75rem] border border-[#232425] bg-[#0c0d0e]'

/** Largeur réelle d'un conteneur (les graphiques sont dessinés en pixels, texte net sur iPad comme sur téléphone). */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)))
    ro.observe(el)
    setW(Math.round(el.getBoundingClientRect().width))
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}
