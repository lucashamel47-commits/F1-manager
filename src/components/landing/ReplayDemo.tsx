/* Démo de l'accueil : vrai rejeu du GP du Brésil 2026 (départ + premiers tours), joué en accéléré sur la carte du Live.
   Données précalculées et légères (public/replay/bresil-2026.json, ~13 ko, voir scripts/build-replay.mjs) : aucun appel réseau externe. */
import { useEffect, useMemo, useRef, useState } from 'react'
import LiveMap from '../../live/ui/LiveMap'
import { makeOutline, pointAt, type LocationStore, type Outline } from '../../live/data'
import type { Row } from '../../live/model'
import type { OFLocation } from '../../live/openf1'
import { prefersReduced } from '../../lib/motion'

interface RDriver { n: number; acr: string; name: string; team: string; color: string; grid: number; finish: number | null; laps: [number, number, number | null, number | null, number | null][] }
interface Replay { gp: string; circuit: string; totalLaps: number; sectors: [number, number]; track: [number, number][]; drivers: RDriver[] }

const SPEED = 16 // secondes de course par seconde réelle
const LAPS_SHOWN = 12

/** Distance parcourue (en tours) à l'instant t (s depuis le départ) ; null = plus en piste. */
function distance(d: RDriver, t: number, sec: [number, number]): number | null {
  const L = d.laps
  if (!L.length) return null
  const slot = (d.grid - 1) * 0.0024 + (d.grid % 2) * 0.0006 // décalage sur la grille
  if (t <= 0) return -slot
  let i = L.length - 1
  while (i > 0 && L[i][1] > t) i--
  const [lap, start, s1, s2, s3] = L[i]
  const next = L[i + 1]
  const dur = next ? next[1] - start : s1 != null && s2 != null && s3 != null ? s1 + s2 + s3 : null
  if (dur == null) return null // abandon
  const e = t - start
  if (e > dur) return next ? lap : null
  let f: number
  if (s1 != null && s2 != null && s1 + s2 < dur) {
    const a = s1 * (dur / (s1 + s2 + (s3 ?? dur - s1 - s2)))
    const b = (s1 + s2) * (dur / (s1 + s2 + (s3 ?? dur - s1 - s2)))
    f = e < a ? (e / a) * sec[0] : e < b ? sec[0] + ((e - a) / (b - a)) * (sec[1] - sec[0]) : sec[1] + ((e - b) / (dur - b)) * (1 - sec[1])
  } else f = e / dur
  if (lap === 1 && e < (s1 ?? dur * 0.3)) f = f - slot * (1 - e / (s1 ?? dur * 0.3))
  return lap - 1 + f
}

/** Adaptateur minimal : la carte du Live lit `outline`, `per` et `at(n, t)`. */
class ReplayLoc {
  outline: Outline
  per = new Map()
  version = 1
  data: Replay
  constructor(data: Replay, outline: Outline) { this.data = data; this.outline = outline }
  at(n: number, t: number): [number, number] | null {
    const d = this.data.drivers.find((x) => x.n === n)
    const D = d ? distance(d, t, this.data.sectors) : null
    return D == null ? null : pointAt(this.outline, D)
  }
}

export default function ReplayDemo({ active }: { active: boolean }) {
  const [data, setData] = useState<Replay | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}replay/bresil-2026.json`).then((r) => (r.ok ? r.json() : Promise.reject())).then(setData, () => setFailed(true))
  }, [])
  if (failed) return <p className="py-24 text-center text-sm text-zinc-500">Rejeu indisponible hors connexion.</p>
  if (!data) return <div className="h-[22rem] animate-pulse rounded-2xl bg-white/[0.03]" />
  return <Player data={data} active={active} />
}

function Player({ data, active }: { data: Replay; active: boolean }) {
  const loc = useMemo(() => {
    const o = makeOutline(data.track.map(([x, y]) => ({ x, y }) as OFLocation))!
    return new ReplayLoc(data, o)
  }, [data])
  const end = useMemo(() => {
    const leader = data.drivers.find((d) => d.finish === 1) ?? data.drivers[0]
    return leader.laps.find((l) => l[0] === LAPS_SHOWN + 1)?.[1] ?? 1100
  }, [data])
  const t = useRef(-2)
  const [playing, setPlaying] = useState(() => !prefersReduced())
  const [view, setView] = useState(0) // instant affiché dans le classement (~4 fois/s)
  const [sel, setSel] = useState<number | null>(null)

  useEffect(() => {
    if (!active || !playing) return
    let raf = 0, last = performance.now(), shown = 0
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      t.current += dt * SPEED
      if (t.current > end + 6) t.current = -2
      if (now - shown > 250) { shown = now; setView(t.current) }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [active, playing, end])

  const now = useMemo(() => () => t.current, [])
  const rows = useMemo(() => {
    const list = data.drivers.map((d) => ({ d, D: distance(d, view, data.sectors) }))
    list.sort((a, b) => (b.D ?? -99) - (a.D ?? -99) || a.d.grid - b.d.grid)
    const leader = list[0].d
    return list.map(({ d, D }, i) => {
      const lapNo = D == null ? 0 : Math.max(1, Math.floor(D) + 1)
      // écart réel : différence de passage sur la ligne au dernier tour bouclé
      const k = Math.floor(D ?? 0) + 1
      const mine = d.laps.find((l) => l[0] === k)?.[1], lead = leader.laps.find((l) => l[0] === k)?.[1]
      const gap = i === 0 ? 'Leader' : D == null ? 'Abandon' : k > 1 && mine != null && lead != null ? `+${(mine - lead).toFixed(1)}` : `P${i + 1}`
      return { n: d.n, acr: d.acr, name: d.name, team: d.team, color: d.color, pos: i + 1, gap, out: D == null, lapNo, grid: d.grid } as unknown as Row & { grid: number }
    })
  }, [data, view])
  const lap = Math.min(LAPS_SHOWN, Math.max(1, rows[0]?.lapNo ?? 1))
  const top = rows.slice(0, 10)

  return (
    <div className="grid h-full gap-4 lg:grid-cols-[1fr_17rem]">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-semibold tracking-tight"><span className="size-1.5 rounded-full bg-white animate-pulse" aria-hidden />{data.gp} · Tour {view <= 0 ? 0 : lap}/{data.totalLaps}</p>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-400">Rejeu réel · ×{SPEED}</span>
            <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Lecture'} className="grid size-8 place-items-center rounded-full bg-white text-black transition hover:bg-zinc-200 active:scale-95">
              <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>{playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5v14l11-7z" />}</svg>
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-[#08090a] p-2" data-replay="map">
          <LiveMap loc={loc as unknown as LocationStore} now={now} rows={rows} selected={sel} onSelect={(n) => setSel((s) => (s === n ? null : n))} version={1} />
        </div>
        <p className="mt-2 text-[11px] text-zinc-500">{data.circuit} · positions réelles reconstituées à partir des temps au tour et des secteurs.</p>
      </div>
      <aside className="min-w-0">
        <div className="grid grid-cols-[1.5rem_1fr_3.8rem] items-center gap-2 px-3 pb-1 text-[10px] uppercase tracking-wider text-zinc-600"><span>P</span><span>Pilote</span><span className="text-right">Écart</span></div>
        <div className="relative" style={{ height: top.length * 34 }}>
          {rows.map((r) => {
            const shown = r.pos <= 10
            const moved = (r as { grid: number }).grid - r.pos
            return (
              <button key={r.n} onClick={() => setSel((s) => (s === r.n ? null : r.n))} tabIndex={shown ? 0 : -1}
                className={`absolute inset-x-0 grid h-[30px] grid-cols-[1.5rem_1fr_3.8rem] items-center gap-2 rounded-lg px-3 text-left transition-[transform,opacity,background-color] duration-500 ease-out motion-reduce:transition-none ${sel === r.n ? 'bg-white text-black' : 'bg-white/[0.03] hover:bg-white/[0.06]'}`}
                style={{ transform: `translateY(${(Math.min(r.pos, 11) - 1) * 34}px)`, opacity: shown ? 1 : 0, pointerEvents: shown ? 'auto' : 'none' }}>
                <span className={`text-xs tabular-nums ${sel === r.n ? 'text-black/60' : 'text-zinc-400'}`}>{r.pos}</span>
                <span className="flex items-center gap-2 text-[13px] font-semibold"><span className="h-3.5 w-1 rounded-full" style={{ background: r.color }} />{r.acr}
                  {view > 0 && moved !== 0 && <span className={`text-[10px] font-medium tabular-nums ${sel === r.n ? 'text-black/50' : 'text-zinc-500'}`}>{moved > 0 ? `▲${moved}` : `▼${-moved}`}</span>}
                </span>
                <span className={`text-right text-xs tabular-nums ${sel === r.n ? 'text-black/70' : 'text-zinc-300'}`}>{r.gap}</span>
              </button>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
