import { useMemo } from 'react'
import type { CarDataStore } from '../data'
import type { Store, Snapshot } from '../model'
import { fmtLap, fmtSec } from '../model'
import { OpenF1Error } from '../openf1'
import { TyreDot } from './common'
import { compound, stateClass, stateBar } from './style'

const drsState = (v: number) => (v >= 10 ? 'on' : v === 8 ? 'ready' : 'off')

function Trace({ samples, t }: { samples: { t: number; speed: number; thr: number; brk: number }[]; t: number }) {
  if (samples.length < 3) return null
  const t0 = t - 30_000
  const X = (ts: number) => ((ts - t0) / 30_000) * 300
  const sp = samples.map((s, i) => `${i ? 'L' : 'M'}${X(s.t).toFixed(1)} ${(60 - (s.speed / 360) * 56).toFixed(1)}`).join('')
  const th = samples.map((s, i) => `${i ? 'L' : 'M'}${X(s.t).toFixed(1)} ${(100 - (s.thr / 100) * 32).toFixed(1)}`).join('')
  const brakes: { x1: number; x2: number }[] = []
  let x1: number | null = null
  let x2 = 0
  for (const s of samples) {
    if (s.brk > 0) { if (x1 == null) x1 = X(s.t); x2 = X(s.t) } else if (x1 != null) { brakes.push({ x1, x2 }); x1 = null }
  }
  if (x1 != null) brakes.push({ x1, x2 })
  return (
    <svg viewBox="0 0 300 104" className="w-full h-24" role="img" aria-label="Télémétrie des 30 dernières secondes">
      <rect width="300" height="104" fill="#09090b" />
      {brakes.map((b, i) => <rect key={i} x={b.x1} y={0} width={Math.max(1, b.x2 - b.x1)} height="104" fill="#ef4444" fillOpacity=".25" />)}
      <path d={sp} fill="none" stroke="#e4e4e7" strokeWidth="1.4" />
      <path d={th} fill="none" stroke="#22c55e" strokeWidth="1.2" />
    </svg>
  )
}

export default function DriverPanel({ store, snap, car, n, t, onClose, issue }: { store: Store; snap: Snapshot; car: CarDataStore | null; n: number; t: number; onClose: () => void; issue: OpenF1Error | null }) {
  const d = store.driverByNum.get(n)
  const r = snap.rows.find((x) => x.n === n)
  const laps = useMemo(() => (store.laps.get(n) ?? []).filter((l) => l.dur != null && l.start + (l.dur as number) * 1000 <= t).slice(-8).reverse(), [store, n, t])
  const stints = store.stints.filter((s) => s.n === n && s.from <= Math.max(1, r?.lapNo ?? 1))
  const pits = store.pits.filter((p) => p.n === n && p.t <= t)
  const gained = store.overtakes.filter((o) => o.t <= t)
  const plus = gained.filter((o) => o.by === n).length
  const minus = gained.filter((o) => o.over === n).length
  const win = car?.window(n, t - 30_000, t) ?? []
  const idx = win.length ? win.length - 1 : -1
  const cur = idx >= 0 ? win[idx] : null
  const stale = cur ? t - cur.t > 6000 : true
  const color = r?.color ?? '#a1a1aa'
  const bestLap = r?.best
  if (!d || !r) return null
  return (
    <div>
      <div className="flex items-center gap-3 p-3 border-b border-zinc-800" style={{ boxShadow: `inset 4px 0 0 ${color}` }}>
        {d.headshot_url ? <img src={d.headshot_url} alt="" loading="lazy" className="size-14 rounded-full bg-zinc-900 object-cover object-top shrink-0" /> : <span className="size-14 rounded-full bg-zinc-900 shrink-0" />}
        <div className="min-w-0 flex-1">
          <p className="font-black uppercase tracking-tight text-lg leading-tight truncate">{d.first_name} <span style={{ color }}>{d.last_name}</span></p>
          <p className="text-xs text-zinc-400 truncate">#{d.driver_number} · {d.team_name}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black leading-none tabular-nums">P{r.pos}</p>
          <p className="text-[11px] text-zinc-500 mt-1">{snap.timingMode === 'race' ? (r.gap === 'Leader' ? 'Leader' : r.gap) : r.gap}</p>
        </div>
        <button onClick={onClose} aria-label="Fermer la fiche pilote" className="min-h-11 min-w-11 flex items-center justify-center text-zinc-400 active:text-white text-xl">✕</button>
      </div>

      <div className="grid grid-cols-3 gap-px bg-zinc-800 text-center">
        {[
          { k: 'Dernier tour', v: fmtLap(r.last), cls: stateClass(r.lastState) },
          { k: 'Meilleur tour', v: fmtLap(bestLap), cls: r.bestOverall ? 'text-fuchsia-400' : '' },
          { k: 'Pointe', v: r.speedTrap ? `${r.speedTrap} km/h` : '—', cls: '' },
        ].map((c) => (
          <div key={c.k} className="bg-zinc-950 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">{c.k}</p>
            <p className={`mt-0.5 text-base font-bold tabular-nums ${c.cls}`}>{c.v}</p>
          </div>
        ))}
      </div>

      <div className="px-3 pt-3">
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Télémétrie</h4>
          {cur && !stale && <span className="text-[10px] text-emerald-400 uppercase tracking-wider">● en direct</span>}
        </div>
        {cur ? (
          <div className={stale ? 'opacity-50' : ''}>
            <div className="flex items-end gap-4">
              <p className="text-5xl font-black tabular-nums leading-none">{cur.speed}<span className="text-sm text-zinc-500 font-bold ml-1">km/h</span></p>
              <p className="text-3xl font-black text-zinc-300 leading-none tabular-nums" aria-label="Rapport">{cur.gear === 0 ? 'N' : cur.gear}</p>
              <span className={`ml-auto text-xs font-black px-2 py-1 rounded-sm ${drsState(cur.drs) === 'on' ? 'bg-emerald-500 text-black' : drsState(cur.drs) === 'ready' ? 'bg-emerald-900 text-emerald-300' : 'bg-zinc-900 text-zinc-500'}`}>DRS</span>
            </div>
            <div className="mt-3 grid gap-2 text-[10px] uppercase tracking-wider text-zinc-500">
              {[
                { k: 'Accélérateur', v: cur.thr, max: 100, cls: 'bg-emerald-500', txt: `${cur.thr} %` },
                { k: 'Frein', v: cur.brk > 0 ? 100 : 0, max: 100, cls: 'bg-red-500', txt: cur.brk > 0 ? 'ON' : '—' },
                { k: 'Régime', v: cur.rpm, max: 13000, cls: 'bg-sky-500', txt: `${cur.rpm}` },
              ].map((b) => (
                <div key={b.k} className="flex items-center gap-2">
                  <span className="w-24 shrink-0">{b.k}</span>
                  <span className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden"><span className={`block h-full ${b.cls}`} style={{ width: `${Math.min(100, (b.v / b.max) * 100)}%` }} /></span>
                  <span className="w-12 text-right text-zinc-300 tabular-nums">{b.txt}</span>
                </div>
              ))}
            </div>
            <div className="mt-3"><Trace samples={win} t={t} /></div>
            <p className="mt-1 text-[10px] text-zinc-500">Vitesse (blanc), accélérateur (vert), freinage (zones rouges) sur 30 s.</p>
          </div>
        ) : (
          <p className="text-sm text-zinc-500 py-4">
            {issue?.kind === 'auth' ? 'La télémétrie en direct nécessite un abonnement OpenF1.' : 'Chargement de la télémétrie…'}
          </p>
        )}
      </div>

      <div className="px-3 pt-4">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">Secteurs du tour en cours</h4>
        <div className="grid grid-cols-3 gap-2">
          {r.sectors.map((s, i) => (
            <div key={i}>
              <p className={`text-sm font-semibold tabular-nums ${stateClass(s.state, 'text-zinc-600')}`}>{fmtSec(s.v)}</p>
              <span className={`mt-1 block h-1 rounded-full ${stateBar(s.state)}`} />
              <p className="mt-1 text-[10px] text-zinc-500">S{i + 1}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-3 pt-4">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">Derniers tours</h4>
        {laps.length ? (
          <ul className="text-sm tabular-nums">
            {laps.map((l) => (
              <li key={l.lap} className="flex items-center gap-3 min-h-8 border-b border-zinc-900">
                <span className="w-10 text-zinc-500">T{l.lap}</span>
                <span className={`w-20 font-semibold ${bestLap != null && l.dur === bestLap ? 'text-emerald-400' : ''}`}>{fmtLap(l.dur)}</span>
                <span className="flex-1 flex gap-3 text-xs text-zinc-400 justify-end">{[l.s1, l.s2, l.s3].map((v, i) => <span key={i} className="w-12 text-right">{fmtSec(v)}</span>)}</span>
                {l.pitOut && <span className="text-[9px] font-bold bg-sky-700 px-1 rounded-sm">OUT</span>}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-zinc-500">Aucun tour chronométré.</p>}
      </div>

      <div className="px-3 py-4">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">Stratégie & stands</h4>
        <div className="flex flex-wrap items-center gap-2">
          {stints.map((s) => (
            <span key={s.stint} className="inline-flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-900 px-2 py-1">
              <TyreDot c={s.compound} size={16} />{compound(s.compound).label} · T{s.from}
              {s.to != null ? `–${Math.min(s.to, r.lapNo || s.to)}` : '→'}
            </span>
          ))}
          {!stints.length && <span className="text-sm text-zinc-500">Aucune donnée de pneus.</span>}
        </div>
        {pits.length > 0 && (
          <ul className="mt-2 text-sm tabular-nums">
            {pits.map((p, i) => <li key={i} className="flex justify-between min-h-8 border-b border-zinc-900"><span className="text-zinc-400">Arrêt {i + 1} · T{p.lap ?? '?'}</span><span className="font-semibold">{p.stop != null ? `${p.stop.toFixed(1)} s` : '—'} <span className="text-zinc-500 font-normal">({p.lane != null ? p.lane.toFixed(1) : '—'} s dans la voie)</span></span></li>)}
          </ul>
        )}
        {(plus > 0 || minus > 0) && <p className="mt-3 text-xs text-zinc-400">Dépassements : <span className="text-emerald-400 font-semibold">{plus} réalisés</span> · <span className="text-red-400 font-semibold">{minus} subis</span></p>}
      </div>
    </div>
  )
}
