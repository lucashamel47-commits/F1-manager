interface Props {
  showAuth: boolean
  setShowAuth: (v: boolean) => void
  isLogin: boolean
  setIsLogin: (v: boolean) => void
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  message: string
  onSubmit: (e: React.FormEvent) => void
  busy?: boolean
  onForgot?: () => void // défini seulement quand les comptes en ligne sont actifs
}

export default function AuthForm({
  showAuth, setShowAuth, isLogin, setIsLogin,
  email, setEmail, password, setPassword,
  message, onSubmit, busy, onForgot
}: Props) {
  return (
    <div className="relative z-10 px-4 sm:px-6 pb-20 sm:pb-24">
      {!showAuth ? (
        <div className="max-w-xs sm:max-w-sm mx-auto space-y-4">
          <button
            onClick={() => setShowAuth(true)}
            className="w-full py-4.5 bg-red-600 hover:bg-red-700 rounded-2xl font-medium text-base transition-all duration-200 active:scale-[0.98]"
          >
            Créer un compte
          </button>
          <button
            onClick={() => {
              setIsLogin(true)
              setShowAuth(true)
            }}
            className="w-full py-4.5 border border-zinc-800 hover:border-zinc-600 rounded-2xl font-medium text-base transition-all duration-200"
          >
            Se connecter
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="max-w-xs sm:max-w-sm mx-auto space-y-4">
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-4 text-base bg-zinc-950/70 backdrop-blur rounded-xl border border-zinc-800 focus:border-zinc-600 outline-none transition"
          />
          <input
            type="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-4 text-base bg-zinc-950/70 backdrop-blur rounded-xl border border-zinc-800 focus:border-zinc-600 outline-none transition"
          />
          <button type="submit" disabled={busy} className="w-full py-4 bg-red-600 rounded-xl font-medium disabled:opacity-60">
            {busy ? 'Un instant…' : isLogin ? 'Connexion' : 'Créer le compte'}
          </button>
          {message && <p role="status" className="text-sm text-center text-zinc-300">{message}</p>}
          {onForgot && isLogin && (
            <button type="button" onClick={onForgot} className="w-full text-xs text-zinc-400 py-2">
              Mot de passe oublié ?
            </button>
          )}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-xs text-zinc-400 py-2">
            {isLogin ? 'Pas encore de compte ? Créer un compte' : 'Déjà un compte ? Se connecter'}
          </button>
          <button type="button" onClick={() => setShowAuth(false)} className="w-full text-xs text-zinc-500 py-3">
            Retour
          </button>
        </form>
      )}
    </div>
  )
}