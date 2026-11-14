import { useState } from 'react'
import type { Row, Snapshot } from '../model'
import { fmtLap, fmtSec, fmtGap } from '../model'
import { Empty } from './common'

type View = 'speed' | 'laps'
type SpeedKey = 'speedTrap' | 'i1' | 'i2'
const SPEEDS: { key: SpeedKey; label: string; short: string }[] = [
  { key: 'speedTrap', label: 'Vitesse de pointe', short: 'Pointe' },
  { key: 'i1', label: 'Intermédiaire 1', short: 'I1' },
  { key: 'i2', label: 'Intermédiaire 2', short: 'I2' },
]

function Toggle<T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: { key: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] p-0.5">
      {items.map((it) => (
        <button key={it.key} role="radio" aria-checked={value === it.key} onClick={() => onChange(it.key)} className={`min-h-9 rounded-full px-4 text-[13px] font-medium transition ${value === it.key ? 'bg-white text-[#0a0a0a]' : 'text-[#939494] hover:text-white'}`}>
          {it.label}
        </button>
      ))}
    </div>
  )
}

const nice = (n: string) => n.split(' ').map((w) => (w.length > 1 && w === w.toUpperCase() ? w[0] + w.slice(1).toLowerCase() : w)).join(' ')

/** Pilote : pastille couleur écurie + code, nom complet si la place le permet. */
function Who({ r }: { r: Row }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="h-5 w-[3px] shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
      <span className="text-[15px] font-semibold tracking-tight">{r.acr}</span>
      <span className="hidden truncate text-[13px] text-[#636464] md:inline">{nice(r.name)}</span>
    </span>
  )
}

/** Vitesses (pointe et intermédiaires) puis meilleurs tours : lisible d'un coup d'œil, sur iPad comme sur PC. */
export default function Chrono({ snap, selected, onSelect }: { snap: Snapshot; selected: number | null; onSelect: (n: number) => void }) {
  const [view, setView] = useState<View>('speed')
  const [metric, setMetric] = useState<SpeedKey>('speedTrap')

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-4 pt-1 sm:px-5">
      <Toggle label="Affichage" value={view} onChange={setView} items={[{ key: 'speed', label: 'Vitesses' }, { key: 'laps', label: 'Meilleurs tours' }]} />
      {view === 'speed' && <Toggle label="Point de mesure" value={metric} onChange={setMetric} items={SPEEDS.map((s) => ({ key: s.key, label: s.short }))} />}
    </div>
  )

  if (view === 'speed') {
    const withSpeed = snap.rows.filter((r) => r[metric] != null)
    if (!withSpeed.length) return <div>{header}<Empty>Les vitesses apparaîtront dès le premier passage aux points de mesure.</Empty></div>
    const sorted = [...withSpeed].sort((a, b) => (b[metric] as number) - (a[metric] as number))
    const top = sorted[0][metric] as number
    const low = sorted[sorted.length - 1][metric] as number
    const floor = Math.max(0, low - 8)
    const best = SPEEDS.map((s) => {
      const r = [...snap.rows].filter((x) => x[s.key] != null).sort((a, b) => (b[s.key] as number) - (a[s.key] as number))[0]
      return { ...s, r, v: r ? (r[s.key] as number) : null }
    })
    return (
      <div>
        {header}
        <div className="grid grid-cols-3 gap-px border-y border-white/[0.06] bg-white/[0.06]">
          {best.map((b) => (
            <button key={b.key} onClick={() => setMetric(b.key)} aria-pressed={metric === b.key} className={`px-4 py-4 text-left transition sm:px-5 ${metric === b.key ? 'bg-[#141516]' : 'bg-[#0c0d0e] hover:bg-[#111213]'}`}>
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#636464]">{b.label}</p>
              <p className="mt-2 flex items-baseline gap-1 tabular-nums"><span className="text-[1.75rem] font-semibold leading-none tracking-[-0.03em]">{b.v ?? '—'}</span><span className="text-xs text-[#636464]">km/h</span></p>
              <p className="mt-1.5 text-xs text-[#939494]">{b.r ? b.r.acr : '—'}</p>
            </button>
          ))}
        </div>
        <ol className="divide-y divide-white/[0.05]">
          {sorted.map((r, i) => {
            const v = r[metric] as number
            const pct = top > floor ? ((v - floor) / (top - floor)) * 100 : 100
            return (
              <li key={r.n}>
                <button onClick={() => onSelect(r.n)} aria-pressed={selected === r.n} className={`grid min-h-12 w-full grid-cols-[1.75rem_minmax(4.5rem,11rem)_minmax(0,1fr)_4.5rem] items-center gap-3 px-4 text-left tabular-nums transition sm:px-5 ${selected === r.n ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}>
                  <span className="text-[13px] text-[#636464]">{i + 1}</span>
                  <Who r={r} />
                  <span className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(4, pct)}%`, backgroundColor: i === 0 ? '#fff' : 'rgb(255 255 255 / 0.45)' }} /></span>
                  <span className="text-right"><span className={`text-[15px] ${i === 0 ? 'font-semibold' : ''}`}>{v}</span><span className="ml-1 text-[11px] text-[#636464]">km/h</span></span>
                </button>
              </li>
            )
          })}
        </ol>
        <p className="px-4 py-3 text-xs text-[#636464] sm:px-5">Vitesses mesurées par le chronométrage officiel au piège à vitesse et aux deux intermédiaires, meilleure valeur de chaque pilote sur la session. Écart du graphique : {floor} → {top} km/h.</p>
      </div>
    )
  }

  const rows = snap.rows.filter((r) => r.best != null).sort((a, b) => (a.best as number) - (b.best as number))
  if (!rows.length) return <div>{header}<Empty>Les meilleurs tours apparaîtront dès les premiers tours chronométrés.</Empty></div>
  const lead = rows[0].best as number
  const sb = snap.secBest
  const ideal = (r: Row) => (r.pbSec.length === 3 && r.pbSec.every((v) => v != null) ? (r.pbSec as number[]).reduce((a, b) => a + b, 0) : null)
  const isBest = (r: Row, k: number) => r.pbSec[k] != null && sb[k] != null && (r.pbSec[k] as number) <= (sb[k] as number) + 1e-9
  const cols = 'grid-cols-[1.75rem_minmax(4rem,1fr)_5.5rem_4.5rem] sm:grid-cols-[1.75rem_minmax(4rem,1fr)_5.5rem_4.5rem_4rem_4rem_4rem]'
  return (
    <div>
      {header}
      <div className={`grid ${cols} items-center gap-3 border-y border-white/[0.06] px-4 py-2.5 text-[11px] uppercase tracking-[0.14em] text-[#636464] sm:px-5`}>
        <span>P</span><span>Pilote</span><span className="text-right">Meilleur</span><span className="text-right">Écart</span>
        <span className="hidden text-right sm:block">S1</span><span className="hidden text-right sm:block">S2</span><span className="hidden text-right sm:block">S3</span>
      </div>
      <ol className="divide-y divide-white/[0.05]">
        {rows.map((r, i) => (
          <li key={r.n}>
            <button onClick={() => onSelect(r.n)} aria-pressed={selected === r.n} className={`grid ${cols} min-h-12 w-full items-center gap-3 px-4 text-left tabular-nums transition sm:px-5 ${selected === r.n ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}>
              <span className="text-[13px] text-[#636464]">{i + 1}</span>
              <Who r={r} />
              <span className={`text-right text-[15px] ${i === 0 ? 'font-semibold' : ''}`}>{fmtLap(r.best)}</span>
              <span className="text-right text-[13px] text-[#939494]">{i === 0 ? '—' : fmtGap((r.best as number) - lead)}</span>
              {[0, 1, 2].map((k) => (
                <span key={k} className={`hidden text-right text-[13px] sm:block ${isBest(r, k) ? 'font-semibold text-white' : 'text-[#939494]'}`}>
                  {isBest(r, k) && <span className="mr-1 inline-block size-1.5 -translate-y-px rounded-full bg-white align-middle" aria-label="meilleur secteur" />}{fmtSec(r.pbSec[k])}
                </span>
              ))}
            </button>
          </li>
        ))}
      </ol>
      <p className="px-4 py-3 text-xs text-[#636464] sm:px-5">Point blanc = meilleur secteur de la session. Tour idéal du plus rapide : {fmtLap(ideal(rows[0]))}.</p>
    </div>
  )
}
