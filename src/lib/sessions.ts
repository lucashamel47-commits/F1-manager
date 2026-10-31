// Sessions d'un week-end de F1 (essais, qualifs, sprint, course) à partir du calendrier Jolpica,
// + export .ics. Aucune dépendance, tout se passe dans le navigateur.
import type { Race } from './f1api'

export type SessionKind = 'fp' | 'sprint' | 'quali' | 'race'

export interface Session {
  id: string // ex. « 2026-19-Qualifying »
  round: number
  gp: string // ex. « GP Mexico City »
  circuit: string
  place: string
  label: string // ex. « Qualifications »
  kind: SessionKind
  start: Date
  minutes: number
}

export const KIND_LABEL: Record<SessionKind, string> = {
  race: 'Course',
  quali: 'Qualifications',
  sprint: 'Sprint (et qualifs sprint)',
  fp: 'Essais libres',
}

type Raw = Record<string, unknown> & { date?: string; time?: string }

const FIELDS: { key: string; label: string; kind: SessionKind; minutes: number }[] = [
  { key: 'FirstPractice', label: 'Essais libres 1', kind: 'fp', minutes: 60 },
  { key: 'SecondPractice', label: 'Essais libres 2', kind: 'fp', minutes: 60 },
  { key: 'ThirdPractice', label: 'Essais libres 3', kind: 'fp', minutes: 60 },
  { key: 'SprintQualifying', label: 'Qualifications sprint', kind: 'sprint', minutes: 45 },
  { key: 'SprintShootout', label: 'Qualifications sprint', kind: 'sprint', minutes: 45 },
  { key: 'Sprint', label: 'Sprint', kind: 'sprint', minutes: 60 },
  { key: 'Qualifying', label: 'Qualifications', kind: 'quali', minutes: 60 },
]

/** « GP Melbourne » : la ville est plus parlante que « Australian Grand Prix » en français. */
export function gpName(race: Race): string {
  return 'GP ' + (race.Circuit.Location.locality || race.raceName.replace(/\s*Grand Prix.*$/i, '')).trim()
}

function parse(date?: string, time?: string): Date | null {
  if (!date) return null
  const d = new Date(`${date}T${time ?? '13:00:00Z'}`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function sessionsOf(race: Race): Session[] {
  const base = {
    round: Number(race.round),
    gp: gpName(race),
    circuit: race.Circuit.circuitName,
    place: `${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`,
  }
  const out: Session[] = []
  for (const f of FIELDS) {
    const raw = (race as unknown as Record<string, Raw | undefined>)[f.key]
    const start = parse(raw?.date, raw?.time)
    if (start) out.push({ ...base, id: `${race.season}-${race.round}-${f.key}`, label: f.label, kind: f.kind, minutes: f.minutes, start })
  }
  const start = parse(race.date, race.time)
  if (start) out.push({ ...base, id: `${race.season}-${race.round}-Race`, label: 'Course', kind: 'race', minutes: 120, start })
  return out.sort((a, b) => a.start.getTime() - b.start.getTime())
}

export function allSessions(calendar: Race[]): Session[] {
  return calendar.flatMap(sessionsOf).sort((a, b) => a.start.getTime() - b.start.getTime())
}

export function nextSession(list: Session[], now = Date.now()): Session | null {
  return list.find((s) => s.start.getTime() + s.minutes * 60_000 > now) ?? null
}

/** « 2 j 04 h 12 min 09 s » → affichage du compte à rebours. */
export function countdown(ms: number): { d: number; h: number; m: number; s: number } {
  const t = Math.max(0, Math.floor(ms / 1000))
  return { d: Math.floor(t / 86400), h: Math.floor((t % 86400) / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 }
}

export function formatWhen(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(d)
}

// ---------- .ics ----------
const pad = (n: number) => String(n).padStart(2, '0')
const icsDate = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

/** Plie les lignes à 75 octets max (RFC 5545). */
function fold(line: string): string {
  const enc = new TextEncoder()
  if (enc.encode(line).length <= 75) return line
  const parts: string[] = []
  let cur = ''
  for (const ch of line) {
    if (enc.encode(cur + ch).length > (parts.length ? 74 : 75)) {
      parts.push(cur)
      cur = ''
    }
    cur += ch
  }
  parts.push(cur)
  return parts.join('\r\n ')
}

export function buildIcs(list: Session[], leadsMin: number[]): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//F1 Manager//Calendrier F1//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Formule 1', 'X-WR-TIMEZONE:Europe/Paris']
  const stamp = icsDate(new Date())
  for (const s of list) {
    const end = new Date(s.start.getTime() + s.minutes * 60_000)
    lines.push(
      'BEGIN:VEVENT',
      `UID:${s.id}@f1-manager`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(s.start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${esc(`${s.kind === 'race' ? '🏁 ' : ''}${s.label} – ${s.gp}`)}`,
      `LOCATION:${esc(`${s.circuit}, ${s.place}`)}`,
      `DESCRIPTION:${esc(`Formule 1 · Manche ${s.round} · ${s.gp}`)}`,
    )
    for (const m of leadsMin) {
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(`${s.label} – ${s.gp}`)}`, `TRIGGER:-PT${m}M`, 'END:VALARM')
    }
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}
