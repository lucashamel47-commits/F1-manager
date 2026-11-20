import { useEffect, useState } from 'react'
import { getCalendar } from '../lib/f1api'
import { allSessions, nextSession, type Session } from '../lib/sessions'

/** Petite ligne « Prochaine session » sous les boutons de l'accueil. */
export default function NextSessionLine() {
  const [next, setNext] = useState<Session | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    getCalendar().then((c) => setNext(nextSession(allSessions(c)))).catch(() => {})
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  if (!next) return null
  const ms = next.start.getTime() - now
  const mins = Math.floor(ms / 60000)
  const txt = ms <= 0 ? 'en cours' : mins < 60 ? `dans ${mins} min` : mins < 2880 ? `dans ${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')}` : `dans ${Math.floor(mins / 1440)} jours`
  return (
    <p className="text-left text-[13px] text-[#636464]">
      Prochaine session : <span className="text-[#c4c5c5]">{next.label} · {next.gp}</span> · {txt}
    </p>
  )
}
