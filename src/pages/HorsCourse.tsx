import { useState, useEffect, useRef } from 'react'

interface Props {
  onBack: () => void
  userEmail: string
  favDriver: string | null
  setFavDriver: (id: string) => void
  favTeam: string | null
  setFavTeam: (id: string) => void
}

export default function HorsCourse({ onBack, userEmail, favDriver, setFavDriver, favTeam, setFavTeam }: Props) {
  const [subPage, setSubPage] = useState<'home' | 'standings' | 'calendar' | 'stats' | 'favorites' | 'circuit' | 'stats-constructors'>('home')
  const [liveStandings, setLiveStandings] = useState<any[]>([])
  const [liveConstructors, setLiveConstructors] = useState<any[]>([])
  const [selectedTeamStats, setSelectedTeamStats] = useState<any | null>(null)
  const [openSection, setOpenSection] = useState<string | null>(null)

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

  const getDaysUntilRace = () => {
    const raceDate = new Date('2026-10-25T00:00:00')
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const diff = Math.ceil((raceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diff <= 0) return 'Aujourd’hui'
    if (diff === 1) return '1 jour'
    return `${diff} jours`
  }

  if (subPage === 'home') {
    return (
      <div className="min-h-screen bg-black text-white">
        <header className="flex items-center justify-between px-6 py-5 border-b border-zinc-900">
          <button onClick={onBack} className="text-sm text-zinc-500">← Retour</button>
          <p className="text-xs tracking-widest uppercase text-zinc-600">Hors Course</p>
          <div className="w-12" />
        </header>
        <div className="px-6 py-8 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto space-y-8">
          <div onClick={() => setSubPage('circuit')} className="relative overflow-hidden rounded-3xl bg-zinc-950 border border-zinc-800 cursor-pointer active:scale-[0.98] transition">
            <img src="https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/USA_Circuit.png" alt="Circuit of the Americas" className="w-full h-44 md:h-64 object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              <span className="text-red-600 text-[10px] tracking-[0.4em] uppercase">Prochain GP</span>
              <span className="text-xs text-zinc-400">{getDaysUntilRace()}</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h2 className="text-2xl md:text-4xl font-black leading-none">United States</h2>
              <p className="text-sm text-zinc-400 mt-1">23 – 25 octobre • Austin</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

  if (subPage === 'stats-constructors') {
    if (selectedTeamStats) {
      const name = selectedTeamStats.Constructor.name.toLowerCase()
      let carImage = '/cars/redbull.jpeg'
      let teamColor = '#3671C6'
      let fournisseur = 'Red Bull Ford'
      let noteMoteur = 'Premier moteur maison de Red Bull (DM01), développé en partenariat avec Ford. Première conception interne complète pour l’écurie.'

      if (name.includes('ferrari')) {
        carImage = '/cars/ferrari.jpeg'
        teamColor = '#E8002D'
        fournisseur = 'Ferrari'
        noteMoteur = 'Moteur conçu et développé entièrement à Maranello. Fournisseur également de Haas et Cadillac.'
      } else if (name.includes('mercedes')) {
        carImage = '/cars/mercedes.jpeg'
        teamColor = '#27F4D2'
        fournisseur = 'Mercedes'
        noteMoteur = 'Mercedes fournit McLaren, Williams et Alpine en plus de son équipe usine.'
      } else if (name.includes('mclaren')) {
        carImage = '/cars/mclaren.jpeg'
        teamColor = '#FF8000'
        fournisseur = 'Mercedes'
        noteMoteur = 'Client Mercedes depuis 2021. Contrat prolongé jusqu’en 2030.'
      } else if (name.includes('aston')) {
        carImage = '/cars/aston.jpeg'
        teamColor = '#229971'
        fournisseur = 'Honda'
        noteMoteur = 'Partenariat exclusif avec Honda dès 2026. Retour officiel du motoriste japonais.'
      }

      const sections = [
        {
          id: 'classement',
          title: 'Classement',
          subtitle: 'Données temps réel',
          content: (
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-1"><span className="text-zinc-400">Position</span><span className="font-medium">{selectedTeamStats.position}</span></div>
              <div className="flex justify-between items-center py-1"><span className="text-zinc-400">Points</span><span className="font-medium">{selectedTeamStats.points}</span></div>
              <div className="flex justify-between items-center py-1"><span className="text-zinc-400">Victoires</span><span className="font-medium">{selectedTeamStats.wins || '0'}</span></div>
              <p className="text-xs text-zinc-500 pt-2">Mis à jour via l’API Ergast.</p>
            </div>
          )
        },
        {
          id: 'moteur',
          title: 'Groupe motopropulseur',
          subtitle: 'Règlement 2026 • ~1000 ch',
          content: (
            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-1"><span className="text-zinc-400">Fournisseur</span><span className="font-medium">{fournisseur}</span></div>
              <div className="flex justify-between py-1"><span className="text-zinc-400">Puissance totale</span><span className="font-medium">~1 000 ch</span></div>
              <div className="flex justify-between py-1"><span className="text-zinc-400">Moteur thermique</span><span className="font-medium">~400 kW</span></div>
              <div className="flex justify-between py-1"><span className="text-zinc-400">Moteur électrique</span><span className="font-medium">350 kW</span></div>
              <div className="flex justify-between py-1"><span className="text-zinc-400">Récupération max</span><span className="font-medium">8,5 MJ / tour</span></div>
              <div className="flex justify-between py-1"><span className="text-zinc-400">Carburant</span><span className="font-medium">100 % durable</span></div>
              <div className="pt-4 mt-2 border-t border-white/5 space-y-2">
                <p className="text-sm text-zinc-300 leading-relaxed">{noteMoteur}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">Le MGU-H a été supprimé. L’énergie est principalement récupérée au freinage. Le moteur électrique représente près de 50 % de la puissance totale.</p>
              </div>
            </div>
          )
        },
        {
          id: 'aero',
          title: 'Aérodynamique',
          subtitle: 'Ailes actives',
          content: (
            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-1"><span className="text-zinc-400">Mode Virage</span><span className="font-medium">Appui maximum</span></div>
              <div className="flex justify-between py-1"><span className="text-zinc-400">Mode Ligne droite</span><span className="font-medium">−55 % de traînée</span></div>
              <div className="flex justify-between py-1"><span className="text-zinc-400">Réduction d’appui</span><span className="font-medium">−30 %</span></div>
              <p className="text-sm text-zinc-300 pt-4 mt-2 border-t border-white/5 leading-relaxed">Les ailes avant et arrière s’ouvrent automatiquement en ligne droite pour réduire la traînée, puis se ferment dans les virages pour maximiser l’appui.</p>
            </div>
          )
        }
      ]

      return (
        <div className="min-h-screen bg-black text-white">
          <header className="flex items-center justify-between px-6 py-5 border-b border-zinc-900">
            <button onClick={() => setSelectedTeamStats(null)} className="text-sm text-zinc-400">← Retour</button>
            <p className="text-[11px] tracking-[0.3em] uppercase text-zinc-500">{selectedTeamStats.Constructor.name}</p>
            <div className="w-12" />
          </header>
          <div className="px-6 pb-20 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 h-64 flex items-center justify-center mb-10">
              <img src={carImage} alt="" className="w-full h-full object-contain" />
            </div>
            <div className="space-y-3">
              {sections.map((s) => {
                const isOpen = openSection === s.id
                return (
                  <div 
                    key={s.id} 
                    className="rounded-2xl bg-zinc-950/40 overflow-hidden"
                    style={{ borderLeft: `4px solid ${teamColor}`, borderTop: '1px solid #27272a', borderRight: '1px solid #27272a', borderBottom: '1px solid #27272a' }}
                  >
                    <button
                      onClick={() => setOpenSection(isOpen ? null : s.id)}
                      className="w-full text-left px-5 py-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-[15px]">{s.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{s.subtitle}</p>
                      </div>
                      <span className={`text-zinc-500 text-lg transition-transform ${isOpen ? 'rotate-45' : ''}`}>+</span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-6 pt-3 border-t border-zinc-800">
                        {s.content}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-black text-white">
        <header className="flex items-center justify-between px-6 py-5 border-b border-zinc-900">
          <button onClick={() => setSubPage('home')} className="text-sm text-zinc-400">← Retour</button>
          <p className="text-xs tracking-widest uppercase text-zinc-500">Constructeurs</p>
          <div className="w-12" />
        </header>
        <div className="px-6 py-8 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto space-y-2">
          {liveConstructors.map((t) => (
            <button key={t.Constructor.constructorId} onClick={() => setSelectedTeamStats(t)} className="w-full text-left bg-zinc-950/40 border border-zinc-900 rounded-2xl px-5 py-4 hover:border-zinc-700 transition">
              <p className="text-sm font-medium">{t.Constructor.name}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-zinc-400 mb-4">Page en cours d'amélioration</p>
        <button onClick={() => setSubPage('home')} className="text-sm text-red-600">← Retour à l'accueil</button>
      </div>
    </div>
  )
}
