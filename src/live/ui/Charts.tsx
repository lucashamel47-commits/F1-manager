import { useMemo, useState } from 'react'
import type { Store, Snapshot, LapSeries } from '../model'
import { fmtSec } from '../model'
import { TyreDot, Empty } from './common'
import { compound } from './style'

const W = 800

function colorMap(store: Store) {
  const m = new Map<number, { color: string; dash: boolean; acr: string }>()
  const seen = new Map<string, number>()
  for (const d of store.drivers) {
    const k = seen.get(d.team_name) ?? 0
    seen.set(d.team_name, k + 1)
    m.set(d.driver_number, { color: `#${d.team_colour}`, dash: k > 0, acr: d.name_acronym })
  }
  return m
}

/** Positions tour par tour. */
export function PositionChart({ store, series, lap, selected, onSelect }: { store: Store; series: LapSeries; lap: number; selected: number | null; onSelect: (n: number) => void }) {
  const cm = useMemo(() => colorMap(store), [store])
  const N = Math.max(store.drivers.length, 10)
  const maxLap = Math.max(series.laps.length, 2)
  const cur = Math.max(1, Math.min(lap, series.laps.length))
  const L = 38, R = 44, T = 14, B = 26
  const H = 24 * N + T + B
  const x = (l: number) => L + ((l - 1) / (maxLap - 1)) * (W - L - R)
  const y = (p: number) => T + ((p - 1) / (N - 1)) * (H - T - B)
  if (series.laps.length < 2) return <Empty>Les positions par tour apparaîtront après quelques tours.</Empty>
  const lines = store.drivers.map((d) => {
    const arr = series.pos.get(d.driver_number) ?? []
    const pts: string[] = []
    for (let i = 0; i < cur; i++) { const v = arr[i]; if (v != null) pts.push(`${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`) }
    let lastV: number | null = null
    for (let i = cur - 1; i >= 0; i--) if (arr[i] != null) { lastV = arr[i]; break }
    return { n: d.driver_number, pts: pts.join(' '), lastV, ...cm.get(d.driver_number)! }
  })
  const ticks = Array.from({ length: Math.floor(maxLap / 10) }, (_, i) => (i + 1) * 10).filter((l) => l <= maxLap)
  return (
    <div className="p-2 sm:p-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Évolution des positions par tour">
        {Array.from({ length: N }, (_, i) => <line key={i} x1={L} x2={W - R} y1={y(i + 1)} y2={y(i + 1)} stroke="#18181b" />)}
        {Array.from({ length: N }, (_, i) => <text key={i} x={L - 8} y={y(i + 1) + 4} textAnchor="end" fontSize="11" fill="#71717a">{i + 1}</text>)}
        {ticks.map((l) => <text key={l} x={x(l)} y={H - 8} textAnchor="middle" fontSize="11" fill="#71717a">T{l}</text>)}
        <line x1={x(cur)} x2={x(cur)} y1={T - 4} y2={H - B + 4} stroke="#ef4444" strokeOpacity=".5" />
        {lines.map((l) => {
          const on = selected == null || selected === l.n
          return (
            <g key={l.n} opacity={on ? 1 : 0.28}>
              {l.pts && <polyline points={l.pts} fill="none" stroke={l.color} strokeWidth={selected === l.n ? 4 : 2.2} strokeDasharray={l.dash ? '6 4' : undefined} strokeLinejoin="round" strokeLinecap="round" />}
              {l.lastV != null && (
                <text x={x(cur) + 6} y={y(l.lastV) + 4} fontSize="11" fontWeight="700" fill={l.color} onClick={() => onSelect(l.n)} style={{ cursor: 'pointer' }}>{l.acr}</text>
              )}
            </g>
          )
        })}
      </svg>
      <p className="px-2 text-[11px] text-zinc-500">Trait plein : 1er pilote de l’écurie · pointillés : 2e pilote. Touchez un nom pour isoler un pilote.</p>
    </div>
  )
}

/** Évolution de l'écart au leader. */
export function GapChart({ store, series, snap, lap, selected }: { store: Store; series: LapSeries; snap: Snapshot; lap: number; selected: number | null }) {
  const cm = useMemo(() => colorMap(store), [store])
  const [picked, setPicked] = useState<number[] | null>(null)
  const top = snap.rows.slice(0, 6).map((r) => r.n)
  const sel = picked ?? Array.from(new Set([...(selected != null ? [selected] : []), ...top])).slice(0, 7)
  const cur = Math.max(1, Math.min(lap, series.laps.length))
  const maxLap = Math.max(series.laps.length, 2)
  const L = 44, R = 12, T = 14, B = 26, H = 300
  const vals: number[] = []
  for (const n of sel) { const a = series.gap.get(n) ?? []; for (let i = 0; i < cur; i++) if (a[i] != null) vals.push(a[i] as number) }
  const maxGap = Math.max(10, Math.ceil(Math.min(Math.max(0, ...vals), 120) / 10) * 10)
  const x = (l: number) => L + ((l - 1) / (maxLap - 1)) * (W - L - R)
  const y = (g: number) => T + (Math.min(g, maxGap) / maxGap) * (H - T - B)
  if (series.laps.length < 2 || store.intervals.size === 0) return <Empty>Les écarts au leader ne sont disponibles que pour les courses.</Empty>
  const toggle = (n: number) => setPicked((p) => { const b = p ?? sel; return b.includes(n) ? b.filter((v) => v !== n) : [...b, n] })
  return (
    <div className="p-2 sm:p-3">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {snap.rows.map((r) => {
          const on = sel.includes(r.n)
          return (
            <button key={r.n} onClick={() => toggle(r.n)} aria-pressed={on} className={`min-h-9 px-2.5 text-xs font-bold uppercase border ${on ? 'text-white' : 'text-zinc-500 border-zinc-800'}`} style={on ? { borderColor: r.color, background: `${r.color}22` } : undefined}>
              {r.acr}
            </button>
          )
        })}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Évolution de l’écart au leader">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={L} x2={W - R} y1={T + f * (H - T - B)} y2={T + f * (H - T - B)} stroke="#18181b" />
            <text x={L - 6} y={T + f * (H - T - B) + 4} textAnchor="end" fontSize="11" fill="#71717a">{Math.round(f * maxGap)}s</text>
          </g>
        ))}
        {Array.from({ length: Math.floor(maxLap / 10) }, (_, i) => (i + 1) * 10).map((l) => <text key={l} x={x(l)} y={H - 8} textAnchor="middle" fontSize="11" fill="#71717a">T{l}</text>)}
        <line x1={x(cur)} x2={x(cur)} y1={T - 4} y2={H - B + 4} stroke="#ef4444" strokeOpacity=".5" />
        {sel.map((n) => {
          const a = series.gap.get(n) ?? []
          const pts: string[] = []
          for (let i = 0; i < cur; i++) if (a[i] != null) pts.push(`${x(i + 1).toFixed(1)},${y(a[i] as number).toFixed(1)}`)
          const c = cm.get(n)
          return pts.length ? <polyline key={n} points={pts.join(' ')} fill="none" stroke={c?.color} strokeWidth={n === selected ? 4 : 2.2} strokeDasharray={c?.dash ? '6 4' : undefined} strokeLinejoin="round" /> : null
        })}
      </svg>
      <p className="px-2 text-[11px] text-zinc-500">Écart au leader à chaque tour (secondes). Les pilotes à un tour ou plus ne sont pas tracés. Un tracé qui descend = le pilote perd du temps.</p>
    </div>
  )
}

/** Stratégie pneus : relais par pilote. */
export function StrategyChart({ store, snap, lap, selected, onSelect }: { store: Store; snap: Snapshot; lap: number; selected: number | null; onSelect: (n: number) => void }) {
  const total = Math.max(snap.totalLaps ?? 0, ...store.stints.map((s) => s.to ?? s.from), lap, 10)
  const L = 46, R = 10, rowH = 22, T = 8, B = 22
  const H = T + B + rowH * snap.rows.length
  const x = (l: number) => L + (l / total) * (W - L - R)
  if (!store.stints.length) return <Empty>Aucune donnée de pneus pour cette session.</Empty>
  return (
    <div className="p-2 sm:p-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Stratégie pneus par pilote">
        {Array.from({ length: Math.floor(total / 10) }, (_, i) => (i + 1) * 10).map((l) => (
          <g key={l}><line x1={x(l)} x2={x(l)} y1={T} y2={H - B} stroke="#18181b" /><text x={x(l)} y={H - 8} textAnchor="middle" fontSize="11" fill="#71717a">T{l}</text></g>
        ))}
        {snap.rows.map((r, i) => {
          const y = T + i * rowH
          const st = store.stints.filter((s) => s.n === r.n)
          return (
            <g key={r.n} opacity={selected == null || selected === r.n ? 1 : 0.55} onClick={() => onSelect(r.n)} style={{ cursor: 'pointer' }}>
              <rect x={0} y={y} width={W} height={rowH} fill="transparent" />
              <text x={L - 8} y={y + rowH / 2 + 4} textAnchor="end" fontSize="12" fontWeight="800" fill={r.color}>{r.acr}</text>
              {st.map((s) => {
                const from = Math.max(0, s.from - 1)
                const endLap = Math.min(s.to ?? lap, lap)
                const to = Math.max(from, Math.min(endLap, lap))
                if (to <= from) return null
                const k = compound(s.compound)
                const w = x(to) - x(from)
                return (
                  <g key={s.stint}>
                    <rect x={x(from) + 0.5} y={y + 3} width={Math.max(1, w - 1.5)} height={rowH - 6} rx={3} fill={k.color} fillOpacity={0.9} />
                    {w > 34 && <text x={x(from) + w / 2} y={y + rowH / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#000">{k.letter} · {to - from}</text>}
                  </g>
                )
              })}
            </g>
          )
        })}
        <line x1={x(lap)} x2={x(lap)} y1={T - 2} y2={H - B + 2} stroke="#ef4444" strokeWidth="1.5" />
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-400">
        {['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'].map((c) => <span key={c} className="inline-flex items-center gap-1.5"><TyreDot c={c} size={14} />{compound(c).label}</span>)}
      </div>
    </div>
  )
}

/** Arrêts aux stands avec durées. */
export function PitList({ store, t }: { store: Store; t: number }) {
  const rows = store.pits.filter((p) => p.t <= t)
  const best = Math.min(...rows.map((p) => p.stop ?? Infinity))
  if (!rows.length) return <Empty>Aucun arrêt aux stands pour l’instant.</Empty>
  return (
    <div>
      <div className="flex items-center h-8 px-3 text-[10px] uppercase tracking-[0.15em] text-zinc-500 border-y border-zinc-800 bg-black/60">
        <span className="w-12">Tour</span><span className="flex-1">Pilote</span><span className="w-20 text-right">Arrêt</span><span className="w-20 text-right">Voie des stands</span>
      </div>
      <ul className="max-h-80 overflow-y-auto">
        {rows.slice().reverse().map((p, i) => {
          const d = store.driverByNum.get(p.n)
          return (
            <li key={i} className="flex items-center min-h-10 px-3 text-sm border-b border-zinc-900 tabular-nums">
              <span className="w-12 text-zinc-400">T{p.lap ?? '?'}</span>
              <span className="flex-1 font-bold uppercase" style={{ color: d ? `#${d.team_colour}` : undefined }}>{d?.name_acronym ?? p.n}</span>
              <span className={`w-20 text-right font-semibold ${p.stop != null && p.stop === best ? 'text-fuchsia-400' : ''}`}>{p.stop != null ? `${fmtSec(p.stop).slice(0, 4)} s` : '—'}</span>
              <span className="w-20 text-right text-zinc-400">{p.lane != null ? `${p.lane.toFixed(1)} s` : '—'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
