import { useState, useEffect } from 'react'
import Home from './pages/Home'
import ModeSelect from './pages/ModeSelect'
import HorsCourse from './pages/HorsCourse'
import LiveMode from './pages/LiveMode'
import ChatBot from './components/ChatBot'

function App() {
  const [showAuth, setShowAuth] = useState(false)
  const [isLogin, setIsLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [mode, setMode] = useState<'select' | 'hors' | 'live'>('select')
  const [favDriver, setFavDriver] = useState<string | null>(null)
  const [favTeam, setFavTeam] = useState<string | null>(null)

  useEffect(() => {
    if (localStorage.getItem('f1-current-user')) setLoggedIn(true)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return setMessage('Remplis les champs')
    const users = JSON.parse(localStorage.getItem('f1-users') || '{}')
    if (isLogin) {
      if (users[email] === password) {
        localStorage.setItem('f1-current-user', email)
        setLoggedIn(true)
      } else setMessage('Mauvais identifiants')
    } else {
      if (users[email]) setMessage('Email déjà pris')
      else {
        users[email] = password
        localStorage.setItem('f1-users', JSON.stringify(users))
        localStorage.setItem('f1-current-user', email)
        setShowConfetti(true)
        setTimeout(() => setLoggedIn(true), 1400)
      }
    }
  }

  if (loggedIn && mode === 'live') {
    return (
      <>
        <LiveMode onBack={() => setMode('select')} />
        <ChatBot />
      </>
    )
  }

  if (loggedIn && mode === 'hors') {
    return (
      <>
        <HorsCourse
          onBack={() => setMode('select')}
          userEmail={localStorage.getItem('f1-current-user') || ''}
          favDriver={favDriver}
          setFavDriver={setFavDriver}
          favTeam={favTeam}
          setFavTeam={setFavTeam}
        />
        <ChatBot />
      </>
    )
  }

  if (loggedIn) {
    return (
      <>
        <ModeSelect
          onSelectHors={() => setMode('hors')}
          onSelectLive={() => setMode('live')}
          onLogout={() => {
            localStorage.removeItem('f1-current-user')
            setLoggedIn(false)
            setMode('select')
            setFavDriver(null)
            setFavTeam(null)
          }}
          onInfo={setInfo}
        />
        <ChatBot />
        {info && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4 sm:px-6" onClick={() => setInfo(null)}>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-sm md:max-w-md w-full max-h-[85dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-3">
                {info === 'hors' ? 'Mode Hors Course' : 'Mode Live Timing'}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {info === 'hors'
                  ? 'Classements, statistiques, suivi de ton pilote préféré, de ton écurie, calendrier des courses et données hors week-end.'
                  : 'Classement en direct, carte du circuit avec les voitures, pneus et stratégie, chronos par secteur, télémétrie de chaque pilote, direction de course, radios et météo pendant les sessions. Hors week-end : compte à rebours de la prochaine session et rejeu des courses passées (×1, ×10, ×50).'}
              </p>
              <button onClick={() => setInfo(null)} className="mt-5 w-full py-3 bg-zinc-800 rounded-xl text-sm">
                Fermer
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <Home
      showAuth={showAuth}
      setShowAuth={setShowAuth}
      isLogin={isLogin}
      setIsLogin={setIsLogin}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      message={message}
      showConfetti={showConfetti}
      onSubmit={handleSubmit}
    />
  )
}

export default App