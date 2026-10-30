import { useEffect, useMemo, useRef, useState } from 'react'
import { constructorChampions, driverChampions } from '../data/champions'
import { colorFor } from '../lib/teamColors'

/** Largeur réelle du conteneur (graphiques SVG à la taille du pixel → texte net partout). */
function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T | null>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

const Readout = ({ children }: { children: React.ReactNode }) => (
  <p className="min-h-10 mt-3 text-sm text-zinc-300 leading-snug" aria-live="polite">{children}</p>
)

/* ---------------------------------------------------------------------------
 * 1. Barres horizontales (titres par pays)
 * ------------------------------------------------------------------------- */

export function CountryBars() {
  const [kind, setKind] = useState<'drivers' | 'constructors'>('drivers')
  const [sel, setSel] = useState<string | null>(null)
  const data = useMemo(() => {
    const m = new Map<string, number>()
    ;(kind === 'drivers' ? driverChampions : constructorChampions).forEach((c) => m.set(c.nat, (m.get(c.nat) ?? 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7)
  }, [kind])
  const total = (kind === 'drivers' ? driverChampions : constructorChampions).length
  const max = Math.max(...data.map((d) => d[1]))
  const cur = data.find((d) => d[0] === sel)

  return (
    <div className="min-w-0">
      <div className="flex gap-x-6" role="tablist" aria-label="Pilotes ou constructeurs">
        {(['drivers', 'constructors'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={kind === k} onClick={() => { setKind(k); setSel(null) }}
            className={`min-h-11 text-sm border-b ${kind === k ? 'text-white border-red-600' : 'text-zinc-500 border-transparent hover:text-zinc-200'}`}>
            {k === 'drivers' ? 'Pilotes' : 'Constructeurs'}
          </button>
        ))}
      </div>
      <ul className="mt-2 space-y-1" key={kind}>
        {data.map(([nat, n], i) => (
          <li key={nat}>
            <button
              onClick={() => setSel(sel === nat ? null : nat)}
              onMouseEnter={() => setSel(nat)}
              onFocus={() => setSel(nat)}
              className="w-full text-left grid grid-cols-[7.5rem_1fr_1.75rem] sm:grid-cols-[8.5rem_1fr_2rem] items-center gap-3 min-h-9"
              aria-label={`${nat} : ${n} titres`}
            >
              <span className={`truncate text-sm ${sel === nat ? 'text-white' : 'text-zinc-400'}`}>{nat}</span>
              <span className="h-2 bg-zinc-900 block overflow-hidden">
                <span className={`grow-x block h-full ${sel === nat || (sel === null && i === 0) ? 'bg-zinc-200' : 'bg-zinc-600'}`} style={{ width: `${(n / max) * 100}%`, animationDelay: `${i * 60}ms` }} />
              </span>
              <span className="text-right text-sm tabular-nums text-zinc-300">{n}</span>
            </button>
          </li>
        ))}
      </ul>
      <Readout>
        {cur ? <><span className="text-white font-semibold">{cur[0]}</span> · {cur[1]} titre{cur[1] > 1 ? 's' : ''} ({Math.round((cur[1] / total) * 100)} % des titres {kind === 'drivers' ? 'pilote' : 'constructeur'})</> : <span className="text-zinc-500">Touchez une barre pour le détail.</span>}
      </Readout>
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * 2. Colonnes empilées : les dynasties par décennie (titres constructeurs)
 * ------------------------------------------------------------------------- */

const DYNASTY_TEAMS = ['Ferrari', 'McLaren', 'Williams', 'Mercedes', 'Red Bull', 'Lotus']

export function DecadeChart() {
  const [ref, w] = useWidth<HTMLDivElement>()
  const [sel, setSel] = useState<number | null>(null)
  const decades = useMemo(() => {
    const out: { decade: number; teams: Map<string, number>; n: number }[] = []
    for (let d = 1950; d <= 2020; d += 10) {
      const teams = new Map<string, number>()
      let n = 0
      constructorChampions.forEach((c) => {
        if (Math.floor(c.year / 10) * 10 === d) {
          const key = DYNASTY_TEAMS.includes(c.name) ? c.name : 'Autres'
          teams.set(key, (teams.get(key) ?? 0) + 1)
          n++
        }
      })
      out.push({ decade: d, teams, n })
    }
    return out
  }, [])
  const order = [...DYNASTY_TEAMS, 'Autres']
  const H = 190
  const mT = 8, mB = 26, mL = 22
  const innerH = H - mT - mB
  const innerW = Math.max(0, w - mL)
  const slot = innerW / decades.length
  const bw = Math.min(46, slot * 0.58)
  const y = (v: number) => mT + innerH - (v / 10) * innerH
  const cur = decades.find((d) => d.decade === sel)

  return (
    <div className="min-w-0" ref={ref}>
      {w > 0 && (
        <svg width={w} height={H} role="img" aria-label="Titres constructeurs par décennie, par écurie">
          {[0, 5, 10].map((v) => (
            <g key={v}>
              <line x1={mL} x2={w} y1={y(v)} y2={y(v)} stroke="#27272a" strokeWidth="1" />
              <text x={mL - 6} y={y(v) + 3.5} textAnchor="end" fontSize="10" fill="#71717a">{v}</text>
            </g>
          ))}
          {decades.map((d, i) => {
            const x = mL + slot * i + (slot - bw) / 2
            let acc = 0
            return (
              <g
                key={d.decade}
                tabIndex={0}
                role="button"
                aria-label={`${d.decade}s : ${d.n} titres`}
                onClick={() => setSel(sel === d.decade ? null : d.decade)}
                onMouseEnter={() => setSel(d.decade)}
                onFocus={() => setSel(d.decade)}
                className="cursor-pointer outline-none"
                opacity={sel === null || sel === d.decade ? 1 : 0.45}
              >
                <rect x={mL + slot * i} y={0} width={slot} height={H} fill="transparent" />
                <g className="grow-y" style={{ animationDelay: `${i * 70}ms` }}>
                  {order.map((t) => {
                    const v = d.teams.get(t) ?? 0
                    if (!v) return null
                    const top = y(acc + v)
                    const h = y(acc) - top
                    acc += v
                    return <rect key={t} x={x} y={top} width={bw} height={Math.max(0, h - 1)} fill={t === 'Autres' ? '#52525b' : colorFor(t)} fillOpacity={0.8} />
                  })}
                </g>
                <text x={mL + slot * i + slot / 2} y={H - 8} textAnchor="middle" fontSize="11" fill={sel === d.decade ? '#fff' : '#a1a1aa'}>{String(d.decade).slice(2)}s</text>
              </g>
            )
          })}
        </svg>
      )}
      <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-zinc-500">
        {order.map((t) => (
          <li key={t} className="flex items-center gap-1.5"><span className="h-2 w-2 inline-block" style={{ background: t === 'Autres' ? '#52525b' : colorFor(t) }} />{t}</li>
        ))}
      </ul>
      <Readout>
        {cur ? (
          <>
            <span className="text-white font-semibold">Années {cur.decade}</span> ({cur.n} saison{cur.n > 1 ? 's' : ''}) :{' '}
            {order.filter((t) => cur.teams.get(t)).map((t) => `${t} ${cur.teams.get(t)}`).join(' · ')}
          </>
        ) : <span className="text-zinc-500">Touchez une colonne pour voir qui dominait la décennie.</span>}
      </Readout>
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * 3. Courbes : course aux titres (cumul des titres pilote)
 * ------------------------------------------------------------------------- */

const LEGENDS: { name: string; short: string; color: string }[] = [
  { name: 'Lewis Hamilton', short: 'Hamilton', color: '#27F4D2' },
  { name: 'Michael Schumacher', short: 'Schumacher', color: '#E8002D' },
  { name: 'Max Verstappen', short: 'Verstappen', color: '#5b8de0' },
  { name: 'Sebastian Vettel', short: 'Vettel', color: '#c4a1ff' },
  { name: 'Alain Prost', short: 'Prost', color: '#FF8000' },
  { name: 'Juan Manuel Fangio', short: 'Fangio', color: '#d4d4d8' },
]

export function TitlesRace() {
  const [ref, w] = useWidth<HTMLDivElement>()
  const [year, setYear] = useState<number | null>(null)
  const Y0 = 1950, Y1 = 2025
  const H = w >= 700 ? 280 : 230
  const mT = 10, mB = 24, mL = 22, mR = 6
  const innerW = Math.max(0, w - mL - mR)
  const innerH = H - mT - mB
  const x = (yr: number) => mL + ((yr - Y0) / (Y1 - Y0)) * innerW
  const y = (v: number) => mT + innerH - (v / 7) * innerH

  const series = useMemo(
    () =>
      LEGENDS.map((l) => {
        const years = driverChampions.filter((c) => c.name === l.name).map((c) => c.year)
        let d = `M ${Math.max(Y0, (years[0] ?? Y0) - 1)} 0`
        let n = 0
        years.forEach((yr) => {
          d += ` L ${yr} ${n}`
          n++
          d += ` L ${yr} ${n}`
        })
        d += ` L ${Y1} ${n}`
        return { ...l, years, d }
      }),
    [],
  )
  const countAt = (years: number[], yr: number) => years.filter((v) => v <= yr).length

  const toPath = (d: string) =>
    d.replace(/([ML]) (\d+) (\d+)/g, (_m, c: string, a: string, b: string) => `${c} ${x(Number(a)).toFixed(1)} ${y(Number(b)).toFixed(1)}`)

  const pick = (clientX: number, el: SVGSVGElement) => {
    const r = el.getBoundingClientRect()
    const yr = Math.round(Y0 + ((clientX - r.left - mL) / innerW) * (Y1 - Y0))
    setYear(Math.min(Y1, Math.max(Y0, yr)))
  }
  const shown = year ?? Y1
  const rows = series.map((s) => ({ ...s, n: countAt(s.years, shown) })).sort((a, b) => b.n - a.n)

  return (
    <div className="min-w-0" ref={ref}>
      {w > 0 && (
        <svg
          width={w}
          height={H}
          role="img"
          aria-label="Évolution du nombre de titres pilote de 1950 à 2025"
          className="touch-pan-y select-none"
          onPointerDown={(e) => pick(e.clientX, e.currentTarget)}
          onPointerMove={(e) => (e.pointerType === 'mouse' || e.buttons) && pick(e.clientX, e.currentTarget)}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setYear(null)}
        >
          {[0, 2, 4, 6].map((v) => (
            <g key={v}>
              <line x1={mL} x2={w - mR} y1={y(v)} y2={y(v)} stroke="#27272a" strokeWidth="1" />
              <text x={mL - 6} y={y(v) + 3.5} textAnchor="end" fontSize="10" fill="#71717a">{v}</text>
            </g>
          ))}
          <line x1={mL} x2={w - mR} y1={y(7)} y2={y(7)} stroke="#27272a" strokeDasharray="2 4" />
          <text x={mL - 6} y={y(7) + 3.5} textAnchor="end" fontSize="10" fill="#71717a">7</text>
          {[1950, 1970, 1990, 2010, 2025].map((yr) => (
            <text key={yr} x={x(yr)} y={H - 6} textAnchor={yr === 1950 ? 'start' : yr === 2025 ? 'end' : 'middle'} fontSize="10" fill="#71717a">{yr}</text>
          ))}
          {series.map((s) => (
            <path key={s.name} d={toPath(s.d)} pathLength={1} fill="none" stroke={s.color} strokeWidth={1.8} strokeLinejoin="round" className="draw-line" opacity={year === null ? 0.9 : 0.85} />
          ))}
          {year !== null && (
            <g>
              <line x1={x(year)} x2={x(year)} y1={mT} y2={H - mB} stroke="#e4e4e7" strokeOpacity="0.5" />
              {series.map((s) => <circle key={s.name} cx={x(year)} cy={y(countAt(s.years, year))} r="3" fill={s.color} />)}
            </g>
          )}
        </svg>
      )}
      <ul className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-1.5 text-zinc-400">
            <span className="h-0.5 w-3 inline-block" style={{ background: r.color }} />
            <span className="truncate">{r.short}</span>
            <span className="ml-auto tabular-nums text-zinc-200">{r.n}</span>
          </li>
        ))}
      </ul>
      <Readout>
        {year === null ? <span className="text-zinc-500">Touchez ou survolez la courbe pour voir les titres à une date donnée.</span> : <>Titres cumulés en <span className="text-white font-semibold">{year}</span></>}
      </Readout>
    </div>
  )
}
