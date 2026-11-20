import { useEffect, useState } from 'react'
import { getCalendar } from '../lib/f1api'
import { allSessions, nextSession, type Session } from '../lib/sessions'

const SHORT_LABEL: Record<string, string> = {
  'Essais libres 1': 'EL1',
  'Essais libres 2': 'EL2',
  'Essais libres 3': 'EL3',
  'Qualifications': 'Qualifs',
  'Qualifications sprint': 'Qualifs sprint',
  'Sprint': 'Sprint',
  'Course': 'Course',
}

/** « GP de Las Vegas » → « Las Vegas ». */
function shortGp(gp: string): string {
  return gp.replace(/^GP\s+(de\s+la\s+|de\s+l’|de\s+l'|du\s+|des\s+|de\s+|d’|d')/i, '').trim() || gp
}

function remain(ms: number): string {
  if (ms <= 0) return 'en cours'
  const mins = Math.floor(ms / 60_000)
  if (mins < 60) return `dans ${mins} min`
  if (mins < 48 * 60) {
    const h = Math.floor(mins / 60)
    return `dans ${String(h).padStart(2, '0')} h ${String(mins % 60).padStart(2, '0')} min`
  }
  const d = Math.floor(mins / 1440)
  return d <= 1 ? 'dans 1 jour' : `dans ${d} jours`
}

/** Ligne « Prochaine séance · Qualifs Las Vegas dans 05 h 12 min », mise à jour chaque minute. */
export default function NextSessionLine() {
  const [next, setNext] = useState<Session | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    getCalendar().then((c) => setNext(nextSession(allSessions(c)))).catch(() => {})
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  if (!next) return null
  const label = SHORT_LABEL[next.label] ?? next.label
  const place = shortGp(next.gp)
  return (
    <p data-countdown className="text-[14px] text-[#636464]">
      Prochaine séance · <span className="text-[#c4c5c5]">{label} {place}</span> {remain(next.start.getTime() - now)}
    </p>
  )
}
