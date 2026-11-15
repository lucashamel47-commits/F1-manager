import { useEffect, useId, useState, useSyncExternalStore, type ReactNode } from 'react'
import { SectionTitle } from '../components/MotorNav'
import { authInput, authSubmit, AuthMessage } from '../components/AuthForm'
import DeleteAccount from '../components/DeleteAccount'
import { openSupport } from '../lib/support'
import { supabase, supabaseEnabled } from '../lib/supabase'
import { DRIVERS, TEAMS, teamById } from '../data/grid'

export type SettingsSection = 'profil' | 'compte' | 'rappels' | 'preferences' | 'support'

const SECTIONS: { id: SettingsSection; label: string; hint: string }[] = [
  { id: 'profil', label: 'Profil', hint: 'Prénom et e-mail' },
  { id: 'compte', label: 'Compte', hint: 'Sécurité et déconnexion' },
  { id: 'rappels', label: 'Rappels', hint: 'E-mails et calendrier' },
  { id: 'preferences', label: 'Préférences', hint: 'Favoris' },
  { id: 'support', label: 'Support', hint: 'Nous écrire' },
]

const subscribeHash = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

const readSection = (): SettingsSection | null => {
  const id = window.location.hash.match(/^#\/parametres(?:\/([\w-]+))?$/)?.[1]
  return SECTIONS.some((s) => s.id === id) ? (id as SettingsSection) : null
}

const useSettingsSection = () => useSyncExternalStore(subscribeHash, readSection, () => null)

const goSettings = (section?: SettingsSection) => {
  window.location.hash = section ? `#/parametres/${section}` : '#/parametres'
}

function Select({ id, value, onChange, children }: { id: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <div className="relative">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full appearance-none rounded-full border border-[#2b2c2d] bg-[#0c0d0e] px-[18px] pr-11 text-[14px] text-[#f7f8f8] outline-none transition-[border-color] focus:border-[#f7f8f8]/30">
        {children}
      </select>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#7b7c7c]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
    </div>
  )
}

function Toggle({ on, onClick, children, sub }: { on: boolean; onClick: () => void; children: string; sub?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className="flex min-h-16 w-full items-center gap-4 text-left"
    >
      <span className="flex-1">
        <span className="block text-[15px] font-medium text-[#f7f8f8]">{children}</span>
        {sub && <span className="mt-0.5 block text-[13px] text-[#7d7e7e]">{sub}</span>}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-white' : 'bg-[#3d3e3f]'}`} aria-hidden>
        <span className={`absolute top-0.5 size-5 rounded-full transition-all ${on ? 'left-[22px] bg-[#0a0a0a]' : 'left-0.5 bg-white'}`} />
      </span>
    </button>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-[13px] font-medium text-[#939494]">{label}</label>
      {children}
    </div>
  )
}

interface Props {
  user: { id: string; email: string; name?: string }
  onNameChange: (name?: string) => void
  onLogout: () => void
  onDeleted?: () => void
  onOpenReminders: () => void
}

export default function Settings({ user, onNameChange, onLogout, onDeleted, onOpenReminders }: Props) {
  const section = useSettingsSection()
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 768px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const on = () => setWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const current: SettingsSection = section ?? (wide ? 'profil' : ('' as unknown as SettingsSection))
  const showIndex = !wide && section === null
  const active = section ?? 'profil'

  return (
    <div className="min-h-dvh w-full text-white" data-settings>
      <main className="app-page">
        <div className="mx-auto max-w-[52rem]">
          {showIndex ? (
            <>
              <SectionTitle h1 title="Paramètres" />
              <button
                type="button"
                onClick={() => goSettings('profil')}
                data-settings-identity
                className="mb-6 flex w-full items-center gap-4 rounded-2xl border border-[#2b2c2d] bg-[#101112] px-4 py-4 text-left transition hover:border-[#3d3e3f]"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-full border border-[#2b2c2d] bg-[#17181a] text-[20px] font-medium uppercase text-[#f7f8f8]" aria-hidden>
                  {(user.name || user.email).charAt(0) || '?'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-medium tracking-[-0.01em]">{user.name || 'Ton profil'}</span>
                  <span className="mt-0.5 block truncate text-[13px] text-[#7d7e7e]">{user.email}</span>
                </span>
                <span className="text-[#4a4b4c]" aria-hidden>›</span>
              </button>
              <div className="overflow-hidden rounded-2xl border border-[#1d1e1f] bg-[#1d1e1f]">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    data-settings-nav={s.id}
                    onClick={() => goSettings(s.id)}
                    className="flex min-h-[3.5rem] w-full items-center gap-3 bg-[#141516] px-4 text-left transition hover:bg-[#17181a]"
                  >
                    <span className="flex-1">
                      <span className="block text-[15px] font-medium">{s.label}</span>
                      <span className="block text-[12.5px] text-[#7d7e7e]">{s.hint}</span>
                    </span>
                    <span className="text-[#4a4b4c]" aria-hidden>›</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="md:hidden">
                <button type="button" onClick={() => goSettings()} className="-ml-2 mb-6 inline-flex min-h-11 items-center gap-1 px-2 text-[14px] text-[#939494] hover:text-white">
                  <span aria-hidden>‹</span> Paramètres
                </button>
                <h1 className="mb-10 text-[2rem] font-medium leading-[1.06] tracking-[-0.035em]">{SECTIONS.find((s) => s.id === active)?.label}</h1>
              </div>
              <div className="hidden md:block">
                <SectionTitle h1 title="Paramètres" />
              </div>
              <div className="md:grid md:grid-cols-[13.5rem_minmax(0,1fr)] md:gap-12 lg:gap-16">
                <nav aria-label="Sections des paramètres" className="hidden md:block">
                  <ul className="sticky top-8 flex flex-col gap-px">
                    {SECTIONS.map((s) => {
                      const on = current === s.id
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            data-settings-nav={s.id}
                            onClick={() => goSettings(s.id)}
                            aria-current={on ? 'page' : undefined}
                            className={`flex h-10 w-full items-center rounded-[10px] px-3 text-left text-[14.5px] font-medium tracking-[-0.01em] transition ${on ? 'bg-[#f7f8f8]/[0.09] text-[#f7f8f8]' : 'text-[#c4c5c5] hover:bg-white/[0.04] hover:text-white'}`}
                          >
                            {s.label}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </nav>
                <div className="min-w-0" data-settings-panel={active}>
                  {active === 'profil' && <Profil user={user} onNameChange={onNameChange} />}
                  {active === 'compte' && <Compte user={user} onLogout={onLogout} onDeleted={onDeleted} />}
                  {active === 'rappels' && <Rappels onOpenReminders={onOpenReminders} />}
                  {active === 'preferences' && <Preferences email={user.email} />}
                  {active === 'support' && <Support />}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function Profil({ user, onNameChange }: { user: Props['user']; onNameChange: Props['onNameChange'] }) {
  const uid = useId()
  const [name, setName] = useState(user.name ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle')
  const dirty = name.trim() !== (user.name ?? '')

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const next = name.trim().slice(0, 40)
    setStatus('saving')
    try {
      if (supabase) {
        const { error } = await supabase.auth.updateUser({ data: { first_name: next } })
        if (error) throw error
      } else {
        localStorage.setItem(`f1-user-name-${user.email}`, next)
      }
      onNameChange(next || undefined)
      setName(next)
      setStatus('ok')
    } catch {
      setStatus('err')
    }
  }

  return (
    <section aria-labelledby="set-profil">
      <h2 id="set-profil" className="sr-only md:not-sr-only md:mb-8 md:text-[1.5rem] md:font-medium md:tracking-[-0.03em]">Profil</h2>
      <div className="flex items-center gap-5">
        <span className="grid size-16 shrink-0 place-items-center rounded-full border border-[#2b2c2d] bg-[#17181a] text-[22px] font-medium uppercase text-[#f7f8f8]" aria-hidden>
          {(user.name || user.email).charAt(0) || '?'}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[17px] font-medium tracking-[-0.01em]">{user.name || 'Sans prénom'}</p>
          <p className="mt-0.5 truncate text-[13px] text-[#7d7e7e]">{user.email}</p>
        </div>
      </div>
      <form onSubmit={save} className="mt-8 space-y-5" noValidate>
        <Field label="Prénom" htmlFor={`${uid}-name`}>
          <input id={`${uid}-name`} type="text" autoComplete="given-name" maxLength={40} value={name} onChange={(e) => { setName(e.target.value); setStatus('idle') }} className={authInput} />
        </Field>
        <Field label="E-mail" htmlFor={`${uid}-email`}>
          <input id={`${uid}-email`} type="email" value={user.email} readOnly className={`${authInput} cursor-default text-[#939494]`} />
          <p className="mt-2 text-[12.5px] text-[#7d7e7e]">L’e-mail sert à te connecter et à recevoir tes rappels. Il ne peut pas être modifié ici.</p>
        </Field>
        {status === 'err' && <AuthMessage text="Enregistrement impossible. Vérifie ta connexion et réessaie." ok={false} />}
        {status === 'ok' && !dirty && <AuthMessage text="Prénom enregistré." ok={true} />}
        <button type="submit" disabled={!dirty || status === 'saving'} className={`${authSubmit} max-w-[16rem] disabled:opacity-40`}>
          {status === 'saving' ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </section>
  )
}

function Compte({ user, onLogout, onDeleted }: { user: Props['user']; onLogout: () => void; onDeleted?: () => void }) {
  const uid = useId()
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setOk(false)
    if (pwd.length < 6) return setMsg('6 caractères minimum pour le mot de passe.')
    if (pwd !== pwd2) return setMsg('Les deux mots de passe ne correspondent pas.')
    setBusy(true)
    setMsg('')
    try {
      if (supabase) {
        const { error } = await supabase.auth.updateUser({ password: pwd })
        if (error) throw error
      } else {
        const users = JSON.parse(localStorage.getItem('f1-users') || '{}') as Record<string, string>
        users[user.email] = pwd
        localStorage.setItem('f1-users', JSON.stringify(users))
      }
      setPwd(''); setPwd2(''); setOk(true); setMsg('Mot de passe mis à jour.')
    } catch {
      setMsg('Impossible de changer le mot de passe. Réessaie dans un instant.')
    }
    setBusy(false)
  }

  return (
    <section aria-labelledby="set-compte">
      <h2 id="set-compte" className="sr-only md:not-sr-only md:mb-8 md:text-[1.5rem] md:font-medium md:tracking-[-0.03em]">Compte</h2>
      <form onSubmit={changePassword} className="space-y-2.5" noValidate aria-busy={busy}>
        <p className="mb-4 text-[15px] leading-relaxed text-[#939494]">Choisis un nouveau mot de passe. Il doit faire au moins 6 caractères.</p>
        <label htmlFor={`${uid}-pw`} className="sr-only">Nouveau mot de passe</label>
        <input id={`${uid}-pw`} type="password" autoComplete="new-password" placeholder="Nouveau mot de passe" value={pwd} disabled={busy} onChange={(e) => { setPwd(e.target.value); setMsg('') }} className={authInput} />
        <label htmlFor={`${uid}-pw2`} className="sr-only">Confirmer le mot de passe</label>
        <input id={`${uid}-pw2`} type="password" autoComplete="new-password" placeholder="Confirmer le mot de passe" value={pwd2} disabled={busy} onChange={(e) => { setPwd2(e.target.value); setMsg('') }} className={authInput} />
        {msg && <AuthMessage text={msg} ok={ok} />}
        <button type="submit" disabled={busy || !pwd} className={`${authSubmit} mt-1 max-w-[16rem]`}>
          {busy ? 'Enregistrement…' : 'Changer le mot de passe'}
        </button>
      </form>

      <div className="mt-12 border-t border-[#2b2c2d] pt-8">
        <p className="text-[15px] leading-relaxed text-[#939494]">Tu pourras te reconnecter plus tard avec le même e-mail.</p>
        <button type="button" onClick={onLogout} className="btn-ghost mt-5 h-11 rounded-full px-5 text-[14px]">Se déconnecter</button>
      </div>

      {onDeleted && supabaseEnabled && <DeleteAccount user={user} onDeleted={onDeleted} />}
    </section>
  )
}

function Rappels({ onOpenReminders }: { onOpenReminders: () => void }) {
  return (
    <section aria-labelledby="set-rappels">
      <h2 id="set-rappels" className="sr-only md:not-sr-only md:mb-8 md:text-[1.5rem] md:font-medium md:tracking-[-0.03em]">Rappels</h2>
      <p className="max-w-md text-[15px] leading-relaxed text-[#939494]">
        Types de sessions, délai avant l’alerte, e-mails et fichier calendrier (.ics) : tout se règle sur la page Rappels.
      </p>
      <button type="button" onClick={onOpenReminders} className="btn-primary mt-7 h-11 rounded-full px-5 text-[14px]">Ouvrir les rappels</button>
    </section>
  )
}

function Preferences({ email }: { email: string }) {
  const uid = useId()
  const driverKey = `f1-fav-drivers-${email}`
  const teamKey = `f1-fav-team-${email}`
  const readDriver = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(driverKey) ?? '[]') as string[]
      return parsed[0] ?? ''
    } catch { return '' }
  }
  const [driver, setDriver] = useState(readDriver)
  const [team, setTeam] = useState(() => localStorage.getItem(teamKey) ?? '')
  const [hidePast, setHidePast] = useState(() => localStorage.getItem('f1-hide-past') === '1')
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const teamName = teamById(team)?.name

  const pickDriver = (id: string) => {
    setDriver(id)
    if (id) {
      localStorage.setItem(driverKey, JSON.stringify([id]))
      localStorage.setItem(`${driverKey}-onboarded`, '1')
    } else {
      localStorage.setItem(driverKey, '[]')
    }
  }
  const pickTeam = (id: string) => {
    setTeam(id)
    if (id) {
      localStorage.setItem(teamKey, id)
      localStorage.setItem(`${driverKey}-onboarded`, '1')
    } else {
      localStorage.removeItem(teamKey)
    }
  }
  const toggleHide = () => {
    setHidePast((v) => {
      localStorage.setItem('f1-hide-past', v ? '0' : '1')
      return !v
    })
  }

  return (
    <section aria-labelledby="set-prefs">
      <h2 id="set-prefs" className="sr-only md:not-sr-only md:mb-8 md:text-[1.5rem] md:font-medium md:tracking-[-0.03em]">Préférences</h2>
      <div className="space-y-6">
        <Field label="Pilote favori" htmlFor={`${uid}-drv`}>
          <Select id={`${uid}-drv`} value={driver} onChange={pickDriver}>
            <option value="">Aucun</option>
            {DRIVERS.map((d) => (
              <option key={d.id} value={d.id}>{d.givenName} {d.familyName}</option>
            ))}
          </Select>
        </Field>
        <Field label="Écurie favorite" htmlFor={`${uid}-team`}>
          <Select id={`${uid}-team`} value={team} onChange={pickTeam}>
            <option value="">Aucune</option>
            {TEAMS.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </Field>
      </div>
      <p className="mt-3 text-[12.5px] text-[#7d7e7e]">
        {driver || team
          ? `Affichés sur l’accueil${teamName ? ` · ${teamName}` : ''}.`
          : 'Tu peux aussi les choisir depuis l’accueil, dans Favoris.'}
      </p>

      <div className="mt-10 border-t border-[#2b2c2d] pt-2">
        <Toggle on={hidePast} onClick={toggleHide} sub="Dans le calendrier de la saison.">Masquer les courses passées</Toggle>
      </div>
      <p className="mt-8 text-[13px] leading-relaxed text-[#7d7e7e]">
        Les horaires s’affichent dans le fuseau de cet appareil ({tz.replace(/_/g, ' ')}).
      </p>
    </section>
  )
}

function Support() {
  return (
    <section aria-labelledby="set-support">
      <h2 id="set-support" className="sr-only md:not-sr-only md:mb-8 md:text-[1.5rem] md:font-medium md:tracking-[-0.03em]">Support</h2>
      <p className="max-w-md text-[15px] leading-relaxed text-[#939494]">
        Un bug, une question, une idée : une vraie personne te répond par e-mail.
      </p>
      <button type="button" onClick={openSupport} data-support className="btn-primary mt-7 flex h-11 items-center gap-2 rounded-full px-5 text-[14px]">
        Écrire au support
      </button>
      <a href="#/mentions" className="mt-8 block text-[13px] text-[#7d7e7e] transition hover:text-[#d6d7d7]">Mentions légales &amp; confidentialité</a>
    </section>
  )
}
