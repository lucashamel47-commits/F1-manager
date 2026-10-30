import { useEffect, useMemo, useState } from 'react'
import { SectionTitle } from './MotorNav'
import { constructorChampions, driverChampions, type Champion } from '../data/champions'
import { RECORDS_AS_OF, constructorRecords, driverRecords, seasonFacts, type RecordCat, type RecordEntry } from '../data/records'
import { getSeasonTop, season, type SeasonSummary } from '../lib/f1api'
import { CountryBars, DecadeChart, TitlesRace } from './RecordCharts'
import { colorFor } from '../lib/teamColors'

type Kind = 'drivers' | 'constructors'

const LIMIT = 10
const FACTS_VISIBLE = 6
const ordinal = (n: number) => (n === 1 ? '1er titre' : `${n}e titre`)

const CATS: { key: RecordCat; label: string; unit: string }[] = [
  { key: 'titles', label: 'Titres', unit: 'titres' },
  { key: 'wins', label: 'Victoires', unit: 'victoires' },
  { key: 'podiums', label: 'Podiums', unit: 'podiums' },
  { key: 'poles', label: 'Poles', unit: 'poles' },
  { key: 'fastest', label: 'Meilleurs tours', unit: 'meilleurs tours' },
  { key: 'starts', label: 'Départs', unit: 'départs' },
]

/** Petit sélecteur texte souligné (calme, sans fond coloré). */
function Switch<T extends string>({ value, options, onChange, label, className = '' }: { value: T; options: { key: T; label: string }[]; onChange: (k: T) => void; label: string; className?: string }) {
  return (
    <div role="tablist" aria-label={label} className={`flex gap-x-6 gap-y-1 flex-wrap ${className}`}>
      {options.map((o) => (
        <button
          key={o.key}
          role="tab"
          aria-selected={value === o.key}
          onClick={() => onChange(o.key)}
          className={`min-h-11 text-sm transition-colors border-b ${value === o.key ? 'text-white border-red-600' : 'text-zinc-500 border-transparent hover:text-zinc-200'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const Heading = ({ id, kicker, title }: { id: string; kicker: string; title: string }) => (
  <div className="mb-5">
    <p className="text-zinc-500 text-xs uppercase tracking-[0.2em]">{kicker}</p>
    <h2 id={id} className="mt-1 text-xl sm:text-2xl font-bold tracking-tight">{title}</h2>
  </div>
)

/* ------------------------------ Classements ------------------------------ */

function RecordBoard() {
  const [kind, setKind] = useState<Kind>('drivers')
  const [cat, setCat] = useState<RecordCat>('titles')
  const table = kind === 'drivers' ? driverRecords : constructorRecords
  const cats = CATS.filter((c) => (table[c.key]?.length ?? 0) > 0)
  const active = cats.some((c) => c.key === cat) ? cat : 'titles'
  const rows: RecordEntry[] = table[active] ?? []
  const unit = CATS.find((c) => c.key === active)?.unit ?? ''
  const max = Math.max(1, ...rows.map((r) => r.value))
  const [sel, setSel] = useState<string | null>(null)

  return (
    <section aria-labelledby="rec-board" className="min-w-0">
      <Heading id="rec-board" kicker="Classements all-time" title="Les plus grands de l’histoire" />
      <Switch value={kind} onChange={setKind} label="Pilotes ou écuries" options={[{ key: 'drivers', label: 'Pilotes' }, { key: 'constructors', label: 'Écuries' }]} />
      <div role="tablist" aria-label="Catégorie de record" className="mt-1 mb-2 grid grid-cols-3 sm:grid-cols-6 xl:grid-cols-3 2xl:grid-cols-6 border border-zinc-800 divide-x divide-y sm:divide-y-0 xl:divide-y 2xl:divide-y-0 divide-zinc-800">
        {cats.map((c) => (
          <button
            key={c.key}
            role="tab"
            aria-selected={active === c.key}
            onClick={() => setCat(c.key)}
            className={`min-h-11 px-1 text-[12px] sm:text-xs transition-colors ${active === c.key ? 'bg-zinc-100 text-black font-semibold' : 'text-zinc-400 hover:text-white'}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <ol className="divide-y divide-zinc-900" key={`${kind}-${active}`}>
        {rows.map((r, i) => (
          <li key={r.name}>
            <button
              onClick={() => setSel(sel === r.name ? null : r.name)}
              onMouseEnter={() => setSel(r.name)}
              onMouseLeave={() => setSel(null)}
              onFocus={() => setSel(r.name)}
              onBlur={() => setSel(null)}
              aria-label={`${r.name} : ${r.value} ${unit}, ${Math.round((r.value / max) * 100)} % du record`}
              className={`w-full text-left py-3 transition-opacity ${sel && sel !== r.name ? 'opacity-50' : ''}`}
            >
              <span className="flex items-baseline gap-4">
                <span className="w-5 shrink-0 text-sm text-zinc-600 tabular-nums">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate ${i === 0 ? 'text-lg font-bold' : 'text-base text-zinc-200'}`}>{r.name}</span>
                  {(r.note || r.team) && <span className="block text-xs text-zinc-500 truncate">{r.note ?? r.team}</span>}
                </span>
                <span className={`shrink-0 tabular-nums ${i === 0 ? 'text-2xl font-bold text-white' : 'text-lg font-semibold text-zinc-300'}`}>
                  {r.value}
                  <span className="sr-only"> {unit}</span>
                </span>
              </span>
              <span className="mt-2 ml-9 block h-1 bg-zinc-900 overflow-hidden" aria-hidden>
                <span className="grow-x block h-full" style={{ width: `${(r.value / max) * 100}%`, background: colorFor(r.team), opacity: sel === r.name || i === 0 ? 0.9 : 0.55, animationDelay: `${i * 50}ms` }} />
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}

/* ------------------------------ Faits marquants ------------------------------ */

function Facts() {
  const [all, setAll] = useState(false)
  const list = all ? seasonFacts : seasonFacts.slice(0, FACTS_VISIBLE)
  return (
    <section aria-labelledby="rec-facts" className="min-w-0">
      <Heading id="rec-facts" kicker="Records de référence" title="Faits marquants" />
      <dl className="grid md:grid-cols-2 xl:grid-cols-3 md:gap-x-12 border-t border-zinc-900">
        {list.map((f) => (
          <div key={f.label} className="flex items-baseline gap-4 py-3.5 border-b border-zinc-900">
            <dt className="w-20 sm:w-24 shrink-0 text-xl sm:text-2xl font-bold tabular-nums whitespace-nowrap">{f.value}</dt>
            <dd className="min-w-0 flex-1">
              <p className="text-sm sm:text-base text-zinc-200">{f.label}</p>
              <p className="text-xs text-zinc-500">{f.holder}</p>
            </dd>
          </div>
        ))}
      </dl>
      {seasonFacts.length > FACTS_VISIBLE && (
        <button onClick={() => setAll((a) => !a)} aria-expanded={all} className="mt-3 min-h-11 text-sm text-zinc-400 hover:text-white underline underline-offset-4 decoration-zinc-700">
          {all ? 'Réduire' : `Voir les ${seasonFacts.length - FACTS_VISIBLE} autres records`}
        </button>
      )}
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
      <div className="space-y-3 py-2" aria-busy="true">
        {[0, 1, 2].map((i) => <div key={i} className="h-5 bg-zinc-900 animate-pulse" />)}
      </div>
    )
  if (res.state === 'error')
    return (
      <div className="flex items-center justify-between gap-3 py-2 text-sm text-zinc-400">
        <span>Impossible de charger le classement {year}.</span>
        <button onClick={() => { setRes({ state: 'loading' }); setTick((t) => t + 1) }} className="min-h-11 px-2 text-white underline underline-offset-4 decoration-red-600">Réessayer</button>
      </div>
    )
  const { data } = res
  return (
    <div className="pb-4">
      <ol className="divide-y divide-zinc-900 text-sm">
        {data.top.map((t, i) => (
          <li key={t.name} className="flex items-baseline gap-3 py-2.5">
            <span className="w-4 text-zinc-600 tabular-nums">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate">
              <span className={i === 0 ? 'font-semibold text-white' : 'text-zinc-300'}>{t.name}</span>
              {t.team && <span className="text-zinc-600"> · {t.team}</span>}
            </span>
            <span className="shrink-0 text-right tabular-nums text-zinc-300">
              {t.points} <span className="text-zinc-600">pts</span>
              <span className="text-zinc-600"> · {t.wins} V</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-zinc-600">Classement après {data.round} Grand{Number(data.round) > 1 ? 's' : ''} Prix · Jolpica</p>
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

  const counts = useMemo(() => {
    const seen = new Map<string, number>()
    const m = new Map<number, number>()
    for (const c of list) {
      const n = (seen.get(c.name) ?? 0) + 1
      seen.set(c.name, n)
      m.set(c.year, n)
    }
    return m
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
  const filtered = q !== '' || decade !== null
  const shown = expanded || filtered ? rows : rows.slice(0, LIMIT)
  const total = rows.length + (showLive ? 1 : 0)
  const liveName = live.state === 'ok' ? live.data.top[0]?.name : undefined

  const liveRow = (
    <li key="live">
      <button onClick={() => setOpen(open === season ? null : season)} aria-expanded={open === season} className="w-full text-left flex items-baseline gap-4 min-h-14 py-3.5">
        <span className="w-12 shrink-0 text-base tabular-nums text-zinc-500">{season}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base">
            {live.state === 'loading' ? <span className="inline-block h-4 w-32 bg-zinc-900 animate-pulse align-middle" /> : live.state === 'error' ? 'Saison en cours' : `Leader : ${liveName}`}
          </span>
          <span className="block text-xs text-red-500">En cours · classement provisoire</span>
        </span>
        <span className={`text-zinc-600 transition-transform ${open === season ? 'rotate-90' : ''}`} aria-hidden>›</span>
      </button>
      {open === season && <SeasonDetail year={season} kind={kind} />}
    </li>
  )

  return (
    <section aria-labelledby="rec-champs" className="min-w-0">
      <Heading id="rec-champs" kicker="Palmarès · depuis 1950" title="Champions du monde" />
      <Switch
        value={kind}
        onChange={(k) => { setKind(k); setOpen(null); setDecade(null) }}
        label="Pilotes ou constructeurs"
        options={[{ key: 'drivers', label: 'Pilotes' }, { key: 'constructors', label: 'Constructeurs' }]}
      />

      <label className="block mt-1">
        <span className="sr-only">Rechercher un champion, une écurie ou une année</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un nom, une écurie, une année"
          className="w-full min-h-12 bg-transparent border-b border-zinc-800 focus:border-red-600 outline-none text-base placeholder:text-zinc-600"
        />
      </label>

      <div className="mt-2 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-500">
          <span>Décennie</span>
          <select
            value={decade ?? ''}
            onChange={(e) => setDecade(e.target.value === '' ? null : Number(e.target.value))}
            className="min-h-11 bg-black border-b border-zinc-800 text-zinc-200 text-base outline-none focus:border-red-600"
          >
            <option value="">Toutes</option>
            {decades.map((d) => <option key={d} value={d}>{d}s</option>)}
          </select>
        </label>
        <button onClick={() => setDesc((d) => !d)} className="min-h-11 text-sm text-zinc-500 hover:text-white">
          {desc ? 'Récents d’abord ↓' : 'Anciens d’abord ↑'}
        </button>
      </div>

      <p className="text-xs text-zinc-600 mb-1" aria-live="polite">{total} saison{total > 1 ? 's' : ''}</p>
      <ul className="divide-y divide-zinc-900 border-y border-zinc-900">
        {desc && showLive && liveRow}
        {shown.map((c: Champion) => {
          const n = counts.get(c.year) ?? 1
          const isOpen = open === c.year
          return (
            <li key={c.year}>
              <button onClick={() => setOpen(isOpen ? null : c.year)} aria-expanded={isOpen} className="w-full text-left flex items-baseline gap-4 min-h-14 py-3.5">
                <span className="w-12 shrink-0 text-base tabular-nums text-zinc-500">{c.year}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base">{c.name}</span>
                  <span className="block truncate text-xs text-zinc-500">
                    {kind === 'drivers' ? c.team : c.nat}
                    {n > 1 && ` · ${ordinal(n)}`}
                  </span>
                </span>
                <span className={`text-zinc-600 transition-transform ${isOpen ? 'rotate-90' : ''}`} aria-hidden>›</span>
              </button>
              {isOpen && <SeasonDetail year={c.year} kind={kind} />}
            </li>
          )
        })}
        {!desc && showLive && liveRow}
        {rows.length === 0 && !showLive && (
          <li className="py-8 text-center text-sm text-zinc-500">
            Aucun résultat pour « {query} ».
            <button onClick={() => { setQuery(''); setDecade(null) }} className="block mx-auto mt-2 min-h-11 px-3 text-white underline underline-offset-4 decoration-red-600">Réinitialiser</button>
          </li>
        )}
      </ul>
      {!filtered && rows.length > LIMIT && (
        <button onClick={() => setExpanded((e) => !e)} className="mt-3 min-h-11 text-sm text-zinc-400 hover:text-white underline underline-offset-4 decoration-zinc-700">
          {expanded ? 'Réduire la liste' : `Voir les ${rows.length - LIMIT} autres saisons`}
        </button>
      )}
    </section>
  )
}

/* ------------------------------ Page ------------------------------ */

export default function StatsRecords() {
  const heroes = [
    { big: String(driverRecords.titles?.[0]?.value ?? ''), label: 'titres pilote', who: 'Hamilton · Schumacher' },
    { big: String(driverRecords.wins?.[0]?.value ?? ''), label: 'victoires', who: driverRecords.wins?.[0]?.name ?? '' },
    { big: String(driverRecords.poles?.[0]?.value ?? ''), label: 'pole positions', who: driverRecords.poles?.[0]?.name ?? '' },
    { big: String(constructorRecords.titles?.[0]?.value ?? ''), label: 'titres constructeurs', who: constructorRecords.titles?.[0]?.name ?? '' },
  ]
  return (
    <div className="px-4 sm:px-6 lg:px-10 xl:px-14 py-8 sm:py-10 w-full max-w-[1600px] flex-1 space-y-14 sm:space-y-16">
      <SectionTitle h1 kicker="Statistiques" title="Records & Historique" />

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-zinc-900 pt-8">
        {heroes.map((h) => (
          <div key={h.label}>
            <dt className="text-xs text-zinc-500 uppercase tracking-[0.15em]">{h.label}</dt>
            <dd className="mt-1">
              <span className="block text-4xl sm:text-5xl font-light tabular-nums leading-none">{h.big}</span>
              <span className="block mt-2 text-sm text-zinc-400 truncate">{h.who}</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-14 sm:gap-16 md:grid-cols-2 md:gap-x-10 lg:gap-x-14 xl:gap-x-20 items-start">
        <RecordBoard />
        <Champions />
      </div>

      <section aria-labelledby="rec-charts" className="min-w-0">
        <div className="mb-6">
          <p className="text-zinc-500 text-xs uppercase tracking-[0.2em]">En graphiques</p>
          <h2 id="rec-charts" className="mt-1 text-xl sm:text-2xl font-bold tracking-tight">70 ans de Formule 1 en un coup d’œil</h2>
        </div>
        <div className="grid gap-12 md:grid-cols-2 md:gap-x-10 lg:gap-x-14 xl:grid-cols-3 xl:gap-x-16">
          <div className="min-w-0 md:col-span-2 xl:col-span-1">
            <h3 className="text-sm font-semibold text-zinc-200">La course aux titres</h3>
            <p className="text-xs text-zinc-500 mb-3">Titres pilote cumulés, 1950 → 2025</p>
            <TitlesRace />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-200">Les dynasties par décennie</h3>
            <p className="text-xs text-zinc-500 mb-3">Titres constructeurs par écurie</p>
            <DecadeChart />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-200">Titres par pays</h3>
            <p className="text-xs text-zinc-500 mb-3">Les 7 nations les plus titrées</p>
            <CountryBars />
          </div>
        </div>
      </section>

      <Facts />

      <p className="text-xs text-zinc-600 leading-relaxed border-t border-zinc-900 pt-5 max-w-3xl">{RECORDS_AS_OF}</p>
    </div>
  )
}
