import { useEffect, useId, useState, useSyncExternalStore, type ReactNode } from 'react'
import { AuthMessage } from '../components/AuthForm'
import DeleteAccount from '../components/DeleteAccount'
import { openSupport } from '../lib/support'
import { supabase, supabaseEnabled } from '../lib/supabase'
import { DRIVERS, TEAMS } from '../data/grid'
import { ACCENTS, applyAccent, readAccent, type AccentId } from '../lib/accent'
import { SETTINGS_SECTIONS, goSettings, isSettingsIndex, readSettingsSection, type SettingsSection } from '../lib/settings'

const subscribeHash = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

let pathCache: { section: SettingsSection; index: boolean } | null = null
const getSettingsPath = () => {
  const next = { section: readSettingsSection(), index: isSettingsIndex() }
  if (pathCache && pathCache.section === next.section && pathCache.index === next.index) return pathCache
  pathCache = next
  return pathCache
}
const useSettingsPath = () => useSyncExternalStore(subscribeHash, getSettingsPath, getSettingsPath)

interface Props {
  user: { id: string; email: string; name?: string }
  onNameChange: (name?: string) => void
  onLogout: () => void
  onDeleted?: () => void
  onOpenReminders: () => void
  onBack?: () => void
}

export default function Settings({ user, onNameChange, onLogout, onDeleted, onOpenReminders, onBack }: Props) {
  const { section, index } = useSettingsPath()
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 768px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const on = () => setWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const showList = !wide && index
  const active = section

  const panel = (
    <Card title={SETTINGS_SECTIONS.find((s) => s.id === active)?.label ?? 'Compte'}>
      {active === 'compte' && <Compte user={user} onNameChange={onNameChange} onLogout={onLogout} />}
      {active === 'securite' && <Securite user={user} onDeleted={onDeleted} />}
      {active === 'apparence' && <Apparence email={user.email} />}
      {active === 'rappels' && <Rappels onOpenReminders={onOpenReminders} />}
      {active === 'contact' && <Contact />}
    </Card>
  )

  return (
    <div className="min-h-dvh w-full text-white" data-settings data-settings-panel={showList ? 'index' : active}>
      {/* Téléphone : retour + liste ou fiche */}
      <div className="md:hidden px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8">
        {showList ? (
          <>
            {onBack && (
              <button type="button" onClick={onBack} className="-ml-2 mb-6 inline-flex min-h-11 items-center gap-1.5 px-2 text-[14px] text-[#939494] hover:text-white">
                <ArrowLeft /> Retour à l'application
              </button>
            )}
            <h1 className="mb-6 text-[1.75rem] font-medium tracking-[-0.03em]">Réglages</h1>
            <div className="overflow-hidden rounded-2xl border border-[#1d1e1f] bg-[#1d1e1f]">
              {SETTINGS_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  data-settings-nav={s.id}
                  onClick={() => goSettings(s.id)}
                  className="flex min-h-[3.5rem] w-full items-center gap-3 bg-[#141516] px-4 text-left text-[15px] font-medium transition hover:bg-[#17181a]"
                >
                  <span className="flex-1">{s.label}</span>
                  <span className="text-[#4a4b4c]" aria-hidden>›</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button type="button" onClick={() => goSettings()} className="-ml-2 mb-4 inline-flex min-h-11 items-center gap-1.5 px-2 text-[14px] text-[#939494] hover:text-white">
              <ArrowLeft /> Réglages
            </button>
            {panel}
          </>
        )}
      </div>

      {/* iPad / ordinateur : uniquement la carte, la nav est dans la barre latérale */}
      <div className="hidden md:block p-5 lg:p-6 xl:p-8">
        <div className="mx-auto max-w-[44rem]">{panel}</div>
      </div>
    </div>
  )
}

function ArrowLeft() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-h-[calc(100dvh-4.5rem)] overflow-hidden rounded-2xl border border-[#2b2c2d] bg-[#151515] md:min-h-[calc(100dvh-3rem)]">
      <h2 className="px-6 pt-5 pb-4 text-[11px] font-medium uppercase tracking-[0.14em] text-[#6e6f70]">{title}</h2>
      <div className="border-t border-[#2b2c2d]">{children}</div>
    </section>
  )
}

function Compte({ user, onNameChange, onLogout }: { user: Props['user']; onNameChange: Props['onNameChange']; onLogout: () => void }) {
  const uid = useId()
  const [name, setName] = useState(user.name ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle')

  const save = async (next = name.trim().slice(0, 40)) => {
    if (next === (user.name ?? '')) return
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
    <div className="px-6 py-6">
      <div className="space-y-5">
        <div>
          <p className="text-[13px] text-[#939494]">E-mail</p>
          <p className="mt-1 text-[15px] text-[#f7f8f8] underline decoration-[#3d3e3f] underline-offset-4">{user.email}</p>
        </div>
        <div>
          <label htmlFor={`${uid}-name`} className="block text-[13px] text-[#939494]">Prénom</label>
          <input
            id={`${uid}-name`}
            type="text"
            autoComplete="given-name"
            maxLength={40}
            value={name}
            onChange={(e) => { setName(e.target.value); setStatus('idle') }}
            onBlur={() => save()}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
            className="mt-1 w-full max-w-md border-0 bg-transparent p-0 text-[15px] text-[#f7f8f8] outline-none focus:underline focus:decoration-[#636464] focus:underline-offset-4"
          />
        </div>
      </div>
      {status === 'err' && <div className="mt-4"><AuthMessage text="Enregistrement impossible. Vérifie ta connexion et réessaie." ok={false} /></div>}
      {status === 'ok' && <p className="mt-3 text-[12.5px] text-[#7d7e7e]">Prénom enregistré.</p>}
      <div className="mt-8 border-t border-[#2b2c2d] pt-6">
        <button type="button" onClick={onLogout} className="h-9 rounded-lg border border-[#2b2c2d] bg-[#1a1a1a] px-3.5 text-[13px] font-medium text-[#d6d7d7] transition hover:bg-[#222] hover:text-white">
          Se déconnecter
        </button>
      </div>
    </div>
  )
}

function Securite({ user, onDeleted }: { user: Props['user']; onDeleted?: () => void }) {
  const uid = useId()
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)
  const field = 'h-11 w-full max-w-md rounded-xl border border-[#2b2c2d] bg-[#0c0d0e] px-4 text-[14px] text-[#f7f8f8] outline-none transition-[border-color] placeholder:text-[#5a5b5c] focus:border-[#f7f8f8]/30'

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
    <div>
      <form onSubmit={changePassword} className="px-6 py-6" noValidate>
        <p className="text-[15px] font-medium text-[#f7f8f8]">Mot de passe</p>
        <p className="mt-1 text-[13px] text-[#7d7e7e]">6 caractères minimum.</p>
        <div className="mt-4 space-y-2.5">
          <label htmlFor={`${uid}-pw`} className="sr-only">Nouveau mot de passe</label>
          <input id={`${uid}-pw`} type="password" autoComplete="new-password" placeholder="Nouveau mot de passe" value={pwd} disabled={busy} onChange={(e) => { setPwd(e.target.value); setMsg('') }} className={field} />
          <label htmlFor={`${uid}-pw2`} className="sr-only">Confirmer le mot de passe</label>
          <input id={`${uid}-pw2`} type="password" autoComplete="new-password" placeholder="Confirmer le mot de passe" value={pwd2} disabled={busy} onChange={(e) => { setPwd2(e.target.value); setMsg('') }} className={field} />
        </div>
        {msg && <div className="mt-3"><AuthMessage text={msg} ok={ok} /></div>}
        <button type="submit" disabled={busy || !pwd} className="btn-primary mt-4 h-10 rounded-full px-5 text-[13px] disabled:opacity-40">{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
      </form>
      {onDeleted && supabaseEnabled && (
        <div className="border-t border-[#2b2c2d] px-6 pb-6">
          <DeleteAccount user={user} onDeleted={onDeleted} />
        </div>
      )}
    </div>
  )
}

function Apparence({ email }: { email: string }) {
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
  const [accent, setAccent] = useState<AccentId>(readAccent)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

  const pickDriver = (id: string) => {
    setDriver(id)
    if (id) {
      localStorage.setItem(driverKey, JSON.stringify([id]))
      localStorage.setItem(`${driverKey}-onboarded`, '1')
    } else localStorage.setItem(driverKey, '[]')
  }
  const pickTeam = (id: string) => {
    setTeam(id)
    if (id) {
      localStorage.setItem(teamKey, id)
      localStorage.setItem(`${driverKey}-onboarded`, '1')
    } else localStorage.removeItem(teamKey)
  }
  const pickAccent = (id: AccentId) => { setAccent(id); applyAccent(id) }

  return (
    <div>
      <Row label="Modèle de couleurs">
        <div className="flex flex-wrap justify-end gap-2.5">
          {ACCENTS.map((a) => {
            const on = accent === a.id
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => pickAccent(a.id)}
                aria-pressed={on}
                className={`w-[4.5rem] text-center ${on ? '' : 'opacity-90 hover:opacity-100'}`}
              >
                <span className={`relative mx-auto block h-12 w-full overflow-hidden rounded-lg border ${on ? 'border-[#c4c5c5] bg-[#1a1a1a]' : 'border-[#2b2c2d] bg-[#101112]'}`}>
                  <span className="absolute left-1.5 top-1.5 h-0.5 w-5 rounded-full bg-[#3d3e3f]" />
                  <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#22c55e]" />
                  <span className="absolute bottom-1.5 right-1.5 h-2 w-6 rounded-full" style={{ background: a.swatch }} />
                </span>
                <span className="mt-1.5 block text-[11px] text-[#939494]">{a.label}</span>
              </button>
            )
          })}
        </div>
      </Row>
      <Row label="Pilote favori">
        <Select id={`${uid}-drv`} value={driver} onChange={pickDriver}>
          <option value="">Aucun</option>
          {DRIVERS.map((d) => <option key={d.id} value={d.id}>{d.givenName} {d.familyName}</option>)}
        </Select>
      </Row>
      <Row label="Écurie favorite">
        <Select id={`${uid}-team`} value={team} onChange={pickTeam}>
          <option value="">Aucune</option>
          {TEAMS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </Row>
      <Row label="Masquer les courses passées" sub="Dans le calendrier de la saison." last>
        <Toggle on={hidePast} onClick={() => { setHidePast((v) => { localStorage.setItem('f1-hide-past', v ? '0' : '1'); return !v }) }} />
      </Row>
      <p className="px-6 pb-5 text-[12.5px] text-[#6e6f70]">Les horaires s’affichent dans le fuseau de cet appareil ({tz.replace(/_/g, ' ')}).</p>
    </div>
  )
}

function Rappels({ onOpenReminders }: { onOpenReminders: () => void }) {
  return (
    <div className="px-6 py-6">
      <p className="max-w-md text-[15px] leading-relaxed text-[#939494]">
        Types de sessions, délai avant l’alerte, e-mails et fichier calendrier (.ics) : tout se règle sur la page Rappels.
      </p>
      <button type="button" onClick={onOpenReminders} className="btn-primary mt-6 h-10 rounded-full px-5 text-[13px]">Ouvrir les rappels</button>
    </div>
  )
}

function Contact() {
  return (
    <div className="px-6 py-6">
      <p className="max-w-md text-[15px] leading-relaxed text-[#939494]">
        Un bug, une question, une idée : une vraie personne te répond par e-mail.
      </p>
      <button type="button" onClick={openSupport} data-support className="btn-primary mt-6 h-10 rounded-full px-5 text-[13px]">Écrire au support</button>
      <a href="#/mentions" className="mt-6 block text-[13px] text-[#7d7e7e] transition hover:text-[#d6d7d7]">Mentions légales &amp; confidentialité</a>
    </div>
  )
}

function Row({ label, sub, last, children }: { label: string; sub?: string; last?: boolean; children: ReactNode }) {
  return (
    <div className={`flex items-center gap-6 px-6 py-5 ${last ? '' : 'border-b border-[#2b2c2d]'}`}>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-[#f7f8f8]">{label}</p>
        {sub && <p className="mt-0.5 text-[13px] text-[#7d7e7e]">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Select({ id, value, onChange, children }: { id: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <div className="relative">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 max-w-[14rem] appearance-none rounded-lg border border-[#2b2c2d] bg-[#101112] py-0 pl-3 pr-8 text-[13px] text-[#f7f8f8] outline-none focus:border-[#f7f8f8]/30">
        {children}
      </select>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-[#7b7c7c]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
    </div>
  )
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-[var(--accent,#fff)]' : 'bg-[#3d3e3f]'}`}>
      <span className={`absolute top-0.5 size-5 rounded-full transition-all ${on ? 'left-[22px] bg-[var(--accent-on,#0a0a0a)]' : 'left-0.5 bg-white'}`} />
    </button>
  )
}
