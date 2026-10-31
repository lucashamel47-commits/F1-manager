import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRuntime, useSessionList } from './useLive'
import { OpenF1Error, ms } from './openf1'
import type { OFSession } from './openf1'
import { snapshot, lapSeries, fmtElapsed } from './model'
import type { Store } from './model'
import { Card, Tabs, FlagIcon, Empty } from './ui/common'
import { TRACK_LABEL } from './ui/style'
import Tower from './ui/Tower'
import LiveMap from './ui/LiveMap'
import Chrono from './ui/Chrono'
import DriverPanel from './ui/DriverPanel'
import Controls from './ui/Controls'
import Picker from './ui/Picker'
import { PositionChart, GapChart, StrategyChart, PitList } from './ui/Charts'
import { RaceControlFeed, OvertakesFeed, RadioFeed, WeatherPanel } from './ui/Feeds'
import { sessionFr, gpLabel, fmtDateFr } from './ui/labels'

type Chosen = { session: OFSession; mode: 'live' | 'replay' }
type LeftTab = 'tower' | 'chrono' | 'strategy' | 'evolution'
type RightTab = 'rc' | 'overtakes' | 'radio' | 'weather' | 'driver'
type MobTab = LeftTab | RightTab | 'map'

const LEFT: { key: LeftTab; label: string }[] = [
  { key: 'tower', label: 'Classement' }, { key: 'chrono', label: 'Chronos' }, { key: 'strategy', label: 'Stratégie' }, { key: 'evolution', label: 'Évolution' },
]
const RIGHT: { key: RightTab; label: string }[] = [
  { key: 'rc', label: 'Direction' }, { key: 'overtakes', label: 'Dépassements' }, { key: 'radio', label: 'Radios' }, { key: 'weather', label: 'Météo' },
]

function useMedia(q: string) {
  const [m, setM] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(q).matches : true))
  useEffect(() => {
    const mq = window.matchMedia(q)
    const f = () => setM(mq.matches)
    mq.addEventListener('change', f)
    f()
    return () => mq.removeEventListener('change', f)
  }, [q])
  return m
}

function useNow(everyMs = 1000) {
  const [n, setN] = useState(() => Date.now())
  useEffect(() => { const id = setInterval(() => setN(Date.now()), everyMs); return () => clearInterval(id) }, [everyMs])
  return n
}

function countdown(ms_: number) {
  const s = Math.max(0, Math.floor(ms_ / 1000))
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), x = s % 60
  return { d, h, m, s: x }
}

function lapStart(store: Store, lap: number): number | null {
  let best: number | null = null
  for (const arr of store.laps.values()) for (const l of arr) if (l.lap === lap && (best == null || l.start < best)) best = l.start
  return best
}

function Spinner() {
  return <span className="inline-block size-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" aria-hidden />
}

function Banner({ tone, children, action }: { tone: 'warn' | 'err'; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div role="status" className={`flex flex-wrap items-center gap-3 px-3 sm:px-5 lg:px-6 py-3 text-sm border-b ${tone === 'err' ? 'bg-red-950/60 border-red-900 text-red-100' : 'bg-amber-950/50 border-amber-900 text-amber-100'}`}>
      <span className="flex-1 min-w-[min(16rem,100%)] leading-snug">{children}</span>
      {action}
    </div>
  )
}

function issueText(e: OpenF1Error | Error): string {
  if (e instanceof OpenF1Error) {
    if (e.kind === 'auth') return 'Accès refusé (401) : les données en direct d’OpenF1 pendant une session sont réservées aux abonnés. L’accès gratuit ne couvre que les sessions terminées — vous pouvez rejouer une session passée.'
    if (e.kind === 'rate') return 'Limite de requêtes OpenF1 atteinte (429). Nouvel essai automatique dans quelques secondes.'
    if (e.kind === 'network') return navigator.onLine ? 'OpenF1 est injoignable pour le moment. Nouvel essai automatique.' : 'Vous êtes hors connexion : seules les sessions déjà consultées sont disponibles.'
    return `OpenF1 a répondu une erreur (${e.status ?? '?'}). Nouvel essai automatique.`
  }
  return e.message || 'Erreur inattendue.'
}

export default function LivePage() {
  const [thisYear] = useState(() => new Date().getFullYear())
  const [years, setYears] = useState<number[]>([thisYear])
  const list = useSessionList(years)
  const now = useNow(1000)
  const sim = useMemo(() => new URLSearchParams(window.location.search).get('livesim'), [])
  const [chosen, setChosen] = useState<Chosen | null>(null)
  const [picker, setPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(thisYear)
  const online = typeof navigator === 'undefined' || navigator.onLine !== false

  const sessions = list.sessions
  const liveSession = useMemo(() => sessions.find((s) => ms(s.date_start) - 5 * 60_000 <= now && now <= ms(s.date_end) + 10 * 60_000) ?? null, [sessions, now])
  const next = useMemo(() => sessions.find((s) => ms(s.date_start) > now) ?? null, [sessions, now])
  const lastRace = useMemo(() => [...sessions].reverse().find((s) => s.session_name === 'Race' && ms(s.date_end) < now) ?? null, [sessions, now])
  const weekend = useMemo(() => (next ? sessions.filter((s) => s.meeting_key === next.meeting_key) : []), [sessions, next])

  // lien de test : ?livesim=<session_key> joue une session passée comme si elle était en direct
  const simSession = sim ? sessions.find((s) => String(s.session_key) === sim) ?? null : null
  const active: Chosen | null = chosen ?? (simSession ? { session: simSession, mode: 'live' } : liveSession ? { session: liveSession, mode: 'live' } : null)
  const rt = useRuntime(active?.session ?? null, active?.mode ?? 'replay', !!simSession && !chosen)

  const start = useCallback((s: OFSession, mode: 'live' | 'replay' = 'replay') => { setChosen({ session: s, mode }); setPicker(false) }, [])
  const onYear = (y: number) => { setPickerYear(y); setYears((ys) => (ys.includes(y) ? ys : [...ys, y].sort((a, b) => b - a))) }

  // ---------- état d'affichage ----------
  const store = rt.status === 'ready' ? rt.store : null
  const snap = useMemo(() => (store ? snapshot(store, rt.t) : null), [store, rt.t, store?.version, rt.version]) // eslint-disable-line react-hooks/exhaustive-deps
  const series = useMemo(() => (store ? lapSeries(store) : null), [store, store?.version, rt.version]) // eslint-disable-line react-hooks/exhaustive-deps

  const desktop = useMedia('(min-width: 1024px)')
  const [leftTab, setLeftTab] = useState<LeftTab>('tower')
  const [rightTab, setRightTab] = useState<RightTab>('rc')
  const [mobTab, setMobTab] = useState<MobTab>('tower')
  const [sel, setSel] = useState<number | null>(null)
  const sessKey = active?.session.session_key
  const [prevKey, setPrevKey] = useState(sessKey)
  if (prevKey !== sessKey) { setPrevKey(sessKey); setSel(null) }

  const select = useCallback((n: number) => {
    setSel(n); rt.setWatch(n)
    if (desktop) setRightTab('driver'); else setMobTab('driver')
  }, [desktop, rt])
  const closeDriver = useCallback(() => {
    setSel(null); rt.setWatch(null)
    if (desktop) setRightTab('rc'); else setMobTab('tower')
  }, [desktop, rt])
  const stepLap = useCallback((d: number) => {
    if (!store || !snap) return
    const target = Math.max(1, Math.min(snap.totalLaps ?? 999, snap.lap + d))
    const at = lapStart(store, target)
    if (at != null) rt.seek(at + 500)
  }, [store, snap, rt])

  const toolbarBtn = 'min-h-11 px-4 text-xs font-bold uppercase tracking-wider border border-zinc-700 text-zinc-200 active:bg-zinc-900'
  const whiteBtn = 'min-h-11 px-4 text-xs font-bold uppercase tracking-wider border border-white bg-white text-black active:bg-zinc-300'

  const driverTab = sel != null && store && snap ? (
    <DriverPanel store={store} snap={snap} car={rt.car} n={sel} t={rt.t} onClose={closeDriver} issue={rt.liveIssue} />
  ) : <Empty>Touchez un pilote dans le classement ou sur la carte pour voir sa télémétrie et sa fiche.</Empty>

  const panel = (k: MobTab) => {
    if (!store || !snap) return null
    switch (k) {
      case 'tower': return <Tower snap={snap} selected={sel} onSelect={select} />
      case 'chrono': return <Chrono snap={snap} selected={sel} onSelect={select} />
      case 'strategy': return (
        <div>
          <StrategyChart store={store} snap={snap} lap={snap.lap} selected={sel} onSelect={select} />
          <div className="border-t border-zinc-800"><PitList store={store} t={rt.t} /></div>
        </div>
      )
      case 'evolution': return series ? (
        <div className="divide-y divide-zinc-800">
          <PositionChart store={store} series={series} lap={snap.lap} selected={sel} onSelect={select} />
          <GapChart store={store} series={series} snap={snap} lap={snap.lap} selected={sel} />
        </div>
      ) : null
      case 'rc': return <RaceControlFeed snap={snap} />
      case 'overtakes': return <OvertakesFeed store={store} snap={snap} />
      case 'radio': return <RadioFeed store={store} snap={snap} />
      case 'weather': return <WeatherPanel store={store} w={snap.weather} t={rt.t} />
      case 'driver': return driverTab
      case 'map': return null
    }
  }

  const mapEl = store && snap ? (
    <LiveMap loc={rt.loc} now={rt.now} rows={snap.rows} selected={sel} onSelect={select} version={rt.version} />
  ) : null

  const isLive = active?.mode === 'live'
  const track = snap ? TRACK_LABEL[snap.track.kind] : null
  const rightTabs = sel != null ? [...RIGHT, { key: 'driver' as const, label: 'Pilote' }] : RIGHT
  const mobTabs: { key: MobTab; label: string }[] = [
    { key: 'tower', label: 'Classement' }, { key: 'map', label: 'Carte' }, ...(sel != null ? [{ key: 'driver' as const, label: 'Pilote' }] : []),
    { key: 'rc', label: 'Direction' }, { key: 'strategy', label: 'Stratégie' }, { key: 'evolution', label: 'Évolution' },
    { key: 'chrono', label: 'Chronos' }, { key: 'overtakes', label: 'Dépass.' }, { key: 'radio', label: 'Radios' }, { key: 'weather', label: 'Météo' },
  ]
  const wide = 'w-full px-3 sm:px-5 lg:px-6'

  // ---------- écran d'accueil (aucune session) ----------
  if (!active) {
    const cd = next ? countdown(ms(next.date_start) - now) : null
    return (
      <main className="flex-1 w-full pb-28">
        <div className="h-1 bg-red-600" />
        <section className={`${wide} pt-8 pb-6`}>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-500">Live</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-black uppercase tracking-tighter leading-none">Pas de session en cours</h1>
          <p className="mt-3 text-zinc-400 max-w-2xl text-sm sm:text-base">Chronos, carte du circuit, stratégie, télémétrie et radios de la F1 en direct — ou rejouez n’importe quelle session passée avec les données d’OpenF1.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button disabled={!lastRace} onClick={() => lastRace && start(lastRace)} className="min-h-12 px-6 inline-flex items-center gap-2.5 bg-red-600 active:bg-red-500 disabled:opacity-40 text-white text-sm font-black uppercase tracking-wider">
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden><path d="M7 4l13 8-13 8z" /></svg>
              Rejouer une course{lastRace ? ` — ${gpLabel(lastRace)} ${lastRace.year}` : ''}
            </button>
            <button onClick={() => setPicker(true)} className={`${toolbarBtn} min-h-12`}>Choisir une session</button>
          </div>
          {list.status === 'loading' && !sessions.length && <p className="mt-4 text-sm text-zinc-500 flex items-center gap-2"><Spinner /> Chargement du calendrier…</p>}
          {list.status === 'error' && (
            <div className="mt-5 max-w-2xl"><Banner tone="err" action={<button onClick={list.reload} className={toolbarBtn}>Réessayer</button>}>{online ? issueText(list.error as Error) : 'Hors connexion.'}</Banner></div>
          )}
        </section>
        {next && cd && (
          <section className={`${wide} grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-3`}>
            <Card title="Prochaine session">
              <div className="p-4 sm:p-6">
                <p className="text-sm text-zinc-400 uppercase tracking-wider">{gpLabel(next)} · {next.circuit_short_name}</p>
                <p className="mt-1 text-2xl sm:text-3xl font-black uppercase tracking-tight">{sessionFr(next.session_name)}</p>
                <p className="mt-1 text-sm text-zinc-400">{fmtDateFr(next.date_start)} (heure de Paris)</p>
                <div className="mt-5 grid grid-cols-4 gap-px bg-zinc-800 max-w-md text-center" role="timer" aria-label="Compte à rebours">
                  {([['j', cd.d], ['h', cd.h], ['min', cd.m], ['s', cd.s]] as const).map(([u, v]) => (
                    <div key={u} className="bg-black py-4"><p className="text-3xl sm:text-4xl font-black tabular-nums">{String(v).padStart(2, '0')}</p><p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{u}</p></div>
                  ))}
                </div>
              </div>
            </Card>
            <Card title="Programme du week-end">
              <ul>
                {weekend.map((s) => (
                  <li key={s.session_key} className={`flex items-center justify-between gap-3 px-4 min-h-12 border-b border-zinc-900 text-sm ${s.session_key === next.session_key ? 'bg-zinc-900' : ''}`}>
                    <span className="font-bold uppercase tracking-tight">{sessionFr(s.session_name)}</span>
                    <span className="text-zinc-400 tabular-nums">{fmtDateFr(s.date_start)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}
        {!next && list.status === 'ok' && <section className={wide}><Card><Empty>Aucune session à venir au calendrier pour le moment.</Empty></Card></section>}
        <p className={`${wide} mt-6 text-xs text-zinc-500 max-w-3xl`}>Données : OpenF1 (api.openf1.org). Les données en direct pendant une session nécessitent un abonnement OpenF1 ; les sessions terminées sont gratuites et mises en cache sur cet appareil.</p>
        {picker && <Picker sessions={sessions} loading={list.status === 'loading'} year={pickerYear} years={[thisYear, thisYear - 1, thisYear - 2, thisYear - 3]} onYear={onYear} onPick={(s) => start(s)} onClose={() => setPicker(false)} current={null} now={now} />}
      </main>
    )
  }

  // ---------- écran de session ----------
  const s = active.session
  return (
    <main className="flex-1 w-full pb-28 lg:pb-10">
      <div className={`h-1 ${isLive ? 'bg-red-600' : 'bg-zinc-700'}`} />
      <section className={`${wide} py-3 flex flex-wrap items-center gap-x-4 gap-y-2`}>
        <span className={`inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${isLive ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-200'}`}>
          {isLive && <span className="size-2 rounded-full bg-white animate-pulse" />}{isLive ? 'Live' : 'Rejeu'}
        </span>
        <div className="min-w-0">
          <h1 className="font-black uppercase tracking-tight text-xl sm:text-2xl leading-tight truncate">{gpLabel(s)} {s.year} · {sessionFr(s.session_name)}</h1>
          <p className="text-xs text-zinc-500 truncate">{s.circuit_short_name}{s.location && s.location !== s.circuit_short_name ? ` · ${s.location}` : ''}</p>
        </div>
        {snap && (
          <div className="flex items-center gap-3 sm:ml-auto flex-wrap">
            <div className="flex items-baseline gap-2 tabular-nums" aria-label="Compteur de tours">
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Tour</span>
              <span className="text-3xl font-black leading-none">{snap.lap || '—'}</span>
              {snap.totalLaps && <span className="text-zinc-500 text-lg font-bold">/ {snap.totalLaps}</span>}
            </div>
            {track && (
              <span className={`inline-flex items-center gap-2 px-3 min-h-9 text-xs font-black uppercase tracking-wider ${track.cls}`}>
                {snap.track.kind !== 'NONE' && <FlagIcon flag={snap.track.kind === 'GREEN' ? 'GREEN' : snap.track.kind === 'YELLOW' ? 'YELLOW' : snap.track.kind === 'RED' ? 'RED' : snap.track.kind === 'CHEQUERED' ? 'CHEQUERED' : null} cat={snap.track.kind === 'SC' ? 'SafetyCar' : snap.track.kind === 'VSC' ? 'SafetyCar' : 'Flag'} msg={snap.track.kind === 'VSC' ? 'VSC' : snap.track.kind === 'SC' ? 'SAFETY CAR' : ''} size={16} />}
                {track.label}{snap.track.yellowSectors.length > 0 && snap.track.kind !== 'YELLOW' ? ` · jaune S${snap.track.yellowSectors.join(', S')}` : ''}
              </span>
            )}
            {snap.weather && <span className="text-xs text-zinc-400 tabular-nums hidden sm:inline">Air {snap.weather.air.toFixed(0)}° · Piste {snap.weather.track.toFixed(0)}°{snap.weather.rain ? ' · 🌧' : ''}</span>}
          </div>
        )}
        <div className={`flex gap-2 ${snap ? '' : 'sm:ml-auto'}`}>
          {isLive && lastRace && <button onClick={() => start(lastRace)} className={toolbarBtn}>Rejouer</button>}
          {chosen && liveSession && chosen.session.session_key !== liveSession.session_key && <button onClick={() => setChosen(null)} className={`${toolbarBtn} border-red-600`}>Retour au direct</button>}
          <button onClick={() => setPicker(true)} className={toolbarBtn}>Sessions</button>
          {chosen && !liveSession && <button onClick={() => { setChosen(null); closeDriver() }} className={toolbarBtn} aria-label="Quitter le rejeu">Fermer</button>}
        </div>
      </section>

      {rt.status === 'loading' && (
        <div className={`${wide} py-16 flex flex-col items-center gap-4 text-center`} role="status" aria-live="polite">
          <Spinner />
          <p className="text-sm text-zinc-300">Chargement de la session… <span className="text-zinc-500">{rt.progress ? `${rt.progress.label} (${rt.progress.done}/${rt.progress.total})` : ''}</span></p>
          <div className="w-64 max-w-full h-1 bg-zinc-800"><div className="h-full bg-red-600 transition-all" style={{ width: `${rt.progress ? (rt.progress.done / rt.progress.total) * 100 : 5}%` }} /></div>
        </div>
      )}

      {rt.status === 'error' && rt.error && (
        <div className="py-4">
          <Banner tone="err" action={<div className="flex gap-2"><button onClick={rt.reload} className={toolbarBtn}>Réessayer</button>{lastRace && lastRace.session_key !== s.session_key && <button onClick={() => start(lastRace)} className={whiteBtn}>Rejouer la dernière course</button>}</div>}>
            {issueText(rt.error)}
          </Banner>
        </div>
      )}

      {rt.liveIssue && rt.status === 'ready' && isLive && (
        <Banner tone="warn" action={lastRace && rt.liveIssue.kind === 'auth' ? <button onClick={() => start(lastRace)} className={`${whiteBtn}`}>Rejouer la dernière course</button> : undefined}>
          {issueText(rt.liveIssue)}
        </Banner>
      )}
      {isLive && rt.status === 'ready' && snap && !rt.liveIssue && (
        <div className={`${wide} py-1.5 text-[11px] text-zinc-500 tabular-nums border-b border-zinc-900`}>
          {rt.lastUpdate ? `Dernière mise à jour : ${new Date(rt.lastUpdate).toLocaleTimeString('fr-FR')}` : 'En attente des premières données…'} · actualisation toutes les ~4,5 s
          {snap.rows.length === 0 && ' · aucune donnée reçue pour l’instant (le direct peut être retardé ou restreint)'}
        </div>
      )}

      {store && snap && (
        <>
          {!isLive && <Controls rt={rt} lap={snap.lap} totalLaps={snap.totalLaps} onLap={stepLap} />}
          {isLive && <div className={`${wide} py-1 text-[11px] text-zinc-500`}>Session en cours · {fmtElapsed(rt.t, store.t0)}</div>}
          {snap.rows.length === 0 ? (
            <div className={`${wide} py-4`}><Card><Empty>Aucune donnée de classement disponible pour cette session.</Empty></Card></div>
          ) : desktop ? (
            <div className={`${wide} py-3 grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3 items-start`}>
              <Card>
                <Tabs tabs={LEFT} value={leftTab} onChange={setLeftTab} label="Données de course" />
                <div role="tabpanel">{panel(leftTab)}</div>
              </Card>
              <div className="flex flex-col gap-3 sticky top-[72px]">
                <Card title="Circuit" right={<span className="text-[10px] text-zinc-500 uppercase tracking-wider">Touchez un pilote</span>}>
                  <div className="p-2">{mapEl}</div>
                </Card>
                <Card>
                  <Tabs tabs={rightTabs} value={rightTab} onChange={setRightTab} label="Direction de course et pilote" />
                  <div role="tabpanel" className="max-h-[calc(100dvh-28rem)] min-h-[14rem] overflow-y-auto overscroll-contain">{panel(rightTab)}</div>
                </Card>
              </div>
            </div>
          ) : (
            <div className="py-2">
              <div className={wide}>
                <Card>
                  <Tabs tabs={mobTabs} value={mobTab} onChange={setMobTab} label="Sections du live" />
                  <div role="tabpanel">{mobTab === 'map' ? <div className="p-2">{mapEl}</div> : panel(mobTab)}</div>
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      {picker && <Picker sessions={sessions} loading={list.status === 'loading'} year={pickerYear} years={[thisYear, thisYear - 1, thisYear - 2, thisYear - 3]} onYear={onYear} onPick={(x) => start(x)} onClose={() => setPicker(false)} current={s.session_key} now={now} />}
    </main>
  )
}
