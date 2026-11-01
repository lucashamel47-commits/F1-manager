import { useId, useState, type ReactNode } from 'react'

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

const Icon = ({ d }: { d: ReactNode }) => (
  <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>
)
const mailIcon = <Icon d={<><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 8 8 5.5L20 8" /></>} />
const lockIcon = <Icon d={<><rect x="5" y="11" width="14" height="9" rx="3" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>} />
const eyeIcon = <Icon d={<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></>} />
const eyeOffIcon = <Icon d={<><path d="M3 3l18 18" /><path d="M10.6 5.7A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3.2 4M6.4 7.5A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9.5 9.5 0 0 0 3.2-.6" /><path d="M9.9 9.9a2.8 2.8 0 0 0 4 4" /></>} />

/** Boutons d'entrée (état « fermé ») : s'affichent sous le titre du hero. */
export function AuthCtas({ showAuth, setShowAuth, setIsLogin }: Pick<Props, 'showAuth' | 'setShowAuth' | 'setIsLogin'>) {
  if (showAuth) return null
  return (
    <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
      <button
        onClick={() => setShowAuth(true)}
        className="btn-primary min-h-14 rounded-full px-9 text-base font-semibold active:scale-[0.98]"
      >
        Créer un compte
      </button>
      <button
        onClick={() => { setIsLogin(true); setShowAuth(true) }}
        className="btn-ghost min-h-14 rounded-full px-9 text-base font-medium text-zinc-100 active:scale-[0.98]"
      >
        Se connecter
      </button>
    </div>
  )
}

const wrap = 'group relative flex items-center rounded-2xl border border-white/10 bg-white/[0.04] transition focus-within:border-accent-400/70 focus-within:bg-white/[0.06] focus-within:ring-4 focus-within:ring-accent-500/20'
const input = 'peer min-h-14 w-full bg-transparent pl-12 pr-4 text-base outline-none placeholder:text-zinc-500 [&:focus-visible]:outline-none'
const ico = 'pointer-events-none absolute left-4 text-zinc-500 transition group-focus-within:text-accent-300'

/** Carte du formulaire (connexion / inscription), en verre dépoli. */
export default function AuthCard({
  showAuth, setShowAuth, isLogin, setIsLogin,
  email, setEmail, password, setPassword,
  message, onSubmit, busy, onForgot
}: Props) {
  const [reveal, setReveal] = useState(false)
  const uid = useId()
  if (!showAuth) return null
  const ok = /créé|enregistr|✓/i.test(message)
  return (
    <form onSubmit={onSubmit} className="relative mx-auto w-full max-w-md rounded-[2rem] border border-white/[0.12] bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 shadow-[0_40px_100px_-30px_rgb(0_0_0_/_0.9),0_0_60px_-30px_rgb(99_102_241_/_0.6)] backdrop-blur-2xl sm:p-8 lg:ml-auto lg:mr-0">
      <div aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <p className="kicker">{isLogin ? 'Connexion' : 'Inscription'}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{isLogin ? 'Content de te revoir' : 'Crée ton compte'}</h2>
      <p className="mt-1.5 text-sm text-zinc-400">{isLogin ? 'Retrouve tes pilotes, ton écurie et tes rappels.' : 'Choisis tes pilotes et ton écurie, suis ta saison.'}</p>

      <div className="mt-6 space-y-3.5">
        <div>
          <label htmlFor={`${uid}-email`} className="mb-1.5 block text-xs font-medium text-zinc-400">Email</label>
          <div className={wrap}>
            <span className={ico}>{mailIcon}</span>
            <input id={`${uid}-email`} type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </div>
        </div>
        <div>
          <label htmlFor={`${uid}-pw`} className="mb-1.5 block text-xs font-medium text-zinc-400">Mot de passe</label>
          <div className={wrap}>
            <span className={ico}>{lockIcon}</span>
            <input id={`${uid}-pw`} type={reveal ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className={`${input} pr-14`} />
            <button type="button" onClick={() => setReveal((r) => !r)} aria-label={reveal ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={reveal} className="absolute right-1.5 grid size-11 place-items-center rounded-xl text-zinc-400 transition hover:bg-white/[0.06] hover:text-white">
              {reveal ? eyeOffIcon : eyeIcon}
            </button>
          </div>
          {!isLogin && <p className="mt-1.5 text-xs text-zinc-500">6 caractères minimum.</p>}
        </div>
      </div>

      {message && (
        <p role={ok ? 'status' : 'alert'} className={`mt-4 flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm leading-snug ${ok ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/25 bg-rose-400/10 text-rose-200'}`}>
          <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ok ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></>}</svg>
          <span>{message}</span>
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-primary mt-5 flex min-h-14 w-full items-center justify-center gap-2.5 rounded-full text-base font-semibold active:scale-[0.98] disabled:opacity-60">
        {busy && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />}
        {busy ? 'Un instant…' : isLogin ? 'Connexion' : 'Créer le compte'}
      </button>

      <div className="mt-3 flex flex-col items-center">
        {onForgot && isLogin && (
          <button type="button" onClick={onForgot} className="min-h-11 px-3 text-sm text-zinc-400 transition hover:text-white">Mot de passe oublié ?</button>
        )}
        <button type="button" onClick={() => setIsLogin(!isLogin)} className="min-h-11 px-3 text-sm text-zinc-400 transition hover:text-white">
          {isLogin ? 'Pas encore de compte ? Créer un compte' : 'Déjà un compte ? Se connecter'}
        </button>
        <button type="button" onClick={() => setShowAuth(false)} className="min-h-11 px-3 text-xs text-zinc-500 transition hover:text-zinc-300">Retour</button>
      </div>
    </form>
  )
}
