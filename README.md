<<<<<<< HEAD
import { useState, useEffect, useRef } from 'react'

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

export default function HorsCourse({ onBack, userEmail, favDriver, setFavDriver, favTeam, setFavTeam }: Props) {
  const driverKey = `f1-fav-drivers-${userEmail}`
  const teamKey = `f1-fav-team-${userEmail}`
  const validateRef = useRef<HTMLButtonElement>(null)

  const [step, setStep] = useState<'driver' | 'team' | 'done'>('driver')
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([])
  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomeDone, setWelcomeDone] = useState(false)
  const [subPage, setSubPage] = useState<'home' | 'standings' | 'calendar' | 'stats' | 'favorites' | 'circuit'>('home')
  const [liveStandings, setLiveStandings] = useState<any[]>([])
  const [liveConstructors, setLiveConstructors] = useState<any[]>([])
  const [hover, setHover] = useState<{ x: number; y: number; speed: number } | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [standingsTab, setStandingsTab] = useState<'drivers' | 'constructors'>('drivers')
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null)
  const [selectedConstructor, setSelectedConstructor] = useState<any | null>(null)
  const [selectedRace, setSelectedRace] = useState<any | null>(null)

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
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-center px-6">
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
        <div className="min-h-screen bg-black text-white">
          <header className="flex items-center justify-between px-6 py-5 border-b border-zinc-900">
            <button onClick={() => setSubPage('home')} className="text-sm text-zinc-500">← Retour</button>
            <p className="text-xs tracking-widest uppercase text-zinc-600">Circuit</p>
            <div className="w-12" />
          </header>
          <div className="px-6 py-6 max-w-md mx-auto space-y-6">
            <div className="text-center">
              <p className="text-red-600 text-[10px] tracking-[0.5em] uppercase mb-2">Prochain GP</p>
              <h1 className="text-2xl font-black">{cota.name}</h1>
              <p className="text-sm text-zinc-500 mt-1">{cota.circuit} • Austin</p>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-zinc-900 select-none touch-none" onMouseDown={() => setIsActive(true)} onMouseUp={() => { setIsActive(false); setHover(null) }} onMouseLeave={() => { setIsActive(false); setHover(null) }} onMouseMove={(e) => handleTrackMove(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())} onTouchStart={() => setIsActive(true)} onTouchEnd={() => { setIsActive(false); setHover(null) }} onTouchMove={(e) => { e.preventDefault(); const touch = e.touches[0]; handleTrackMove(touch.clientX, touch.clientY, e.currentTarget.getBoundingClientRect()) }}>
              <img src={cota.map} alt="COTA" className="w-full pointer-events-none" />
              {hover && isActive && (
                <div className="absolute bg-black/95 border border-zinc-700 rounded-xl px-4 py-2 text-center text-xs shadow-xl pointer-events-none whitespace-nowrap" style={{ left: `${Math.min(85, Math.max(15, hover.x * 100))}%`, top: hover.y < 0.25 ? `${hover.y * 100 + 12}%` : `${Math.max(8, hover.y * 100)}%`, transform: hover.y < 0.25 ? 'translate(-50%, 0)' : 'translate(-50%, -140%)' }}>
                  <p className="font-semibold text-white">{hover.speed} km/h</p>
                  <p className="text-zinc-500 text-[10px] mt-0.5">Vitesse estimée</p>
                </div>
              )}
            </div>
            <img src={cota.photo} alt="COTA photo" className="w-full rounded-2xl border border-zinc-900" />
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4"><p className="text-[11px] text-zinc-500">Longueur</p><p className="font-semibold mt-1">{cota.length}</p></div>
              <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4"><p className="text-[11px] text-zinc-500">Tours</p><p className="font-semibold mt-1">{cota.laps}</p></div>
              <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4 col-span-2"><p className="text-[11px] text-zinc-500">Record</p><p className="font-semibold mt-1">{cota.record}</p><p className="text-[10px] text-zinc-500 mt-0.5">{cota.recordDriver}</p></div>
            </div>
            <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4"><p className="text-[11px] text-zinc-500">Histoire</p><p className="text-sm mt-1 leading-relaxed">{cota.history}</p></div>
            <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4"><p className="text-[11px] text-zinc-500">Grip</p><p className="text-sm mt-1">{cota.grip}</p></div>
            <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4"><p className="text-[11px] text-zinc-500">Concepteur</p><p className="text-sm mt-1">{cota.creator}</p></div>
          </div>
        </div>
      )
    }

    if (subPage === 'calendar') {
      if (selectedRace) {
        return (
          <div className="min-h-screen bg-black text-white">
            <header className="flex items-center justify-between px-6 py-5 border-b border-zinc-900">
              <button onClick={() => setSelectedRace(null)} className="text-sm text-zinc-500">← Retour</button>
              <p className="text-xs tracking-widest uppercase text-zinc-600">Course</p>
              <div className="w-12" />
            </header>
            <div className="px-6 py-6 max-w-md mx-auto space-y-6">
              <div className="text-center">
                <p className="text-red-600 text-[10px] tracking-[0.5em] uppercase mb-2">Round {selectedRace.round}</p>
                <h1 className="text-2xl font-black">{selectedRace.name}</h1>
                <p className="text-sm text-zinc-500 mt-1">{selectedRace.circuit} • {selectedRace.date}</p>
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-zinc-900 select-none touch-none" onMouseDown={() => setIsActive(true)} onMouseUp={() => { setIsActive(false); setHover(null) }} onMouseLeave={() => { setIsActive(false); setHover(null) }} onMouseMove={(e) => handleTrackMove(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())} onTouchStart={() => setIsActive(true)} onTouchEnd={() => { setIsActive(false); setHover(null) }} onTouchMove={(e) => { e.preventDefault(); const touch = e.touches[0]; handleTrackMove(touch.clientX, touch.clientY, e.currentTarget.getBoundingClientRect()) }}>
                <img src={selectedRace.map} alt={selectedRace.name} className="w-full pointer-events-none" />
                {hover && isActive && (
                  <div className="absolute bg-black/95 border border-zinc-700 rounded-xl px-4 py-2 text-center text-xs shadow-xl pointer-events-none whitespace-nowrap" style={{ left: `${Math.min(85, Math.max(15, hover.x * 100))}%`, top: hover.y < 0.25 ? `${hover.y * 100 + 12}%` : `${Math.max(8, hover.y * 100)}%`, transform: hover.y < 0.25 ? 'translate(-50%, 0)' : 'translate(-50%, -140%)' }}>
                    <p className="font-semibold text-white">{hover.speed} km/h</p>
                    <p className="text-zinc-500 text-[10px] mt-0.5">Vitesse estimée</p>
                  </div>
                )}
              </div>
              <img src={selectedRace.photo} alt={selectedRace.name} className="w-full rounded-2xl border border-zinc-900" />
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4"><p className="text-[11px] text-zinc-500">Longueur</p><p className="font-semibold mt-1">{selectedRace.length}</p></div>
                <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4"><p className="text-[11px] text-zinc-500">Tours</p><p className="font-semibold mt-1">{selectedRace.laps}</p></div>
                <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4 col-span-2"><p className="text-[11px] text-zinc-500">Record</p><p className="font-semibold mt-1">{selectedRace.record}</p><p className="text-[10px] text-zinc-500 mt-0.5">{selectedRace.recordDriver}</p></div>
              </div>
              <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4"><p className="text-[11px] text-zinc-500">Histoire</p><p className="text-sm mt-1 leading-relaxed">{selectedRace.history}</p></div>
              <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4"><p className="text-[11px] text-zinc-500">Grip</p><p className="text-sm mt-1">{selectedRace.grip}</p></div>
              <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4"><p className="text-[11px] text-zinc-500">Concepteur</p><p className="text-sm mt-1">{selectedRace.creator}</p></div>
            </div>
          </div>
        )
      }

      return (
        <div className="min-h-screen bg-black text-white">
          <header className="flex items-center justify-between px-6 py-5 border-b border-zinc-900">
            <button onClick={() => setSubPage('home')} className="text-sm text-zinc-500">← Retour</button>
            <p className="text-xs tracking-widest uppercase text-zinc-600">Calendrier</p>
            <div className="w-12" />
          </header>
          <div className="px-6 py-8 max-w-md mx-auto space-y-3">
            {calendar.map((race) => (
              <button key={race.round} onClick={() => setSelectedRace(race)} className="w-full flex items-center justify-between bg-zinc-950/40 border border-zinc-900/80 rounded-2xl px-5 py-4 text-left hover:border-zinc-700 transition">
                <div>
                  <p className="text-sm font-medium">{race.name}</p>
                  <p className="text-[11px] text-zinc-500">{race.circuit}</p>
                </div>
                <span className="text-xs text-zinc-400">{race.date}</span>
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
          <div className="min-h-screen bg-black text-white">
            <header className="flex items-center justify-between px-6 py-5 border-b border-zinc-900">
              <button onClick={() => setSelectedDriver(null)} className="text-sm text-zinc-500">← Retour</button>
              <p className="text-xs tracking-widest uppercase text-zinc-600">Pilote</p>
              <div className="w-12" />
            </header>
            <div className="px-6 py-8 max-w-md mx-auto space-y-6">
              <div className="text-center">
                <div className="w-28 h-28 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-black text-white" style={{ backgroundColor: getColor(teamName) }}>
                  {selectedDriver.Driver.familyName.charAt(0)}
                </div>
                <h1 className="text-2xl font-black">{selectedDriver.Driver.givenName} {selectedDriver.Driver.familyName}</h1>
                <p className="text-sm text-zinc-500 mt-1">{teamName}</p>
              </div>
              <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4">
                <p className="text-sm leading-relaxed text-zinc-300">Pilote de Formule 1 en compétition pour le championnat.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4 text-center"><p className="text-[11px] text-zinc-500">Points</p><p className="text-xl font-semibold mt-1">{selectedDriver.points}</p></div>
                <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4 text-center"><p className="text-[11px] text-zinc-500">Victoires</p><p className="text-xl font-semibold mt-1">{selectedDriver.wins}</p></div>
                <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4 text-center"><p className="text-[11px] text-zinc-500">Position</p><p className="text-xl font-semibold mt-1">{selectedDriver.position}</p></div>
                <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4 text-center"><p className="text-[11px] text-zinc-500">Nationalité</p><p className="text-xl font-semibold mt-1">{nat}</p></div>
              </div>
            </div>
          </div>
        )
      }

      if (selectedConstructor) {
        const nat = nationalityFR[selectedConstructor.Constructor.nationality] || selectedConstructor.Constructor.nationality
        return (
          <div className="min-h-screen bg-black text-white">
            <header className="flex items-center justify-between px-6 py-5 border-b border-zinc-900">
              <button onClick={() => setSelectedConstructor(null)} className="text-sm text-zinc-500">← Retour</button>
              <p className="text-xs tracking-widest uppercase text-zinc-600">Écurie</p>
              <div className="w-12" />
            </header>
            <div className="px-6 py-8 max-w-md mx-auto space-y-6">
              <h1 className="text-2xl font-black text-center">{selectedConstructor.Constructor.name}</h1>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4 text-center"><p className="text-[11px] text-zinc-500">Points</p><p className="text-xl font-semibold mt-1">{selectedConstructor.points}</p></div>
                <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4 text-center"><p className="text-[11px] text-zinc-500">Victoires</p><p className="text-xl font-semibold mt-1">{selectedConstructor.wins}</p></div>
                <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4 text-center"><p className="text-[11px] text-zinc-500">Position</p><p className="text-xl font-semibold mt-1">{selectedConstructor.position}</p></div>
                <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4 text-center"><p className="text-[11px] text-zinc-500">Nationalité</p><p className="text-xl font-semibold mt-1">{nat}</p></div>
              </div>
            </div>
          </div>
        )
      }

      return (
        <div className="min-h-screen bg-black text-white">
          <header className="flex items-center justify-between px-6 py-5 border-b border-zinc-900">
            <button onClick={() => setSubPage('home')} className="text-sm text-zinc-500">← Retour</button>
            <p className="text-xs tracking-widest uppercase text-zinc-600">Classements</p>
            <div className="w-12" />
          </header>
          <div className="px-6 py-6 max-w-md mx-auto">
            <div className="flex gap-2 mb-6">
              <button onClick={() => setStandingsTab('drivers')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${standingsTab === 'drivers' ? 'bg-red-600 text-white' : 'bg-zinc-950 border border-zinc-800 text-zinc-400'}`}>Pilotes</button>
              <button onClick={() => setStandingsTab('constructors')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${standingsTab === 'constructors' ? 'bg-red-600 text-white' : 'bg-zinc-950 border border-zinc-800 text-zinc-400'}`}>Constructeurs</button>
            </div>
            <div className="space-y-3">
              {standingsTab === 'drivers' ? (
                liveStandings.length === 0 ? <p className="text-center text-zinc-500 text-sm">Chargement...</p> :
                liveStandings.map((d, i) => {
                  const teamName = d.Constructors[0]?.name || ''
                  return (
                    <button key={d.Driver.driverId} onClick={() => setSelectedDriver(d)} className="w-full flex items-center justify-between bg-zinc-950/40 border border-zinc-900/80 rounded-2xl px-5 py-4 text-left hover:border-zinc-700 transition">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-zinc-600 w-6">{i + 1}</span>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: getColor(teamName) }}>
                          {d.Driver.familyName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{d.Driver.givenName} {d.Driver.familyName}</p>
                          <p className="text-[11px] text-zinc-500">{teamName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-zinc-300">{d.points}</span>
                        <p className="text-[10px] text-zinc-500">{d.wins} win{Number(d.wins) !== 1 ? 's' : ''}</p>
                      </div>
                    </button>
                  )
                })
              ) : (
                liveConstructors.length === 0 ? <p className="text-center text-zinc-500 text-sm">Chargement...</p> :
                liveConstructors.map((t, i) => (
                  <button key={t.Constructor.constructorId} onClick={() => setSelectedConstructor(t)} className="w-full flex items-center justify-between bg-zinc-950/40 border border-zinc-900/80 rounded-2xl px-5 py-4 text-left hover:border-zinc-700 transition">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-zinc-600 w-6">{i + 1}</span>
                      <p className="text-sm font-medium">{t.Constructor.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-zinc-300">{t.points}</span>
                      <p className="text-[10px] text-zinc-500">{t.wins} win{Number(t.wins) !== 1 ? 's' : ''}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
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
        <div className="min-h-screen bg-black text-white pb-10">
          <header className="flex items-center justify-between px-6 py-5 border-b border-zinc-900">
            <button onClick={() => setSubPage('home')} className="text-sm text-zinc-500">← Retour</button>
            <p className="text-xs tracking-widest uppercase text-zinc-600">Statistiques</p>
            <div className="w-12" />
          </header>
          <div className="px-5 py-6 max-w-md mx-auto space-y-7">
            <div>
              <p className="text-red-600 text-[10px] tracking-[0.5em] uppercase mb-4">Title Fight</p>
              {leader && second ? (
                <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
                  <div className="flex justify-between items-end mb-4">
                    <div><p className="text-xs text-zinc-500">{leader.Driver.familyName}</p><p className="text-3xl font-black">{leader.points}</p><p className="text-[11px] text-zinc-500 mt-1">{leader.wins} victoires</p></div>
                    <div className="text-right"><p className="text-xs text-zinc-500">{second.Driver.familyName}</p><p className="text-3xl font-black text-zinc-400">{second.points}</p><p className="text-[11px] text-zinc-500 mt-1">{second.wins} victoires</p></div>
                  </div>
                  <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-zinc-900 mb-3">
                    <div className="bg-red-600" style={{ width: `${(Number(leader.points) / (Number(leader.points) + Number(second.points))) * 100}%` }} />
                    <div className="bg-zinc-700 flex-1" />
                  </div>
                  <p className="text-[11px] text-zinc-500 text-center">Écart : {gap} points</p>
                </div>
              ) : <p className="text-center text-zinc-500 text-sm">Chargement...</p>}
            </div>
            <div>
              <p className="text-red-600 text-[10px] tracking-[0.5em] uppercase mb-4">Top 3</p>
              <div className="space-y-2">
                {liveStandings.slice(0, 3).map((d, i) => (
                  <div key={d.Driver.driverId} className="flex items-center justify-between bg-zinc-950/60 border border-zinc-900/80 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3"><span className="text-xs text-zinc-600 w-5">{i + 1}</span><div><p className="text-sm font-medium">{d.Driver.familyName}</p><p className="text-[11px] text-zinc-500">{d.Constructors[0]?.name}</p></div></div>
                    <div className="text-right"><p className="text-sm font-semibold">{d.points}</p><p className="text-[10px] text-zinc-500">{d.wins} win{Number(d.wins) !== 1 ? 's' : ''}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-red-600 text-[10px] tracking-[0.5em] uppercase mb-4">Essentiels</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950/60 border border-zinc-900/80 rounded-2xl p-4"><p className="text-[11px] text-zinc-500">Moy. points / course</p><p className="text-lg font-semibold mt-1">{leader ? (Number(leader.points) / totalRaces).toFixed(1) : '-'}</p></div>
                <div className="bg-zinc-950/60 border border-zinc-900/80 rounded-2xl p-4"><p className="text-[11px] text-zinc-500">Victoires leader</p><p className="text-lg font-semibold mt-1">{leader?.wins || '-'}</p></div>
                <div className="bg-zinc-950/60 border border-zinc-900/80 rounded-2xl p-4"><p className="text-[11px] text-zinc-500">Écart au 2e</p><p className="text-lg font-semibold mt-1">{gap} pts</p></div>
                <div className="bg-zinc-950/60 border border-zinc-900/80 rounded-2xl p-4"><p className="text-[11px] text-zinc-500">Écurie leader</p><p className="text-lg font-semibold mt-1">{liveConstructors[0]?.Constructor.name || '-'}</p></div>
              </div>
            </div>
            <div>
              <p className="text-red-600 text-[10px] tracking-[0.5em] uppercase mb-4">Constructeurs</p>
              <div className="space-y-2">
                {liveConstructors.slice(0, 3).map((t, i) => (
                  <div key={t.Constructor.constructorId} className="flex items-center justify-between bg-zinc-950/60 border border-zinc-900/80 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3"><span className="text-xs text-zinc-600 w-5">{i + 1}</span><p className="text-sm font-medium">{t.Constructor.name}</p></div>
                    <div className="text-right"><p className="text-sm font-semibold">{t.points}</p><p className="text-[10px] text-zinc-500">{t.wins} win{Number(t.wins) !== 1 ? 's' : ''}</p></div>
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
        <div className="min-h-screen bg-black text-white">
          <header className="flex items-center justify-between px-6 py-5 border-b border-zinc-900">
            <button onClick={() => setSubPage('home')} className="text-sm text-zinc-500">← Retour</button>
            <p className="text-xs tracking-widest uppercase text-zinc-600">Tes favoris</p>
            <div className="w-12" />
          </header>
          <div className="px-6 py-8 max-w-md mx-auto space-y-6">
            {driver && (
              <div className="bg-zinc-950/40 border border-zinc-900/80 rounded-2xl p-5">
                <div className="flex items-center gap-4 mb-5">
                  <img src={driver.photo} alt={driver.name} className="w-16 h-16 rounded-full object-cover object-top" />
                  <div><p className="font-semibold">{driver.name}</p><p className="text-xs text-zinc-500">{driver.team}</p></div>
                </div>
                <a href={`https://www.formula1.com/en/drivers/${driver.name.toLowerCase().replace(/ /g, '-')}.html`} target="_blank" rel="noreferrer" className="block w-full py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-sm font-medium hover:bg-zinc-800 transition">Voir les actualités</a>
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(driver.name + ' F1')}`} target="_blank" rel="noreferrer" className="block w-full py-3 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-sm font-medium hover:bg-zinc-800 transition">Vidéos récentes</a>
              </div>
            )}
            {team && (
              <div className="bg-zinc-950/40 border border-zinc-900/80 rounded-2xl p-5">
                <div className="flex items-center gap-4 mb-5">
                  <img src={team.logo} alt={team.name} className="w-14 h-14 object-contain" />
                  <p className="font-semibold">{team.name}</p>
                </div>
                <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(team.name.replace(' Racing', ''))}`} target="_blank" rel="noreferrer" className="block w-full py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-sm font-medium hover:bg-zinc-800 transition">Voir les actualités</a>
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(team.name + ' F1')}`} target="_blank" rel="noreferrer" className="block w-full py-3 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-sm font-medium hover:bg-zinc-800 transition">Vidéos récentes</a>
              </div>
            )}
            {!driver && !team && <p className="text-center text-zinc-500">Aucun favori sélectionné</p>}
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-black text-white">
        <header className="flex items-center justify-between px-6 py-5 border-b border-zinc-900">
          <button onClick={onBack} className="text-sm text-zinc-500">← Retour</button>
          <p className="text-xs tracking-widest uppercase text-zinc-600">Hors Course</p>
          <div className="w-12" />
        </header>
        <div className="px-6 py-8 max-w-md mx-auto space-y-8">
          <div onClick={() => setSubPage('circuit')} className="relative overflow-hidden rounded-3xl bg-zinc-950 border border-zinc-800 cursor-pointer active:scale-[0.98] transition">
            <img src="https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/USA_Circuit.png" alt="Circuit of the Americas" className="w-full h-44 object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              <span className="text-red-600 text-[10px] tracking-[0.4em] uppercase">Prochain GP</span>
              <span className="text-xs text-zinc-400">{getDaysUntilRace()}</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h2 className="text-2xl font-black leading-none">United States</h2>
              <p className="text-sm text-zinc-400 mt-1">23 – 25 octobre • Austin</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setSubPage('standings')} className="py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm font-medium hover:border-zinc-600 transition">Classements</button>
            <button onClick={() => setSubPage('calendar')} className="py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm font-medium hover:border-zinc-600 transition">Calendrier</button>
            <button onClick={() => setSubPage('stats')} className="py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm font-medium hover:border-zinc-600 transition">Statistiques</button>
            <button onClick={() => setSubPage('favorites')} className="py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm font-medium hover:border-zinc-600 transition">Tes favoris</button>
          </div>
          <div>
            <p className="text-red-600 text-[10px] tracking-[0.5em] uppercase mb-4">Top 3 Pilotes</p>
            <div className="space-y-2.5">
              {liveStandings.slice(0, 3).map((d, i) => (
                <div key={d.Driver.driverId} className="flex items-center justify-between bg-zinc-950/40 border border-zinc-900/60 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3"><span className="text-xs text-zinc-600 w-4">{i + 1}</span><p className="text-sm font-medium">{d.Driver.familyName}</p></div>
                  <span className="text-sm text-zinc-400">{d.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'driver') {
    return (
      <div className="min-h-screen bg-black text-white pb-10">
        <header className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 sticky top-0 bg-black z-10">
          <button onClick={onBack} className="text-sm text-zinc-400">← Retour</button>
          <h1 className="font-semibold">Choisis tes pilotes</h1>
          <button onClick={() => setStep('team')} className="text-sm text-zinc-500">Passer</button>
        </header>
        <div className="px-5 py-6">
          <div className="grid grid-cols-2 gap-6">
            {drivers.map((d) => (
              <button key={d.id} onClick={() => toggleDriver(d.id)} className="flex flex-col items-center">
                <img src={d.photo} alt={d.name} className={`w-28 h-28 rounded-full object-cover object-top transition ${selectedDrivers.includes(d.id) ? 'ring-4 ring-red-600' : ''}`} />
                <p className="mt-2 font-medium text-sm text-center">{d.name}</p>
                <p className="text-xs text-zinc-500">{d.team}</p>
              </button>
            ))}
          </div>
          <button ref={validateRef} disabled={selectedDrivers.length === 0} onClick={() => setStep('team')} className="mt-10 w-full py-4 bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl font-medium">Valider ({selectedDrivers.length})</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      <header className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 sticky top-0 bg-black z-10">
        <button onClick={() => setStep('driver')} className="text-sm text-zinc-400">← Retour</button>
        <h1 className="font-semibold">Choisis ton écurie</h1>
        <button onClick={() => setStep('done')} className="text-sm text-zinc-500">Passer</button>
      </header>
      <div className="px-5 py-6">
        <div className="grid grid-cols-2 gap-6">
          {teams.map((t) => (
            <button key={t.id} onClick={() => { setFavTeam(t.id); localStorage.setItem(teamKey, t.id); scrollToValidate() }} className={`flex flex-col items-center gap-3 p-4 rounded-2xl ${favTeam === t.id ? 'bg-zinc-900' : ''}`}>
              <img src={t.logo} alt={t.name} className="w-20 h-20 object-contain" />
              <p className="font-medium text-sm text-center">{t.name}</p>
            </button>
          ))}
        </div>
        <button ref={validateRef} disabled={!favTeam} onClick={() => setStep('done')} className="mt-10 w-full py-4 bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl font-medium">Valider</button>
      </div>
    </div>
  )
}
=======
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
>>>>>>> 25e2e25 (Amélioration page constructeurs + images F1)
