import { useEffect, useMemo, useState } from 'react'
import { SectionTitle } from './MotorNav'
import { constructorChampions, driverChampions, type Champion } from '../data/champions'
import { RECORDS_AS_OF, constructorRecords, driverRecords, seasonFacts, type RecordCat, type RecordEntry } from '../data/records'
import { getSeasonTop, season, type SeasonSummary } from '../lib/f1api'

type Kind = 'drivers' | 'constructors'

const TEAM_COLORS: [string, string][] = [
  ['ferrari', '#E8002D'], ['mclaren', '#FF8000'], ['mercedes', '#27F4D2'], ['red bull', '#3671C6'],
  ['williams', '#64C4FF'], ['renault', '#FFD800'], ['lotus', '#CBA135'], ['brabham', '#0b8a3e'],
  ['benetton', '#43B02A'], ['tyrrell', '#2c5fb3'], ['alpine', '#FF87BC'], ['brawn', '#C8F000'],
  ['alfa', '#9B0000'], ['cooper', '#1f7a4d'], ['brm', '#8b1a1a'], ['matra', '#3a6fd8'], ['vanwall', '#1a6b3a'],
  ['maserati', '#c8102e'], ['aston', '#229971'],
]
const colorFor = (team?: string) => {
  const t = (team ?? '').toLowerCase()
  return TEAM_COLORS.find(([k]) => t.includes(k))?.[1] ?? '#71717a'
}

const LIMIT = 10
const ordinal = (n: number) => (n === 1 ? '1er titre' : `${n}e titre`)

const CATS: { key: RecordCat; label: string }[] = [
  { key: 'titles', label: 'Titres' },
  { key: 'wins', label: 'Victoires' },
  { key: 'podiums', label: 'Podiums' },
  { key: 'poles', label: 'Pole positions' },
  { key: 'fastest', label: 'Meilleurs tours' },
  { key: 'starts', label: 'Départs' },
]

const KindToggle = ({ kind, onChange, labels = ['Pilotes', 'Constructeurs'] }: { kind: Kind; onChange: (k: Kind) => void; labels?: [string, string] }) => (
  <div role="tablist" className="inline-flex border border-zinc-800 bg-zinc-950">
    {(['drivers', 'constructors'] as const).map((k, i) => (
      <button
        key={k}
        role="tab"
        aria-selected={kind === k}
        onClick={() => onChange(k)}
        className={`px-4 min-h-11 text-xs sm:text-sm font-bold uppercase tracking-wider transition ${kind === k ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}
      >
        {labels[i]}
      </button>
    ))}
  </div>
)

const Kicker = ({ children }: { children: React.ReactNode }) => (
  <p className="text-red-500 text-xs font-bold uppercase tracking-[0.25em] mb-3">{children}</p>
)

/* ------------------------------ Records absolus ------------------------------ */

function RecordBoard() {
  const [kind, setKind] = useState<Kind>('drivers')
  const [cat, setCat] = useState<RecordCat>('titles')
  const table = kind === 'drivers' ? driverRecords : constructorRecords
  const cats = CATS.filter((c) => table[c.key] && table[c.key]!.length > 0)
  const active = cats.some((c) => c.key === cat) ? cat : 'titles'
  const rows: RecordEntry[] = table[active] ?? []
  const max = Math.max(1, ...rows.map((r) => r.value))
  const unit = CATS.find((c) => c.key === active)?.label.toLowerCase() ?? ''

  return (
    <section aria-labelledby="rec-board" className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <Kicker>Classements all-time</Kicker>
          <h2 id="rec-board" className="text-xl sm:text-2xl font-black uppercase tracking-tight">Les plus grands de l’histoire</h2>
        </div>
        <KindToggle kind={kind} onChange={setKind} labels={['Pilotes', 'Écuries']} />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 [scrollbar-width:none]" role="tablist" aria-label="Catégorie de record">
        {cats.map((c) => (
          <button
            key={c.key}
            role="tab"
            aria-selected={active === c.key}
            onClick={() => setCat(c.key)}
            className={`shrink-0 px-4 min-h-11 text-xs font-bold uppercase tracking-wider border transition ${active === c.key ? 'border-red-600 bg-red-600/15 text-white' : 'border-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <ol className="bg-zinc-950 border border-zinc-800 divide-y divide-zinc-900">
        {rows.map((r, i) => (
          <li key={r.name} className="px-3 sm:px-4 py-3 relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 opacity-[0.14] transition-[width] duration-700"
              style={{ width: `${(r.value / max) * 100}%`, background: colorFor(r.team) }}
              aria-hidden
            />
            <div className="relative flex items-center gap-3">
              <span className={`w-6 shrink-0 text-center font-black ${i === 0 ? 'text-red-500 text-lg' : 'text-zinc-500 text-sm'}`}>{i + 1}</span>
              <span className="w-1 self-stretch shrink-0" style={{ background: colorFor(r.team) }} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-bold truncate text-sm sm:text-base">{r.name}</p>
                {(r.note || r.team) && <p className="text-[11px] sm:text-xs text-zinc-500 truncate">{r.note ?? r.team}</p>}
              </div>
              <p className="shrink-0 text-right leading-none">
                <span className="text-2xl sm:text-3xl font-black tabular-nums">{r.value}</span>
                <span className="hidden sm:block text-[10px] uppercase tracking-widest text-zinc-500 mt-1">{unit}</span>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

/* ------------------------------ Faits marquants ------------------------------ */

function Facts() {
  return (
    <section aria-labelledby="rec-facts">
      <Kicker>Records de référence</Kicker>
      <h2 id="rec-facts" className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-4">Faits marquants</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {seasonFacts.map((f) => (
          <div key={f.label} className="bg-zinc-950 border border-zinc-800 border-t-2 border-t-red-600 p-4">
            <p className="text-3xl sm:text-4xl font-black tabular-nums leading-none">{f.value}</p>
            <p className="mt-2 text-xs uppercase tracking-wider text-zinc-300 font-bold">{f.label}</p>
            <p className="mt-1 text-[11px] sm:text-xs text-zinc-500">{f.holder}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------ Champions par saison ------------------------------ */

type Fetch = { state: 'loading' } | { state: 'error' } | { state: 'ok'; data: SeasonSummary }

function SeasonDetail({ year, kind }: { year: number; kind: Kind }) {
  const [res, setRes] = useState<Fetch>({ state: 'loading' })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let alive = true
    getSeasonTop(year, kind).then(
      (data) => alive && setRes({ state: 'ok', data }),
      () => alive && setRes({ state: 'error' }),
    )
    return () => {
      alive = false
    }
  }, [year, kind, tick])

  if (res.state === 'loading')
    return (
      <div className="space-y-2" aria-busy="true">
        {[0, 1, 2].map((i) => <div key={i} className="h-9 bg-zinc-900 animate-pulse" />)}
      </div>
    )
  if (res.state === 'error')
    return (
      <div className="flex items-center justify-between gap-3 text-sm text-zinc-300">
        <span>Impossible de charger le classement {year}.</span>
        <button onClick={() => { setRes({ state: 'loading' }); setTick((t) => t + 1) }} className="px-4 min-h-11 border border-red-600 text-xs font-bold uppercase tracking-wider hover:bg-red-600">Réessayer</button>
      </div>
    )
  const { data } = res
  return (
    <div>
      <ol className="space-y-1.5">
        {data.top.map((t, i) => (
          <li key={t.name} className="flex items-center gap-3 bg-black/60 border border-zinc-900 px-3 py-2">
            <span className={`w-5 text-center font-black text-sm ${i === 0 ? 'text-red-500' : 'text-zinc-500'}`}>{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">{t.name}</p>
              {t.team && <p className="text-[11px] text-zinc-500 truncate">{t.team}</p>}
            </div>
            <p className="text-right text-sm leading-tight">
              <span className="font-black tabular-nums">{t.points}</span> <span className="text-zinc-500 text-xs">pts</span>
              <span className="block text-[11px] text-zinc-500">{t.wins} victoire{Number(t.wins) > 1 ? 's' : ''}</span>
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[11px] text-zinc-600">Classement après {data.round} Grand{Number(data.round) > 1 ? 's' : ''} Prix · source Jolpica</p>
    </div>
  )
}

function Champions() {
  const [kind, setKind] = useState<Kind>('drivers')
  const [query, setQuery] = useState('')
  const [decade, setDecade] = useState<number | null>(null)
  const [desc, setDesc] = useState(true)
  const [open, setOpen] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [liveRaw, setLive] = useState<{ kind: Kind; res: Fetch } | null>(null)
  const live: Fetch = liveRaw && liveRaw.kind === kind ? liveRaw.res : { state: 'loading' }

  useEffect(() => {
    let alive = true
    getSeasonTop(season, kind).then(
      (data) => alive && setLive({ kind, res: { state: 'ok', data } }),
      () => alive && setLive({ kind, res: { state: 'error' } }),
    )
    return () => {
      alive = false
    }
  }, [kind])

  const list = kind === 'drivers' ? driverChampions : constructorChampions

  // numéro du titre pour chaque champion (1er, 2e, 3e…)
  const counts = useMemo(() => {
    const seen = new Map<string, number>()
    const m = new Map<number, number>()
    for (const c of list) {
      const n = (seen.get(c.name) ?? 0) + 1
      seen.set(c.name, n)
      m.set(c.year, n)
    }
    return { m, total: seen }
  }, [list])

  const decades = useMemo(() => {
    const s = new Set<number>([Math.floor(season / 10) * 10])
    list.forEach((c) => s.add(Math.floor(c.year / 10) * 10))
    return [...s].sort((a, b) => b - a)
  }, [list])

  const q = query.trim().toLowerCase()
  const rows = useMemo(() => {
    const r = list.filter(
      (c) =>
        (decade === null || Math.floor(c.year / 10) * 10 === decade) &&
        (!q || `${c.name} ${c.team} ${c.nat} ${c.year}`.toLowerCase().includes(q)),
    )
    return desc ? [...r].reverse() : r
  }, [list, decade, q, desc])

  const showLive = (decade === null || decade === Math.floor(season / 10) * 10) && (!q || 'saison en cours'.includes(q) || String(season).includes(q))

  const liveName = live.state === 'ok' ? live.data.top[0]?.name : undefined
  const liveRow = (
    <li key="live" className="bg-zinc-950 border border-red-600/50">
      <button onClick={() => setOpen(open === season ? null : season)} aria-expanded={open === season} className="w-full text-left flex items-center gap-3 px-3 sm:px-4 min-h-16 py-2">
        <span className="w-14 shrink-0 font-black text-xl tabular-nums">{season}</span>
        <div className="min-w-0 flex-1">
          <p className="font-bold truncate">{live.state === 'loading' ? <span className="inline-block h-4 w-32 bg-zinc-800 animate-pulse align-middle" /> : live.state === 'error' ? 'Saison en cours' : `Leader : ${liveName}`}</p>
          <p className="text-[11px] text-zinc-500">Classement provisoire</p>
        </div>
        <span className="shrink-0 bg-red-600 text-[10px] font-bold uppercase tracking-widest px-2 py-1">En cours</span>
        <span className={`text-zinc-500 transition ${open === season ? 'rotate-90' : ''}`} aria-hidden>›</span>
      </button>
      {open === season && <div className="px-3 sm:px-4 pb-4"><SeasonDetail year={season} kind={kind} /></div>}
    </li>
  )

  return (
    <section aria-labelledby="rec-champs" className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <Kicker>Palmarès · depuis 1950</Kicker>
          <h2 id="rec-champs" className="text-xl sm:text-2xl font-black uppercase tracking-tight">Champions du monde</h2>
        </div>
        <KindToggle kind={kind} onChange={(k) => { setKind(k); setOpen(null); setDecade(null) }} />
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] mb-3">
        <label className="relative block">
          <span className="sr-only">Rechercher un champion, une écurie ou une année</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={kind === 'drivers' ? 'Rechercher un pilote, une écurie, une année…' : 'Rechercher une écurie, une année…'}
            className="w-full min-h-12 bg-zinc-950 border border-zinc-800 focus:border-red-600 outline-none px-4 text-base placeholder:text-zinc-600"
          />
        </label>
        <button onClick={() => setDesc((d) => !d)} className="min-h-12 px-4 border border-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white">
          {desc ? '↓ Plus récents' : '↑ Plus anciens'}
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 [scrollbar-width:none]" role="group" aria-label="Filtrer par décennie">
        <button onClick={() => setDecade(null)} aria-pressed={decade === null} className={`shrink-0 px-4 min-h-11 text-xs font-bold uppercase tracking-wider border ${decade === null ? 'border-red-600 bg-red-600/15 text-white' : 'border-zinc-800 text-zinc-400'}`}>Tout</button>
        {decades.map((d) => (
          <button key={d} onClick={() => setDecade(d)} aria-pressed={decade === d} className={`shrink-0 px-4 min-h-11 text-xs font-bold uppercase tracking-wider border ${decade === d ? 'border-red-600 bg-red-600/15 text-white' : 'border-zinc-800 text-zinc-400'}`}>{d}s</button>
        ))}
      </div>

      <p className="text-xs text-zinc-500 mb-2" aria-live="polite">{rows.length + (showLive ? 1 : 0)} saison{rows.length + (showLive ? 1 : 0) > 1 ? 's' : ''}</p>
      <ul className="space-y-1.5">
        {desc && showLive && liveRow}
        {(expanded || q || decade !== null ? rows : rows.slice(0, LIMIT)).map((c: Champion) => {
          const n = counts.m.get(c.year) ?? 1
          const isOpen = open === c.year
          return (
            <li key={c.year} className="bg-zinc-950 border border-zinc-800 hover:border-zinc-600 transition">
              <button onClick={() => setOpen(isOpen ? null : c.year)} aria-expanded={isOpen} className="w-full text-left flex items-center gap-3 px-3 sm:px-4 min-h-16 py-2">
                <span className="w-14 shrink-0 font-black text-xl tabular-nums">{c.year}</span>
                <span className="w-1 self-stretch my-1 shrink-0" style={{ background: colorFor(c.team) }} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate">{c.name}</p>
                  <p className="text-[11px] sm:text-xs text-zinc-500 truncate">{kind === 'drivers' ? `${c.team} · ${c.nat}` : c.nat}</p>
                </div>
                {n > 1 && <span className="shrink-0 border border-zinc-700 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-300 px-2 py-1">{ordinal(n)}</span>}
                <span className={`text-zinc-500 transition ${isOpen ? 'rotate-90' : ''}`} aria-hidden>›</span>
              </button>
              {isOpen && <div className="px-3 sm:px-4 pb-4"><SeasonDetail year={c.year} kind={kind} /></div>}
            </li>
          )
        })}
        {!desc && showLive && liveRow}
        {!expanded && !q && decade === null && rows.length > LIMIT && (
          <li>
            <button onClick={() => setExpanded(true)} className="w-full min-h-12 border border-zinc-700 hover:border-red-600 text-xs font-bold uppercase tracking-wider text-zinc-200">
              Voir les {rows.length - LIMIT} autres saisons
            </button>
          </li>
        )}
        {expanded && decade === null && !q && rows.length > LIMIT && (
          <li>
            <button onClick={() => setExpanded(false)} className="w-full min-h-12 border border-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white">
              Réduire la liste
            </button>
          </li>
        )}
        {rows.length === 0 && !showLive && (
          <li className="bg-zinc-950 border border-zinc-800 p-6 text-center text-sm text-zinc-400">
            Aucun résultat pour « {query} ».
            <button onClick={() => { setQuery(''); setDecade(null) }} className="block mx-auto mt-3 px-4 min-h-11 border border-red-600 text-xs font-bold uppercase tracking-wider hover:bg-red-600">Réinitialiser</button>
          </li>
        )}
      </ul>
    </section>
  )
}

/* ------------------------------ Page ------------------------------ */

export default function StatsRecords() {
  const heroes = [
    { big: String(driverRecords.titles?.[0]?.value ?? ''), label: 'titres mondiaux pilote', who: 'Lewis Hamilton · Michael Schumacher' },
    { big: String(driverRecords.wins?.[0]?.value ?? ''), label: 'victoires en carrière', who: driverRecords.wins?.[0]?.name ?? '' },
    { big: String(driverRecords.poles?.[0]?.value ?? ''), label: 'pole positions', who: driverRecords.poles?.[0]?.name ?? '' },
    { big: String(constructorRecords.titles?.[0]?.value ?? ''), label: 'titres constructeurs', who: constructorRecords.titles?.[0]?.name ?? '' },
  ]
  return (
    <div className="px-4 sm:px-6 lg:px-10 xl:px-14 py-6 w-full flex-1 space-y-10">
      <SectionTitle h1 kicker="Statistiques" title="Records & Historique" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {heroes.map((h) => (
          <div key={h.label} className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-4 sm:p-5">
            <span className="absolute -right-2 -top-3 text-red-600/10 font-black italic text-7xl select-none" aria-hidden>F1</span>
            <p className="relative text-5xl sm:text-6xl font-black italic tabular-nums leading-none">{h.big}</p>
            <p className="relative mt-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider">{h.label}</p>
            <p className="relative mt-1 text-[11px] sm:text-xs text-zinc-500">{h.who}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-10 xl:grid-cols-2 xl:gap-x-10 items-start">
        <RecordBoard />
        <Champions />
      </div>

      <Facts />

      <p className="text-[11px] text-zinc-600 leading-relaxed border-t border-zinc-900 pt-4">{RECORDS_AS_OF}</p>
    </div>
  )
}
