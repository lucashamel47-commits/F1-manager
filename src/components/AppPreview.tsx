import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { circuits } from '../data/circuits'
import { LogoFull } from './Logo'

/* ───────── Aperçu interactif de l'app (données de démonstration) ─────────
   Une fausse fenêtre d'app avec 4 onglets : classement, calendrier, live timing, stats.
   Légère : aucune dépendance, animations coupées si « réduire les animations » est actif,
   et la boucle du live timing ne tourne que lorsque l'onglet est visible. */

const LOADED_AT = Date.now()

type TabKey = 'standings' | 'calendar' | 'live' | 'stats'

interface Drv { id: string; acr: string; name: string; team: string; color: string; pts: number; wins: number; podiums: number; form: number[] }

// Démo : top 8 du championnat 2026 (Jolpica, après le GP du Brésil), couleurs officielles 2026.
const D: Drv[] = [
  { id: 'ant', acr: 'ANT', name: 'Kimi Antonelli', team: 'Mercedes', color: '#00D7B6', pts: 390, wins: 9, podiums: 14, form: [18, 25, 15, 25, 18, 25, 12, 25] },
  { id: 'ver', acr: 'VER', name: 'Max Verstappen', team: 'Red Bull Racing', color: '#4781D7', pts: 279, wins: 3, podiums: 9, form: [25, 12, 25, 18, 25, 10, 18, 18] },
  { id: 'rus', acr: 'RUS', name: 'George Russell', team: 'Mercedes', color: '#00D7B6', pts: 262, wins: 3, podiums: 9, form: [15, 18, 18, 15, 12, 18, 25, 12] },
  { id: 'ham', acr: 'HAM', name: 'Lewis Hamilton', team: 'Ferrari', color: '#ED1131', pts: 261, wins: 1, podiums: 7, form: [6, 8, 8, 15, 8, 10, 8, 12] },
  { id: 'lec', acr: 'LEC', name: 'Charles Leclerc', team: 'Ferrari', color: '#ED1131', pts: 249, wins: 1, podiums: 7, form: [10, 10, 12, 12, 18, 12, 10, 15] },
  { id: 'nor', acr: 'NOR', name: 'Lando Norris', team: 'McLaren', color: '#F47600', pts: 246, wins: 3, podiums: 8, form: [12, 15, 10, 18, 15, 15, 15, 18] },
  { id: 'pia', acr: 'PIA', name: 'Oscar Piastri', team: 'McLaren', color: '#F47600', pts: 152, wins: 0, podiums: 4, form: [8, 12, 15, 10, 10, 18, 12, 10] },
  { id: 'had', acr: 'HAD', name: 'Isack Hadjar', team: 'Red Bull Racing', color: '#4781D7', pts: 122, wins: 0, podiums: 1, form: [4, 6, 6, 4, 8, 6, 10, 6] },
]
const TEAMS = Object.values(
  D.reduce<Record<string, { name: string; color: string; pts: number }>>((a, d) => {
    a[d.team] = { name: d.team, color: d.color, pts: (a[d.team]?.pts ?? 0) + d.pts }
    return a
  }, {}),
).sort((x, y) => y.pts - x.pts)
const TYRES = { S: '#ff5b50', M: '#ffd23f', H: '#e8e9ea' } as const

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const ICON: Record<TabKey, string> = {
  standings: 'M6 20V10M12 20V4M18 20v-7',
  calendar: 'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4',
  live: 'M3 12h4l3-8 4 16 3-8h4',
  stats: 'M4 19h16M6 16l4-5 3 3 5-7',
}
const TABS: { key: TabKey; label: string }[] = [
  { key: 'standings', label: 'Classement' },
  { key: 'calendar', label: 'Calendrier' },
  { key: 'live', label: 'Live timing' },
  { key: 'stats', label: 'Statistiques' },
]

const Icon = ({ k }: { k: TabKey }) => (
  <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={ICON[k]} /></svg>
)

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={`min-h-9 px-3.5 rounded-full text-xs font-medium border transition ${on ? 'bg-white text-black border-white' : 'border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white'}`}>{children}</button>
  )
}

/* ───────── Classement ───────── */
function Standings() {
  const [mode, setMode] = useState<'d' | 'c'>('d')
  const [sel, setSel] = useState('ant')
  const [ready, setReady] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t) }, [])
  const d = D.find((x) => x.id === sel) ?? D[0]
  const max = mode === 'd' ? D[0].pts : TEAMS[0].pts
  const rows = mode === 'd' ? D.map((x) => ({ key: x.id, label: x.name, sub: x.team, color: x.color, pts: x.pts })) : TEAMS.map((x) => ({ key: x.name, label: x.name, sub: '', color: x.color, pts: x.pts }))
  const spark = d.form.reduce<number[]>((a, v) => [...a, (a[a.length - 1] ?? 0) + v], [])
  const top = spark[spark.length - 1]
  return (
    <div className="grid lg:grid-cols-[1fr_15rem] gap-4 h-full">
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-sm font-semibold tracking-tight">Championnat 2026</p>
          <div className="flex gap-1.5"><Pill on={mode === 'd'} onClick={() => setMode('d')}>Pilotes</Pill><Pill on={mode === 'c'} onClick={() => setMode('c')}>Constructeurs</Pill></div>
        </div>
        <ul className="space-y-1" key={mode}>
          {rows.map((r, i) => (
            <li key={r.key}>
              <button onClick={() => mode === 'd' && setSel(r.key)} className={`group w-full flex items-center gap-3 rounded-xl px-3 min-h-11 text-left transition ${mode === 'd' && sel === r.key ? 'bg-white/[0.08] ring-1 ring-white/15' : 'hover:bg-white/[0.05]'}`}>
                <span className="w-4 text-xs tabular-nums text-zinc-500">{i + 1}</span>
                <span className="h-5 w-1 rounded-full" style={{ background: r.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{r.label}</span>
                  <span className="mt-1 block h-1 rounded-full bg-white/[0.06] overflow-hidden"><span className="block h-full rounded-full transition-[width] duration-[900ms] ease-out" style={{ width: ready ? `${(r.pts / max) * 100}%` : '0%', background: `linear-gradient(90deg, ${r.color}66, ${r.color})`, transitionDelay: `${i * 55}ms` }} /></span>
                </span>
                <span className="w-10 text-right text-[13px] font-semibold tabular-nums">{r.pts}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <aside className="hidden lg:flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
        <p className="kicker">Fiche pilote</p>
        <p className="mt-2 text-lg font-semibold tracking-tight leading-tight">{d.name}</p>
        <p className="text-xs text-zinc-500 flex items-center gap-1.5"><span className="size-1.5 rounded-full" style={{ background: d.color }} />{d.team}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[['Pts', d.pts], ['Victoires', d.wins], ['Podiums', d.podiums]].map(([k, v]) => (
            <div key={k as string} className="rounded-xl bg-white/[0.04] py-2"><p className="text-base font-semibold tabular-nums">{v}</p><p className="text-[10px] text-zinc-500">{k}</p></div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-zinc-500">Points sur les 8 dernières manches</p>
        <svg viewBox="0 0 160 60" className="mt-1 w-full" role="img" aria-label="Évolution des points">
          <defs><linearGradient id="spk" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={d.color} stopOpacity=".35" /><stop offset="1" stopColor={d.color} stopOpacity="0" /></linearGradient></defs>
          <path key={d.id} d={`M0 60 ${spark.map((v, i) => `L${(i / 7) * 160} ${56 - (v / top) * 50}`).join(' ')} L160 60Z`} fill="url(#spk)" />
          <polyline key={d.id + 'l'} points={spark.map((v, i) => `${(i / 7) * 160},${56 - (v / top) * 50}`).join(' ')} fill="none" stroke={d.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </aside>
    </div>
  )
}

/* ───────── Calendrier ───────── */
function Calendar() {
  const list = useMemo(() => {
    const up = circuits.filter((c) => Date.parse(c.iso) >= LOADED_AT - 864e5)
    return (up.length >= 4 ? up : circuits.slice(-6)).slice(0, 5)
  }, [])
  const [sel, setSel] = useState(list[0]?.round ?? 0)
  const c = list.find((x) => x.round === sel) ?? list[0]
  const fmt = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  if (!c) return null
  return (
    <div className="grid lg:grid-cols-[1fr_16rem] gap-4 h-full">
      <div>
        <p className="text-sm font-semibold tracking-tight mb-3">Prochains Grands Prix</p>
        <ul className="space-y-1.5">
          {list.map((x, i) => (
            <li key={x.round}>
              <button onClick={() => setSel(x.round)} className={`w-full flex items-center gap-3 rounded-xl px-3 min-h-12 text-left transition ${sel === x.round ? 'bg-white/[0.08] ring-1 ring-white/15' : 'hover:bg-white/[0.05]'}`}>
                <span className="grid size-9 place-items-center rounded-lg bg-white/[0.05] text-[11px] font-semibold tabular-nums text-zinc-300">R{x.round}</span>
                <span className="text-lg leading-none" aria-hidden>{x.flag}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium">{x.name}</span><span className="block truncate text-[11px] text-zinc-500">{x.circuit}</span></span>
                {i === 0 && <span className="hidden sm:inline rounded-full bg-accent-500/20 text-accent-300 px-2.5 py-0.5 text-[10px] font-medium">Prochain GP</span>}
                <span className="text-xs tabular-nums text-zinc-400">{fmt(x.iso)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <aside className="hidden lg:flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4" key={c.round}>
        <p className="kicker">Fiche circuit</p>
        <p className="mt-2 text-lg font-semibold tracking-tight leading-tight">{c.flag} {c.name}</p>
        <p className="text-xs text-zinc-500">{c.circuit}</p>
        <svg viewBox="0 0 200 110" className="mt-3 w-full" aria-hidden>
          <path d="M30 80 C20 50 50 25 85 30 S130 70 150 45 S185 20 175 60 S120 95 85 90 S40 100 30 80Z" fill="none" stroke="rgb(255 255 255 / .12)" strokeWidth="9" strokeLinecap="round" />
          <path className="preview-trace" pathLength="1" d="M30 80 C20 50 50 25 85 30 S130 70 150 45 S185 20 175 60 S120 95 85 90 S40 100 30 80Z" fill="none" stroke="url(#acc)" strokeWidth="3" strokeLinecap="round" />
          <defs><linearGradient id="acc" x1="0" x2="1"><stop offset="0" stopColor="#7d9bff" /><stop offset="1" stopColor="#b08cff" /></linearGradient></defs>
        </svg>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[['Tours', c.laps ?? '—'], ['Longueur', c.length.replace(' km', '')], ['Record', c.record ?? '—']].map(([k, v]) => (
            <div key={k as string} className="rounded-xl bg-white/[0.04] py-2"><dd className="text-[12px] font-semibold tabular-nums">{v}</dd><dt className="text-[10px] text-zinc-500">{k}</dt></div>
          ))}
        </dl>
      </aside>
    </div>
  )
}

/* ───────── Live timing (animé) ───────── */
const TRACK = 'M40 130 C20 90 60 40 120 48 S210 105 255 70 S320 20 330 70 S250 150 190 138 S100 160 40 130Z'
function Live() {
  const [order, setOrder] = useState(() => D.map((d) => d.id))
  const [flash, setFlash] = useState<string | null>(null)
  const [lap, setLap] = useState(31)
  const [tick, setTick] = useState(0)
  const orderRef = useRef(order)
  const dotRefs = useRef<Record<string, SVGCircleElement | null>>({})
  const pathRef = useRef<SVGPathElement>(null)
  const tyre = useMemo(() => Object.fromEntries(D.map((d, i) => [d.id, (['M', 'H', 'M', 'S', 'H', 'M', 'S', 'H'] as const)[i]])), [])

  useEffect(() => {
    if (reduced()) return
    const id = setInterval(() => {
      setTick((t) => t + 1)
      const o = orderRef.current
      if (Math.random() < 0.45) return
      const i = 1 + Math.floor(Math.random() * (o.length - 1))
      const n = [...o]; [n[i - 1], n[i]] = [n[i], n[i - 1]]
      orderRef.current = n
      setOrder(n); setFlash(n[i - 1]); setTimeout(() => setFlash(null), 1200)
    }, 2300)
    const lapId = setInterval(() => setLap((l) => (l >= 56 ? 31 : l + 1)), 7000)
    return () => { clearInterval(id); clearInterval(lapId) }
  }, [])

  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const len = path.getTotalLength()
    let raf = 0
    const t0 = performance.now()
    const frame = (t: number) => {
      order.forEach((id, pos) => {
        const el = dotRefs.current[id]
        if (!el) return
        const p = path.getPointAtLength((((t - t0) / 24000 + (order.length - pos) * 0.075) % 1) * len)
        el.setAttribute('cx', String(p.x)); el.setAttribute('cy', String(p.y))
      })
      if (!reduced()) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [order])

  const gap = (pos: number) => (pos === 0 ? 'Leader' : `+${(pos * 1.7 + ((tick * (pos + 3)) % 9) / 10 + 0.3).toFixed(1)}`)
  return (
    <div className="grid lg:grid-cols-[1fr_17rem] gap-4 h-full">
      <div className="min-w-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold tracking-tight flex items-center gap-2"><span className="size-1.5 rounded-full bg-white animate-pulse" aria-hidden />Course · Tour {lap}/56</p>
          <span className="rounded-full bg-emerald-500/15 text-emerald-300 px-2.5 py-0.5 text-[10px] font-medium">Drapeau vert</span>
        </div>
        <div className="grid grid-cols-[1.5rem_1fr_3.5rem_2rem] items-center gap-2 px-3 pb-1 text-[10px] uppercase tracking-wider text-zinc-600"><span>P</span><span>Pilote</span><span className="text-right">Écart</span><span className="text-center">Pn</span></div>
        <div className="relative" style={{ height: order.length * 40 }}>
          {D.map((d) => {
            const pos = order.indexOf(d.id)
            return (
              <div key={d.id} className={`absolute inset-x-0 grid grid-cols-[1.5rem_1fr_3.5rem_2rem] items-center gap-2 px-3 h-9 rounded-lg transition-[transform,background-color] duration-700 ease-out ${flash === d.id ? 'bg-emerald-400/15' : 'bg-white/[0.03]'}`} style={{ transform: `translateY(${pos * 40}px)` }}>
                <span className="text-xs tabular-nums text-zinc-400">{pos + 1}</span>
                <span className="flex items-center gap-2 text-[13px] font-semibold"><span className="h-4 w-1 rounded-full" style={{ background: d.color }} />{d.acr}</span>
                <span className="text-right text-xs tabular-nums text-zinc-300">{gap(pos)}</span>
                <span className="mx-auto grid size-5 place-items-center rounded-full border text-[9px] font-bold" style={{ color: TYRES[tyre[d.id]], borderColor: TYRES[tyre[d.id]] }}>{tyre[d.id]}</span>
              </div>
            )
          })}
        </div>
      </div>
      <aside className="hidden lg:flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
        <p className="kicker">Carte en direct</p>
        <svg viewBox="0 0 370 180" className="mt-3 w-full" aria-hidden>
          <path ref={pathRef} d={TRACK} fill="none" stroke="rgb(255 255 255 / .12)" strokeWidth="10" strokeLinecap="round" />
          {D.map((d) => <circle key={d.id} ref={(el) => { dotRefs.current[d.id] = el }} r="5" cx="40" cy="130" fill={d.color} stroke="#0e0f11" strokeWidth="1.5" />)}
        </svg>
        <p className="mt-3 text-[11px] text-zinc-500">Air 24° · Piste 31° · Vent 8 km/h</p>
        <div className="mt-3 space-y-2">
          {['S1', 'S2', 'S3'].map((s, i) => (
            <div key={s} className="flex items-center gap-2 text-[11px] text-zinc-400"><span className="w-5">{s}</span><span className="h-1.5 flex-1 rounded-full bg-white/[0.06] overflow-hidden"><span className="block h-full rounded-full bg-zinc-100 transition-[width] duration-700" style={{ width: `${40 + ((tick * 17 + i * 31) % 55)}%` }} /></span></div>
          ))}
        </div>
      </aside>
    </div>
  )
}

/* ───────── Statistiques ───────── */
function Stats() {
  const four = D.slice(0, 4)
  const [on, setOn] = useState<string[]>(['ant', 'ver', 'rus'])
  const [hover, setHover] = useState<number | null>(null)
  const series = useMemo(() => Object.fromEntries(four.map((d) => [d.id, d.form.reduce<number[]>((a, v) => [...a, (a[a.length - 1] ?? 0) + v], [])])), [four])
  const W = 480, H = 170
  const maxV = 200
  const x = (i: number) => 14 + (i / 7) * (W - 28)
  const y = (v: number) => H - 16 - (v / maxV) * (H - 32)
  return (
    <div className="h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-sm font-semibold tracking-tight">Évolution des points</p>
        <div className="flex flex-wrap gap-1.5">
          {four.map((d) => (
            <button key={d.id} aria-pressed={on.includes(d.id)} onClick={() => setOn((s) => (s.includes(d.id) ? s.filter((i) => i !== d.id) : [...s, d.id]))} className="min-h-9 px-3 rounded-full text-xs font-semibold border transition" style={on.includes(d.id) ? { color: '#fff', borderColor: d.color, background: `${d.color}26` } : { color: '#8d9092', borderColor: 'rgb(255 255 255 / .1)' }}>{d.acr}</button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3" onPointerLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none" onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setHover(Math.max(0, Math.min(7, Math.round(((e.clientX - r.left) / r.width * W - 14) / (W - 28) * 7)))) }}>
          {[0, 50, 100, 150, 200].map((v) => <g key={v}><line x1="14" x2={W - 14} y1={y(v)} y2={y(v)} stroke="rgb(255 255 255 / .06)" /><text x="0" y={y(v) - 3} fontSize="8" fill="#6b6e70">{v}</text></g>)}
          {four.filter((d) => on.includes(d.id)).map((d) => (
            <polyline key={d.id} className="preview-line" pathLength="1" points={series[d.id].map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke={d.color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1="8" y2={H - 12} stroke="rgb(255 255 255 / .25)" strokeDasharray="3 3" />}
          {hover !== null && four.filter((d) => on.includes(d.id)).map((d) => <circle key={d.id} cx={x(hover)} cy={y(series[d.id][hover])} r="3.5" fill={d.color} stroke="#0e0f11" strokeWidth="1.5" />)}
        </svg>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-400 min-h-5">
          {hover === null ? <span className="text-zinc-600">Passe la souris (ou le doigt) sur le graphique</span> : <><span className="text-zinc-500">Manche {hover + 1}</span>{four.filter((d) => on.includes(d.id)).map((d) => <span key={d.id} className="tabular-nums"><span style={{ color: d.color }}>●</span> {d.acr} {series[d.id][hover]}</span>)}</>}
        </div>
      </div>
    </div>
  )
}

/* ───────── Cadre ───────── */
export default function AppPreview() {
  const [tab, setTab] = useState<TabKey>('standings')
  const [auto, setAuto] = useState(true)
  const [inView, setInView] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') { setInView(true); return }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!auto || !inView || reduced()) return
    const id = setInterval(() => setTab((t) => TABS[(TABS.findIndex((x) => x.key === t) + 1) % TABS.length].key), 9000)
    return () => clearInterval(id)
  }, [auto, inView])

  const choose = (k: TabKey) => { setAuto(false); setTab(k) }

  return (
    <section ref={root} id="apercu" aria-label="Aperçu interactif de l'application" className="relative z-10 scroll-mt-20 px-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[77.5rem]">
        {/* Cadre Novex : grand conteneur arrondi, fond --surface, fenêtre coupée en bas */}
        <div className="overflow-hidden rounded-[1.5rem] border border-[#2b2c2d] bg-gradient-to-b from-[#1a1b1c] to-[#0d0e0f] px-3 pt-3 sm:px-8 sm:pt-8 lg:px-14 lg:pt-14">
        <div
          ref={frame}
          className="relative -mb-px overflow-hidden rounded-t-[0.875rem] border border-b-0 border-[#2b2c2d] bg-[#0b0c0d]"
        >
          {/* barre de fenêtre */}
          <div className="flex items-center gap-3 px-4 h-11 border-b border-white/[0.07] bg-white/[0.02]">
            <span className="flex gap-1.5" aria-hidden><i className="size-2.5 rounded-full bg-white/15" /><i className="size-2.5 rounded-full bg-white/15" /><i className="size-2.5 rounded-full bg-white/15" /></span>
            <span className="mx-auto flex items-center gap-1.5 rounded-full bg-white/[0.05] px-4 py-1 text-[11px] text-zinc-500"><svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>f1-manager</span>
            <span className="w-12" aria-hidden />
          </div>
          <div className="flex min-h-[26rem] md:min-h-[32rem]">
            {/* barre latérale */}
            <nav role="tablist" aria-label="Sections de l'aperçu" aria-orientation="vertical" className="hidden md:flex w-48 shrink-0 flex-col gap-1 border-r border-white/[0.07] p-3">
              <div className="px-2 pb-3 pt-1"><LogoFull size="sm" /></div>
              {TABS.map((t) => (
                <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => choose(t.key)} className={`flex items-center gap-2.5 rounded-xl px-3 min-h-10 text-[13px] text-left transition ${tab === t.key ? 'bg-[#222324] text-white' : 'text-zinc-400 hover:bg-white/[0.05] hover:text-white'}`}>
                  <Icon k={t.key} />{t.label}
                  {t.key === 'live' && <span className="ml-auto size-1.5 rounded-full bg-white animate-pulse" aria-hidden />}
                </button>
              ))}
              <div className="mt-auto rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 text-[11px] leading-snug text-zinc-500">Données de démonstration. Crée ton compte pour suivre la vraie saison.</div>
            </nav>
            <div className="min-w-0 flex-1 p-3 sm:p-5">
              {/* onglets mobiles */}
              <div role="tablist" aria-label="Sections de l'aperçu" className="md:hidden -mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]">
                {TABS.map((t) => (
                  <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => choose(t.key)} className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 min-h-10 text-xs font-medium border transition ${tab === t.key ? 'bg-white text-black border-white' : 'border-white/10 text-zinc-400'}`}><Icon k={t.key} />{t.label}</button>
                ))}
              </div>
              <div key={tab} role="tabpanel" className="animate-fadeIn">
                {tab === 'standings' && <Standings />}
                {tab === 'calendar' && <Calendar />}
                {tab === 'live' && <Live />}
                {tab === 'stats' && <Stats />}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  )
}
