import { useMemo } from 'react'
import type { Store, Snapshot, Weather } from '../model'
import { fmtClock, fmtElapsed } from '../model'
import { FlagIcon, Empty } from './common'
import { frMsg } from './fr'

export function RaceControlFeed({ snap }: { snap: Snapshot }) {
  if (!snap.feed.length) return <Empty>Aucun message de la direction de course pour l’instant.</Empty>
  return (
    <ul>
      {snap.feed.map((r, i) => (
        <li key={r.t + ':' + i} className="flex items-start gap-3 px-3 py-2.5 border-b border-zinc-900">
          <span className="pt-0.5 w-9 flex justify-center"><FlagIcon flag={r.flag} cat={r.cat} msg={r.msg} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-100 leading-snug" title={r.msg}>{frMsg(r.msg)}</p>
            <p className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">{fmtClock(r.t)}{r.lap ? ` · Tour ${r.lap}` : ''}{r.scope && r.scope !== 'Track' ? ` · ${r.scope === 'Driver' ? 'Pilote' : r.scope === 'Sector' ? 'Secteur' : r.scope}` : ''}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function OvertakesFeed({ store, snap }: { store: Store; snap: Snapshot }) {
  if (!snap.overtakes.length) return <Empty>Aucun dépassement enregistré pour l’instant (données disponibles en course uniquement).</Empty>
  const c = (n: number) => { const d = store.driverByNum.get(n); return { a: d?.name_acronym ?? String(n), col: d ? `#${d.team_colour}` : '#a1a1aa' } }
  return (
    <ul>
      {snap.overtakes.map((o, i) => {
        const a = c(o.by), b = c(o.over)
        return (
          <li key={o.t + ':' + i} className="flex items-center gap-2 px-3 min-h-11 border-b border-zinc-900 text-sm">
            <span className="font-black uppercase" style={{ color: a.col }}>{a.a}</span>
            <span className="text-zinc-500">dépasse</span>
            <span className="font-black uppercase" style={{ color: b.col }}>{b.a}</span>
            <span className="ml-auto text-xs text-zinc-400 tabular-nums">P{o.pos} · {fmtElapsed(o.t, store.t0)}</span>
          </li>
        )
      })}
    </ul>
  )
}

export function RadioFeed({ store, snap }: { store: Store; snap: Snapshot }) {
  if (!snap.radio.length) {
    return <Empty>Aucune radio disponible. La F1 ne publie pas les radios de toutes les sessions (couverture réduite en 2026).</Empty>
  }
  return (
    <ul>
      {snap.radio.map((r, i) => {
        const d = store.driverByNum.get(r.n)
        return (
          <li key={r.t + ':' + i} className="px-3 py-2.5 border-b border-zinc-900">
            <div className="flex items-center justify-between text-sm">
              <span className="font-black uppercase" style={{ color: d ? `#${d.team_colour}` : undefined }}>{d?.name_acronym ?? r.n} <span className="text-zinc-500 font-normal normal-case">{d?.last_name}</span></span>
              <span className="text-[11px] text-zinc-500 tabular-nums">{fmtClock(r.t)}</span>
            </div>
            <audio className="mt-1.5 w-full h-9" controls preload="none" src={r.url} />
          </li>
        )
      })}
    </ul>
  )
}

function Spark({ pts, color }: { pts: number[]; color: string }) {
  if (pts.length < 2) return null
  const min = Math.min(...pts), max = Math.max(...pts), span = max - min || 1
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${((i / (pts.length - 1)) * 100).toFixed(1)} ${(28 - ((v - min) / span) * 24).toFixed(1)}`).join('')
  return <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-8"><path d={d} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" /></svg>
}

export function WeatherPanel({ store, w, t }: { store: Store; w: Weather | null; t: number }) {
  const hist = useMemo(() => store.weather.filter((x) => x.t <= t), [store.weather, t])
  if (!w) return <Empty>Pas de données météo pour cette session.</Empty>
  const cells: { k: string; v: string; sub?: string; spark?: number[]; color?: string }[] = [
    { k: 'Air', v: `${w.air.toFixed(1)} °C`, spark: hist.map((x) => x.air), color: '#38bdf8' },
    { k: 'Piste', v: `${w.track.toFixed(1)} °C`, spark: hist.map((x) => x.track), color: '#fb923c' },
    { k: 'Humidité', v: `${Math.round(w.hum)} %`, spark: hist.map((x) => x.hum), color: '#a78bfa' },
    { k: 'Pression', v: `${w.press.toFixed(0)} mbar` },
    { k: 'Vent', v: `${(w.wind * 3.6).toFixed(0)} km/h`, sub: `${Math.round(w.dir)}°` },
    { k: 'Pluie', v: w.rain ? 'Oui' : 'Non', color: w.rain ? '#38bdf8' : undefined },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-px bg-zinc-800">
      {cells.map((c) => (
        <div key={c.k} className="bg-zinc-950 p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{c.k}</p>
          <p className="mt-1 text-xl font-black tabular-nums flex items-center gap-2" style={{ color: c.k === 'Pluie' ? c.color : undefined }}>
            {c.v}
            {c.k === 'Vent' && (
              <svg viewBox="0 0 24 24" className="size-5 text-zinc-300" style={{ transform: `rotate(${w.dir + 180}deg)` }} fill="currentColor" aria-label={`Vent à ${Math.round(w.dir)}°`}><path d="M12 2l5 16-5-3-5 3z" /></svg>
            )}
          </p>
          {c.sub && <p className="text-[11px] text-zinc-500">{c.sub}</p>}
          {c.spark && <Spark pts={c.spark} color={c.color ?? '#a1a1aa'} />}
        </div>
      ))}
    </div>
  )
}
