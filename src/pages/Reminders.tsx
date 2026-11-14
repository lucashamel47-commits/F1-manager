import { useEffect, useMemo, useState } from 'react'
import { SectionTitle } from '../components/MotorNav'
import { getCalendar, type Race } from '../lib/f1api'
import { allSessions, buildIcs, countdown, formatWhen, KIND_LABEL, nextSession, type SessionKind } from '../lib/sessions'
import { deleteMyAccount } from '../lib/account'
import { DEFAULT_PREFS, fetchRemote, LEAD_CHOICES, loadLocal, saveLocal, saveRemote, type Prefs } from '../lib/reminders'

export interface ReminderUser {
  id: string
  email: string
}


function Toggle({ on, onClick, children, sub }: { on: boolean; onClick: () => void; children: React.ReactNode; sub?: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className="w-full min-h-16 flex items-center gap-4 px-7 text-left border-b border-white/[0.06] hover:bg-white/[0.03] active:bg-white/[0.05]"
    >
      <span className="flex-1">
        <span className="block text-sm font-semibold">{children}</span>
        {sub && <span className="block text-xs text-zinc-500 mt-0.5">{sub}</span>}
      </span>
      <span className={`relative w-11 h-6 rounded-full transition ${on ? 'bg-white' : 'bg-[#3d3e3f]'}`} aria-hidden>
        <span className={`absolute top-0.5 size-5 rounded-full transition-all ${on ? 'bg-[#0a0a0a]' : 'bg-white'} ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-[1.75rem] overflow-hidden">
      <h2 className="px-7 pt-7 pb-4 kicker">{title}</h2>
      {children}
    </section>
  )
}

/** Suppression du compte : discrète, en deux temps (taper SUPPRIMER), sans rouge criard. */
function DeleteAccount({ user, onDeleted }: { user: ReminderUser; onDeleted: () => void }) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'err'>('idle')
  const ok = typed.trim().toUpperCase() === 'SUPPRIMER'
  const cancel = () => { setOpen(false); setTyped(''); setState('idle') }
  const confirm = async () => {
    if (!ok) return
    setState('busy')
    try {
      await deleteMyAccount(user.id)
      onDeleted()
    } catch {
      setState('err')
    }
  }
  if (!open) {
    return (
      <div className="mt-14 flex justify-center">
        <button onClick={() => setOpen(true)} className="min-h-11 px-4 rounded-full text-[13px] font-medium text-[#7d7e7e] hover:text-[#d6d7d7] hover:bg-white/[0.04]">
          Supprimer mon compte
        </button>
      </div>
    )
  }
  return (
    <section aria-label="Supprimer mon compte" className="mt-14 mx-auto max-w-xl rounded-[1.75rem] border border-[#2b2c2d] bg-[#0d0e0f] p-7 sm:p-8">
      <h2 className="text-[17px] font-medium tracking-[-0.01em] text-white">Supprimer ton compte ?</h2>
      <p className="mt-3 text-sm leading-relaxed text-[#939494]">
        Ton compte <strong className="font-medium text-[#d6d7d7]">{user.email}</strong> et tes réglages de rappel seront effacés définitivement. Plus aucun email ne te sera envoyé. Cette action est irréversible.
      </p>
      <label className="mt-6 block text-xs text-[#7d7e7e]" htmlFor="confirm-delete">Tape <span className="font-semibold tracking-[0.08em] text-[#d6d7d7]">SUPPRIMER</span> pour confirmer</label>
      <input
        id="confirm-delete"
        value={typed}
        onChange={(e) => { setTyped(e.target.value); setState('idle') }}
        onKeyDown={(e) => { if (e.key === 'Enter') confirm() }}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        placeholder="SUPPRIMER"
        className="mt-2 w-full min-h-12 rounded-full border border-[#2b2c2d] bg-[#08090a] px-5 text-[15px] tracking-[0.06em] text-white placeholder:text-[#3d3e3f] outline-none focus:border-[#636464]"
      />
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
        <button onClick={cancel} disabled={state === 'busy'} className="btn-ghost min-h-12 flex-1 rounded-full">Annuler</button>
        <button onClick={confirm} disabled={!ok || state === 'busy'} className="btn-primary min-h-12 flex-1 rounded-full disabled:opacity-30">
          {state === 'busy' ? 'Suppression…' : 'Supprimer définitivement'}
        </button>
      </div>
      <p role="status" className="mt-3 min-h-4 text-xs text-amber-400">{state === 'err' && 'La suppression n’a pas abouti. Vérifie ta connexion et réessaie.'}</p>
    </section>
  )
}

export default function Reminders({ user, onDeleted }: { onBack: () => void; user: ReminderUser | null; onDeleted?: () => void }) {
  const [prefs, setPrefs] = useState<Prefs>(loadLocal)
  const [saved, setSaved] = useState<Prefs>(loadLocal) // dernière version enregistrée en ligne
  const [calendar, setCalendar] = useState<Race[] | null>(null)
  const [calErr, setCalErr] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [loading, setLoading] = useState(Boolean(user))
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle')

  useEffect(() => {
    getCalendar().then(setCalendar).catch(() => setCalErr(true))
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Réglages enregistrés dans le compte (si les comptes en ligne sont actifs).
  useEffect(() => {
    if (!user) return
    let alive = true
    fetchRemote(user.id)
      .then((p) => {
        if (!alive) return
        const v = p ?? DEFAULT_PREFS // nouveau compte : pas de réglages hérités d'un autre compte de cet iPad
        setPrefs(v); setSaved(v); saveLocal(v)
      })
      .catch(() => alive && setStatus('err'))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [user])

  const sessions = useMemo(() => (calendar ? allSessions(calendar) : []), [calendar])
  const next = nextSession(sessions, now)
  const weekend = next ? sessions.filter((s) => s.round === next.round) : []
  const cd = next ? countdown(next.start.getTime() - now) : null
  const started = next ? next.start.getTime() <= now : false

  const dirty = user ? JSON.stringify(prefs) !== JSON.stringify(saved) : false
  const update = (p: Prefs) => { setPrefs(p); saveLocal(p); setStatus('idle') }
  const toggleKind = (k: SessionKind) => update({ ...prefs, kinds: { ...prefs.kinds, [k]: !prefs.kinds[k] } })
  const toggleLead = (m: number) => {
    const leads = prefs.leads.includes(m) ? prefs.leads.filter((x) => x !== m) : [...prefs.leads, m].sort((a, b) => a - b)
    if (leads.length) update({ ...prefs, leads })
  }
  const noKind = !Object.values(prefs.kinds).some(Boolean)

  const save = async () => {
    if (!user) return
    setStatus('saving')
    try {
      await saveRemote(user.id, prefs)
      setSaved(prefs)
      setStatus('ok')
    } catch {
      setStatus('err')
    }
  }

  const downloadIcs = () => {
    const wanted = sessions.filter((s) => prefs.kinds[s.kind])
    const ics = buildIcs(wanted.length ? wanted : sessions, prefs.leads)
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'formule-1.ics'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }
  const nbIcs = sessions.filter((s) => prefs.kinds[s.kind]).length

  const choices = (
    <>
      <div className="border-t border-white/[0.06]">
        {(['race', 'quali', 'sprint', 'fp'] as SessionKind[]).map((k) => (
          <Toggle key={k} on={prefs.kinds[k]} onClick={() => toggleKind(k)} sub={k === 'sprint' ? 'Uniquement les week-ends avec sprint' : undefined}>
            {KIND_LABEL[k]}
          </Toggle>
        ))}
      </div>
      <div className="px-7 py-6">
        <p className="text-sm font-semibold">Combien de temps avant ?</p>
        <p className="text-xs text-zinc-500 mt-0.5 mb-3">Tu peux en choisir plusieurs.</p>
        <div className="flex flex-wrap gap-2">
          {LEAD_CHOICES.map((l) => {
            const on = prefs.leads.includes(l.min)
            return (
              <button key={l.min} onClick={() => toggleLead(l.min)} aria-pressed={on} className={`min-h-11 px-5 rounded-full text-sm font-medium border transition ${on ? 'btn-primary border-transparent' : 'border-white/15 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.07]'}`}>
                {l.label}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )

  const unit = (v: number, u: string) => (
    <div className="flex-1 text-center">
      <div className="text-5xl sm:text-7xl lg:text-5xl xl:text-6xl font-semibold tabular-nums tracking-[-0.05em] text-gradient">{String(v).padStart(2, '0')}</div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">{u}</div>
    </div>
  )

  return (
    <div className="min-h-dvh w-full text-white pb-20">

      <main className="app-page">
      <SectionTitle h1 kicker="Rappels" title="Ne rate plus une session" desc="Compte à rebours, alertes et calendrier." />
      <div className="grid gap-8 lg:gap-10 lg:grid-cols-2 items-start">
        {/* Compte à rebours : fonctionne sans serveur ni autorisation */}
        <Section title="Prochaine session">
          <div className="px-7 pb-7">
            {calErr && <p className="text-sm text-zinc-400">Calendrier indisponible pour le moment (hors ligne ?).</p>}
            {!calendar && !calErr && <p className="text-sm text-zinc-500">Chargement du calendrier…</p>}
            {calendar && !next && <p className="text-sm text-zinc-400">Plus aucune session cette saison. Le calendrier de la prochaine saison arrive bientôt.</p>}
            {next && cd && (
              <>
                <p className="text-2xl font-semibold tracking-[-0.03em]">{next.label}</p>
                <p className="text-sm text-zinc-400 mt-0.5">{next.gp} · {next.place}</p>
                <p className="text-xs text-zinc-500 mt-1 first-letter:uppercase">{formatWhen(next.start)}</p>
                {started ? (
                  <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold tracking-[0.2em] text-accent-400"><span className="size-2 rounded-full bg-accent-500 animate-pulse" />En cours</p>
                ) : (
                  <div className="mt-8 flex items-start gap-2" role="timer" aria-label="Compte à rebours">
                    {unit(cd.d, 'jours')}{unit(cd.h, 'heures')}{unit(cd.m, 'min')}{unit(cd.s, 'sec')}
                  </div>
                )}
                {weekend.length > 1 && (
                  <ul className="mt-6 border-t border-white/[0.06]">
                    {weekend.map((s) => (
                      <li key={s.id} className={`flex items-center gap-3 py-2.5 border-b border-white/[0.06] text-sm ${s.start.getTime() + s.minutes * 60000 < now ? 'text-zinc-600 line-through' : ''}`}>
                        <span className={`size-1.5 rounded-full ${s.kind === 'race' ? 'bg-accent-500' : 'bg-zinc-600'}`} aria-hidden />
                        <span className="flex-1">{s.label}</span>
                        <span className="text-xs text-zinc-500 tabular-nums first-letter:uppercase">{new Intl.DateTimeFormat('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(s.start)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </Section>

        <div className="grid gap-6">
          {user ? (
            <Section title="Rappels par email">
              <div className="border-t border-white/[0.06]">
                <Toggle on={prefs.enabled} onClick={() => update({ ...prefs, enabled: !prefs.enabled })} sub={`Envoyés à ${user.email}`}>
                  Recevoir des rappels par email
                </Toggle>
              </div>
              <div className={prefs.enabled ? '' : 'opacity-40 pointer-events-none'} aria-disabled={!prefs.enabled}>
                {choices}
              </div>
              <div className="px-7 pb-7">
                <button
                  onClick={save}
                  disabled={!dirty || status === 'saving' || loading || (prefs.enabled && noKind)}
                  className="btn-primary w-full min-h-12 rounded-full font-semibold disabled:opacity-40 disabled:saturate-0"
                >
                  {status === 'saving' ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <p role="status" className={`mt-3 text-xs ${status === 'err' ? 'text-amber-400' : 'text-zinc-500'}`}>
                  {status === 'ok' && !dirty && (saved.enabled ? 'Enregistré ✓ Tu recevras un email avant chaque session choisie.' : 'Enregistré ✓ Les rappels par email sont désactivés.')}
                  {status === 'err' && "Impossible d'enregistrer pour le moment. Vérifie ta connexion et réessaie."}
                  {status === 'idle' && prefs.enabled && noKind && 'Choisis au moins un type de session.'}
                  {status === 'idle' && !dirty && !loading && !saved.enabled && 'Les rappels sont désactivés : active-les pour recevoir un email avant les sessions.'}
                  {status === 'idle' && dirty && 'Modifications non enregistrées.'}
                </p>
              </div>
            </Section>
          ) : (
            <Section title="Quelles sessions ?">
              <div className="border-t border-white/[0.06]">{choices}</div>
            </Section>
          )}

          <Section title="Ton calendrier">
            <div className="px-7 pb-7 text-sm">
              <p className="text-zinc-400 leading-relaxed">Ajoute les sessions choisies ({nbIcs || '…'}) à l'app Calendrier de l'iPad, avec une alerte aux délais choisis. Ça marche toujours, sans compte.</p>
              <button onClick={downloadIcs} disabled={!calendar} className="btn-ghost mt-4 w-full min-h-12 rounded-full font-medium disabled:opacity-40">
                Ajouter au Calendrier (.ics)
              </button>
            </div>
          </Section>
        </div>
      </div>
      {user && onDeleted && <DeleteAccount user={user} onDeleted={onDeleted} />}
      </main>
    </div>
  )
}
