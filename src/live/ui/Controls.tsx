import type { Runtime } from '../useLive'
import { fmtElapsed } from '../model'

export default function Controls({ rt, lap, totalLaps, onLap }: { rt: Runtime; lap: number; totalLaps: number | null; onLap: (d: number) => void }) {
  const st = rt.store
  if (!st) return null
  const speeds = [1, 10, 50]
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 sm:px-5 lg:px-6 py-2 border-b border-white/[0.08] bg-white/[0.02]" role="group" aria-label="Contrôles du rejeu">
      <button
        onClick={rt.playing ? rt.pause : rt.play}
        aria-label={rt.playing ? 'Pause' : 'Lecture'}
        className="btn-primary min-h-11 min-w-11 rounded-full flex items-center justify-center text-white active:scale-95"
      >
        {rt.playing ? (
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden><path d="M7 4l13 8-13 8z" /></svg>
        )}
      </button>
      <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-0.5" role="radiogroup" aria-label="Vitesse de lecture">
        {speeds.map((s) => (
          <button key={s} role="radio" aria-checked={rt.speed === s} onClick={() => rt.setSpeed(s)} className={`min-h-10 min-w-12 px-3 rounded-full text-sm font-semibold tabular-nums ${rt.speed === s ? 'bg-white text-[#0a0a0a]' : 'text-zinc-300 hover:bg-white/5'}`}>×{s}</button>
        ))}
      </div>
      <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-0.5">
        <button onClick={() => onLap(-1)} aria-label="Tour précédent" className="min-h-10 px-4 rounded-full text-sm font-medium text-zinc-300 hover:bg-white/5">‹ Tour</button>
        <button onClick={() => onLap(1)} aria-label="Tour suivant" className="min-h-10 px-4 rounded-full text-sm font-medium text-zinc-300 hover:bg-white/5">Tour ›</button>
      </div>
      <label className="flex-1 min-w-[12rem] flex items-center gap-3">
        <span className="sr-only">Position dans la session</span>
        <input
          type="range"
          min={st.t0}
          max={st.t1}
          step={1000}
          value={Math.min(Math.max(rt.t, st.t0), st.t1)}
          onChange={(e) => rt.seek(Number(e.target.value))}
          className="flex-1 h-11 accent-accent-500"
          aria-valuetext={`Tour ${lap}${totalLaps ? ` sur ${totalLaps}` : ''}`}
        />
        <span className="w-28 text-right text-xs text-zinc-400 tabular-nums">{fmtElapsed(rt.t, st.t0)} · T{lap}{totalLaps ? `/${totalLaps}` : ''}</span>
      </label>
    </div>
  )
}
