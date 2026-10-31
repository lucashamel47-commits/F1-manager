import type { Snapshot } from '../model'
import { fmtLap, fmtSec, fmtGap } from '../model'
import { Empty } from './common'

/** Meilleurs tours, meilleurs secteurs, tour idéal et vitesses de pointe. */
export default function Chrono({ snap, selected, onSelect }: { snap: Snapshot; selected: number | null; onSelect: (n: number) => void }) {
  const rows = snap.rows.filter((r) => r.best != null).sort((a, b) => (a.best as number) - (b.best as number))
  if (!rows.length) return <Empty>Les meilleurs tours apparaîtront dès les premiers tours chronométrés.</Empty>
  const lead = rows[0].best as number
  const maxTrap = Math.max(...snap.rows.map((r) => r.speedTrap ?? 0))
  const maxI1 = Math.max(...snap.rows.map((r) => r.i1 ?? 0))
  const maxI2 = Math.max(...snap.rows.map((r) => r.i2 ?? 0))
  const ideal = (r: (typeof rows)[number]) => (r.pbSec.length === 3 && r.pbSec.every((v) => v != null) ? (r.pbSec as number[]).reduce((a, b) => a + b, 0) : null)
  const spd = (v: number | null, max: number) => (
    <span className={v != null && v === max ? 'text-fuchsia-400 font-semibold' : 'text-zinc-300'}>{v ?? '—'}</span>
  )
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="flex items-center h-9 px-3 text-[10px] uppercase tracking-[0.15em] text-zinc-500 border-b border-zinc-800 bg-black/60">
          <span className="w-8">P</span><span className="w-14">Pilote</span><span className="w-20 text-right">Meilleur tour</span><span className="w-16 text-right">Écart</span>
          <span className="w-16 text-right">S1</span><span className="w-16 text-right">S2</span><span className="w-16 text-right">S3</span><span className="w-20 text-right">Tour idéal</span>
          <span className="w-12 text-right">I1</span><span className="w-12 text-right">I2</span><span className="w-14 text-right">Pointe</span>
        </div>
        <ol>
          {rows.map((r, i) => {
            const sb = snap.secBest
            const sc = (k: number) => (r.pbSec[k] != null && sb[k] != null && (r.pbSec[k] as number) <= (sb[k] as number) + 1e-9 ? 'text-fuchsia-400 font-semibold' : 'text-zinc-300')
            return (
              <li key={r.n}>
                <button onClick={() => onSelect(r.n)} className={`w-full flex items-center min-h-10 px-3 text-sm text-left border-b border-zinc-900 tabular-nums ${selected === r.n ? 'bg-zinc-900' : 'active:bg-zinc-900'}`}>
                  <span className="w-8 text-zinc-400">{i + 1}</span>
                  <span className="w-14 font-black uppercase" style={{ color: r.color }}>{r.acr}</span>
                  <span className={`w-20 text-right ${i === 0 ? 'text-fuchsia-400 font-semibold' : ''}`}>{fmtLap(r.best)}</span>
                  <span className="w-16 text-right text-zinc-400">{i === 0 ? '—' : fmtGap((r.best as number) - lead)}</span>
                  <span className={`w-16 text-right ${sc(0)}`}>{fmtSec(r.pbSec[0])}</span>
                  <span className={`w-16 text-right ${sc(1)}`}>{fmtSec(r.pbSec[1])}</span>
                  <span className={`w-16 text-right ${sc(2)}`}>{fmtSec(r.pbSec[2])}</span>
                  <span className="w-20 text-right text-zinc-300">{fmtLap(ideal(r))}</span>
                  <span className="w-12 text-right">{spd(r.i1, maxI1)}</span>
                  <span className="w-12 text-right">{spd(r.i2, maxI2)}</span>
                  <span className="w-14 text-right">{spd(r.speedTrap, maxTrap)}</span>
                </button>
              </li>
            )
          })}
        </ol>
        <p className="px-3 py-2 text-[11px] text-zinc-500">Violet = meilleur de la session. I1 / I2 = vitesse aux points intermédiaires, Pointe = vitesse au piège à vitesse (km/h).</p>
      </div>
    </div>
  )
}
