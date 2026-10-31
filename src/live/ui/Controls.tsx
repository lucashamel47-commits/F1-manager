import type { Runtime } from '../useLive'
import { fmtElapsed } from '../model'

export default function Controls({ rt, lap, totalLaps, onLap }: { rt: Runtime; lap: number; totalLaps: number | null; onLap: (d: number) => void }) {
  const st = rt.store
  if (!st) return null
  const speeds = [1, 10, 50]
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 sm:px-5 lg:px-6 py-2 border-b border-zinc-800 bg-zinc-950" role="group" aria-label="Contrôles du rejeu">
      <button
        onClick={rt.playing ? rt.pause : rt.play}
        aria-label={rt.playing ? 'Pause' : 'Lecture'}
        className="min-h-11 min-w-11 flex items-center justify-center bg-red-600 active:bg-red-500 text-white"
      >
        {rt.playing ? (
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden><path d="M7 4l13 8-13 8z" /></svg>
        )}
      </button>
      <div className="flex" role="radiogroup" aria-label="Vitesse de lecture">
        {speeds.map((s) => (
          <button key={s} role="radio" aria-checked={rt.speed === s} onClick={() => rt.setSpeed(s)} className={`min-h-11 min-w-12 px-2 text-sm font-bold tabular-nums border ${rt.speed === s ? 'bg-white text-black border-white' : 'border-zinc-700 text-zinc-300 active:bg-zinc-900'}`}>×{s}</button>
        ))}
      </div>
      <div className="flex">
        <button onClick={() => onLap(-1)} aria-label="Tour précédent" className="min-h-11 px-3 text-sm font-bold border border-zinc-700 text-zinc-300 active:bg-zinc-900">‹ Tour</button>
        <button onClick={() => onLap(1)} aria-label="Tour suivant" className="min-h-11 px-3 text-sm font-bold border border-l-0 border-zinc-700 text-zinc-300 active:bg-zinc-900">Tour ›</button>
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
          className="flex-1 h-11 accent-red-600"
          aria-valuetext={`Tour ${lap}${totalLaps ? ` sur ${totalLaps}` : ''}`}
        />
        <span className="w-28 text-right text-xs text-zinc-400 tabular-nums">{fmtElapsed(rt.t, st.t0)} · T{lap}{totalLaps ? `/${totalLaps}` : ''}</span>
      </label>
    </div>
  )
}
