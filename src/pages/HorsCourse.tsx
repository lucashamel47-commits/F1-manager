import { useState, useEffect, useRef, lazy, Suspense, type ReactNode } from 'react'
import MotorNav, { SectionTitle, TopBar, LogoMark, type NavKey } from '../components/MotorNav'
import CarStage from '../components/CarStage'
import StatsRecords from '../components/StatsRecords'
import { colorFor } from '../lib/teamColors'
import CircuitCarousel from '../components/CircuitCarousel'
import TrackMap from '../components/TrackMap'
import { circuits, daysUntil, fmtDay, type Circuit } from '../data/circuits'
import { getSeasonWinners, season, type RaceWinner } from '../lib/f1api'
import { useGrid } from '../lib/grid'
import { useChampionship, type Title } from '../lib/championship'
import { DRIVERS, F1_PHOTO_ID, TEAMS, driverPhoto, teamById, teamByName, teamLogo, normTeamId, type GridDriver } from '../data/grid'

const LivePage = lazy(() => import('../live/LivePage'))

interface Props {
  onBack: () => void
  userEmail: string
  favDriver: string | null
  setFavDriver: (id: string) => void
  favTeam: string | null
  setFavTeam: (id: string) => void
}


const extras: Record<number, { history?: string; grip?: string; creator?: string }> = {
  18: { history: 'Inauguré en 2012, conçu par Hermann Tilke. Circuit technique avec de longs virages et une grande ligne droite qui favorise les dépassements.', grip: 'Asphalte lisse, bon grip une fois en température. Usure modérée.', creator: 'Hermann Tilke' },
  19: { history: 'Autódromo Hermanos Rodríguez, rénové en 2015. L’altitude élevée (2200 m) réduit la puissance des moteurs et augmente l’usure des freins.', grip: 'Grip correct mais usure pneus importante à cause de l’air moins dense.', creator: 'Oscar Fernández' },
  20: { history: 'Circuit historique depuis 1940, plusieurs fois rénové. Connu pour ses dépassements et l’ambiance unique du public brésilien.', grip: 'Asphalte abrasif, grip moyen, forte usure des pneus.', creator: 'Hermann Tilke (rénovation)' },
  21: { history: 'Circuit urbain inauguré en 2023. Très long avec une grande ligne droite sur le Strip. Course de nuit spectaculaire.', grip: 'Asphalte neuf, grip qui évolue fortement pendant le week-end.', creator: 'Hermann Tilke' },
  22: { history: 'Circuit moderne inauguré en 2004, utilisé en F1 depuis 2021. Très exigeant physiquement avec de nombreux virages rapides.', grip: 'Asphalte abrasif, grip élevé mais usure importante.', creator: 'Hermann Tilke' },
  23: { history: 'Circuit inauguré en 2009, rénové en 2021. Course de nuit sous les lumières, dernier Grand Prix de la saison.', grip: 'Asphalte lisse, grip stable tout le week-end.', creator: 'Hermann Tilke' },
}

/** Les 23 courses, avec date lisible et fiches détaillées quand elles existent. */
const fullSeason: any[] = circuits.map((c) => ({ ...extras[c.round], ...c, date: fmtDay(c.iso) }))

/** Index du prochain GP : première course dont le jour de course (iso) n'est pas encore passé. */
const findNextRace = () => {
  const n = new Date()
  const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
  const i = fullSeason.findIndex((r) => r.iso >= today)
  return i === -1 ? fullSeason.length - 1 : i
}


export default function HorsCourse({ onBack, userEmail, favDriver, setFavDriver, favTeam, setFavTeam }: Props) {
  const driverKey = `f1-fav-drivers-${userEmail}`
  const teamKey = `f1-fav-team-${userEmail}`
  const validateRef = useRef<HTMLButtonElement>(null)
  const { grid } = useGrid()
  const teamOf = (c?: { constructorId?: string; name?: string }) => teamByName(c?.constructorId) ?? teamByName(c?.name)
  /** Portrait officiel d'un pilote du classement (repli : silhouette du CDN). */
  const standingPhoto = (d: any, w = 160) => {
    const t = teamOf(d.Constructors?.at(-1))
    return driverPhoto(t?.slug ?? 'fallback', F1_PHOTO_ID[d.Driver.code ?? ''], w)
  }
  /** Fiche d'un pilote favori : grille en cours, sinon grille de référence. */
  const driverInfo = (id: string | null) => {
    const d = grid.find((x) => x.id === id) ?? DRIVERS.find((x) => x.id === id)
    if (!d) return null
    const t = TEAMS.find((x) => x.id === d.teamId)
    return { ...d, name: `${d.givenName} ${d.familyName}`, team: t?.name ?? '', color: t?.color ?? '#a1a1aa', photo: driverPhoto(t?.slug ?? 'fallback', d.f1, 320) }
  }

  const [step, setStep] = useState<'driver' | 'team' | 'done'>('driver')
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([])
  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomeDone, setWelcomeDone] = useState(false)
  const [nextIdx] = useState(findNextRace)
  const nextRace = fullSeason[nextIdx]
  const [subPage, setSubPage] = useState<'home' | 'standings' | 'calendar' | 'stats' | 'favorites' | 'live' | 'circuit' | 'stats-constructors' | 'stats-records'>('home')
  const champ = useChampionship()
  const liveStandings: any[] = champ.data?.drivers ?? []
  const liveConstructors: any[] = champ.data?.constructors ?? []
  const [standingsTab, setStandingsTab] = useState<'drivers' | 'constructors'>('drivers')
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null)
  const [selectedConstructor, setSelectedConstructor] = useState<any | null>(null)
  const [selectedRace, setSelectedRace] = useState<any | null>(null)
  const [selectedTeamStats, setSelectedTeamStats] = useState<any | null>(null)
  const [raceFrom, setRaceFrom] = useState<'calendar' | 'stats'>('calendar')
  const dataState = champ.data ? 'ok' : champ.state
  const [winners, setWinners] = useState<Record<number, RaceWinner>>({})
  const [winnersState, setWinnersState] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    let alive = true
    getSeasonWinners().then(
      (w) => { if (alive) { setWinners(w); setWinnersState('ok') } },
      () => { if (alive) setWinnersState('error') },
    )
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const savedDrivers = localStorage.getItem(driverKey)
    const savedTeam = localStorage.getItem(teamKey)
    if (savedDrivers) {
      const parsed = JSON.parse(savedDrivers)
      setSelectedDrivers(parsed)
      if (parsed.length > 0) setFavDriver(parsed[0])
    }
    if (savedTeam) setFavTeam(savedTeam)
    const onboarded = localStorage.getItem(driverKey + '-onboarded') === '1'
    if ((savedDrivers && savedTeam) || onboarded) {
      setStep('done')
      setShowWelcome(true)
      setTimeout(() => {
        setShowWelcome(false)
        setWelcomeDone(true)
      }, 3500)
    } else if (savedDrivers) setStep('team')
    else setStep('driver')
  }, [userEmail])

  useEffect(() => {
    if (step === 'done') localStorage.setItem(driverKey + '-onboarded', '1')
  }, [step, driverKey])

  useEffect(() => {
    if (subPage === 'circuit' || (subPage === 'calendar' && selectedRace)) {
      window.scrollTo(0, 0)
    }
  }, [subPage, selectedRace])

  const toggleDriver = (id: string) => {
    setSelectedDrivers(prev => {
      const next = prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
      localStorage.setItem(driverKey, JSON.stringify(next))
      if (next.length > 0) setFavDriver(next[0])
      return next
    })
    setTimeout(() => validateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
  }

  const scrollToValidate = () => {
    setTimeout(() => validateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
  }

  const getDaysUntilRace = () => {
    const raceDate = new Date(`${nextRace.iso}T00:00:00`)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const diff = Math.round((raceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return 'Terminé'
    if (diff === 0) return 'Aujourd’hui'
    if (diff === 1) return 'Demain'
    return `Dans ${diff} jours`
  }

  const getColor = (teamName: string) => {
    const name = teamName.toLowerCase()
    if (name.includes('red bull')) return '#3671C6'
    if (name.includes('mclaren')) return '#FF8000'
    if (name.includes('ferrari')) return '#E8002D'
    if (name.includes('mercedes')) return '#27F4D2'
    if (name.includes('aston')) return '#229971'
    if (name.includes('alpine')) return '#FF87BC'
    if (name.includes('williams')) return '#64C4FF'
    if (name.includes('rb') || name.includes('racing bulls')) return '#6692FF'
    if (name.includes('haas')) return '#B6BABD'
    if (name.includes('sauber') || name.includes('kick')) return '#52E252'
    return '#3f3f46'
  }


  const go = (k: NavKey) => {
    setSelectedRace(null)
    setSelectedDriver(null)
    setSelectedConstructor(null)
    setSelectedTeamStats(null)
    setRaceFrom('calendar')
    setSubPage(k)
  }

  const statsTabs = (active: 'overview' | 'constructors' | 'records') => {
    const ico = (d: string) => (
      <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
    )
    const tabs = [
      { key: 'overview' as const, label: 'Aperçu', page: 'stats' as const, icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
      { key: 'constructors' as const, label: 'Constructeurs', page: 'stats-constructors' as const, icon: 'M3 15l2-5h9l4 3h3v2M6 17a2 2 0 100 .01M17 17a2 2 0 100 .01M8 17h7' },
      { key: 'records' as const, label: 'Records & Historique', short: 'Records', page: 'stats-records' as const, icon: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3' },
    ]
    return (
      <div className="seg" role="tablist" aria-label="Sections des statistiques">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={active === t.key}
            onClick={() => { setSelectedTeamStats(null); setSelectedRace(null); setSubPage(t.page) }}
            className="seg-item !px-3 sm:!px-5 !text-xs sm:!text-sm"
          >
            {ico(t.icon)}
            {'short' in t ? (<><span className="sm:hidden">{t.short}</span><span className="hidden sm:inline">{t.label}</span></>) : t.label}
          </button>
        ))}
      </div>
    )
  }

  const navKey: NavKey =
    subPage === 'stats-constructors' || subPage === 'stats-records' || (subPage === 'calendar' && selectedRace && raceFrom === 'stats')
      ? 'stats'
      : subPage === 'circuit' ? 'home' : subPage
  const nav = (back?: () => void, crumb?: string, extra?: ReactNode) => (
    <MotorNav active={navKey} onNavigate={go} onExit={onBack} onBack={back} crumb={crumb} extra={extra} />
  )

  const nationalityFR: Record<string, string> = {
    Dutch: 'Néerlandais', British: 'Britannique', Monegasque: 'Monégasque',
    Australian: 'Australien', Spanish: 'Espagnol', French: 'Français',
    Thai: 'Thaïlandais', German: 'Allemand', Italian: 'Italien',
    Finnish: 'Finlandais', Mexican: 'Mexicain', Canadian: 'Canadien',
    American: 'Américain', Chinese: 'Chinois', Japanese: 'Japonais', Danish: 'Danois'
  }

  const raceDetail = (race: any, _kicker: string, back: () => void, crumb: string, pager = false) => {
    const idx = fullSeason.findIndex((r) => r.round === race.round)
    const prev = pager ? fullSeason[idx - 1] : undefined
    const nextR = pager ? fullSeason[idx + 1] : undefined
    const w = winners[race.round]
    const d = daysUntil(race.iso)
    const state = d < 0 ? (w ? `Vainqueur : ${w.name}` : 'Course terminée') : d === 0 ? 'Ce week-end' : d === 1 ? 'Demain' : `Dans ${d} jours`
    return (
      <div className="min-h-dvh w-full flex flex-col text-white pb-28 sm:pb-10">
        {nav(back, crumb)}
        <div className="app-page flex-1 grid content-start gap-8 md:grid-cols-2 md:gap-10 items-start">
          <div className="md:col-span-2 mb-4 app-in">
            <h1 className="text-[2rem] sm:text-[2.75rem] font-medium tracking-[-0.035em] leading-[1.04] text-white"><span className="mr-3" aria-hidden>{race.flag}</span>{race.name}</h1>
            <p className="text-base text-zinc-400 mt-5">{race.circuit} · {race.country} · {fmtDay(race.iso)} · <span className={d >= 0 ? 'text-white' : ''}>{state}</span></p>
          </div>
          <TrackMap src={race.map} alt={`Plan du circuit de ${race.circuit}`} unavailable={race.circuit} />
          <div className="space-y-6 min-w-0">
            {race.photo && <img src={race.photo} alt={`Le circuit de ${race.circuit}`} className="w-full h-auto rounded-3xl border border-white/[0.08]" />}
            <dl className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6"><dt className="text-xs text-zinc-500">Longueur</dt><dd className="font-semibold mt-1">{race.length}</dd></div>
              <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6"><dt className="text-xs text-zinc-500">Tours</dt><dd className="font-semibold mt-1">{race.laps ?? '—'}</dd></div>
              <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6"><dt className="text-xs text-zinc-500">Record</dt><dd className="font-semibold mt-1 tabular-nums">{race.record ?? '—'}</dd>{race.recordDriver && <p className="text-[11px] text-zinc-500 mt-0.5">{race.recordDriver}{race.recordYear ? ` · ${race.recordYear}` : ''}</p>}</div>
            </dl>
            {w && (
              <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6"><p className="text-xs text-zinc-500">Vainqueur 2026</p><p className="font-semibold mt-1">{w.name}</p><p className="text-[11px] text-zinc-500 mt-0.5">{w.team}</p></div>
            )}
          </div>
          {race.history && <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6 md:col-span-2"><p className="text-xs text-zinc-500">Histoire</p><p className="text-sm mt-1 leading-relaxed">{race.history}</p></div>}
          {race.grip && <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6"><p className="text-xs text-zinc-500">Grip</p><p className="text-sm mt-1">{race.grip}</p></div>}
          {race.creator && <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6"><p className="text-xs text-zinc-500">Concepteur</p><p className="text-sm mt-1">{race.creator}</p></div>}
          {pager && (
            <div className="md:col-span-2 mt-6 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-6">
              <button disabled={!prev} onClick={() => prev && setSelectedRace(prev)} className="min-h-12 px-4 text-sm text-zinc-300 hover:text-white active:bg-zinc-900 disabled:opacity-30 disabled:hover:text-zinc-300 text-left">
                ‹ {prev ? prev.name : 'Début de saison'}
              </button>
              <span className="text-xs text-zinc-500 tabular-nums">{idx + 1} / {fullSeason.length}</span>
              <button disabled={!nextR} onClick={() => nextR && setSelectedRace(nextR)} className="min-h-12 px-4 text-sm text-zinc-300 hover:text-white active:bg-zinc-900 disabled:opacity-30 disabled:hover:text-zinc-300 text-right">
                {nextR ? nextR.name : 'Fin de saison'} ›
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (step === 'done') {
    if (showWelcome && !welcomeDone) {
      const text = 'Bienvenue dans le mode Hors Course'
      return (
        <div className="min-h-dvh text-white flex items-center justify-center">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-medium tracking-[-0.035em] leading-[1.05] text-center px-6">
            {text.split('').map((char, i) => (
              <span key={i} className="inline-block opacity-0 animate-fadeIn" style={{ animationDelay: `${i * 40}ms` }}>
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </h1>
        </div>
      )
    }

    if (subPage === 'circuit') {
      return raceDetail(fullSeason.find((r) => r.round === nextRace.round) ?? nextRace, 'Prochain GP', () => setSubPage('home'), 'Circuit')
    }

    if (subPage === 'calendar') {
      if (selectedRace) {
        const fromStats = raceFrom === 'stats'
        return raceDetail(
          selectedRace,
          fromStats ? 'Circuit' : 'Course',
          fromStats ? () => { setSelectedRace(null); setSubPage('stats') } : () => setSelectedRace(null),
          fromStats ? 'Statistiques › Circuit' : 'Course',
          true,
        )
      }

      return (
        <div className="min-h-dvh w-full flex flex-col text-white">
          {nav(() => setSubPage('home'), "Calendrier")}
          <div className="app-page flex-1 grid content-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <SectionTitle h1 kicker="Saison 2026" title="Calendrier" className="col-span-full" />
            {fullSeason.map((race) => (
              <button key={race.round} onClick={() => { setRaceFrom('calendar'); setSelectedRace(race) }} className="group text-left bg-zinc-950 border border-white/[0.08] rounded-3xl overflow-hidden transition duration-300 hover:-translate-y-1">
                <div className="relative aspect-video overflow-hidden bg-[#0c0d0e]">
                  <img src={race.photo} alt={`Le circuit de ${race.circuit}`} loading="lazy" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08090a]/80 to-transparent" />
                  <span className="absolute top-3 left-3 chip">Manche {race.round}</span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold tracking-[-0.02em]">{race.flag} {race.name}</h3>
                  <p className="text-sm text-zinc-500 mt-1.5">{race.circuit} • {race.country} • {race.date}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (subPage === 'standings') {
      if (selectedDriver) {
        const teamName = selectedDriver.Constructors[0]?.name || ''
        const nat = nationalityFR[selectedDriver.Driver.nationality] || selectedDriver.Driver.nationality
        return (
          <div className="min-h-dvh w-full flex flex-col text-white">
            {nav(() => setSelectedDriver(null), "Pilote")}
            <div className="app-page flex-1 grid content-start gap-8 lg:grid-cols-3 lg:gap-10 items-start">
              <div className="text-center lg:row-span-2 lg:self-center">
                <img src={standingPhoto(selectedDriver, 320)} alt="" className="w-28 h-28 sm:w-32 sm:h-32 rounded-full mx-auto mb-8 bg-[#17181a] border border-white/10 object-cover object-top" />
                <h1 className="text-gradient text-4xl sm:text-5xl font-medium tracking-[-0.035em] leading-[1.05]">{selectedDriver.Driver.givenName} {selectedDriver.Driver.familyName}</h1>
                <p className="text-base text-zinc-500 mt-3">{teamName}</p>
              </div>
              <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6 lg:col-span-2">
                <p className="text-sm leading-relaxed text-zinc-300">Pilote de Formule 1 en compétition pour le championnat.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:col-span-2">
                <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6 text-center"><p className="text-xs text-zinc-500">Points</p><p className="text-gradient text-3xl font-semibold tracking-[-0.03em] mt-2">{selectedDriver.points}</p></div>
                <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6 text-center"><p className="text-xs text-zinc-500">Victoires</p><p className="text-gradient text-3xl font-semibold tracking-[-0.03em] mt-2">{selectedDriver.wins}</p></div>
                <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6 text-center"><p className="text-xs text-zinc-500">Position</p><p className="text-gradient text-3xl font-semibold tracking-[-0.03em] mt-2">{selectedDriver.position}</p></div>
                <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6 text-center"><p className="text-xs text-zinc-500">Nationalité</p><p className="text-gradient text-2xl font-semibold tracking-[-0.03em] mt-2 break-words">{nat}</p></div>
              </div>
            </div>
          </div>
        )
      }

      if (selectedConstructor) {
        const nat = nationalityFR[selectedConstructor.Constructor.nationality] || selectedConstructor.Constructor.nationality
        return (
          <div className="min-h-dvh w-full flex flex-col text-white">
            {nav(() => setSelectedConstructor(null), "Écurie")}
            <div className="app-page flex-1 space-y-12 content-start">
              <h1 className="text-gradient text-4xl sm:text-6xl font-medium tracking-[-0.035em] text-center leading-[1.05]">{selectedConstructor.Constructor.name}</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:col-span-2">
                <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6 text-center"><p className="text-xs text-zinc-500">Points</p><p className="text-gradient text-3xl font-semibold tracking-[-0.03em] mt-2">{selectedConstructor.points}</p></div>
                <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6 text-center"><p className="text-xs text-zinc-500">Victoires</p><p className="text-gradient text-3xl font-semibold tracking-[-0.03em] mt-2">{selectedConstructor.wins}</p></div>
                <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6 text-center"><p className="text-xs text-zinc-500">Position</p><p className="text-gradient text-3xl font-semibold tracking-[-0.03em] mt-2">{selectedConstructor.position}</p></div>
                <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6 text-center"><p className="text-xs text-zinc-500">Nationalité</p><p className="text-gradient text-2xl font-semibold tracking-[-0.03em] mt-2 break-words">{nat}</p></div>
              </div>
            </div>
          </div>
        )
      }

      const title: Title | null = standingsTab === 'drivers' ? champ.data?.driverTitle ?? null : champ.data?.constructorTitle ?? null
      const updated = champ.data ? new Date(champ.data.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null
      const list = standingsTab === 'drivers' ? liveStandings : liveConstructors
      const max = Number(list[0]?.points) || 1
      return (
        <div className="min-h-dvh w-full flex flex-col text-white">
          {nav(() => setSubPage('home'), "Classements")}
          <div className="app-page flex-1">
            <SectionTitle h1 kicker={`Championnat ${champ.data?.season ?? ''}`} title="Classements" className="" />
            <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
              <div className="seg" role="tablist" aria-label="Type de classement">
                <button role="tab" aria-selected={standingsTab === 'drivers'} onClick={() => setStandingsTab('drivers')} className="seg-item">Pilotes</button>
                <button role="tab" aria-selected={standingsTab === 'constructors'} onClick={() => setStandingsTab('constructors')} className="seg-item">Constructeurs</button>
              </div>
              {champ.data && (
                <p className="flex items-center gap-2 text-[13px] text-[#939494]">
                  <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-white/40" /><span className="relative inline-flex size-2 rounded-full bg-white" /></span>
                  En direct · après la manche {champ.data.round}/{champ.data.totalRounds}{champ.data.lastRaceName ? ` (${champ.data.lastRaceName.replace('Grand Prix', 'GP')})` : ''} · mis à jour à {updated}
                </p>
              )}
            </div>

            {title && (
              title.decided ? (
                <div className="mb-10 overflow-hidden rounded-3xl border border-white/[0.1] bg-[#101112]">
                  <div className="flex flex-col gap-8 p-7 sm:flex-row sm:items-center sm:p-10">
                    {standingsTab === 'drivers' && liveStandings[0] ? (
                      <img src={standingPhoto(liveStandings[0], 320)} alt="" className="size-28 shrink-0 rounded-full border border-white/10 bg-[#17181a] object-cover object-top sm:size-32" />
                    ) : liveConstructors[0] && teamOf(liveConstructors[0].Constructor) ? (
                      <span className="grid size-28 shrink-0 place-items-center rounded-full border border-white/10 bg-[#17181a] sm:size-32"><img src={teamLogo(teamOf(liveConstructors[0].Constructor)!)} alt="" className="size-16" /></span>
                    ) : null}
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0a0a0a]">
                        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3" /></svg>
                        {standingsTab === 'drivers' ? 'Champion du monde' : 'Champion constructeurs'} {champ.data?.season}
                      </span>
                      <p className="mt-5 text-[2rem] font-medium leading-[1.05] tracking-[-0.035em] sm:text-[2.75rem]">{title.leaderName}</p>
                      <p className="mt-3 text-[15px] leading-relaxed text-[#939494]">
                        {title.seasonOver
                          ? `Saison terminée${standingsTab === 'drivers' ? ` · ${title.leaderTeam}` : ''} · ${title.lead} points d'avance.`
                          : `Titre mathématiquement assuré${standingsTab === 'drivers' ? ` avec ${title.leaderTeam}` : ''} : ${title.lead} points d'avance, ${title.remaining} encore en jeu sur ${title.racesLeft} course${title.racesLeft > 1 ? 's' : ''}.`}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-10 flex flex-wrap items-baseline justify-between gap-3 rounded-2xl border border-white/[0.08] px-6 py-5">
                  <p className="text-[15px]"><span className="text-[#939494]">Course au titre · </span>{title.leaderName} mène de <span className="font-semibold tabular-nums">{title.lead} pts</span></p>
                  <p className="text-[13px] text-[#939494] tabular-nums">{title.remaining} pts encore en jeu · {title.racesLeft} course{title.racesLeft > 1 ? 's' : ''}{title.sprintsLeft ? ` + ${title.sprintsLeft} sprint${title.sprintsLeft > 1 ? 's' : ''}` : ''}</p>
                </div>
              )
            )}

            {list.length === 0 ? (
              champ.state === 'error'
                ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] px-5 py-4" role="alert"><p className="text-sm text-zinc-300">Impossible de charger les classements.</p><button onClick={champ.reload} className="btn-primary min-h-11 px-5 rounded-full text-sm font-semibold">Réessayer</button></div>
                : <div className="space-y-2" aria-busy="true">{Array.from({ length: 8 }, (_, i) => <div key={i} className="h-16 rounded-2xl bg-white/[0.03] animate-pulse" />)}</div>
            ) : (
              <ol className="overflow-hidden rounded-3xl border border-white/[0.08] divide-y divide-white/[0.06]">
                {standingsTab === 'drivers' ? liveStandings.map((d, i) => {
                  const t = teamOf(d.Constructors.at(-1))
                  const champion = i === 0 && title?.decided
                  return (
                    <li key={d.Driver.driverId}>
                      <button onClick={() => setSelectedDriver(d)} className="grid w-full grid-cols-[2rem_2.75rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03] sm:grid-cols-[2.5rem_3rem_minmax(0,1fr)_10rem_auto] sm:gap-4 sm:px-6">
                        <span className="text-sm tabular-nums text-[#636464]">{d.position}</span>
                        <img src={standingPhoto(d, 160)} alt="" loading="lazy" className="size-11 rounded-full bg-[#17181a] object-cover object-top sm:size-12" />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2"><span className="truncate text-[15px] font-medium">{d.Driver.givenName} {d.Driver.familyName}</span>{champion && <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-black">Champion</span>}</span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-[#636464]"><span className="size-1.5 rounded-full" style={{ backgroundColor: t?.color ?? '#636464' }} />{d.Constructors.at(-1)?.name}</span>
                        </span>
                        <span className="hidden h-1 rounded-full bg-white/[0.06] sm:block"><span className="block h-full rounded-full bg-white/70" style={{ width: `${(Number(d.points) / max) * 100}%` }} /></span>
                        <span className="text-right"><span className="block text-[17px] font-semibold tabular-nums">{d.points}</span><span className="block text-[11px] text-[#636464]">{d.wins} victoire{Number(d.wins) > 1 ? 's' : ''}</span></span>
                      </button>
                    </li>
                  )
                }) : liveConstructors.map((c, i) => {
                  const t = teamOf(c.Constructor)
                  const champion = i === 0 && title?.decided
                  return (
                    <li key={c.Constructor.constructorId}>
                      <button onClick={() => setSelectedConstructor(c)} className="grid w-full grid-cols-[2rem_2.75rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03] sm:grid-cols-[2.5rem_3rem_minmax(0,1fr)_10rem_auto] sm:gap-4 sm:px-6">
                        <span className="text-sm tabular-nums text-[#636464]">{c.position}</span>
                        <span className="grid size-11 place-items-center rounded-full border border-white/[0.08] bg-[#141516] sm:size-12">{t && <img src={teamLogo(t)} alt="" className="size-7" />}</span>
                        <span className="min-w-0 flex items-center gap-2"><span className="truncate text-[15px] font-medium">{c.Constructor.name}</span>{champion && <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-black">Champion</span>}</span>
                        <span className="hidden h-1 rounded-full bg-white/[0.06] sm:block"><span className="block h-full rounded-full" style={{ width: `${(Number(c.points) / max) * 100}%`, backgroundColor: t?.color ?? '#fff' }} /></span>
                        <span className="text-right"><span className="block text-[17px] font-semibold tabular-nums">{c.points}</span><span className="block text-[11px] text-[#636464]">{c.wins} victoire{Number(c.wins) > 1 ? 's' : ''}</span></span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            )}
            <p className="mt-6 text-xs text-[#636464]">Source : Jolpica-F1, actualisé automatiquement toutes les 5 minutes. Barème 2026 : 25 points par course, 8 par sprint.</p>
          </div>
        </div>
      )
    }

if (subPage === 'stats-records') {
  return (
    <div className="min-h-dvh w-full flex flex-col text-white pb-28 sm:pb-10">
      {nav(() => setSubPage('home'), 'Records & Historique', statsTabs('records'))}
      <StatsRecords />
    </div>
  )
}

if (subPage === 'stats-constructors') {
  if (selectedTeamStats) {
    const name = selectedTeamStats.Constructor.name.toLowerCase()
    let fournisseur = 'Red Bull Ford'
    let noteMoteur = 'Premier moteur maison de Red Bull (DM01), développé avec Ford. L’écurie conçoit pour la première fois son propre groupe motopropulseur.'
    let noteAero = 'Red Bull va chercher à maximiser l’efficacité en ligne droite avec les ailes actives, tout en gardant un bon appui dans les virages rapides.'
    let officialSite = 'https://www.redbullracing.com'

    if (name.includes('ferrari')) {
      fournisseur = 'Ferrari'
      noteMoteur = 'Moteur entièrement développé à Maranello. Ferrari fournit aussi Haas et Cadillac.'
      noteAero = 'Ferrari devra adapter son concept aéro pour bien gérer le passage entre mode virage et mode ligne droite.'
      officialSite = 'https://www.ferrari.com/en-EN/formula1'
    } else if (name.includes('mercedes')) {
      fournisseur = 'Mercedes'
      noteMoteur = 'Mercedes fournit McLaren, Williams et Alpine. Référence en gestion de l’énergie et fiabilité.'
      noteAero = 'Mercedes va chercher à tirer le meilleur parti des ailes actives sur les circuits à longues lignes droites.'
      officialSite = 'https://www.mercedesamgf1.com'
    } else if (name.includes('mclaren')) {
      fournisseur = 'Mercedes'
      noteMoteur = 'Client Mercedes depuis 2021. Partenariat prolongé jusqu’en 2030.'
      noteAero = 'McLaren va chercher à maximiser les zones de freinage et les virages rapides.'
      officialSite = 'https://www.mclaren.com/racing'
    } else if (name.includes('aston')) {
      fournisseur = 'Honda'
      noteMoteur = 'Partenariat exclusif avec Honda à partir de 2026. Honda revient avec un moteur entièrement nouveau.'
      noteAero = 'Aston Martin devra adapter son concept aéro au nouveau moteur Honda.'
      officialSite = 'https://www.astonmartinf1.com'
    } else if (name.includes('williams')) {
      fournisseur = 'Mercedes'
      noteMoteur = 'Client Mercedes. Williams bénéficie de la puissance et de la fiabilité du constructeur allemand.'
      noteAero = 'Williams espère réduire l’écart grâce aux ailes actives sur les longues lignes droites.'
      officialSite = 'https://www.williamsf1.com'
    } else if (name.includes('alpine')) {
      fournisseur = 'Mercedes'
      noteMoteur = 'Alpine passe chez Mercedes en 2026. Un changement majeur qui permet de se concentrer sur le châssis.'
      noteAero = 'Le passage à Mercedes va permettre à Alpine de mieux travailler sur les ailes actives.'
      officialSite = 'https://www.alpinecars.com/en/formula-1'
    } else if (name.includes('haas')) {
      fournisseur = 'Ferrari'
      noteMoteur = 'Client Ferrari. Haas utilise le même groupe motopropulseur que Ferrari.'
      noteAero = 'Haas va chercher à maximiser les zones de dépassement avec le nouveau règlement.'
      officialSite = 'https://www.haasf1team.com'
    } else if (name.includes('audi')) {
      fournisseur = 'Audi'
      noteMoteur = 'Audi développe son propre moteur pour sa première saison en Formule 1. Un projet ambitieux pour la marque allemande.'
      noteAero = 'Audi devra rapidement maîtriser les ailes actives et le mode dépassement dès sa première année.'
      officialSite = 'https://www.audi.com'
    } else if (name.includes('sauber') || name.includes('kick')) {
      fournisseur = 'Audi'
      noteMoteur = 'Sauber devient Audi. L’équipe prépare la transition vers la marque allemande.'
      noteAero = 'Sauber travaille sur l’adaptation aux nouvelles règles aérodynamiques de 2026.'
      officialSite = 'https://www.sauber-group.com'
    } else if (name.includes('cadillac')) {
      fournisseur = 'Ferrari'
      noteMoteur = 'Cadillac utilise un moteur Ferrari pour ses débuts en Formule 1. L’équipe américaine arrive avec un projet ambitieux.'
      noteAero = 'Cadillac devra rapidement maîtriser les ailes actives pour être compétitive dès sa première saison.'
      officialSite = 'https://www.cadillac.com'
    } else if (name.includes('racing bulls') || name.includes('rb')) {
      fournisseur = 'Red Bull Ford'
      noteMoteur = 'Utilise le même groupe motopropulseur que Red Bull Racing.'
      noteAero = 'Racing Bulls profite des connaissances de Red Bull en aérodynamique.'
      officialSite = 'https://www.visacashapprb.com'
    }

    const youtube = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(selectedTeamStats.Constructor.name + ' F1 2026')

    return (
      <div className="min-h-dvh w-full flex flex-col text-white">
        {nav(() => setSelectedTeamStats(null), selectedTeamStats.Constructor.name)}

        <div className="app-page flex-1 lg:grid lg:grid-cols-2 lg:gap-x-12 lg:content-start">
          <div className="lg:col-span-2 flex items-center justify-between gap-4"><SectionTitle h1 kicker="Écurie 2026" title={selectedTeamStats.Constructor.name} />{(() => { const gt = teamByName(selectedTeamStats.Constructor.constructorId) ?? teamByName(selectedTeamStats.Constructor.name); return gt ? <span className="grid size-16 sm:size-20 shrink-0 place-items-center rounded-2xl border border-white/[0.08] bg-[#141516]"><img src={teamLogo(gt)} alt={gt.name} className="size-10 sm:size-12 object-contain" /></span> : null })()}</div>

          {(() => { const gt = teamOf(selectedTeamStats.Constructor); return gt ? <CarStage team={gt} size="lg" className="rounded-3xl border border-white/[0.08] aspect-[16/9] lg:aspect-auto lg:h-full lg:min-h-[28rem] mb-8 lg:mb-0" /> : null })()}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 items-start">
            <div className="rounded-3xl border border-white/[0.08] bg-zinc-950 p-6 md:col-span-2 lg:col-span-1">
              <p className="kicker mb-6">Classement</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-medium">{selectedTeamStats.position}</p>
                  <p className="text-xs text-zinc-500 mt-1">Position</p>
                </div>
                <div>
                  <p className="text-2xl font-medium">{selectedTeamStats.points}</p>
                  <p className="text-xs text-zinc-500 mt-1">Points</p>
                </div>
                <div>
                  <p className="text-2xl font-medium">{selectedTeamStats.wins || '0'}</p>
                  <p className="text-xs text-zinc-500 mt-1">Victoires</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-zinc-950 p-6">
              <p className="kicker mb-6">Groupe motopropulseur</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4"><span className="text-zinc-500">Fournisseur</span><span>{fournisseur}</span></div>
                <div className="flex justify-between gap-4"><span className="text-zinc-500">Puissance totale</span><span>~1 000 ch</span></div>
                <div className="flex justify-between gap-4"><span className="text-zinc-500">Moteur thermique</span><span>~400 kW</span></div>
                <div className="flex justify-between gap-4"><span className="text-zinc-500">Moteur électrique</span><span>350 kW</span></div>
                <div className="flex justify-between gap-4"><span className="text-zinc-500">Récupération max</span><span>8,5 MJ / tour</span></div>
              </div>
              <p className="text-sm text-zinc-400 mt-5 leading-relaxed">{noteMoteur}</p>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-zinc-950 p-6">
              <p className="kicker mb-6">Aérodynamique</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4"><span className="text-zinc-500">Mode Virage</span><span className="text-right">Appui maximum</span></div>
                <div className="flex justify-between gap-4"><span className="text-zinc-500">Mode Ligne droite</span><span>−55 % de traînée</span></div>
                <div className="flex justify-between gap-4"><span className="text-zinc-500">Mode Dépassement</span><span>À moins d’1 seconde</span></div>
              </div>
              <p className="text-sm text-zinc-400 mt-5 leading-relaxed">{noteAero}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 pt-8 lg:col-span-2">
            <a href={officialSite} target="_blank" rel="noopener noreferrer" className="btn-ghost block w-full text-center py-3.5 min-h-12 rounded-full text-sm text-zinc-200">
              Site officiel
            </a>
            <a href={youtube} target="_blank" rel="noopener noreferrer" className="btn-ghost block w-full text-center py-3.5 min-h-12 rounded-full text-sm text-zinc-200">
              Actualités YouTube
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh w-full flex flex-col text-white">
      {nav(() => setSubPage('home'), "Constructeurs", statsTabs('constructors'))}
      <div className="app-page flex-1 grid content-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <SectionTitle h1 kicker="Statistiques" title="Constructeurs" desc="Le championnat par écurie. Touchez une voiture pour voir ses chiffres, ses pilotes et son aéro." className="col-span-full" />
        {liveConstructors.length === 0 && dataState === 'loading' && Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-video bg-zinc-950 border border-white/[0.06] rounded-3xl animate-pulse" aria-busy="true" />)}
        {liveConstructors.length === 0 && dataState === 'error' && (
          <div className="col-span-full flex flex-wrap items-center justify-between gap-3 border border-white/[0.08] bg-zinc-950 rounded-2xl px-5 py-4" role="alert">
            <p className="text-sm text-zinc-300">Impossible de charger les écuries.</p>
            <button onClick={champ.reload} className="btn-primary min-h-11 px-5 rounded-full text-sm font-semibold">Réessayer</button>
          </div>
        )}
        {liveConstructors.map((t, i) => (
          <button key={t.Constructor.constructorId} onClick={() => setSelectedTeamStats(t)} className="group text-left bg-zinc-950 border border-white/[0.08] rounded-3xl overflow-hidden transition duration-300 hover:-translate-y-1">
            <div className="relative">
              {teamOf(t.Constructor) ? <CarStage team={teamOf(t.Constructor)!} className="aspect-video" /> : <div className="aspect-video bg-[#0c0d0e]" />}
              <span className="absolute top-3 right-3 chip">P{i + 1}</span>
            </div>
            <div className="p-6 flex items-end justify-between gap-3" >
              <h3 className="text-lg font-semibold tracking-tight leading-tight">{t.Constructor.name}</h3>
              <p className="text-sm text-zinc-500 shrink-0"><span className="font-semibold text-2xl text-white tabular-nums">{t.points}</span> pts <span className="ml-1 text-zinc-600 group-hover:text-white transition" aria-hidden>›</span></p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

    if (subPage === 'stats') {
      const leader = liveStandings[0]
      const second = liveStandings[1]
      const gap = leader && second ? Number(leader.points) - Number(second.points) : 0
      const done = Math.max(0, circuits.filter((c) => c.round < nextRace.round).length)
      const loading = dataState === 'loading' && liveStandings.length === 0
      const failed = dataState === 'error' && liveStandings.length === 0
      const head = (label: string, cta?: string, onClick?: () => void) => (
        <div className="flex items-center justify-between gap-3 mb-6 min-h-9">
          <p className="kicker">{label}</p>
          {cta && onClick && (
            <button onClick={onClick} className="-mr-2 px-2 min-h-9 text-xs text-zinc-400 hover:text-white active:text-white whitespace-nowrap">{cta} ›</button>
          )}
        </div>
      )
      const skeleton = (n = 3, h = 'h-14') => (
        <div className="space-y-3" aria-busy="true" aria-label="Chargement">
          {Array.from({ length: n }, (_, i) => <div key={i} className={`${h} bg-zinc-950 border border-white/[0.06] rounded-2xl animate-pulse`} />)}
        </div>
      )
      const row = 'w-full flex items-center justify-between gap-3 bg-zinc-950 border border-white/[0.08] rounded-2xl px-5 py-4 text-left transition hover:-translate-y-0.5'
      return (
        <div className="min-h-dvh w-full flex flex-col text-white pb-28 sm:pb-10">
          {nav(() => setSubPage('home'), "Statistiques", statsTabs('overview'))}
          <div className="app-page flex-1 grid content-start gap-x-8 gap-y-16 md:grid-cols-2 lg:gap-x-12 lg:gap-y-20 items-start">
            <SectionTitle h1 kicker="Saison 2026" title="Statistiques" desc={`Le championnat en un coup d’œil : ${done} courses disputées sur ${circuits.length}. Touchez une carte pour voir le détail.`} className="col-span-full" />

            <CircuitCarousel
              nextRound={nextRace.round}
              winners={winners}
              winnersState={winnersState}
              onOpen={(c: Circuit) => { setRaceFrom('stats'); setSelectedRace(fullSeason.find((r) => r.round === c.round) ?? c); setSubPage('calendar') }}
            />

            {failed && (
              <div className="col-span-full flex flex-wrap items-center justify-between gap-3 border border-white/[0.08] bg-zinc-950 rounded-2xl px-5 py-4" role="alert">
                <p className="text-sm text-zinc-300">Impossible de charger les classements. Vérifiez votre connexion.</p>
                <button onClick={champ.reload} className="btn-primary min-h-11 px-5 rounded-full text-sm font-semibold">Réessayer</button>
              </div>
            )}

            <div className="min-w-0">
              {head('Title fight', 'Classement', () => setSubPage('standings'))}
              {leader && second ? (
                <button onClick={() => setSubPage('standings')} className="group w-full text-left bg-zinc-950 border border-zinc-800 hover:border-zinc-600 active:bg-zinc-900 rounded-2xl p-5 transition">
                  <div className="flex justify-between items-end mb-8">
                    <div><p className="text-xs text-zinc-500">{leader.Driver.familyName}</p><p className="text-gradient text-5xl font-semibold tracking-[-0.04em] mt-1">{leader.points}</p><p className="text-xs text-zinc-500 mt-1">{leader.wins} victoires</p></div>
                    <div className="text-right"><p className="text-xs text-zinc-500">{second.Driver.familyName}</p><p className="text-5xl font-semibold tracking-[-0.04em] text-zinc-500 mt-1">{second.points}</p><p className="text-xs text-zinc-500 mt-1">{second.wins} victoires</p></div>
                  </div>
                  <div className="flex gap-1 h-2 rounded-full overflow-hidden bar-rail mb-4">
                    <div className="bar-fill" style={{ width: `${(Number(leader.points) / (Number(leader.points) + Number(second.points))) * 100}%` }} />
                    <div className="bg-white/10 flex-1 rounded-full" />
                  </div>
                  <p className="text-xs text-zinc-500 text-center">{champ.data?.driverTitle?.decided ? `${leader.Driver.familyName} est champion du monde · ${gap} points d'avance` : `Écart : ${gap} points`}</p>
                </button>
              ) : loading ? skeleton(1, 'h-40') : <p className="text-sm text-zinc-500">Aucune donnée pour le moment.</p>}
            </div>

            <div className="min-w-0">
              {head('Top 3', 'Tout voir', () => setSubPage('standings'))}
              {loading ? skeleton() : liveStandings.length === 0 ? <p className="text-sm text-zinc-500">Aucune donnée pour le moment.</p> : (
                <div className="space-y-3">
                  {liveStandings.slice(0, 3).map((d, i) => (
                    <button key={d.Driver.driverId} onClick={() => { setSelectedDriver(d); setSubPage('standings') }} className={row}>
                      <div className="flex items-center gap-3 min-w-0"><span className="text-xs text-zinc-600 w-5">{i + 1}</span><div className="min-w-0"><p className="text-sm font-medium truncate">{d.Driver.familyName}</p><p className="text-xs text-zinc-500 truncate">{d.Constructors[0]?.name}</p></div></div>
                      <div className="flex items-center gap-2 shrink-0"><div className="text-right"><p className="text-sm font-semibold">{d.points}</p><p className="text-[11px] text-zinc-500">{d.wins} win{Number(d.wins) !== 1 ? 's' : ''}</p></div><span className="text-zinc-600" aria-hidden>›</span></div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="min-w-0">
              {head('Essentiels')}
              {loading ? skeleton(2, 'h-20') : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6"><p className="text-xs text-zinc-500">Moy. points / course</p><p className="text-gradient text-2xl font-semibold tracking-[-0.03em] mt-2">{leader && done ? (Number(leader.points) / done).toFixed(1) : '-'}</p></div>
                  <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6"><p className="text-xs text-zinc-500">Victoires leader</p><p className="text-gradient text-2xl font-semibold tracking-[-0.03em] mt-2">{leader?.wins || '-'}</p></div>
                  <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6"><p className="text-xs text-zinc-500">Écart au 2e</p><p className="text-gradient text-2xl font-semibold tracking-[-0.03em] mt-2">{leader ? `${gap} pts` : '-'}</p></div>
                  <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6"><p className="text-xs text-zinc-500">Écurie leader</p><p className="text-gradient text-2xl font-semibold tracking-[-0.03em] mt-2 break-words">{liveConstructors[0]?.Constructor.name || '-'}</p></div>
                </div>
              )}
            </div>

            <div className="min-w-0">
              {head('Constructeurs', 'Tout voir', () => setSubPage('stats-constructors'))}
              {loading ? skeleton() : liveConstructors.length === 0 ? <p className="text-sm text-zinc-500">Aucune donnée pour le moment.</p> : (
                <div className="space-y-3">
                  {liveConstructors.slice(0, 3).map((t, i) => (
                    <button key={t.Constructor.constructorId} onClick={() => { setSelectedTeamStats(t); setSubPage('stats-constructors') }} className={row}>
                      <div className="flex items-center gap-3 min-w-0"><span className="text-xs text-zinc-600 w-5">{i + 1}</span><p className="text-sm font-medium truncate">{t.Constructor.name}</p></div>
                      <div className="flex items-center gap-2 shrink-0"><div className="text-right"><p className="text-sm font-semibold">{t.points}</p><p className="text-[11px] text-zinc-500">{t.wins} win{Number(t.wins) !== 1 ? 's' : ''}</p></div><span className="text-zinc-600" aria-hidden>›</span></div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-full min-w-0 border-t border-white/[0.07] pt-16">
              {head('Classement pilotes', 'Voir le classement complet', () => setSubPage('standings'))}
              {loading ? skeleton(4, 'h-10') : (
                <ol className="grid gap-x-12 md:grid-cols-2">
                  {liveStandings.slice(0, 12).map((d, i) => {
                    const max = Number(liveStandings[0]?.points) || 1
                    return (
                      <li key={d.Driver.driverId} className="min-w-0">
                        <button onClick={() => { setSelectedDriver(d); setSubPage('standings') }} className="w-full text-left py-4 border-b border-white/[0.06] hover:bg-white/[0.03] transition">
                          <div className="flex items-baseline gap-3">
                            <span className="w-5 text-xs text-zinc-600 tabular-nums">{i + 1}</span>
                            <span className="flex-1 min-w-0 truncate text-sm">{d.Driver.givenName} <span className="font-semibold">{d.Driver.familyName}</span></span>
                            <span className="text-sm font-semibold tabular-nums">{d.points}</span>
                          </div>
                          <div className="ml-8 mt-2.5 h-1.5 bar-rail"><div className="h-full rounded-full" style={{ width: `${(Number(d.points) / max) * 100}%`, background: `linear-gradient(90deg, ${colorFor(d.Constructors[0]?.name)}66, ${colorFor(d.Constructors[0]?.name)})`, boxShadow: `0 0 12px -2px ${colorFor(d.Constructors[0]?.name)}88` }} /></div>
                        </button>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          </div>
        </div>
      )
    }

    if (subPage === 'live') {
      return (
        <div className="min-h-dvh w-full flex flex-col text-white">
          {nav(() => setSubPage('home'), 'Live')}
          <Suspense fallback={<p className="p-8 text-sm text-zinc-500">Chargement du live…</p>}><LivePage /></Suspense>
        </div>
      )
    }

    if (subPage === 'favorites') {
      const driver = driverInfo(favDriver)
      const team = teamById(favTeam)
      return (
        <div className="min-h-dvh w-full flex flex-col text-white">
          {nav(() => setSubPage('home'), "Tes favoris")}
          <div className="app-page flex-1 grid content-start gap-8 md:grid-cols-2 items-start">
            <SectionTitle h1 kicker="Ton paddock" title="Tes favoris" className="col-span-full" />
            {driver && (
              <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6">
                <div className="flex items-center gap-5 mb-8">
                  <img src={driver.photo} alt={driver.name} className="w-20 h-20 shrink-0 rounded-full bg-[#141516] object-cover object-top ring-1 ring-white/10" />
                  <div><p className="text-2xl font-semibold tracking-[-0.03em]">{driver.name}</p><p className="text-sm text-zinc-500 mt-1">{driver.team}</p></div>
                </div>
                <a href={`https://www.formula1.com/en/drivers/${driver.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ /g, '-')}`} target="_blank" rel="noreferrer" className="btn-ghost block w-full py-3 min-h-12 rounded-full text-center text-sm font-medium">Voir les actualités</a>
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(driver.name + ' F1')}`} target="_blank" rel="noreferrer" className="btn-ghost block w-full py-3 min-h-12 mt-3 rounded-full text-center text-sm font-medium">Vidéos récentes</a>
              </div>
            )}
            {team && (
              <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6">
                <div className="flex items-center gap-5 mb-8">
                  <span className="grid size-20 shrink-0 place-items-center rounded-2xl border border-white/[0.08] bg-[#141516]"><img src={teamLogo(team)} alt={team.name} className="size-12 object-contain" /></span>
                  <p className="text-2xl font-semibold tracking-[-0.03em]">{team.name}</p>
                </div>
                <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(team.name.replace(' Racing', ''))}`} target="_blank" rel="noreferrer" className="btn-ghost block w-full py-3 min-h-12 rounded-full text-center text-sm font-medium">Voir les actualités</a>
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(team.name + ' F1')}`} target="_blank" rel="noreferrer" className="btn-ghost block w-full py-3 min-h-12 mt-3 rounded-full text-center text-sm font-medium">Vidéos récentes</a>
              </div>
            )}
            {!driver && !team && <p className="text-zinc-500 md:col-span-2">Aucun favori sélectionné</p>}
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-dvh w-full flex flex-col text-white">
        {nav()}
        <main className="flex-1 w-full pb-32">
          <div className="app-wrap pt-6 sm:pt-10 app-in">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSubPage('circuit')}
              onKeyDown={(e) => { if (e.key === 'Enter') setSubPage('circuit') }}
              className="group relative block overflow-hidden rounded-[2rem] border border-white/[0.09] cursor-pointer shadow-[0_40px_100px_-40px_rgb(0_0_0_/_0.95)]"
            >
              <img src={nextRace.photo} alt="" className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:scale-105 transition duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08090a] via-[#08090a]/55 to-[#08090a]/10" />
              <div className="relative min-h-[24rem] sm:min-h-[30rem] lg:min-h-[34rem] flex flex-col justify-end p-6 sm:p-12 lg:p-16 pt-24">
                <span className="self-start chip">Prochain GP • Round {nextRace.round}</span>
                <h1 className="text-gradient mt-6 font-medium leading-[1.04] tracking-[-0.04em] text-[2.5rem] sm:text-[4rem] lg:text-[4.5rem]">{nextRace.name}</h1>
                <p className="mt-6 text-zinc-300 text-base sm:text-lg">{nextRace.date} • {nextRace.circuit} • <span className="text-white font-semibold">{getDaysUntilRace()}</span></p>
                <span className="btn-primary mt-8 self-start inline-flex items-center min-h-12 rounded-full text-white font-semibold text-sm px-7">Voir le circuit →</span>
              </div>
            </div>
          </div>

          <div className="app-wrap pt-24 sm:pt-32">
            <section>
              <SectionTitle kicker="À la une" title="Explorer" />
              <div className="grid gap-6 sm:grid-cols-2">
                {[
                  { key: 'standings' as const, tag: 'Classements', title: 'Le championnat pilotes et constructeurs', img: '', car: 'mer', big: true },
                  { key: 'calendar' as const, tag: 'Calendrier', title: 'Toutes les courses de la saison', img: (fullSeason[nextIdx + 1] ?? nextRace).photo },
                  { key: 'stats' as const, tag: 'Statistiques', title: 'Chiffres, écarts et écuries', img: '', car: 'fer' },
                  { key: 'favorites' as const, tag: 'Favoris', title: 'Ton pilote et ton écurie', img: '', car: normTeamId(favTeam) ?? 'mcl' },
                ].map((t) => (
                  <button key={t.key} onClick={() => setSubPage(t.key)} className={`group relative overflow-hidden rounded-3xl border border-white/[0.09] bg-zinc-950 text-left transition duration-300 hover:-translate-y-1 ${t.big ? 'sm:col-span-2 aspect-[16/9] lg:aspect-[21/9]' : 'aspect-[16/10]'}`}>
                    {t.car && teamById(t.car) ? <div className="absolute inset-0 transition duration-500 group-hover:scale-[1.03]"><CarStage team={teamById(t.car)!} logo={false} className="h-full" /></div> : <img src={t.img} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:opacity-100 group-hover:scale-105 transition duration-500" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08090a] via-[#08090a]/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                      <span className="inline-block chip">{t.tag}</span>
                      <h3 className={`mt-4 font-semibold tracking-[-0.03em] leading-tight ${t.big ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}>{t.title}</h3>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="app-wrap pt-24 sm:pt-40 grid gap-x-12 gap-y-24 lg:grid-cols-2 items-start">
            <section>
              <SectionTitle kicker="Championnat" title="Top pilotes" />
              <div className="rounded-3xl overflow-hidden border border-white/[0.09] bg-zinc-950 divide-y divide-white/[0.06]">
                {liveStandings.length === 0 && <p className="p-6 text-sm text-zinc-500">Chargement...</p>}
                {liveStandings.slice(0, 5).map((d, i) => (
                  <button key={d.Driver.driverId} onClick={() => setSubPage('standings')} className="w-full flex items-center justify-between gap-3 px-6 min-h-[4.5rem] text-left hover:bg-white/[0.04] transition">
                    <span className="flex items-center gap-4 min-w-0">
                      <span className="w-6 text-lg font-semibold text-accent-400 tabular-nums">{i + 1}</span>
                      <span className="w-1 h-7 shrink-0 rounded-full" style={{ backgroundColor: getColor(d.Constructors[0]?.name || '') }} />
                      <span className="truncate text-base font-semibold">{d.Driver.givenName} {d.Driver.familyName}</span>
                      {i === 0 && champ.data?.driverTitle?.decided && <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-black">Champion</span>}
                    </span>
                    <span className="text-lg font-semibold tabular-nums">{d.points}</span>
                  </button>
                ))}
              </div>
            </section>
            <section>
              <SectionTitle kicker="À suivre" title="Prochaines courses" />
              <div className="rounded-3xl overflow-hidden border border-white/[0.09] bg-zinc-950 divide-y divide-white/[0.06]">
                {fullSeason.slice(nextIdx + 1, nextIdx + 5).length === 0 && <p className="p-6 text-sm text-zinc-500">Dernière course de la saison.</p>}
                {fullSeason.slice(nextIdx + 1, nextIdx + 5).map((race) => (
                  <button key={race.round} onClick={() => { setRaceFrom('calendar'); setSelectedRace(fullSeason.find((r) => r.round === race.round) ?? race); setSubPage('calendar') }} className="w-full flex items-center justify-between gap-3 px-6 min-h-[4.5rem] text-left hover:bg-white/[0.04] transition">
                    <span className="min-w-0">
                      <span className="block text-base font-semibold truncate">{race.name}</span>
                      <span className="block text-sm text-zinc-500">{race.circuit} · {race.country}</span>
                    </span>
                    <span className="text-sm text-zinc-400 text-right shrink-0">{race.date}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    )
  }

  if (step === 'driver') {
    return (
      <div className="min-h-dvh w-full flex flex-col text-white">
        <TopBar>
          <div className="app-wrap flex items-center justify-between gap-2 h-16">
            <button onClick={onBack} className="text-sm text-zinc-400 hover:text-white min-h-11 min-w-16 text-left">← Retour</button>
            <LogoMark />
            <button onClick={() => setStep('team')} className="text-sm text-zinc-400 hover:text-white min-h-11 min-w-16 text-right">Passer</button>
          </div>
        </TopBar>
        <div className="app-page flex-1">
          <SectionTitle h1 kicker="Étape 1 sur 2" title="Choisis tes pilotes" desc={`Les ${grid.length} pilotes de la grille ${season}. Touche ceux que tu veux suivre.`} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {grid.map((d: GridDriver) => {
              const on = selectedDrivers.includes(d.id)
              const t = TEAMS.find((x) => x.id === d.teamId)
              return (
                <button key={d.id} onClick={() => toggleDriver(d.id)} aria-pressed={on} aria-label={`${d.givenName} ${d.familyName}, ${t?.name ?? ''}`} className={`group relative overflow-hidden rounded-2xl border text-left transition active:scale-[0.98] ${on ? 'border-white bg-[#17181a]' : 'border-white/[0.08] bg-[#101112] hover:border-white/25'}`}>
                  <span className="absolute left-3 top-3 z-10 text-[11px] font-medium tabular-nums text-[#636464]">{d.number}</span>
                  <span className={`absolute right-3 top-3 z-10 grid size-5 place-items-center rounded-full border transition ${on ? 'border-white bg-white text-black' : 'border-white/20 text-transparent'}`} aria-hidden>
                    <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m3.5 8.5 3 3 6-7" /></svg>
                  </span>
                  <span className="block aspect-[4/5] overflow-hidden">
                    <img src={driverPhoto(t?.slug ?? 'fallback', d.f1, 320)} alt="" loading="lazy" className={`size-full object-cover object-top transition duration-500 ${on ? '' : 'grayscale-[35%] group-hover:grayscale-0'}`} />
                  </span>
                  <span className="block border-t border-white/[0.06] px-3.5 py-3">
                    <span className="block truncate text-[13px] text-[#939494]">{d.givenName}</span>
                    <span className="block truncate text-[15px] font-medium tracking-[-0.01em]">{d.familyName}</span>
                    <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#636464]"><span className="size-1.5 rounded-full" style={{ backgroundColor: t?.color }} />{t?.name}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <button ref={validateRef} disabled={selectedDrivers.length === 0} onClick={() => setStep('team')} className="btn-primary mt-14 block w-full sm:max-w-md mx-auto min-h-14 rounded-full font-semibold disabled:opacity-35 disabled:saturate-0 disabled:shadow-none">Valider ({selectedDrivers.length})</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh w-full flex flex-col text-white">
      <TopBar>
        <div className="app-wrap flex items-center justify-between gap-2 h-16">
          <button onClick={() => setStep('driver')} className="text-sm text-zinc-400 hover:text-white min-h-11 min-w-16 text-left">← Retour</button>
          <LogoMark />
          <button onClick={() => setStep('done')} className="text-sm text-zinc-400 hover:text-white min-h-11 min-w-16 text-right">Passer</button>
        </div>
      </TopBar>
      <div className="app-page flex-1">
        <SectionTitle h1 kicker="Étape 2 sur 2" title="Choisis ton écurie" desc="Une seule, celle de ton cœur." />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {TEAMS.map((t) => {
            const on = normTeamId(favTeam) === t.id
            return (
              <button key={t.id} onClick={() => { setFavTeam(t.id); localStorage.setItem(teamKey, t.id); scrollToValidate() }} aria-pressed={on} className={`group relative flex flex-col overflow-hidden rounded-2xl border text-left transition active:scale-[0.98] ${on ? 'border-white bg-[#17181a]' : 'border-white/[0.08] bg-[#101112] hover:border-white/25'}`}>
                <span className={`absolute right-3 top-3 grid size-5 place-items-center rounded-full border transition ${on ? 'border-white bg-white text-black' : 'border-white/20 text-transparent'}`} aria-hidden>
                  <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m3.5 8.5 3 3 6-7" /></svg>
                </span>
                <span className="grid aspect-[16/10] place-items-center">
                  <img src={teamLogo(t)} alt="" className={`size-20 sm:size-24 object-contain transition duration-300 ${on ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
                </span>
                <span className="flex items-center gap-2 border-t border-white/[0.06] px-4 py-3.5">
                  <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="truncate text-[14px] font-medium">{t.name}</span>
                </span>
              </button>
            )
          })}
        </div>
        <button ref={validateRef} disabled={!teamById(favTeam)} onClick={() => setStep('done')} className="btn-primary mt-14 block w-full sm:max-w-md mx-auto min-h-14 rounded-full font-semibold disabled:opacity-35 disabled:saturate-0 disabled:shadow-none">Valider</button>
      </div>
    </div>
  )
}
