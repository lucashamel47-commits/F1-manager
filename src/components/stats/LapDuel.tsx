/* Duel au tour : deux pilotes, une session, tour par tour (temps, écart en piste, secteurs du meilleur tour). */
import { useMemo, useState } from 'react'
import type { OFDriver, OFLap, OFSession } from '../../live/openf1'
import { color, fmt, fmtDelta, loadSession, useMeetings, useSessionData, panel, useWidth, type Meeting, type SessionData } from './data'
import { PillSelect, SessionPicker, Skeleton, State } from './ui'
import { Num } from '../Num'

const KINDS = ['Race', 'Sprint', 'Qualifying', 'Sprint Qualifying']

interface Side { d: OFDriver; c: string; laps: Map<number, OFLap>; best: OFLap | null; sec: (number | null)[]; top: number | null }

function side(d: OFDriver, laps: OFLap[]): Side {
  const mine = laps.filter((l) => l.driver_number === d.driver_number)
  const map = new Map(mine.map((l) => [l.lap_number, l]))
  const timed = mine.filter((l) => l.lap_duration != null && !l.is_pit_out_lap)
  const best = timed.reduce<OFLap | null>((b, l) => (!b || l.lap_duration! < b.lap_duration! ? l : b), null)
  const minOf = (k: 'duration_sector_1' | 'duration_sector_2' | 'duration_sector_3') => {
    const v = mine.map((l) => l[k]).filter((x): x is number => x != null && x > 0)
    return v.length ? Math.min(...v) : null
  }
  const st = mine.map((l) => l.st_speed).filter((x): x is number => x != null)
  return { d, c: color(d), laps: map, best, sec: [minOf('duration_sector_1'), minOf('duration_sector_2'), minOf('duration_sector_3')], top: st.length ? Math.max(...st) : null }
}

export default function LapDuel() {
  const { meetings, error } = useMeetings(KINDS)
  const [pick, setPick] = useState<{ meeting: Meeting; session: OFSession } | null>(null)
  const first = meetings?.[0]
  const meeting = pick?.meeting ?? first ?? null
  const session = pick?.session ?? (first ? first.sessions.find((s) => s.session_name === 'Race') ?? first.sessions.at(-1)! : null)
  const setSession = (s: OFSession) => setPick({ meeting: meeting!, session: s })
  const pickMeeting = (m: Meeting) => { setPick({ meeting: m, session: m.sessions.find((s) => s.session_name === session?.session_name) ?? m.sessions.find((s) => s.session_name === 'Race') ?? m.sessions.at(-1)! }) }
  const { data, error: dErr, loading } = useSessionData(session, loadSession)

  if (error) return <State>Impossible de charger la saison. Vérifie ta connexion.</State>
  if (!meetings) return <Skeleton h="h-96" />
  if (!meetings.length) return <State>Aucune session terminée pour le moment.</State>
  return (
    <div className="grid gap-6">
      <SessionPicker meetings={meetings} meeting={meeting} session={session} onMeeting={pickMeeting} onSession={setSession} />
      {dErr ? <State>Données indisponibles pour cette session.</State> : loading || !data || !session ? <Skeleton h="h-[32rem]" /> : <Duel key={session.session_key} data={data} session={session} />}
    </div>
  )
}

function Duel({ data, session }: { data: SessionData; session: OFSession }) {
  const isRace = /^(Race|Sprint)$/.test(session.session_name)
  const ordered = useMemo(() => {
    const pos = new Map(data.results.map((r) => [r.driver_number, r.position ?? 99]))
    return data.drivers.slice().sort((a, b) => (pos.get(a.driver_number) ?? 99) - (pos.get(b.driver_number) ?? 99) || a.driver_number - b.driver_number)
  }, [data])
  const [a, setA] = useState(ordered[0]?.driver_number ?? 0)
  const [b, setB] = useState(ordered[1]?.driver_number ?? 0)
  const A = useMemo(() => { const d = ordered.find((x) => x.driver_number === a); return d ? side(d, data.laps) : null }, [a, ordered, data])
  const B = useMemo(() => { const d = ordered.find((x) => x.driver_number === b); return d ? side(d, data.laps) : null }, [b, ordered, data])
  if (!A || !B) return <State>Pas assez de pilotes dans cette session.</State>
  const sameColor = A.c.toLowerCase() === B.c.toLowerCase()
  const dBest = A.best?.lap_duration != null && B.best?.lap_duration != null ? B.best.lap_duration - A.best.lap_duration : null

  const picker = (val: number, set: (n: number) => void, other: number, c: string, label: string) => (
    <PillSelect label={label} value={val} dot={c} onChange={(v) => set(Number(v))}>
      {ordered.map((d) => <option key={d.driver_number} value={d.driver_number} disabled={d.driver_number === other}>{d.name_acronym} · {d.last_name}</option>)}
    </PillSelect>
  )

  return (
    <>
      <div className="flex flex-wrap items-center gap-3" data-duel="pickers">
        {picker(a, setA, b, A.c, 'Pilote 1')}
        <span className="text-[13px] text-[#636464]">vs</span>
        {picker(b, setB, a, B.c, 'Pilote 2')}
      </div>

      {/* meilleurs tours + secteurs */}
      <section className={`${panel} p-6 sm:p-9`} aria-label="Meilleurs tours">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
          <Best s={A} />
          <div className="pb-1 text-center">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#636464]">Écart</p>
            <p className="mt-2 text-[15px] font-medium tabular-nums text-white">{dBest == null ? '—' : fmtDelta(Math.abs(dBest))}</p>
          </div>
          <Best s={B} right />
        </div>
        <div className="mt-9 grid gap-4 border-t border-[#1d1e1f] pt-7 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <SectorBar key={i} i={i} a={A} b={B} />)}
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3 border-t border-[#1d1e1f] pt-6 text-[13px] text-[#939494] sm:grid-cols-4">
          <Fact label="Vitesse de pointe" a={A.top} b={B.top} unit=" km/h" higher />
          <Fact label="Tours bouclés" a={A.laps.size} b={B.laps.size} higher />
          <Fact label="Meilleur S1+S2+S3" a={sum(A.sec)} b={sum(B.sec)} time />
          <Fact label="Tour le plus rapide" a={A.best?.lap_number ?? null} b={B.best?.lap_number ?? null} plain prefix="T" />
        </div>
      </section>

      <LapChart A={A} B={B} dashed={sameColor} dots={!isRace} />
      {isRace && <GapChart A={A} B={B} />}
    </>
  )
}

const sum = (v: (number | null)[]) => (v.every((x) => x != null) ? (v as number[]).reduce((s, x) => s + x, 0) : null)

function Best({ s, right }: { s: Side; right?: boolean }) {
  return (
    <div className={right ? 'text-right' : ''}>
      <p className={`flex items-center gap-2 text-[13px] text-[#939494] ${right ? 'justify-end' : ''}`}><span className="h-3.5 w-1 rounded-full" style={{ background: s.c }} />{s.d.team_name}</p>
      <p className="mt-2 text-[1.35rem] font-medium tracking-[-0.03em] sm:text-[1.75rem]">{s.d.last_name}</p>
      <p className="mt-3 text-[1.6rem] font-medium leading-none tabular-nums tracking-[-0.04em] sm:text-[2.6rem]">{fmt(s.best?.lap_duration)}</p>
      <p className="mt-2 text-[12px] text-[#636464]">Meilleur tour{s.best ? ` · T${s.best.lap_number}` : ''}</p>
    </div>
  )
}

function SectorBar({ i, a, b }: { i: number; a: Side; b: Side }) {
  const va = a.sec[i], vb = b.sec[i]
  const win = va != null && vb != null ? (va <= vb ? 'a' : 'b') : null
  const max = Math.max(va ?? 0, vb ?? 0) || 1
  const row = (s: Side, v: number | null, on: boolean) => (
    <div className="flex items-center gap-3">
      <span className="w-9 text-[12px] font-semibold" style={{ color: on ? '#fff' : '#636464' }}>{s.d.name_acronym}</span>
      <span className="bar-rail h-1.5 flex-1"><span className="block h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${v ? (v / max) * 100 : 0}%`, background: on ? s.c : '#3a3b3c' }} /></span>
      <span className={`w-14 text-right text-[13px] tabular-nums ${on ? 'text-white' : 'text-[#636464]'}`}>{v?.toFixed(3) ?? '—'}</span>
    </div>
  )
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between"><p className="text-[13px] font-medium text-[#c4c5c5]">Secteur {i + 1}</p>{va != null && vb != null && <p className="text-[12px] tabular-nums text-[#636464]">{fmtDelta(Math.abs(va - vb))}</p>}</div>
      <div className="grid gap-2">{row(a, va, win === 'a')}{row(b, vb, win === 'b')}</div>
    </div>
  )
}

function Fact({ label, a, b, unit = '', higher, time, plain, prefix = '' }: { label: string; a: number | null; b: number | null; unit?: string; higher?: boolean; time?: boolean; plain?: boolean; prefix?: string }) {
  const better = (x: number | null, y: number | null) => !plain && x != null && y != null && x !== y && (higher ? x > y : x < y)
  const show = (v: number | null) => (v == null ? '—' : time ? fmt(v) : <>{prefix}<Num value={v} />{unit}</>)
  return (
    <div>
      <p className="text-[12px] text-[#636464]">{label}</p>
      <p className="mt-1.5 tabular-nums"><span className={better(a, b) ? 'text-white' : ''}>{show(a)}</span><span className="mx-1.5 text-[#3d3e3f]">/</span><span className={better(b, a) ? 'text-white' : ''}>{show(b)}</span></p>
    </div>
  )
}

/* ── temps au tour ─────────────────────────────────────────── */
function LapChart({ A, B, dashed, dots }: { A: Side; B: Side; dashed: boolean; dots: boolean }) {
  const [ref, W] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const maxLap = Math.max(0, ...A.laps.keys(), ...B.laps.keys())
  // tours masqués : sortie et entrée des stands (le tour qui précède une sortie), et les tours très lents (drapeau rouge, VSC long)
  const raw = (s: Side, n: number) => { const l = s.laps.get(n); return l && l.lap_duration != null && !l.is_pit_out_lap && !s.laps.get(n + 1)?.is_pit_out_lap ? l.lap_duration : null }
  const all = [...A.laps.keys()].map((n) => raw(A, n)).concat([...B.laps.keys()].map((n) => raw(B, n))).filter((x): x is number => x != null)
  const lo = all.length ? Math.min(...all) : 60
  const shown = all.filter((v) => v <= lo * 1.4)
  const hi = Math.max(lo + 1, ...shown)
  const val = (s: Side, n: number) => { const v = raw(s, n); return v != null && v <= hi ? v : null }
  const H = W < 520 ? 220 : 280
  const pl = 52, pr = 14, pt = 14, pb = 28
  const x = (n: number) => pl + ((n - 1) / Math.max(1, maxLap - 1)) * (W - pl - pr)
  const y = (v: number) => H - pb - ((v - lo + 0.2) / (hi - lo + 0.2)) * (H - pt - pb)
  const path = (s: Side) => {
    let d = '', pen = false
    for (let n = 1; n <= maxLap; n++) {
      const v = val(s, n)
      if (v == null || v > hi) { pen = false; continue }
      d += `${pen ? 'L' : 'M'}${x(n).toFixed(1)},${y(v).toFixed(1)}`
      pen = true
    }
    return d
  }
  const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4)
  const lapTicks = Array.from(new Set([1, ...Array.from({ length: 6 }, (_, i) => Math.round(1 + ((maxLap - 1) * (i + 1)) / 6))]))
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const n = Math.round(1 + ((e.clientX - r.left - pl) / (W - pl - pr)) * (maxLap - 1))
    setHover(Math.max(1, Math.min(maxLap, n)))
  }
  const ha = hover ? val(A, hover) : null, hb = hover ? val(B, hover) : null
  return (
    <section className={`${panel} p-5 sm:p-8`} aria-label="Temps au tour">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-[1.15rem] font-medium tracking-[-0.02em]">Temps au tour</h3>
        <p className="min-h-5 text-[13px] tabular-nums text-[#939494]">
          {hover ? <>Tour {hover} · <span style={{ color: A.c }}>●</span> {fmt(ha)} · <span style={{ color: B.c }}>●</span> {fmt(hb)}{ha && hb ? <span className="text-white"> · {fmtDelta(hb - ha)}</span> : null}</> : 'Touchez le graphique'}
        </p>
      </div>
      <div ref={ref} className="w-full" onPointerLeave={() => setHover(null)}>
        {W > 0 && maxLap > 0 && (
          <svg width={W} height={H} className="block touch-none select-none" onPointerMove={move} onPointerDown={move} role="img" aria-label={`Temps au tour de ${A.d.last_name} et ${B.d.last_name}`}>
            {ticks.map((t) => <g key={t}><line x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} stroke="#1d1e1f" /><text x={pl - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#636464">{fmt(t).replace(/\.\d+$/, (m) => m.slice(0, 2))}</text></g>)}
            {lapTicks.map((n) => <text key={n} x={x(n)} y={H - 8} textAnchor="middle" fontSize="11" fill="#636464">{n}</text>)}
            {!dots && <path className="chart-draw" pathLength={1} d={path(A)} fill="none" stroke={A.c} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
            {!dots && <path className={dashed ? undefined : 'chart-draw'} pathLength={dashed ? undefined : 1} d={path(B)} fill="none" stroke={B.c} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={dashed ? '6 5' : undefined} />}
            {dots && [A, B].map((s, k) => [...s.laps.keys()].map((n) => { const v = val(s, n); return v != null && v <= hi ? <circle key={`${k}-${n}`} cx={x(n)} cy={y(v)} r="4" fill={k && dashed ? '#08090a' : s.c} stroke={s.c} strokeWidth="2" /> : null }))}
            {hover && <line x1={x(hover)} x2={x(hover)} y1={pt} y2={H - pb} stroke="rgb(255 255 255 / .25)" strokeDasharray="3 3" />}
            {hover && ha != null && ha <= hi && <circle cx={x(hover)} cy={y(ha)} r="4.5" fill={A.c} stroke="#08090a" strokeWidth="2" />}
            {hover && hb != null && hb <= hi && <circle cx={x(hover)} cy={y(hb)} r="4.5" fill={B.c} stroke="#08090a" strokeWidth="2" />}
          </svg>
        )}
      </div>
      <p className="mt-3 text-[12px] text-[#636464]">Plus bas = plus rapide. Tours d’entrée et de sortie des stands masqués.</p>
    </section>
  )
}

/* ── écart en piste, tour après tour ───────────────────────── */
function GapChart({ A, B }: { A: Side; B: Side }) {
  const [ref, W] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  // passage sur la ligne à la fin du tour n = départ du tour n+1 (ou départ + durée)
  const cross = (s: Side, n: number) => {
    const nx = s.laps.get(n + 1)
    if (nx?.date_start) return Date.parse(nx.date_start)
    const l = s.laps.get(n)
    return l?.date_start && l.lap_duration != null ? Date.parse(l.date_start) + l.lap_duration * 1000 : NaN
  }
  const maxLap = Math.min(Math.max(0, ...A.laps.keys()), Math.max(0, ...B.laps.keys()))
  const gaps = Array.from({ length: maxLap }, (_, i) => { const g = (cross(B, i + 1) - cross(A, i + 1)) / 1000; return Number.isFinite(g) ? g : null })
  const vals = gaps.filter((g): g is number => g != null)
  if (vals.length < 2) return null
  const m = Math.max(1, ...vals.map(Math.abs)) * 1.1
  const H = W < 520 ? 180 : 220
  const pl = 52, pr = 14, pt = 12, pb = 26
  const x = (n: number) => pl + ((n - 1) / Math.max(1, maxLap - 1)) * (W - pl - pr)
  const y = (g: number) => pt + ((m - g) / (2 * m)) * (H - pt - pb)
  const pts = gaps.map((g, i) => (g == null ? null : [x(i + 1), y(g)] as const))
  let d = ''
  pts.forEach((p, i) => { if (p) d += `${d && pts[i - 1] ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}` })
  const firstI = pts.findIndex(Boolean), lastI = pts.length - 1 - [...pts].reverse().findIndex(Boolean)
  const area = d && `${d}L${x(lastI + 1)},${y(0)}L${x(firstI + 1)},${y(0)}Z`
  const end = vals.at(-1)!
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setHover(Math.max(1, Math.min(maxLap, Math.round(1 + ((e.clientX - r.left - pl) / (W - pl - pr)) * (maxLap - 1)))))
  }
  const hg = hover ? gaps[hover - 1] : null
  const who = (g: number) => (g >= 0 ? A : B)
  return (
    <section className={`${panel} p-5 sm:p-8`} aria-label="Écart en piste">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-[1.15rem] font-medium tracking-[-0.02em]">Écart en piste</h3>
        <p className="min-h-5 text-[13px] tabular-nums text-[#939494]">
          {hover && hg != null ? <>Tour {hover} · {who(hg).d.last_name} devant de {Math.abs(hg).toFixed(1)} s</> : <>Arrivée · {who(end).d.last_name} devant de {Math.abs(end).toFixed(1)} s</>}
        </p>
      </div>
      <div ref={ref} className="w-full" onPointerLeave={() => setHover(null)}>
        {W > 0 && (
          <svg width={W} height={H} className="block touch-none select-none" onPointerMove={move} onPointerDown={move} role="img" aria-label="Écart entre les deux pilotes à chaque passage sur la ligne">
            <defs>
              <clipPath id="gap-top"><rect x="0" y="0" width={W} height={y(0)} /></clipPath>
              <clipPath id="gap-bot"><rect x="0" y={y(0)} width={W} height={H} /></clipPath>
            </defs>
            <path d={area} fill={A.c} fillOpacity="0.14" clipPath="url(#gap-top)" />
            <path d={area} fill={B.c} fillOpacity="0.14" clipPath="url(#gap-bot)" />
            <line x1={pl} x2={W - pr} y1={y(0)} y2={y(0)} stroke="#2b2c2d" />
            <text x={pl - 8} y={pt + 10} textAnchor="end" fontSize="11" fill="#939494">{A.d.name_acronym}</text>
            <text x={pl - 8} y={H - pb} textAnchor="end" fontSize="11" fill="#939494">{B.d.name_acronym}</text>
            <text x={pl - 8} y={y(0) + 4} textAnchor="end" fontSize="11" fill="#636464">0 s</text>
            <path className="chart-draw" pathLength={1} d={d} fill="none" stroke="#f7f8f8" strokeWidth="1.8" strokeLinejoin="round" />
            {hover && hg != null && <><line x1={x(hover)} x2={x(hover)} y1={pt} y2={H - pb} stroke="rgb(255 255 255 / .25)" strokeDasharray="3 3" /><circle cx={x(hover)} cy={y(hg)} r="4.5" fill={who(hg).c} stroke="#08090a" strokeWidth="2" /></>}
          </svg>
        )}
      </div>
    </section>
  )
}
