import { useEffect, useMemo, useState } from 'react'
import type { OFSession } from '../openf1'
import { SESSION_SHORT, gpLabel, fmtDateFr } from './labels'

export default function Picker({ sessions, loading, year, years, onYear, onPick, onClose, current, now }: {
  now: number
  sessions: OFSession[]; loading: boolean; year: number; years: number[]; onYear: (y: number) => void; onPick: (s: OFSession) => void; onClose: () => void; current: number | null
}) {
  const [filter, setFilter] = useState<'all' | 'race'>('all')
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  const meetings = useMemo(() => {
    const m = new Map<number, OFSession[]>()
    for (const s of sessions.filter((s) => s.year === year)) m.set(s.meeting_key, [...(m.get(s.meeting_key) ?? []), s])
    return [...m.values()].sort((a, b) => b[0].date_start.localeCompare(a[0].date_start))
  }, [sessions, year])
  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose} role="presentation">
      <div role="dialog" aria-modal="true" aria-label="Choisir une session" onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-3xl max-h-[88dvh] glass flex flex-col bg-[#0e0f11]/95 rounded-t-3xl sm:rounded-3xl overflow-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <header className="flex items-center gap-3 px-4 h-14 border-b border-white/[0.08] shrink-0">
          <h2 className="font-semibold tracking-tight">Choisir une session à rejouer</h2>
          <button onClick={onClose} aria-label="Fermer" className="ml-auto min-h-11 min-w-11 text-xl text-zinc-400 active:text-white">✕</button>
        </header>
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] shrink-0 overflow-x-auto [scrollbar-width:none]">
          {years.map((y) => (
            <button key={y} onClick={() => onYear(y)} aria-pressed={y === year} className={`min-h-10 px-4 rounded-full text-sm font-semibold border ${y === year ? 'bg-gradient-to-br from-[#5b7cff] to-[#7a5cf5] text-white border-transparent' : 'border-white/15 text-zinc-300 hover:bg-white/5'}`}>{y}</button>
          ))}
          <span className="mx-1 h-5 w-px bg-zinc-800" />
          {(['all', 'race'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f} className={`min-h-10 px-4 rounded-full text-xs font-medium border ${filter === f ? 'border-accent-400/70 bg-accent-500/10 text-white' : 'border-white/10 text-zinc-400 hover:bg-white/5'}`}>{f === 'all' ? 'Toutes les sessions' : 'Courses'}</button>
          ))}
        </div>
        <div className="overflow-y-auto flex-1">
          {loading && !meetings.length && <p className="p-6 text-sm text-zinc-500">Chargement du calendrier…</p>}
          {!loading && !meetings.length && <p className="p-6 text-sm text-zinc-500">Aucune session pour {year}.</p>}
          {meetings.map((ms) => (
            <div key={ms[0].meeting_key} className="px-4 py-3 border-b border-white/[0.06]">
              <p className="text-sm font-semibold tracking-tight">{gpLabel(ms[0])} <span className="text-zinc-500 font-normal normal-case">· {ms[0].circuit_short_name}</span></p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ms.filter((s) => filter === 'all' || /^(Race|Sprint)$/.test(s.session_name)).map((s) => {
                  const over = Date.parse(s.date_end) < now
                  return (
                    <button
                      key={s.session_key}
                      disabled={!over}
                      onClick={() => onPick(s)}
                      title={over ? fmtDateFr(s.date_start) : `Pas encore disputée — ${fmtDateFr(s.date_start)}`}
                      className={`min-h-11 px-4 rounded-full text-xs font-semibold border ${current === s.session_key ? 'border-accent-400/70 text-white bg-accent-500/10' : 'border-white/15 text-zinc-200 hover:bg-white/5'} disabled:opacity-30 disabled:active:bg-transparent`}
                    >
                      {SESSION_SHORT[s.session_name] ?? s.session_name}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
