import { useId, useState, type ReactNode } from 'react'

export interface AuthProps {
  isLogin: boolean
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

/** Boutons d'entrée (accueil) : mènent aux pages dédiées. */
export function AuthCtas() {
  return (
    <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <a href="#/inscription" className="btn-primary inline-flex h-11 items-center justify-center rounded-full px-[22px] text-[15px] active:scale-[0.98]">
        Créer un compte
      </a>
      <a href="#/connexion" className="btn-ghost inline-flex h-11 items-center justify-center rounded-full px-[22px] text-[15px] active:scale-[0.98]">
        Se connecter
      </a>
    </div>
  )
}

const wrap = 'group relative flex items-center rounded-xl border border-[#2b2c2d] bg-[#101112] transition focus-within:border-[#636464]'
const input = 'peer min-h-12 w-full bg-transparent pl-11 pr-4 text-base outline-none placeholder:text-zinc-600 [&:focus-visible]:outline-none'
const ico = 'pointer-events-none absolute left-3.5 text-zinc-500 transition group-focus-within:text-zinc-200'

/** Formulaire de connexion / inscription (page dédiée) : sobre, sans effets. */
export default function AuthCard({
  isLogin,
  email, setEmail, password, setPassword,
  message, onSubmit, busy, onForgot
}: AuthProps) {
  const [reveal, setReveal] = useState(false)
  const uid = useId()
  const ok = /créé|enregistr|✓/i.test(message)
  return (
    <form onSubmit={onSubmit} noValidate className="w-full max-w-[26rem] rounded-[1.25rem] border border-[#2b2c2d] bg-[#0c0d0e] p-6 sm:p-8">
      <h1 className="text-[1.75rem] font-medium leading-[1.1] tracking-[-0.035em]">{isLogin ? 'Connexion' : 'Créer un compte'}</h1>
      <p className="mt-2 text-[15px] text-[#939494]">{isLogin ? 'Retrouve tes pilotes, ton écurie et tes rappels.' : 'Choisis tes pilotes et ton écurie, suis ta saison.'}</p>

      <div className="mt-7 space-y-4">
        <div>
          <label htmlFor={`${uid}-email`} className="mb-1.5 block text-sm font-medium text-zinc-300">Email</label>
          <div className={wrap}>
            <span className={ico}>{mailIcon}</span>
            <input id={`${uid}-email`} type="email" autoComplete="email" placeholder="toi@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </div>
        </div>
        <div>
          <label htmlFor={`${uid}-pw`} className="mb-1.5 block text-sm font-medium text-zinc-300">Mot de passe</label>
          <div className={wrap}>
            <span className={ico}>{lockIcon}</span>
            <input id={`${uid}-pw`} type={reveal ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`${input} pr-14`} />
            <button type="button" onClick={() => setReveal((r) => !r)} aria-label={reveal ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={reveal} className="absolute right-1 grid size-10 place-items-center rounded-lg text-zinc-500 transition hover:text-white">
              {reveal ? eyeOffIcon : eyeIcon}
            </button>
          </div>
          {!isLogin && <p className="mt-1.5 text-xs text-zinc-500">6 caractères minimum.</p>}
        </div>
      </div>

      {message && (
        <p role={ok ? 'status' : 'alert'} className={`mt-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm leading-snug ${ok ? 'border-[#2b2c2d] bg-[#101112] text-[#c4c5c5]' : 'border-[#4a2a2a] bg-[#1a1010] text-[#f0b4b4]'}`}>
          <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ok ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></>}</svg>
          <span>{message}</span>
        </p>
      )}

      <button type="submit" disabled={busy} className="mt-6 flex h-11 w-full items-center justify-center gap-2.5 rounded-full bg-white text-[15px] font-medium text-[#0a0a0a] transition hover:bg-[#e4e5e5] active:scale-[0.99] disabled:opacity-60">
        {busy && <span className="size-4 animate-spin rounded-full border-2 border-black/30 border-t-black" aria-hidden />}
        {busy ? 'Un instant…' : isLogin ? 'Se connecter' : 'Créer le compte'}
      </button>

      {onForgot && isLogin && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={onForgot} className="min-h-11 px-3 text-sm text-zinc-400 transition hover:text-white">Mot de passe oublié ?</button>
        </div>
      )}
    </form>
  )
}
