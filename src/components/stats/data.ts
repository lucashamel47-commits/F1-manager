/* Données des outils d'analyse (Duel, Positions) : historique OpenF1 gratuit, mis en cache par le client existant. */
import { useEffect, useRef, useState } from 'react'
import { getSessions, histGet, type OFDriver, type OFLap, type OFPosition, type OFResult, type OFSession } from '../../live/openf1'
import { isSettled } from '../../live/data'
import { countryFr } from '../../lib/i18n'

export const SEASON = 2026

export type Kind = 'Race' | 'Sprint' | 'Qualifying' | 'Sprint Qualifying'
export const KIND_FR: Record<string, string> = { Race: 'Course', Sprint: 'Sprint', Qualifying: 'Qualifications', 'Sprint Qualifying': 'Qualifs sprint', 'Sprint Shootout': 'Qualifs sprint' }

export interface Meeting { key: number; name: string; short: string; sessions: OFSession[] }

/** Week-ends terminés de la saison, du plus récent au plus ancien, avec leurs sessions utiles. */
export function useMeetings(kinds: string[]) {
  const [meetings, setMeetings] = useState<Meeting[] | null>(null)
  const [error, setError] = useState(false)
  const kk = kinds.join('|')
  useEffect(() => {
    let alive = true
    getSessions(SEASON).then(
      (all) => {
        if (!alive) return
        const keep = all.filter((s) => !s.is_cancelled && isSettled(s) && kk.split('|').includes(s.session_name))
        const by = new Map<number, Meeting>()
        for (const s of keep) {
          const m = by.get(s.meeting_key) ?? { key: s.meeting_key, name: gpName(s), short: s.location, sessions: [] }
          m.sessions.push(s)
          by.set(s.meeting_key, m)
        }
        setMeetings([...by.values()].reverse())
      },
      () => alive && setError(true),
    )
    return () => { alive = false }
  }, [kk])
  return { meetings, error }
}

const COUNTRY_FR: Record<string, string> = {
  Australia: 'Australie', China: 'Chine', Japan: 'Japon', Bahrain: 'Bahreïn', 'Saudi Arabia': 'Arabie saoudite', 'United States': 'États-Unis',
  Italy: 'Italie', Monaco: 'Monaco', Spain: 'Espagne', Canada: 'Canada', Austria: 'Autriche', 'United Kingdom': 'Grande-Bretagne', Belgium: 'Belgique',
  Hungary: 'Hongrie', Netherlands: 'Pays-Bas', Azerbaijan: 'Azerbaïdjan', Singapore: 'Singapour', Mexico: 'Mexique', Brazil: 'Brésil', Qatar: 'Qatar',
  'United Arab Emirates': 'Abu Dhabi', 'Abu Dhabi': 'Abu Dhabi',
}
const BY_CITY: Record<string, string> = { 'Miami Gardens': 'Miami', Miami: 'Miami', 'Las Vegas': 'Las Vegas', Austin: 'États-Unis', Madrid: 'Madrid', 'Kuala Lumpur': 'Kuala Lumpur', Imola: 'Émilie-Romagne' }
function gpName(s: OFSession) {
  return BY_CITY[s.location] ?? COUNTRY_FR[s.country_name] ?? countryFr(s.country_name)
}

export interface SessionData { drivers: OFDriver[]; laps: OFLap[]; results: OFResult[] }

export async function loadSession(s: OFSession, signal?: AbortSignal): Promise<SessionData> {
  const key = { session_key: s.session_key }
  const drivers = await histGet<OFDriver>('drivers', key, signal)
  const laps = await histGet<OFLap>('laps', key, signal)
  const results = await histGet<OFResult>('session_result', key, signal).catch(() => [] as OFResult[])
  return { drivers, laps, results }
}
export const loadPositions = (s: OFSession, signal?: AbortSignal) => histGet<OFPosition>('position', { session_key: s.session_key }, signal)

/** Petit état « chargement → données / erreur » pour une session choisie. */
export function useSessionData<T>(s: OFSession | null, load: (s: OFSession, sig: AbortSignal) => Promise<T>) {
  const [st, setSt] = useState<{ key: number; data: T | null; error: boolean } | null>(null)
  useEffect(() => {
    if (!s) return
    const ac = new AbortController()
    let alive = true
    load(s, ac.signal).then(
      (data) => alive && setSt({ key: s.session_key, data, error: false }),
      () => alive && setSt({ key: s.session_key, data: null, error: true }),
    )
    return () => { alive = false; ac.abort() }
  }, [s, load])
  const cur = st && s && st.key === s.session_key ? st : null
  return { data: cur?.data ?? null, error: !!cur?.error, loading: !!s && !cur }
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

