import { useState, useEffect, useRef } from 'react'
import Home from './pages/Home'
import AuthPage from './pages/AuthPage'
import { useRoute, replaceRoute, clearRoute } from './lib/route'
import AppHome from './pages/AppHome'
import HorsCourse, { type HorsPage } from './pages/HorsCourse'
import LiveMode from './pages/LiveMode'
import Reminders from './pages/Reminders'
import NewPassword from './components/NewPassword'
import { supabase, supabaseEnabled, APP_URL } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import ChatBot from './components/ChatBot'
import Legal from './pages/Legal'
import { usePageFade } from './lib/motion'
import { isPendingDeletion } from './lib/account'
import AppMenu, { type MenuKey } from './components/AppMenu'

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
  const route = useRoute()
  const isLogin = route === 'connexion'
  const keepMessage = useRef(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [user, setUser] = useState<User | null>(() => (supabase ? null : localUser()))
  const [ready, setReady] = useState(!supabase)
  const [recovery, setRecovery] = useState(false)
  const [mode, setMode] = useState<'select' | 'hors' | 'live' | 'notif'>('select')
  const [horsPage, setHorsPage] = useState<HorsPage | undefined>(undefined)
  const [favDriver, setFavDriver] = useState<string | null>(null)
  const [favTeam, setFavTeam] = useState<string | null>(null)
  const [deleted, setDeleted] = useState(false)
  // Page « Saison » affichée (suivie pour surligner la bonne entrée du menu) et compteur pour rouvrir une page depuis le menu.
  const [seasonPage, setSeasonPage] = useState<string>('standings')
  const [seasonNav, setSeasonNav] = useState(0)
  const loggedIn = user !== null

  // Changer de page (connexion ↔ inscription ↔ accueil) efface l'ancien message d'erreur ; on revient en haut de page.
  useEffect(() => {
    if (keepMessage.current) keepMessage.current = false
    else setMessage('')
    window.scrollTo(0, 0)
  }, [route])

  // Une fois connecté, la route #/connexion n'a plus de sens : on la retire de l'URL.
  useEffect(() => {
    if (loggedIn && route !== 'mentions') clearRoute()
  }, [loggedIn]) // eslint-disable-line react-hooks/exhaustive-deps

  usePageFade(`${loggedIn}-${mode}-${route}`)

  // Comptes en ligne : session restaurée au démarrage, puis suivie (connexion, déconnexion, lien « mot de passe oublié »).
  useEffect(() => {
    if (!supabase) return
    // Un compte en attente de suppression (voir lib/account.ts) ne peut plus se reconnecter.
    const toUser = (s: Session | null): User | null => {
      if (!s?.user) return null
      if (isPendingDeletion(s.user)) {
        supabase?.auth.signOut({ scope: 'local' })
        setMessage('Ce compte a été supprimé.')
        return null
      }
      return { id: s.user.id, email: s.user.email ?? '' }
    }
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
          keepMessage.current = true
          replaceRoute('connexion')
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

  // Après « Supprimer mon compte » : retour à l'accueil, avec une courte confirmation.
  const accountDeleted = () => {
    setUser(null)
    setMode('select')
    setFavDriver(null)
    setFavTeam(null)
    clearRoute()
    window.scrollTo(0, 0)
    setDeleted(true)
    setTimeout(() => setDeleted(false), 6000)
  }

  if (!ready) return <div className="min-h-dvh" />

  if (recovery) return <NewPassword onDone={() => setRecovery(false)} />

  if (route === 'mentions') return <Legal />

  if (loggedIn) {
    const active: MenuKey =
      mode === 'live' ? 'live'
        : mode === 'notif' ? 'reminders'
          : mode === 'hors'
            ? (seasonPage === 'calendar' ? 'calendar'
              : seasonPage === 'stats-duel' || seasonPage === 'stats-positions' ? 'duel'
                : seasonPage.startsWith('stats') ? 'stats'
                  : seasonPage === 'favorites' ? 'favorites'
                    : seasonPage === 'standings' ? 'standings' : 'home')
            : 'home'
    const openSeason = (p: HorsPage) => { setHorsPage(p); setSeasonNav((n) => n + 1); setMode('hors') }
    const navigate = (k: MenuKey) => {
      if (k === 'home') setMode('select')
      else if (k === 'live') setMode('live')
      else if (k === 'reminders') setMode('notif')
      else openSeason(k === 'duel' ? 'stats-duel' : k)
      window.scrollTo(0, 0)
    }
    let screen
    if (mode === 'notif') screen = <Reminders onBack={() => setMode('select')} user={supabaseEnabled ? user : null} onDeleted={accountDeleted} />
    else if (mode === 'live') screen = <><LiveMode onBack={() => setMode('select')} /><ChatBot /></>
    else if (mode === 'hors') {
      screen = (
        <>
          <HorsCourse
            key={`${horsPage ?? 'home'}-${seasonNav}`}
            initialPage={horsPage}
            onBack={() => setMode('select')}
            onPageChange={setSeasonPage}
            userEmail={user?.email ?? ''}
            favDriver={favDriver}
            setFavDriver={setFavDriver}
            favTeam={favTeam}
            setFavTeam={setFavTeam}
          />
          <ChatBot />
        </>
      )
    } else {
      screen = (
        <>
          <AppHome
            userEmail={user?.email ?? ''}
            onOpenSeason={openSeason}
            onOpenLive={() => setMode('live')}
            onOpenReminders={() => setMode('notif')}
          />
          <ChatBot />
        </>
      )
    }
    return (
      <AppMenu active={active} email={user?.email ?? ''} onNavigate={navigate} onLogout={logout}>
        {screen}
      </AppMenu>
    )
  }

  if (route === 'connexion' || route === 'inscription') {
    return (
      <AuthPage
        isLogin={isLogin}
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

  return (
    <>
      <Home />
      {deleted && (
        <div role="status" className="app-in fixed inset-x-0 bottom-6 z-50 flex justify-center px-6">
          <p className="rounded-full border border-[#2b2c2d] bg-[#121314] px-5 py-3 text-sm text-[#d6d7d7] shadow-[0_8px_30px_rgba(0,0,0,0.5)]">Ton compte a bien été supprimé. À bientôt !</p>
        </div>
      )}
    </>
  )
}

export default App
