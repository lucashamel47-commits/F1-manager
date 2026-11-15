import { useId, useState, type ReactNode } from 'react'

export interface AuthProps {
  isLogin: boolean
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  name?: string
  setName?: (v: string) => void
  message: string
  onSubmit: (e: React.FormEvent) => void
  busy?: boolean
  onForgot?: () => void // défini seulement quand les comptes en ligne sont actifs
}

const Icon = ({ d }: { d: ReactNode }) => (
  <svg viewBox="0 0 24 24" className="size-[17px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>
)
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

/** Champ pilule façon Novex : 44 px, fond blanc 3 %, bord #2b2c2d, halo discret au focus. Libellé lu par VoiceOver, pas affiché. */
export const authInput =
  'h-11 w-full rounded-full border border-[#2b2c2d] bg-white/[0.03] px-[18px] text-base text-[#f7f8f8] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#636464] focus:border-[#f7f8f8]/30 focus:shadow-[0_0_0_3px_rgba(247,248,248,0.06)] focus-visible:outline-none aria-[invalid=true]:border-[#f7f8f8]/45 disabled:opacity-60 sm:text-[14px]'

export const authSubmit =
  'flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-[14px] font-[510] text-[#0a0a0a] transition-[background-color,opacity] duration-150 hover:bg-[#e4e5e5] disabled:opacity-60'

/** Message sous le formulaire : neutre (pas de rouge), icône ✓ ou !, annoncé aux lecteurs d'écran. */
export function AuthMessage({ text, ok }: { text: string; ok: boolean }) {
  return (
    <p role={ok ? 'status' : 'alert'} className={`auth-msg flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-[13px] leading-snug ${ok ? 'border-[#2b2c2d] bg-white/[0.03] text-[#c4c5c5]' : 'border-[#f7f8f8]/20 bg-white/[0.05] text-[#f7f8f8]'}`}>
      <svg viewBox="0 0 24 24" className="mt-px size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ok ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></>}</svg>
      <span>{text}</span>
    </p>
  )
}

/** Formulaire connexion / inscription, structure de l'étape « e-mail » de Novex : champs pilules empilés, « Continuer » blanc. */
export default function AuthCard({
  isLogin,
  email, setEmail, password, setPassword, name = '', setName,
  message, onSubmit, busy, onForgot
}: AuthProps) {
  const [reveal, setReveal] = useState(false)
  const uid = useId()
  const ok = /créé|enregistr|envoyé|✓/i.test(message)
  const bad = message && !ok
  const emailBad = bad && /email|compte|identifiants|champs|supprimé/i.test(message)
  const pwBad = bad && /passe|caractères|identifiants|champs/i.test(message)
  return (
    <>
      <form onSubmit={onSubmit} noValidate aria-busy={busy} className="space-y-2.5">
        {!isLogin && setName && (
          <div>
            <label htmlFor={`${uid}-name`} className="sr-only">Prénom (facultatif)</label>
            <input id={`${uid}-name`} type="text" autoComplete="given-name" placeholder="Prénom" maxLength={40} value={name} disabled={busy} onChange={(e) => setName(e.target.value)} className={authInput} />
          </div>
        )}
        <div>
          <label htmlFor={`${uid}-email`} className="sr-only">E-mail</label>
          <input id={`${uid}-email`} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="E-mail" value={email} disabled={busy} aria-invalid={emailBad || undefined} onChange={(e) => setEmail(e.target.value)} className={authInput} />
        </div>
        <div className="relative">
          <label htmlFor={`${uid}-pw`} className="sr-only">Mot de passe</label>
          <input id={`${uid}-pw`} type={reveal ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder={isLogin ? 'Mot de passe' : 'Mot de passe (6 caractères min.)'} value={password} disabled={busy} aria-invalid={pwBad || undefined} onChange={(e) => setPassword(e.target.value)} className={`${authInput} pr-12`} />
          <button type="button" onClick={() => setReveal((r) => !r)} aria-label={reveal ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={reveal} className="absolute right-1 top-0 grid size-11 place-items-center rounded-full text-[#636464] transition-colors hover:text-[#f7f8f8]">
            {reveal ? eyeOffIcon : eyeIcon}
          </button>
        </div>

        {message && <AuthMessage text={message} ok={ok} />}

        <button type="submit" disabled={busy} className={authSubmit}>
          {busy && <span className="size-3.5 animate-spin rounded-full border-2 border-black/25 border-t-black" aria-hidden />}
          {busy ? 'Un instant…' : 'Continuer'}
        </button>
      </form>

      {onForgot && isLogin && (
        <button type="button" onClick={onForgot} disabled={busy} className="mx-auto mt-1 flex min-h-9 items-center px-3 text-[12px] text-[#f7f8f8] transition-opacity hover:opacity-70">Mot de passe oublié ?</button>
      )}
    </>
  )
}
