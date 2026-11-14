import type { ReactNode } from 'react'
import type { OFSession } from '../../live/openf1'
import { KIND_FR, panel, type Meeting } from './data'

export function PillSelect({ label, value, onChange, children, dot }: { label: string; value: string | number; onChange: (v: string) => void; children: ReactNode; dot?: string }) {
  return (
    <label className="relative inline-flex min-h-11 items-center rounded-full border border-[#2b2c2d] bg-[#0c0d0e] pl-4 pr-9 text-[14px] font-medium text-white transition-colors hover:border-[#3d3e3f] focus-within:border-white/60">
      {dot && <span className="mr-2 size-2 shrink-0 rounded-full" style={{ background: dot }} aria-hidden />}
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="min-h-11 appearance-none bg-transparent pr-1 outline-none [&>option]:bg-[#0c0d0e]">
        {children}
      </select>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3.5 size-4 text-[#939494]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
    </label>
  )
}

/** Choix du Grand Prix puis de la session. */
export function SessionPicker({ meetings, meeting, session, onMeeting, onSession }: { meetings: Meeting[]; meeting: Meeting | null; session: OFSession | null; onMeeting: (m: Meeting) => void; onSession: (s: OFSession) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <PillSelect label="Grand Prix" value={meeting?.key ?? ''} onChange={(v) => { const m = meetings.find((x) => String(x.key) === v); if (m) onMeeting(m) }}>
        {meetings.map((m) => <option key={m.key} value={m.key}>{m.name}</option>)}
      </PillSelect>
      {meeting && meeting.sessions.length > 1 && (
        <div className="seg" role="tablist" aria-label="Session">
          {meeting.sessions.map((s) => (
            <button key={s.session_key} role="tab" aria-selected={session?.session_key === s.session_key} onClick={() => onSession(s)} className="seg-item !text-[13px] sm:!text-sm">{KIND_FR[s.session_name] ?? s.session_name}</button>
          ))}
        </div>
      )}
    </div>
  )
}

export function State({ children, retry }: { children: ReactNode; retry?: () => void }) {
  return (
    <div className={`${panel} flex min-h-56 flex-col items-center justify-center gap-4 px-6 text-center text-[15px] text-[#939494]`}>
      {children}
      {retry && <button onClick={retry} className="btn-primary min-h-11 rounded-full px-5 text-sm font-semibold">Réessayer</button>}
    </div>
  )
}

export const Skeleton = ({ h = 'h-64' }: { h?: string }) => <div className={`${h} animate-pulse rounded-[1.75rem] border border-[#1d1e1f] bg-[#0c0d0e]`} aria-busy="true" aria-label="Chargement" />
