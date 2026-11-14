/* Positions tour par tour : toute la course, une ligne par pilote aux couleurs de son écurie. */
import { useMemo, useState } from 'react'
import type { OFSession } from '../../live/openf1'
import { emptyStore, merge, lapSeries, lastIdx } from '../../live/model'
import { color, loadPositions, loadSession, useMeetings, useSessionData, panel, useWidth, type Meeting } from './data'
import { SessionPicker, Skeleton, State } from './ui'

const KINDS = ['Race', 'Sprint']

interface Line { n: number; acr: string; name: string; team: string; c: string; dash: boolean; pos: (number | null)[]; finish: number | null; grid: number | null; out: boolean }

async function loadRace(s: OFSession, sig: AbortSignal) {
  const base = await loadSession(s, sig)
  const positions = await loadPositions(s, sig)
  const store = emptyStore(s)
  merge.drivers(store, base.drivers)
  merge.laps(store, base.laps)
  merge.positions(store, positions)
  const series = lapSeries(store)
  const seen = new Map<string, number>()
  const lines: Line[] = store.drivers.map((d) => {
    const c = color(d)
    const k = seen.get(c) ?? 0
    seen.set(c, k + 1)
    const pa = store.positions.get(d.driver_number) ?? []
    const first = store.laps.get(d.driver_number)?.[0]
    const gi = first && Number.isFinite(first.start) ? lastIdx(pa, first.start + 1000, (v) => v[0]) : -1
    const res = base.results.find((r) => r.driver_number === d.driver_number)
    return { n: d.driver_number, acr: d.name_acronym, name: `${d.first_name} ${d.last_name}`, team: d.team_name, c, dash: k > 0, pos: series.pos.get(d.driver_number) ?? [], finish: res?.position ?? null, out: !!res && (res.dnf || res.dns || res.dsq || res.position == null), grid: gi >= 0 ? pa[gi][1] : pa[0]?.[1] ?? null }
  })
  return { lines, laps: series.laps.length }
}

export default function PositionChart() {
  const { meetings, error } = useMeetings(KINDS)
  const [pick, setPick] = useState<{ meeting: Meeting; session: OFSession } | null>(null)
  const first = meetings?.[0]
  const meeting = pick?.meeting ?? first ?? null
  const session = pick?.session ?? (first ? first.sessions.find((s) => s.session_name === 'Race') ?? first.sessions[0] : null)
  const pickMeeting = (m: Meeting) => setPick({ meeting: m, session: m.sessions.find((s) => s.session_name === 'Race') ?? m.sessions[0] })
  const setSession = (s: OFSession) => setPick({ meeting: meeting!, session: s })
  const { data, error: dErr, loading } = useSessionData(session, loadRace)

  if (error) return <State>Impossible de charger la saison. Vérifie ta connexion.</State>
  if (!meetings) return <Skeleton h="h-[36rem]" />
  if (!meetings.length) return <State>Aucune course terminée pour le moment.</State>
  return (
    <div className="grid gap-6">
      <SessionPicker meetings={meetings} meeting={meeting} session={session} onMeeting={pickMeeting} onSession={setSession} />
      {dErr ? <State>Données indisponibles pour cette course.</State> : loading || !data ? <Skeleton h="h-[36rem]" /> : data.laps < 2 ? <State>Pas encore de tours pour cette course.</State> : <Chart key={session?.session_key} lines={data.lines} laps={data.laps} />}
    </div>
  )
}

function Chart({ lines, laps }: { lines: Line[]; laps: number }) {
  const [ref, W] = useWidth<HTMLDivElement>()
  const [sel, setSel] = useState<number | null>(null)
  const [hov, setHov] = useState<number | null>(null)
  const [lap, setLap] = useState<number | null>(null)
  const focus = hov ?? sel
  const N = Math.max(20, ...lines.map((l) => Math.max(0, ...l.pos.map((p) => p ?? 0))))
  const narrow = W < 560
  const H = narrow ? 460 : 560
  const pl = narrow ? 34 : 44, pr = narrow ? 40 : 52, pt = 10, pb = 28
  const x = (i: number) => pl + (i / laps) * (W - pl - pr) // i = 0 → grille, i = k → fin du tour k
  const y = (p: number) => pt + ((p - 1) / (N - 1)) * (H - pt - pb)
  const paths = useMemo(() => lines.map((l) => {
    let d = '', pen = false
    const pts: (number | null)[] = [l.grid, ...l.pos]
    pts.forEach((p, i) => { if (p == null) { pen = false; return } d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(p).toFixed(1)}`; pen = true })
    const lastI = pts.length - 1 - [...pts].reverse().findIndex((p) => p != null)
    return { l, d, end: pts[lastI] != null ? { x: x(lastI), y: y(pts[lastI]!), out: l.out } : null }
  }), [lines, W, laps]) // eslint-disable-line react-hooks/exhaustive-deps
  const ordered = [...paths].sort((a, b) => Number(a.l.n === focus) - Number(b.l.n === focus))
  const lapTicks = Array.from(new Set([1, ...Array.from({ length: narrow ? 4 : 7 }, (_, i) => Math.round((laps * (i + 1)) / (narrow ? 4 : 7)))]))
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setLap(Math.max(0, Math.min(laps, Math.round(((e.clientX - r.left - pl) / (W - pl - pr)) * laps))))
  }
  const focused = lines.find((l) => l.n === focus)
  const posAt = (l: Line, i: number) => (i === 0 ? l.grid : l.pos[i - 1])
  return (
    <section className={`${panel} p-4 sm:p-8`} aria-label="Positions tour par tour">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3 px-1">
        <h3 className="text-[1.15rem] font-medium tracking-[-0.02em]">Positions tour par tour</h3>
        <p className="min-h-5 text-[13px] tabular-nums text-[#939494]">
          {focused ? <><span style={{ color: focused.c }}>●</span> {focused.name} · {lap != null ? `${lap === 0 ? 'Grille' : `Tour ${lap}`} : P${posAt(focused, lap) ?? '—'}` : `P${focused.grid ?? '—'} → ${focused.finish ? `P${focused.finish}` : 'abandon'}`}</> : lap != null ? (lap === 0 ? 'Grille de départ' : `Tour ${lap}`) : 'Touchez une ligne ou un pilote'}
        </p>
      </div>
      <div ref={ref} className="w-full" onPointerLeave={() => { setHov(null); setLap(null) }}>
        {W > 0 && (
          <svg width={W} height={H} className="block touch-none select-none" onPointerMove={move} onPointerDown={move} role="img" aria-label="Évolution des positions de chaque pilote">
            {Array.from({ length: N }, (_, i) => i + 1).map((p) => (
              <g key={p}>
                <line x1={pl} x2={W - pr} y1={y(p)} y2={y(p)} stroke="#151617" />
                {(p === 1 || p % (narrow ? 5 : 2) === 0 || p === N) && <text x={pl - 10} y={y(p) + 4} textAnchor="end" fontSize="11" fill="#4a4b4c">P{p}</text>}
              </g>
            ))}
            {lapTicks.map((n) => <text key={n} x={x(n)} y={H - 8} textAnchor="middle" fontSize="11" fill="#636464">{n}</text>)}
            {lap != null && <line x1={x(lap)} x2={x(lap)} y1={pt} y2={H - pb} stroke="rgb(255 255 255 / .2)" strokeDasharray="3 3" />}
            {ordered.map(({ l, d, end }) => {
              const on = focus === l.n
              const dim = focus != null && !on
              return (
                <g key={l.n} onPointerEnter={(e) => e.pointerType === 'mouse' && setHov(l.n)} onPointerLeave={() => setHov(null)} onClick={() => setSel((s) => (s === l.n ? null : l.n))} style={{ cursor: 'pointer', transition: 'opacity .25s' }} opacity={dim ? 0.13 : 1}>
                  <path d={d} fill="none" stroke="transparent" strokeWidth="12" />
                  <path className={l.dash ? undefined : 'chart-draw'} pathLength={l.dash ? undefined : 1} d={d} fill="none" stroke={l.c} strokeWidth={on ? 3 : 1.6} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={l.dash ? '5 4' : undefined} />
                  {end && <>
                    {end.out && <circle cx={end.x} cy={end.y} r="3" fill="#08090a" stroke={l.c} strokeWidth="1.6" />}
                    <text x={end.out ? end.x + 6 : Math.max(end.x + 8, W - pr + 8)} y={end.y + 4} fontSize={on ? 12 : 10.5} fontWeight={on ? 600 : 500} fill={on ? '#fff' : l.c}>{l.acr}</text>
                  </>}
                  {on && lap != null && posAt(l, lap) != null && <circle cx={x(lap)} cy={y(posAt(l, lap)!)} r="5" fill={l.c} stroke="#08090a" strokeWidth="2" />}
                </g>
              )
            })}
          </svg>
        )}
      </div>
      <div className="mt-6 flex flex-wrap gap-1.5 px-1" role="group" aria-label="Mettre un pilote en avant">
        {[...lines].sort((a, b) => (a.finish ?? 99) - (b.finish ?? 99)).map((l) => (
          <button key={l.n} aria-pressed={sel === l.n} onClick={() => setSel((s) => (s === l.n ? null : l.n))} onPointerEnter={(e) => e.pointerType === 'mouse' && setHov(l.n)} onPointerLeave={() => setHov(null)}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold transition-colors ${sel === l.n ? 'border-white bg-white text-[#08090a]' : 'border-[#2b2c2d] text-[#c4c5c5] hover:border-[#3d3e3f] hover:text-white'}`}>
            <span className="size-1.5 rounded-full" style={{ background: l.c }} />{l.acr}
          </button>
        ))}
      </div>
      <p className="mt-4 px-1 text-[12px] text-[#636464]">Tour 0 = grille de départ. Rond vide = abandon.</p>
    </section>
  )
}
