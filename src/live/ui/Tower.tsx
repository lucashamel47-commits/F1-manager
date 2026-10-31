import type { Row, Snapshot } from '../model'
import { fmtLap, fmtSec } from '../model'
import { TyreDot, Empty } from './common'
import { stateClass, stateBar } from './style'

function RowView({ r, sel, onSelect, mode }: { r: Row; sel: boolean; onSelect: (n: number) => void; mode: 'race' | 'best' }) {
  return (
    <li>
      <button
        onClick={() => onSelect(r.n)}
        aria-pressed={sel}
        className={`w-full flex items-center min-h-11 pr-2 sm:pr-3 text-left border-b border-zinc-900 tabular-nums ${sel ? 'bg-zinc-900' : 'active:bg-zinc-900 hover:bg-zinc-950'} ${r.out ? 'opacity-40' : ''}`}
      >
        <span className="w-8 sm:w-10 text-center text-sm font-bold text-zinc-300">{r.pos}</span>
        <span className="w-1 self-stretch my-1" style={{ background: r.color }} aria-hidden />
        <span className="w-16 sm:w-20 pl-2 sm:pl-3 font-black uppercase tracking-tight text-sm sm:text-base">
          {r.acr}
          {r.inPit && <span className="ml-1 align-middle text-[9px] font-bold bg-sky-600 text-white px-1 rounded-sm">PIT</span>}
        </span>
        <span className="flex-1 min-w-0 flex items-center justify-end gap-x-2 sm:gap-x-3 text-right text-xs sm:text-sm">
          <span className="w-[4.2rem] sm:w-20 text-zinc-100 font-semibold">{r.gap}</span>
          <span className="w-[4.2rem] sm:w-20 text-zinc-400">{r.int}</span>
          <span className={`w-[4.2rem] sm:w-20 font-semibold ${stateClass(r.lastState)}`}>{fmtLap(r.last)}</span>
          <span className={`hidden md:block w-20 ${r.bestOverall ? 'text-fuchsia-400 font-semibold' : 'text-zinc-300'}`}>{fmtLap(r.best)}</span>
          <span className="hidden lg:flex gap-1.5 w-[8.6rem] justify-end" aria-label="Secteurs">
            {r.sectors.map((s, i) => (
              <span key={i} className="w-11 text-left">
                <span className={`block text-[11px] leading-none ${stateClass(s.state, 'text-zinc-600')}`}>{fmtSec(s.v)}</span>
                <span className={`mt-1 block h-[3px] rounded-full ${stateBar(s.state)}`} />
              </span>
            ))}
          </span>
          <span className="w-12 shrink-0 flex items-center justify-end gap-1">
            {r.tyre ? <TyreDot c={r.tyre.compound} size={17} /> : <span className="text-zinc-700">—</span>}
            {r.tyre && <span className="text-[11px] text-zinc-400 w-5 text-left">{r.tyre.age}</span>}
          </span>
          <span className="hidden sm:block w-6 text-zinc-400 text-center" title="Arrêts aux stands">{mode === 'race' || r.pits ? r.pits : ''}</span>
        </span>
      </button>
    </li>
  )
}

export default function Tower({ snap, selected, onSelect }: { snap: Snapshot; selected: number | null; onSelect: (n: number) => void }) {
  const mode = snap.timingMode
  if (!snap.rows.length) return <Empty>En attente des pilotes…</Empty>
  return (
    <div>
      <div className="flex items-center h-9 pr-2 sm:pr-3 text-[10px] uppercase tracking-[0.15em] text-zinc-500 border-b border-zinc-800 bg-black/60">
        <span className="w-8 sm:w-10 text-center">P</span>
        <span className="w-1" />
        <span className="w-16 sm:w-20 pl-2 sm:pl-3">Pilote</span>
        <span className="flex-1 min-w-0 flex items-center justify-end gap-x-2 sm:gap-x-3 text-right">
          <span className="w-[4.2rem] sm:w-20">{mode === 'race' ? 'Écart' : 'Écart'}</span>
          <span className="w-[4.2rem] sm:w-20">{mode === 'race' ? 'Interv.' : 'Précéd.'}</span>
          <span className="w-[4.2rem] sm:w-20">Dernier</span>
          <span className="hidden md:block w-20">Meilleur</span>
          <span className="hidden lg:flex gap-1.5 w-[8.6rem]"><span className="w-11 text-left">S1</span><span className="w-11 text-left">S2</span><span className="w-11 text-left">S3</span></span>
          <span className="w-12 shrink-0">Pneus</span>
          <span className="hidden sm:block w-6 text-center" title="Arrêts aux stands">Arr.</span>
        </span>
      </div>
      <ol>{snap.rows.map((r) => <RowView key={r.n} r={r} sel={selected === r.n} onSelect={onSelect} mode={mode} />)}</ol>
      <p className="px-3 py-2 text-[11px] text-zinc-500 flex flex-wrap gap-x-4 gap-y-1">
        <span><i className="inline-block size-2 rounded-full bg-fuchsia-500 mr-1" />meilleur global</span>
        <span><i className="inline-block size-2 rounded-full bg-emerald-500 mr-1" />meilleur perso</span>
        <span><i className="inline-block size-2 rounded-full bg-yellow-400 mr-1" />plus lent</span>
        <span>Touchez un pilote pour sa fiche et sa télémétrie</span>
      </p>
    </div>
  )
}
