import { useState, useEffect, useRef } from 'react'
import MotorNav, { SectionTitle, type NavKey } from '../components/MotorNav'
import SpeedTrail from '../components/SpeedTrail'

interface Props {
  onBack: () => void
  userEmail: string
  favDriver: string | null
  setFavDriver: (id: string) => void
  favTeam: string | null
  setFavTeam: (id: string) => void
}

const drivers = [
  { id: 'ver', name: 'Max Verstappen', team: 'Red Bull', photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png.transform/2col/image.png' },
  { id: 'nor', name: 'Lando Norris', team: 'McLaren', photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png.transform/2col/image.png' },
  { id: 'lec', name: 'Charles Leclerc', team: 'Ferrari', photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png.transform/2col/image.png' },
  { id: 'pia', name: 'Oscar Piastri', team: 'McLaren', photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png.transform/2col/image.png' },
  { id: 'sai', name: 'Carlos Sainz', team: 'Ferrari', photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png.transform/2col/image.png' },
  { id: 'ham', name: 'Lewis Hamilton', team: 'Ferrari', photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png.transform/2col/image.png' },
  { id: 'rus', name: 'George Russell', team: 'Mercedes', photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png.transform/2col/image.png' },
  { id: 'alo', name: 'Fernando Alonso', team: 'Aston Martin', photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png.transform/2col/image.png' },
  { id: 'str', name: 'Lance Stroll', team: 'Aston Martin', photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png.transform/2col/image.png' },
  { id: 'gas', name: 'Pierre Gasly', team: 'Alpine', photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/P/PIEGAS01_Pierre_Gasly/piegas01.png.transform/2col/image.png' },
  { id: 'oco', name: 'Esteban Ocon', team: 'Alpine', photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/E/ESTOCO01_Esteban_Ocon/estoco01.png.transform/2col/image.png' },
  { id: 'alb', name: 'Alexander Albon', team: 'Williams', photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ALEALB01_Alexander_Albon/alealb01.png.transform/2col/image.png' },
]

const teams = [
  { id: 'rbr', name: 'Red Bull Racing', logo: 'https://www.formula1.com/content/dam/fom-website/teams/2024/red-bull-racing-logo.png' },
  { id: 'mcl', name: 'McLaren', logo: 'https://www.formula1.com/content/dam/fom-website/teams/2024/mclaren-logo.png' },
  { id: 'fer', name: 'Ferrari', logo: 'https://www.formula1.com/content/dam/fom-website/teams/2024/ferrari-logo.png' },
  { id: 'mer', name: 'Mercedes', logo: 'https://www.formula1.com/content/dam/fom-website/teams/2024/mercedes-logo.png' },
  { id: 'ast', name: 'Aston Martin', logo: 'https://www.formula1.com/content/dam/fom-website/teams/2024/aston-martin-logo.png' },
  { id: 'alp', name: 'Alpine', logo: 'https://www.formula1.com/content/dam/fom-website/teams/2024/alpine-logo.png' },
  { id: 'wil', name: 'Williams', logo: 'https://www.formula1.com/content/dam/fom-website/teams/2024/williams-logo.png' },
  { id: 'rb', name: 'RB', logo: 'https://www.formula1.com/content/dam/fom-website/teams/2024/rb-logo.png' },
  { id: 'haas', name: 'Haas', logo: 'https://www.formula1.com/content/dam/fom-website/teams/2024/haas-logo.png' },
  { id: 'sau', name: 'Sauber', logo: 'https://www.formula1.com/content/dam/fom-website/teams/2024/sauber-logo.png' },
]

const calendar = [
  { round: 18, name: 'United States', date: '23 – 25 octobre', circuit: 'Austin', map: 'https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/USA_Circuit.png', photo: 'https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Racehub%20header%20images%2016x9/USA.jpg', length: '5,513 km', laps: 56, record: '1:36.169', recordDriver: 'C. Leclerc', history: 'Inauguré en 2012, conçu par Hermann Tilke. Circuit technique avec de longs virages et une grande ligne droite qui favorise les dépassements.', grip: 'Asphalte lisse, bon grip une fois en température. Usure modérée.', creator: 'Hermann Tilke' },
  { round: 19, name: 'Mexico City', date: '30 oct – 1 nov', circuit: 'Mexico', map: 'https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Mexico_Circuit.png', photo: 'https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Racehub%20header%20images%2016x9/Mexico.jpg', length: '4,304 km', laps: 71, record: '1:17.774', recordDriver: 'V. Bottas', history: 'Autódromo Hermanos Rodríguez, rénové en 2015. L’altitude élevée (2200 m) réduit la puissance des moteurs et augmente l’usure des freins.', grip: 'Grip correct mais usure pneus importante à cause de l’air moins dense.', creator: 'Oscar Fernández' },
  { round: 20, name: 'São Paulo', date: '6 – 8 novembre', circuit: 'Interlagos', map: 'https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Brazil_Circuit.png', photo: 'https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Racehub%20header%20images%2016x9/Brazil.jpg', length: '4,309 km', laps: 71, record: '1:10.540', recordDriver: 'V. Bottas', history: 'Circuit historique depuis 1940, plusieurs fois rénové. Connu pour ses dépassements et l’ambiance unique du public brésilien.', grip: 'Asphalte abrasif, grip moyen, forte usure des pneus.', creator: 'Hermann Tilke (rénovation)' },
  { round: 21, name: 'Las Vegas', date: '19 – 21 novembre', circuit: 'Las Vegas', map: 'https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Las_Vegas_Circuit.png', photo: 'https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Racehub%20header%20images%2016x9/USA.jpg', length: '6,201 km', laps: 50, record: '1:34.119', recordDriver: 'O. Piastri', history: 'Circuit urbain inauguré en 2023. Très long avec une grande ligne droite sur le Strip. Course de nuit spectaculaire.', grip: 'Asphalte neuf, grip qui évolue fortement pendant le week-end.', creator: 'Hermann Tilke' },
  { round: 22, name: 'Qatar', date: '27 – 29 novembre', circuit: 'Lusail', map: 'https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Qatar_Circuit.png', photo: 'https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Racehub%20header%20images%2016x9/Qatar.jpg', length: '5,419 km', laps: 57, record: '1:22.384', recordDriver: 'M. Verstappen', history: 'Circuit moderne inauguré en 2004, utilisé en F1 depuis 2021. Très exigeant physiquement avec de nombreux virages rapides.', grip: 'Asphalte abrasif, grip élevé mais usure importante.', creator: 'Hermann Tilke' },
  { round: 23, name: 'Abu Dhabi', date: '4 – 6 décembre', circuit: 'Yas Marina', map: 'https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Abu_Dhabi_Circuit.png', photo: 'https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Racehub%20header%20images%2016x9/Abu_Dhabi.jpg', length: '5,281 km', laps: 58, record: '1:26.103', recordDriver: 'M. Verstappen', history: 'Circuit inauguré en 2009, rénové en 2021. Course de nuit sous les lumières, dernier Grand Prix de la saison.', grip: 'Asphalte lisse, grip stable tout le week-end.', creator: 'Hermann Tilke' },
]

const carImageFor = (teamName: string) => {
  const n = teamName.toLowerCase()
  if (n.includes('ferrari')) return '/cars/ferrari.jpeg'
  if (n.includes('mercedes')) return '/cars/mercedes.jpeg'
  if (n.includes('mclaren')) return '/cars/mclaren.jpeg'
  if (n.includes('aston')) return '/cars/aston.jpeg'
  if (n.includes('williams')) return '/cars/williams.jpeg'
  if (n.includes('alpine')) return '/cars/alpine.jpeg'
  if (n.includes('haas')) return '/cars/haas.jpeg'
  if (n.includes('audi')) return '/cars/audi.jpeg'
  if (n.includes('sauber') || n.includes('kick')) return '/cars/sauber.jpeg'
  if (n.includes('cadillac')) return '/cars/cadillac.jpeg'
  if (n.includes('racing bulls') || n.includes('rb')) return '/cars/racingbulls.jpeg'
  return '/cars/redbull.jpeg'
}

export default function HorsCourse({ onBack, userEmail, favDriver, setFavDriver, favTeam, setFavTeam }: Props) {
  const driverKey = `f1-fav-drivers-${userEmail}`
  const teamKey = `f1-fav-team-${userEmail}`
  const validateRef = useRef<HTMLButtonElement>(null)

  const [step, setStep] = useState<'driver' | 'team' | 'done'>('driver')
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([])
  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomeDone, setWelcomeDone] = useState(false)
  const [subPage, setSubPage] = useState<'home' | 'standings' | 'calendar' | 'stats' | 'favorites' | 'circuit' | 'stats-constructors'>('home')
  const [liveStandings, setLiveStandings] = useState<any[]>([])
  const [liveConstructors, setLiveConstructors] = useState<any[]>([])
  const [hover, setHover] = useState<{ x: number; y: number; speed: number } | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [standingsTab, setStandingsTab] = useState<'drivers' | 'constructors'>('drivers')
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null)
  const [selectedConstructor, setSelectedConstructor] = useState<any | null>(null)
  const [selectedRace, setSelectedRace] = useState<any | null>(null)
  const [selectedTeamStats, setSelectedTeamStats] = useState<any | null>(null)

  useEffect(() => {
    fetch('https://api.jolpi.ca/ergast/f1/2026/driverStandings.json')
      .then(r => r.json())
      .then(data => setLiveStandings(data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || []))
      .catch(() => {})

    fetch('https://api.jolpi.ca/ergast/f1/2026/constructorStandings.json')
      .then(r => r.json())
      .then(data => setLiveConstructors(data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || []))
      .catch(() => {})
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
    if (savedDrivers && savedTeam) {
      setStep('done')
      setShowWelcome(true)
      setTimeout(() => {
        setShowWelcome(false)
        setWelcomeDone(true)
      }, 3500)
    } else if (savedDrivers) setStep('team')
    else setStep('driver')
  }, [userEmail])

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
    const raceDate = new Date('2026-10-25T00:00:00')
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const diff = Math.ceil((raceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diff <= 0) return 'Aujourd’hui'
    if (diff === 1) return '1 jour'
    return `${diff} jours`
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

  const trailColor = (teamName: string) => {
    const c = getColor(teamName)
    if (teamName.toLowerCase().includes('audi')) return '#BB0A30'
    if (teamName.toLowerCase().includes('cadillac')) return '#FFD700'
    return c === '#3f3f46' ? '#e10600' : c
  }

  const go = (k: NavKey) => {
    setSelectedRace(null)
    setSelectedDriver(null)
    setSelectedConstructor(null)
    setSelectedTeamStats(null)
    setSubPage(k)
  }

  const navKey: NavKey =
    subPage === 'stats-constructors' ? 'stats' : subPage === 'circuit' ? 'home' : subPage
  const nav = (back?: () => void, crumb?: string) => (
    <MotorNav active={navKey} onNavigate={go} onExit={onBack} onBack={back} crumb={crumb} />
  )

  const nationalityFR: Record<string, string> = {
    Dutch: 'Néerlandais', British: 'Britannique', Monegasque: 'Monégasque',
    Australian: 'Australien', Spanish: 'Espagnol', French: 'Français',
    Thai: 'Thaïlandais', German: 'Allemand', Italian: 'Italien',
    Finnish: 'Finlandais', Mexican: 'Mexicain', Canadian: 'Canadien',
    American: 'Américain', Chinese: 'Chinois', Japanese: 'Japonais', Danish: 'Danois'
  }

  const handleTrackMove = (clientX: number, clientY: number, rect: DOMRect) => {
    if (!isActive) return
    const x = (clientX - rect.left) / rect.width
    const y = (clientY - rect.top) / rect.height
    let speed = 190
    if (x > 0.62 && y < 0.45) speed = 248 + Math.random() * 6
    else if (x < 0.35 && y < 0.42) speed = 162 + Math.sin(y * 12) * 10
    else if (x > 0.32 && x < 0.62 && y > 0.38) speed = 175 + Math.cos(x * 9) * 8
    else speed = 198 + Math.sin(x * 6 + y * 4) * 12
    setHover({ x, y, speed: Math.round(speed) })
  }

  if (step === 'done') {
    if (showWelcome && !welcomeDone) {
      const text = 'Bienvenue dans le mode Hors Course'
      return (
        <div className="min-h-dvh bg-black text-white flex items-center justify-center">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-center px-6">
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
      const cota = calendar[0]
      return (
        <div className="min-h-dvh w-full flex flex-col bg-black text-white">
          {nav(() => setSubPage('home'), "Circuit")}
          <div className="px-4 sm:px-6 lg:px-10 xl:px-14 py-6 w-full flex-1 grid content-start gap-6 md:grid-cols-2 items-start">
            <div className="md:col-span-2 border-l-4 border-red-600 pl-4">
              <p className="text-red-600 text-[11px] tracking-[0.35em] sm:tracking-[0.5em] uppercase mb-2">Prochain GP</p>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none mt-1">{cota.name}</h1>
              <p className="text-sm text-zinc-400 mt-2">{cota.circuit} • Austin</p>
            </div>
            <div className="relative rounded-sm overflow-hidden border border-zinc-900 select-none touch-none" onMouseDown={() => setIsActive(true)} onMouseUp={() => { setIsActive(false); setHover(null) }} onMouseLeave={() => { setIsActive(false); setHover(null) }} onMouseMove={(e) => handleTrackMove(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())} onTouchStart={() => setIsActive(true)} onTouchEnd={() => { setIsActive(false); setHover(null) }} onTouchMove={(e) => { e.preventDefault(); const touch = e.touches[0]; handleTrackMove(touch.clientX, touch.clientY, e.currentTarget.getBoundingClientRect()) }}>
              <img src={cota.map} alt="COTA" className="w-full h-auto max-h-[60vh] object-contain bg-zinc-950 pointer-events-none" />
              {hover && isActive && (
                <div className="absolute bg-black/95 border border-zinc-700 rounded-sm px-4 py-2 text-center text-xs shadow-xl pointer-events-none whitespace-nowrap" style={{ left: `${Math.min(85, Math.max(15, hover.x * 100))}%`, top: hover.y < 0.25 ? `${hover.y * 100 + 12}%` : `${Math.max(8, hover.y * 100)}%`, transform: hover.y < 0.25 ? 'translate(-50%, 0)' : 'translate(-50%, -140%)' }}>
                  <p className="font-semibold text-white">{hover.speed} km/h</p>
                  <p className="text-zinc-500 text-[11px] mt-0.5">Vitesse estimée</p>
                </div>
              )}
            </div>
            <img src={cota.photo} alt="COTA photo" className="w-full h-auto rounded-sm border border-zinc-800" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:col-span-2">
              <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4"><p className="text-xs text-zinc-500">Longueur</p><p className="font-semibold mt-1">{cota.length}</p></div>
              <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4"><p className="text-xs text-zinc-500">Tours</p><p className="font-semibold mt-1">{cota.laps}</p></div>
              <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4 col-span-2"><p className="text-xs text-zinc-500">Record</p><p className="font-semibold mt-1">{cota.record}</p><p className="text-[11px] text-zinc-500 mt-0.5">{cota.recordDriver}</p></div>
            </div>
            <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4 md:col-span-2"><p className="text-xs text-zinc-500">Histoire</p><p className="text-sm mt-1 leading-relaxed">{cota.history}</p></div>
            <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4"><p className="text-xs text-zinc-500">Grip</p><p className="text-sm mt-1">{cota.grip}</p></div>
            <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4"><p className="text-xs text-zinc-500">Concepteur</p><p className="text-sm mt-1">{cota.creator}</p></div>
          </div>
        </div>
      )
    }

    if (subPage === 'calendar') {
      if (selectedRace) {
        return (
          <div className="min-h-dvh w-full flex flex-col bg-black text-white">
            {nav(() => setSelectedRace(null), "Course")}
            <div className="px-4 sm:px-6 lg:px-10 xl:px-14 py-6 w-full flex-1 grid content-start gap-6 md:grid-cols-2 items-start">
              <div className="md:col-span-2 border-l-4 border-red-600 pl-4">
                <p className="text-red-600 text-[11px] tracking-[0.35em] sm:tracking-[0.5em] uppercase mb-2">Round {selectedRace.round}</p>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none mt-1">{selectedRace.name}</h1>
                <p className="text-sm text-zinc-500 mt-1">{selectedRace.circuit} • {selectedRace.date}</p>
              </div>
              <div className="relative rounded-sm overflow-hidden border border-zinc-900 select-none touch-none" onMouseDown={() => setIsActive(true)} onMouseUp={() => { setIsActive(false); setHover(null) }} onMouseLeave={() => { setIsActive(false); setHover(null) }} onMouseMove={(e) => handleTrackMove(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())} onTouchStart={() => setIsActive(true)} onTouchEnd={() => { setIsActive(false); setHover(null) }} onTouchMove={(e) => { e.preventDefault(); const touch = e.touches[0]; handleTrackMove(touch.clientX, touch.clientY, e.currentTarget.getBoundingClientRect()) }}>
                <img src={selectedRace.map} alt={selectedRace.name} className="w-full h-auto max-h-[60vh] object-contain bg-zinc-950 pointer-events-none" />
                {hover && isActive && (
                  <div className="absolute bg-black/95 border border-zinc-700 rounded-sm px-4 py-2 text-center text-xs shadow-xl pointer-events-none whitespace-nowrap" style={{ left: `${Math.min(85, Math.max(15, hover.x * 100))}%`, top: hover.y < 0.25 ? `${hover.y * 100 + 12}%` : `${Math.max(8, hover.y * 100)}%`, transform: hover.y < 0.25 ? 'translate(-50%, 0)' : 'translate(-50%, -140%)' }}>
                    <p className="font-semibold text-white">{hover.speed} km/h</p>
                    <p className="text-zinc-500 text-[11px] mt-0.5">Vitesse estimée</p>
                  </div>
                )}
              </div>
              <img src={selectedRace.photo} alt={selectedRace.name} className="w-full h-auto rounded-sm border border-zinc-800" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:col-span-2">
                <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4"><p className="text-xs text-zinc-500">Longueur</p><p className="font-semibold mt-1">{selectedRace.length}</p></div>
                <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4"><p className="text-xs text-zinc-500">Tours</p><p className="font-semibold mt-1">{selectedRace.laps}</p></div>
                <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4 col-span-2"><p className="text-xs text-zinc-500">Record</p><p className="font-semibold mt-1">{selectedRace.record}</p><p className="text-[11px] text-zinc-500 mt-0.5">{selectedRace.recordDriver}</p></div>
              </div>
              <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4 md:col-span-2"><p className="text-xs text-zinc-500">Histoire</p><p className="text-sm mt-1 leading-relaxed">{selectedRace.history}</p></div>
              <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4"><p className="text-xs text-zinc-500">Grip</p><p className="text-sm mt-1">{selectedRace.grip}</p></div>
              <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4"><p className="text-xs text-zinc-500">Concepteur</p><p className="text-sm mt-1">{selectedRace.creator}</p></div>
            </div>
          </div>
        )
      }

      return (
        <div className="min-h-dvh w-full flex flex-col bg-black text-white">
          {nav(() => setSubPage('home'), "Calendrier")}
          <div className="px-4 sm:px-6 lg:px-10 xl:px-14 py-6 sm:py-8 w-full flex-1 grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            <SectionTitle h1 kicker="Saison 2026" title="Calendrier" className="col-span-full mb-2" />
            {calendar.map((race) => (
              <button key={race.round} onClick={() => setSelectedRace(race)} className="group text-left bg-zinc-950 border border-zinc-800 hover:border-red-600 overflow-hidden transition">
                <div className="relative aspect-video overflow-hidden bg-zinc-900">
                  <img src={race.photo} alt="" loading="lazy" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-bold uppercase tracking-widest px-2 py-1">Round {race.round}</span>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-black uppercase tracking-tight">{race.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{race.circuit} • {race.date}</p>
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
          <div className="min-h-dvh w-full flex flex-col bg-black text-white">
            {nav(() => setSelectedDriver(null), "Pilote")}
            <div className="px-4 sm:px-6 lg:px-10 xl:px-14 py-8 w-full flex-1 grid content-start gap-6 lg:grid-cols-3 items-start">
              <div className="text-center lg:row-span-2 lg:self-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-black text-white" style={{ backgroundColor: getColor(teamName) }}>
                  {selectedDriver.Driver.familyName.charAt(0)}
                </div>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none mt-1">{selectedDriver.Driver.givenName} {selectedDriver.Driver.familyName}</h1>
                <p className="text-sm text-zinc-500 mt-1">{teamName}</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4 lg:col-span-2">
                <p className="text-sm leading-relaxed text-zinc-300">Pilote de Formule 1 en compétition pour le championnat.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:col-span-2">
                <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4 text-center"><p className="text-xs text-zinc-500">Points</p><p className="text-xl font-semibold mt-1">{selectedDriver.points}</p></div>
                <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4 text-center"><p className="text-xs text-zinc-500">Victoires</p><p className="text-xl font-semibold mt-1">{selectedDriver.wins}</p></div>
                <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4 text-center"><p className="text-xs text-zinc-500">Position</p><p className="text-xl font-semibold mt-1">{selectedDriver.position}</p></div>
                <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4 text-center"><p className="text-xs text-zinc-500">Nationalité</p><p className="text-xl font-semibold mt-1 break-words">{nat}</p></div>
              </div>
            </div>
          </div>
        )
      }

      if (selectedConstructor) {
        const nat = nationalityFR[selectedConstructor.Constructor.nationality] || selectedConstructor.Constructor.nationality
        return (
          <div className="min-h-dvh w-full flex flex-col bg-black text-white">
            {nav(() => setSelectedConstructor(null), "Écurie")}
            <div className="px-4 sm:px-6 lg:px-10 xl:px-14 py-8 w-full flex-1 space-y-6 content-start">
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-center">{selectedConstructor.Constructor.name}</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:col-span-2">
                <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4 text-center"><p className="text-xs text-zinc-500">Points</p><p className="text-xl font-semibold mt-1">{selectedConstructor.points}</p></div>
                <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4 text-center"><p className="text-xs text-zinc-500">Victoires</p><p className="text-xl font-semibold mt-1">{selectedConstructor.wins}</p></div>
                <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4 text-center"><p className="text-xs text-zinc-500">Position</p><p className="text-xl font-semibold mt-1">{selectedConstructor.position}</p></div>
                <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4 text-center"><p className="text-xs text-zinc-500">Nationalité</p><p className="text-xl font-semibold mt-1 break-words">{nat}</p></div>
              </div>
            </div>
          </div>
        )
      }

      return (
        <div className="min-h-dvh w-full flex flex-col bg-black text-white">
          {nav(() => setSubPage('home'), "Classements")}
          <div className="px-4 sm:px-6 lg:px-10 xl:px-14 py-6 w-full flex-1">
            <SectionTitle h1 kicker="Championnat 2026" title="Classements" className="mb-6" />
            <div className="flex border-b border-zinc-800 mb-6">
              <button onClick={() => setStandingsTab('drivers')} className={`px-5 min-h-12 text-sm font-bold uppercase tracking-wider border-b-4 transition ${standingsTab === 'drivers' ? 'border-red-600 text-white' : 'border-transparent text-zinc-400'}`}>Pilotes</button>
              <button onClick={() => setStandingsTab('constructors')} className={`px-5 min-h-12 text-sm font-bold uppercase tracking-wider border-b-4 transition ${standingsTab === 'constructors' ? 'border-red-600 text-white' : 'border-transparent text-zinc-400'}`}>Constructeurs</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {standingsTab === 'drivers' ? (
                liveStandings.length === 0 ? <p className="text-center text-zinc-500 text-sm">Chargement...</p> :
                liveStandings.map((d, i) => {
                  const teamName = d.Constructors[0]?.name || ''
                  return (
                    <button key={d.Driver.driverId} onClick={() => setSelectedDriver(d)} className="w-full flex items-center justify-between gap-3 bg-zinc-950 border border-zinc-800 rounded-sm px-4 sm:px-5 py-4 min-h-14 text-left hover:border-zinc-700 active:bg-zinc-900/60 transition">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="text-sm font-medium text-zinc-600 w-6">{i + 1}</span>
                        <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: getColor(teamName) }}>
                          {d.Driver.familyName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{d.Driver.givenName} {d.Driver.familyName}</p>
                          <p className="text-xs text-zinc-500">{teamName}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-semibold text-zinc-300">{d.points}</span>
                        <p className="text-[11px] text-zinc-500">{d.wins} win{Number(d.wins) !== 1 ? 's' : ''}</p>
                      </div>
                    </button>
                  )
                })
              ) : (
                liveConstructors.length === 0 ? <p className="text-center text-zinc-500 text-sm">Chargement...</p> :
                liveConstructors.map((t, i) => (
                  <button key={t.Constructor.constructorId} onClick={() => setSelectedConstructor(t)} className="w-full flex items-center justify-between gap-3 bg-zinc-950 border border-zinc-800 rounded-sm px-4 sm:px-5 py-4 min-h-14 text-left hover:border-zinc-700 active:bg-zinc-900/60 transition">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <span className="text-sm font-medium text-zinc-600 w-6">{i + 1}</span>
                      <p className="text-sm font-medium">{t.Constructor.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-semibold text-zinc-300">{t.points}</span>
                      <p className="text-[11px] text-zinc-500">{t.wins} win{Number(t.wins) !== 1 ? 's' : ''}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )
    }

if (subPage === 'stats-constructors') {
  if (selectedTeamStats) {
    const name = selectedTeamStats.Constructor.name.toLowerCase()
    let carImage = '/cars/redbull.jpeg'
    let teamLogo = 'https://media.formula1.com/content/dam/fom-website/teams/2024/red-bull-racing-logo.png'
    let fournisseur = 'Red Bull Ford'
    let noteMoteur = 'Premier moteur maison de Red Bull (DM01), développé avec Ford. L’écurie conçoit pour la première fois son propre groupe motopropulseur.'
    let noteAero = 'Red Bull va chercher à maximiser l’efficacité en ligne droite avec les ailes actives, tout en gardant un bon appui dans les virages rapides.'
    let officialSite = 'https://www.redbullracing.com'

    if (name.includes('ferrari')) {
      carImage = '/cars/ferrari.jpeg'
      teamLogo = 'https://media.formula1.com/content/dam/fom-website/teams/2024/ferrari-logo.png'
      fournisseur = 'Ferrari'
      noteMoteur = 'Moteur entièrement développé à Maranello. Ferrari fournit aussi Haas et Cadillac.'
      noteAero = 'Ferrari devra adapter son concept aéro pour bien gérer le passage entre mode virage et mode ligne droite.'
      officialSite = 'https://www.ferrari.com/en-EN/formula1'
    } else if (name.includes('mercedes')) {
      carImage = '/cars/mercedes.jpeg'
      teamLogo = 'https://media.formula1.com/content/dam/fom-website/teams/2024/mercedes-logo.png'
      fournisseur = 'Mercedes'
      noteMoteur = 'Mercedes fournit McLaren, Williams et Alpine. Référence en gestion de l’énergie et fiabilité.'
      noteAero = 'Mercedes va chercher à tirer le meilleur parti des ailes actives sur les circuits à longues lignes droites.'
      officialSite = 'https://www.mercedesamgf1.com'
    } else if (name.includes('mclaren')) {
      carImage = '/cars/mclaren.jpeg'
      teamLogo = 'https://media.formula1.com/content/dam/fom-website/teams/2024/mclaren-logo.png'
      fournisseur = 'Mercedes'
      noteMoteur = 'Client Mercedes depuis 2021. Partenariat prolongé jusqu’en 2030.'
      noteAero = 'McLaren va chercher à maximiser les zones de freinage et les virages rapides.'
      officialSite = 'https://www.mclaren.com/racing'
    } else if (name.includes('aston')) {
      carImage = '/cars/aston.jpeg'
      teamLogo = 'https://media.formula1.com/content/dam/fom-website/teams/2024/aston-martin-logo.png'
      fournisseur = 'Honda'
      noteMoteur = 'Partenariat exclusif avec Honda à partir de 2026. Honda revient avec un moteur entièrement nouveau.'
      noteAero = 'Aston Martin devra adapter son concept aéro au nouveau moteur Honda.'
      officialSite = 'https://www.astonmartinf1.com'
    } else if (name.includes('williams')) {
      carImage = '/cars/williams.jpeg'
      teamLogo = 'https://media.formula1.com/content/dam/fom-website/teams/2024/williams-logo.png'
      fournisseur = 'Mercedes'
      noteMoteur = 'Client Mercedes. Williams bénéficie de la puissance et de la fiabilité du constructeur allemand.'
      noteAero = 'Williams espère réduire l’écart grâce aux ailes actives sur les longues lignes droites.'
      officialSite = 'https://www.williamsf1.com'
    } else if (name.includes('alpine')) {
      carImage = '/cars/alpine.jpeg'
      teamLogo = 'https://media.formula1.com/content/dam/fom-website/teams/2024/alpine-logo.png'
      fournisseur = 'Mercedes'
      noteMoteur = 'Alpine passe chez Mercedes en 2026. Un changement majeur qui permet de se concentrer sur le châssis.'
      noteAero = 'Le passage à Mercedes va permettre à Alpine de mieux travailler sur les ailes actives.'
      officialSite = 'https://www.alpinecars.com/en/formula-1'
    } else if (name.includes('haas')) {
      carImage = '/cars/haas.jpeg'
      teamLogo = 'https://media.formula1.com/content/dam/fom-website/teams/2024/haas-f1-team-logo.png'
      fournisseur = 'Ferrari'
      noteMoteur = 'Client Ferrari. Haas utilise le même groupe motopropulseur que Ferrari.'
      noteAero = 'Haas va chercher à maximiser les zones de dépassement avec le nouveau règlement.'
      officialSite = 'https://www.haasf1team.com'
    } else if (name.includes('audi')) {
      carImage = '/cars/audi.jpeg'
      teamLogo = 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Audi.png'
      fournisseur = 'Audi'
      noteMoteur = 'Audi développe son propre moteur pour sa première saison en Formule 1. Un projet ambitieux pour la marque allemande.'
      noteAero = 'Audi devra rapidement maîtriser les ailes actives et le mode dépassement dès sa première année.'
      officialSite = 'https://www.audi.com'
    } else if (name.includes('sauber') || name.includes('kick')) {
      carImage = '/cars/sauber.jpeg'
      teamLogo = 'https://media.formula1.com/content/dam/fom-website/teams/2024/kick-sauber-logo.png'
      fournisseur = 'Audi'
      noteMoteur = 'Sauber devient Audi. L’équipe prépare la transition vers la marque allemande.'
      noteAero = 'Sauber travaille sur l’adaptation aux nouvelles règles aérodynamiques de 2026.'
      officialSite = 'https://www.sauber-group.com'
    } else if (name.includes('cadillac')) {
      carImage = '/cars/cadillac.jpeg'
      teamLogo = 'https://cdn.brandfetch.io/cadillac.com/logo'
      fournisseur = 'Ferrari'
      noteMoteur = 'Cadillac utilise un moteur Ferrari pour ses débuts en Formule 1. L’équipe américaine arrive avec un projet ambitieux.'
      noteAero = 'Cadillac devra rapidement maîtriser les ailes actives pour être compétitive dès sa première saison.'
      officialSite = 'https://www.cadillac.com'
    } else if (name.includes('racing bulls') || name.includes('rb')) {
      carImage = '/cars/racingbulls.jpeg'
      teamLogo = 'https://media.formula1.com/content/dam/fom-website/teams/2024/rb-logo.png'
      fournisseur = 'Red Bull Ford'
      noteMoteur = 'Utilise le même groupe motopropulseur que Red Bull Racing.'
      noteAero = 'Racing Bulls profite des connaissances de Red Bull en aérodynamique.'
      officialSite = 'https://www.visacashapprb.com'
    }

    const youtube = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(selectedTeamStats.Constructor.name + ' F1 2026')

    return (
      <div className="min-h-dvh w-full flex flex-col bg-black text-white">
        {nav(() => setSelectedTeamStats(null), selectedTeamStats.Constructor.name)}

        <div className="px-4 sm:px-6 lg:px-10 xl:px-14 pt-6 pb-16 w-full flex-1 lg:grid lg:grid-cols-2 lg:gap-x-10 lg:content-start">
          <div className="lg:col-span-2 mb-6 flex items-center justify-between gap-4"><SectionTitle h1 kicker="Écurie 2026" title={selectedTeamStats.Constructor.name} /><img src={teamLogo} alt="" className="h-10 sm:h-14 max-w-[30%] object-contain" /></div>

          <div className="relative rounded-sm overflow-hidden border border-zinc-800 bg-black h-48 sm:h-64 md:h-80 lg:h-full lg:min-h-[28rem] flex items-center justify-center mb-6 sm:mb-8 lg:mb-0">
            <SpeedTrail color={trailColor(selectedTeamStats.Constructor.name)} />
            <img src={carImage} alt="" className="relative max-w-full max-h-full object-contain mix-blend-screen" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 items-start">
            <div className="rounded-sm border border-zinc-800 bg-zinc-950 p-5 md:col-span-2 lg:col-span-1">
              <p className="text-xs tracking-widest uppercase text-zinc-600 mb-4">Classement</p>
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

            <div className="rounded-sm border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-xs tracking-widest uppercase text-zinc-600 mb-4">Groupe motopropulseur</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4"><span className="text-zinc-500">Fournisseur</span><span>{fournisseur}</span></div>
                <div className="flex justify-between gap-4"><span className="text-zinc-500">Puissance totale</span><span>~1 000 ch</span></div>
                <div className="flex justify-between gap-4"><span className="text-zinc-500">Moteur thermique</span><span>~400 kW</span></div>
                <div className="flex justify-between gap-4"><span className="text-zinc-500">Moteur électrique</span><span>350 kW</span></div>
                <div className="flex justify-between gap-4"><span className="text-zinc-500">Récupération max</span><span>8,5 MJ / tour</span></div>
              </div>
              <p className="text-sm text-zinc-400 mt-5 leading-relaxed">{noteMoteur}</p>
            </div>

            <div className="rounded-sm border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-xs tracking-widest uppercase text-zinc-600 mb-4">Aérodynamique</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4"><span className="text-zinc-500">Mode Virage</span><span className="text-right">Appui maximum</span></div>
                <div className="flex justify-between gap-4"><span className="text-zinc-500">Mode Ligne droite</span><span>−55 % de traînée</span></div>
                <div className="flex justify-between gap-4"><span className="text-zinc-500">Mode Dépassement</span><span>À moins d’1 seconde</span></div>
              </div>
              <p className="text-sm text-zinc-400 mt-5 leading-relaxed">{noteAero}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 pt-8 lg:col-span-2">
            <a href={officialSite} target="_blank" rel="noopener noreferrer" className="block w-full text-center py-3.5 min-h-12 bg-zinc-900/50 border border-zinc-800 rounded-sm text-sm text-zinc-300">
              Site officiel
            </a>
            <a href={youtube} target="_blank" rel="noopener noreferrer" className="block w-full text-center py-3.5 min-h-12 bg-zinc-900/50 border border-zinc-800 rounded-sm text-sm text-zinc-300">
              Actualités YouTube
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh w-full flex flex-col bg-black text-white">
      {nav(() => setSubPage('home'), "Constructeurs")}
      <div className="px-4 sm:px-6 lg:px-10 xl:px-14 py-6 w-full flex-1 grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <SectionTitle h1 kicker="Statistiques" title="Constructeurs" className="col-span-full mb-2" />
        {liveConstructors.length === 0 && <p className="col-span-full text-zinc-500 text-sm">Chargement...</p>}
        {liveConstructors.map((t, i) => (
          <button key={t.Constructor.constructorId} onClick={() => setSelectedTeamStats(t)} className="group text-left bg-zinc-950 border border-zinc-800 hover:border-red-600 overflow-hidden transition">
            <div className="relative aspect-video overflow-hidden bg-black">
              <SpeedTrail color={trailColor(t.Constructor.name)} />
              <img src={carImageFor(t.Constructor.name)} alt="" loading="lazy" className="relative w-full h-full object-contain mix-blend-screen" />
              <span className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-bold uppercase tracking-widest px-2 py-1">P{i + 1}</span>
            </div>
            <div className="p-4 flex items-end justify-between gap-3" style={{ borderTop: `3px solid ${trailColor(t.Constructor.name)}` }}>
              <h3 className="text-lg font-black uppercase tracking-tight leading-tight">{t.Constructor.name}</h3>
              <p className="text-sm text-zinc-300 shrink-0"><span className="font-black text-xl">{t.points}</span> pts</p>
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
      const totalRaces = 17
      return (
        <div className="min-h-dvh w-full flex flex-col bg-black text-white pb-10">
          {nav(() => setSubPage('home'), "Statistiques")}
          <div className="px-4 sm:px-6 lg:px-10 xl:px-14 pt-6 w-full">
            <div className="flex border-b border-zinc-800">
              <button className="px-5 min-h-12 text-sm font-bold uppercase tracking-wider border-b-4 border-red-600 text-white">Aperçu</button>
              <button onClick={() => setSubPage('stats-constructors')} className="px-5 min-h-12 text-sm font-bold uppercase tracking-wider border-b-4 border-transparent text-zinc-400 hover:text-white">Constructeurs</button>
            </div>
          </div>
          <div className="px-4 sm:px-6 lg:px-10 xl:px-14 py-6 w-full flex-1 grid content-start gap-7 lg:grid-cols-2 lg:gap-x-8 items-start">
            <SectionTitle h1 kicker="Saison 2026" title="Statistiques" className="col-span-full" />
            <div>
              <p className="text-red-600 text-[11px] tracking-[0.35em] sm:tracking-[0.5em] uppercase mb-4">Title Fight</p>
              {leader && second ? (
                <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-5">
                  <div className="flex justify-between items-end mb-4">
                    <div><p className="text-xs text-zinc-500">{leader.Driver.familyName}</p><p className="text-3xl font-black">{leader.points}</p><p className="text-xs text-zinc-500 mt-1">{leader.wins} victoires</p></div>
                    <div className="text-right"><p className="text-xs text-zinc-500">{second.Driver.familyName}</p><p className="text-3xl font-black text-zinc-400">{second.points}</p><p className="text-xs text-zinc-500 mt-1">{second.wins} victoires</p></div>
                  </div>
                  <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-zinc-900 mb-3">
                    <div className="bg-red-600" style={{ width: `${(Number(leader.points) / (Number(leader.points) + Number(second.points))) * 100}%` }} />
                    <div className="bg-zinc-700 flex-1" />
                  </div>
                  <p className="text-xs text-zinc-500 text-center">Écart : {gap} points</p>
                </div>
              ) : <p className="text-center text-zinc-500 text-sm">Chargement...</p>}
            </div>
            <div>
              <p className="text-red-600 text-[11px] tracking-[0.35em] sm:tracking-[0.5em] uppercase mb-4">Top 3</p>
              <div className="space-y-2">
                {liveStandings.slice(0, 3).map((d, i) => (
                  <div key={d.Driver.driverId} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-sm px-4 py-3">
                    <div className="flex items-center gap-3"><span className="text-xs text-zinc-600 w-5">{i + 1}</span><div><p className="text-sm font-medium">{d.Driver.familyName}</p><p className="text-xs text-zinc-500">{d.Constructors[0]?.name}</p></div></div>
                    <div className="text-right"><p className="text-sm font-semibold">{d.points}</p><p className="text-[11px] text-zinc-500">{d.wins} win{Number(d.wins) !== 1 ? 's' : ''}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-red-600 text-[11px] tracking-[0.35em] sm:tracking-[0.5em] uppercase mb-4">Essentiels</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-4"><p className="text-xs text-zinc-500">Moy. points / course</p><p className="text-lg font-semibold mt-1">{leader ? (Number(leader.points) / totalRaces).toFixed(1) : '-'}</p></div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-4"><p className="text-xs text-zinc-500">Victoires leader</p><p className="text-lg font-semibold mt-1">{leader?.wins || '-'}</p></div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-4"><p className="text-xs text-zinc-500">Écart au 2e</p><p className="text-lg font-semibold mt-1">{gap} pts</p></div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-4"><p className="text-xs text-zinc-500">Écurie leader</p><p className="text-lg font-semibold mt-1 break-words">{liveConstructors[0]?.Constructor.name || '-'}</p></div>
              </div>
            </div>
            <div>
              <p className="text-red-600 text-[11px] tracking-[0.35em] sm:tracking-[0.5em] uppercase mb-4">Constructeurs</p>
              <div className="space-y-2">
                {liveConstructors.slice(0, 3).map((t, i) => (
                  <div key={t.Constructor.constructorId} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-sm px-4 py-3">
                    <div className="flex items-center gap-3"><span className="text-xs text-zinc-600 w-5">{i + 1}</span><p className="text-sm font-medium">{t.Constructor.name}</p></div>
                    <div className="text-right"><p className="text-sm font-semibold">{t.points}</p><p className="text-[11px] text-zinc-500">{t.wins} win{Number(t.wins) !== 1 ? 's' : ''}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (subPage === 'favorites') {
      const driver = drivers.find(d => d.id === favDriver)
      const team = teams.find(t => t.id === favTeam)
      return (
        <div className="min-h-dvh w-full flex flex-col bg-black text-white">
          {nav(() => setSubPage('home'), "Tes favoris")}
          <div className="px-4 sm:px-6 lg:px-10 xl:px-14 py-8 w-full flex-1 grid content-start gap-6 md:grid-cols-2 items-start">
            <SectionTitle h1 kicker="Ton paddock" title="Tes favoris" className="col-span-full" />
            {driver && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-5">
                <div className="flex items-center gap-4 mb-5">
                  <img src={driver.photo} alt={driver.name} className="w-16 h-16 shrink-0 rounded-full object-cover object-top" />
                  <div><p className="font-semibold">{driver.name}</p><p className="text-xs text-zinc-500">{driver.team}</p></div>
                </div>
                <a href={`https://www.formula1.com/en/drivers/${driver.name.toLowerCase().replace(/ /g, '-')}.html`} target="_blank" rel="noreferrer" className="block w-full py-3 min-h-12 bg-zinc-900 border border-zinc-800 rounded-sm text-center text-sm font-medium hover:bg-zinc-800 transition">Voir les actualités</a>
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(driver.name + ' F1')}`} target="_blank" rel="noreferrer" className="block w-full py-3 min-h-12 mt-2 bg-zinc-900 border border-zinc-800 rounded-sm text-center text-sm font-medium hover:bg-zinc-800 transition">Vidéos récentes</a>
              </div>
            )}
            {team && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-5">
                <div className="flex items-center gap-4 mb-5">
                  <img src={team.logo} alt={team.name} className="w-14 h-14 object-contain" />
                  <p className="font-semibold">{team.name}</p>
                </div>
                <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(team.name.replace(' Racing', ''))}`} target="_blank" rel="noreferrer" className="block w-full py-3 min-h-12 bg-zinc-900 border border-zinc-800 rounded-sm text-center text-sm font-medium hover:bg-zinc-800 transition">Voir les actualités</a>
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(team.name + ' F1')}`} target="_blank" rel="noreferrer" className="block w-full py-3 min-h-12 mt-2 bg-zinc-900 border border-zinc-800 rounded-sm text-center text-sm font-medium hover:bg-zinc-800 transition">Vidéos récentes</a>
              </div>
            )}
            {!driver && !team && <p className="text-zinc-500 md:col-span-2">Aucun favori sélectionné</p>}
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-dvh w-full flex flex-col bg-black text-white">
        {nav()}
        <main className="flex-1 w-full">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setSubPage('circuit')}
            onKeyDown={(e) => { if (e.key === 'Enter') setSubPage('circuit') }}
            className="group relative block w-full overflow-hidden border-b border-zinc-800 cursor-pointer"
          >
            <img src={calendar[0].photo} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
            <div className="relative min-h-[22rem] sm:min-h-[26rem] lg:min-h-[30rem] xl:min-h-[34rem] flex flex-col justify-end px-4 sm:px-6 lg:px-10 xl:px-14 pb-6 sm:pb-10 pt-24">
              <span className="self-start bg-red-600 text-white text-[11px] font-bold uppercase tracking-widest px-2 py-1">Prochain GP • Round {calendar[0].round}</span>
              <h1 className="mt-3 font-black uppercase leading-[0.95] tracking-tight text-5xl sm:text-6xl lg:text-8xl">{calendar[0].name}</h1>
              <p className="mt-3 text-zinc-300 text-sm sm:text-base">{calendar[0].date} • {calendar[0].circuit} • <span className="text-white font-semibold">{getDaysUntilRace()}</span></p>
              <span className="mt-5 self-start inline-flex items-center min-h-11 bg-white text-black font-bold uppercase text-xs tracking-widest px-5">Voir le circuit →</span>
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-10 xl:px-14 py-8 sm:py-10 grid gap-10 lg:grid-cols-12 items-start">
            <section className="lg:col-span-8">
              <SectionTitle kicker="À la une" title="Explorer" className="mb-5" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { key: 'standings' as const, tag: 'Classements', title: 'Le championnat pilotes et constructeurs', img: '/cars/mercedes.jpeg', big: true },
                  { key: 'calendar' as const, tag: 'Calendrier', title: 'Toutes les courses de la saison', img: calendar[1].photo },
                  { key: 'stats' as const, tag: 'Statistiques', title: 'Chiffres, écarts et écuries', img: '/cars/ferrari.jpeg' },
                  { key: 'favorites' as const, tag: 'Favoris', title: 'Ton pilote et ton écurie', img: drivers.find(d => d.id === favDriver)?.photo || '/cars/mclaren.jpeg' },
                ].map((t) => (
                  <button key={t.key} onClick={() => setSubPage(t.key)} className={`group relative overflow-hidden border border-zinc-800 hover:border-red-600 bg-zinc-950 text-left transition ${t.big ? 'sm:col-span-2 lg:col-span-3 aspect-[16/9] lg:aspect-[21/9]' : 'aspect-[16/10]'}`}>
                    <img src={t.img} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                      <span className="inline-block bg-red-600 text-white text-[11px] font-bold uppercase tracking-widest px-2 py-1">{t.tag}</span>
                      <h3 className={`mt-2 font-black uppercase tracking-tight leading-tight ${t.big ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'}`}>{t.title}</h3>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <aside className="lg:col-span-4 space-y-8">
              <section>
                <SectionTitle kicker="Championnat" title="Top pilotes" className="mb-4" />
                <div className="border border-zinc-800 bg-zinc-950 divide-y divide-zinc-800">
                  {liveStandings.length === 0 && <p className="p-4 text-sm text-zinc-500">Chargement...</p>}
                  {liveStandings.slice(0, 5).map((d, i) => (
                    <button key={d.Driver.driverId} onClick={() => setSubPage('standings')} className="w-full flex items-center justify-between gap-3 px-4 min-h-14 text-left hover:bg-zinc-900 transition">
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="w-6 text-lg font-black text-red-500">{i + 1}</span>
                        <span className="w-1 h-6 shrink-0" style={{ backgroundColor: getColor(d.Constructors[0]?.name || '') }} />
                        <span className="truncate text-sm font-bold uppercase">{d.Driver.givenName} {d.Driver.familyName}</span>
                      </span>
                      <span className="text-sm font-black">{d.points}</span>
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <SectionTitle kicker="À suivre" title="Prochaines courses" className="mb-4" />
                <div className="border border-zinc-800 bg-zinc-950 divide-y divide-zinc-800">
                  {calendar.slice(1, 5).map((race) => (
                    <button key={race.round} onClick={() => { setSelectedRace(race); setSubPage('calendar') }} className="w-full flex items-center justify-between gap-3 px-4 min-h-14 text-left hover:bg-zinc-900 transition">
                      <span className="min-w-0">
                        <span className="block text-sm font-bold uppercase truncate">{race.name}</span>
                        <span className="block text-xs text-zinc-500">{race.circuit}</span>
                      </span>
                      <span className="text-xs text-zinc-400 text-right shrink-0">{race.date}</span>
                    </button>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </main>
      </div>
    )
  }

  if (step === 'driver') {
    return (
      <div className="min-h-dvh w-full flex flex-col bg-black text-white pb-10">
        <header className="flex items-center justify-between gap-2 px-4 sm:px-6 lg:px-10 xl:px-14 py-2 sm:py-4 border-b-4 border-red-600 sticky top-0 bg-black z-10">
          <button onClick={onBack} className="text-sm text-zinc-400 min-h-11 min-w-16 text-left">← Retour</button>
          <h1 className="font-black uppercase tracking-tight text-center text-sm sm:text-lg">Choisis tes pilotes</h1>
          <button onClick={() => setStep('team')} className="text-sm text-zinc-400 min-h-11 min-w-16 text-right">Passer</button>
        </header>
        <div className="px-4 sm:px-6 lg:px-10 xl:px-14 py-6 w-full flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
            {drivers.map((d) => (
              <button key={d.id} onClick={() => toggleDriver(d.id)} className="flex flex-col items-center rounded-sm p-1 active:opacity-80">
                <img src={d.photo} alt={d.name} className={`w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full object-cover object-top transition ${selectedDrivers.includes(d.id) ? 'ring-4 ring-red-600' : ''}`} />
                <p className="mt-2 font-medium text-sm text-center">{d.name}</p>
                <p className="text-xs text-zinc-500">{d.team}</p>
              </button>
            ))}
          </div>
          <button ref={validateRef} disabled={selectedDrivers.length === 0} onClick={() => setStep('team')} className="mt-10 block w-full sm:max-w-md mx-auto py-4 bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-sm font-medium">Valider ({selectedDrivers.length})</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh w-full flex flex-col bg-black text-white pb-10">
      <header className="flex items-center justify-between gap-2 px-4 sm:px-6 lg:px-10 xl:px-14 py-2 sm:py-4 border-b-4 border-red-600 sticky top-0 bg-black z-10">
        <button onClick={() => setStep('driver')} className="text-sm text-zinc-400 min-h-11 min-w-16 text-left">← Retour</button>
        <h1 className="font-black uppercase tracking-tight text-center text-sm sm:text-lg">Choisis ton écurie</h1>
        <button onClick={() => setStep('done')} className="text-sm text-zinc-400 min-h-11 min-w-16 text-right">Passer</button>
      </header>
      <div className="px-4 sm:px-6 lg:px-10 xl:px-14 py-6 w-full flex-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6 lg:gap-8">
          {teams.map((t) => (
            <button key={t.id} onClick={() => { setFavTeam(t.id); localStorage.setItem(teamKey, t.id); scrollToValidate() }} className={`flex flex-col items-center gap-3 p-4 rounded-sm ${favTeam === t.id ? 'bg-zinc-900' : ''}`}>
              <img src={t.logo} alt={t.name} className="w-16 h-16 sm:w-20 sm:h-20 lg:w-28 lg:h-28 object-contain" />
              <p className="font-medium text-sm text-center">{t.name}</p>
            </button>
          ))}
        </div>
        <button ref={validateRef} disabled={!favTeam} onClick={() => setStep('done')} className="mt-10 block w-full sm:max-w-md mx-auto py-4 bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-sm font-medium">Valider</button>
      </div>
    </div>
  )
}