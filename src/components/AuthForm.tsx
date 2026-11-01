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

const field =
  'w-full min-h-14 px-5 text-base bg-white/[0.04] rounded-2xl border border-white/10 placeholder:text-zinc-500 focus:border-white/30 focus:bg-white/[0.06] focus:ring-4 focus:ring-white/5 outline-none'

export default function AuthForm({
  showAuth, setShowAuth, isLogin, setIsLogin,
  email, setEmail, password, setPassword,
  message, onSubmit, busy, onForgot
}: Props) {
  return (
    <div className="relative z-10 px-4 sm:px-6 pb-14 sm:pb-16">
      {!showAuth ? (
        <div className="max-w-xs mx-auto space-y-3 sm:space-y-0 sm:flex sm:max-w-md sm:gap-3">
          <button
            onClick={() => setShowAuth(true)}
            className="btn-primary w-full min-h-14 rounded-full font-semibold text-base active:scale-[0.98]"
          >
            Créer un compte
          </button>
          <button
            onClick={() => {
              setIsLogin(true)
              setShowAuth(true)
            }}
            className="btn-ghost w-full min-h-14 rounded-full font-medium text-base text-zinc-100 active:scale-[0.98]"
          >
            Se connecter
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="glass max-w-xs sm:max-w-sm mx-auto space-y-3 rounded-3xl p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-center pb-1">{isLogin ? 'Content de te revoir' : 'Crée ton compte'}</h2>
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
          />
          <input
            type="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />
          <button type="submit" disabled={busy} className="btn-primary w-full min-h-14 rounded-full font-semibold disabled:opacity-60 active:scale-[0.98]">
            {busy ? 'Un instant…' : isLogin ? 'Connexion' : 'Créer le compte'}
          </button>
          {message && <p role="status" className="text-sm text-center text-zinc-300">{message}</p>}
          {onForgot && isLogin && (
            <button type="button" onClick={onForgot} className="w-full min-h-11 text-xs text-zinc-400 hover:text-white">
              Mot de passe oublié ?
            </button>
          )}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full min-h-11 text-xs text-zinc-400 hover:text-white">
            {isLogin ? 'Pas encore de compte ? Créer un compte' : 'Déjà un compte ? Se connecter'}
          </button>
          <button type="button" onClick={() => setShowAuth(false)} className="w-full min-h-11 text-xs text-zinc-500 hover:text-zinc-300">
            Retour
          </button>
        </form>
      )}
    </div>
  )
}
