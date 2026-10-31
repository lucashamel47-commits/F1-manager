import { useState, useEffect } from 'react'
import Home from './pages/Home'
import ModeSelect from './pages/ModeSelect'
import HorsCourse from './pages/HorsCourse'
import LiveMode from './pages/LiveMode'
import Reminders from './pages/Reminders'
import NewPassword from './components/NewPassword'
import { supabase, supabaseEnabled, APP_URL } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import ChatBot from './components/ChatBot'

interface User {
  id: string
  email: string
}

/** Sans Supabase : ancien mode local (comptes dans le navigateur). */
const localUser = (): User | null => {
  const email = localStorage.getItem('f1-current-user')
  return email ? { id: email, email } : null
}

const authError = (m: string): string => {
  if (/invalid login/i.test(m)) return 'Email ou mot de passe incorrect.'
  if (/not confirmed/i.test(m)) return "Confirme d'abord ton email : clique sur le lien reçu par mail."
  if (/already registered/i.test(m)) return 'Cet email a déjà un compte. Connecte-toi.'
  if (/rate limit|too many/i.test(m)) return 'Trop de tentatives. Réessaie dans quelques minutes.'
  if (/password/i.test(m)) return '6 caractères minimum pour le mot de passe.'
  return 'Une erreur est survenue. Réessaie.'
}

function App() {
  const [showAuth, setShowAuth] = useState(false)
  const [isLogin, setIsLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [user, setUser] = useState<User | null>(() => (supabase ? null : localUser()))
  const [ready, setReady] = useState(!supabase)
  const [recovery, setRecovery] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [mode, setMode] = useState<'select' | 'hors' | 'live' | 'notif'>('select')
  const [favDriver, setFavDriver] = useState<string | null>(null)
  const [favTeam, setFavTeam] = useState<string | null>(null)
  const loggedIn = user !== null

  // Comptes en ligne : session restaurée au démarrage, puis suivie (connexion, déconnexion, lien « mot de passe oublié »).
  useEffect(() => {
    if (!supabase) return
    const toUser = (s: Session | null): User | null => (s?.user ? { id: s.user.id, email: s.user.email ?? '' } : null)
    supabase.auth.getSession().then(({ data }) => {
      setUser(toUser(data.session))
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      setUser(toUser(session))
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return setMessage('Remplis les champs')

    if (supabase) {
      if (!isLogin && password.length < 6) return setMessage('6 caractères minimum pour le mot de passe.')
      setBusy(true)
      setMessage('')
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) setMessage(authError(error.message))
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: APP_URL } })
        if (error) setMessage(authError(error.message))
        else if (data.user && data.user.identities?.length === 0) setMessage('Cet email a déjà un compte. Connecte-toi.')
        else if (!data.session) {
          setMessage('Compte créé ! Clique sur le lien reçu par email pour le confirmer, puis connecte-toi.')
          setIsLogin(true)
        }
      }
      setBusy(false)
      return
    }

    const users = JSON.parse(localStorage.getItem('f1-users') || '{}')
    if (isLogin) {
      if (users[email] === password) {
        localStorage.setItem('f1-current-user', email)
        setUser({ id: email, email })
      } else setMessage('Mauvais identifiants')
    } else {
      if (users[email]) setMessage('Email déjà pris')
      else {
        users[email] = password
        localStorage.setItem('f1-users', JSON.stringify(users))
        localStorage.setItem('f1-current-user', email)
        setShowConfetti(true)
        setTimeout(() => setUser({ id: email, email }), 1400)
      }
    }
  }

  const handleForgot = async () => {
    if (!supabase) return
    if (!email) return setMessage('Entre ton email ci-dessus, puis touche « Mot de passe oublié ».')
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: APP_URL })
    setBusy(false)
    setMessage(error ? authError(error.message) : "Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé.")
  }

  const logout = () => {
    if (supabase) supabase.auth.signOut()
    else {
      localStorage.removeItem('f1-current-user')
      setUser(null)
    }
    setMode('select')
    setFavDriver(null)
    setFavTeam(null)
  }

  if (!ready) return <div className="min-h-dvh bg-black" />

  if (recovery) return <NewPassword onDone={() => setRecovery(false)} />

  if (loggedIn && mode === 'notif') {
    return <Reminders onBack={() => setMode('select')} user={supabaseEnabled ? user : null} />
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
          userEmail={user?.email ?? ''}
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
          onSelectNotif={() => setMode('notif')}
          onLogout={logout}
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
      busy={busy}
      onForgot={supabase ? handleForgot : undefined}
    />
  )
}

export default App