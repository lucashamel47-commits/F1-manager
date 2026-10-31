import { useEffect, useMemo, useState } from 'react'
import { getCalendar, type Race } from '../lib/f1api'
import { allSessions, buildIcs, countdown, formatWhen, KIND_LABEL, nextSession, type SessionKind } from '../lib/sessions'
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
      className="w-full min-h-14 flex items-center gap-4 px-4 text-left border-b border-zinc-900 active:bg-zinc-900"
    >
      <span className="flex-1">
        <span className="block text-sm font-semibold">{children}</span>
        {sub && <span className="block text-xs text-zinc-500 mt-0.5">{sub}</span>}
      </span>
      <span className={`relative w-11 h-6 rounded-full transition ${on ? 'bg-red-600' : 'bg-zinc-700'}`} aria-hidden>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-zinc-900 bg-zinc-950">
      <h2 className="px-4 pt-4 pb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">{title}</h2>
      {children}
    </section>
  )
}

export default function Reminders({ onBack, user }: { onBack: () => void; user: ReminderUser | null }) {
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
      <div className="border-t border-zinc-900">
        {(['race', 'quali', 'sprint', 'fp'] as SessionKind[]).map((k) => (
          <Toggle key={k} on={prefs.kinds[k]} onClick={() => toggleKind(k)} sub={k === 'sprint' ? 'Uniquement les week-ends avec sprint' : undefined}>
            {KIND_LABEL[k]}
          </Toggle>
        ))}
      </div>
      <div className="px-4 py-4">
        <p className="text-sm font-semibold">Combien de temps avant ?</p>
        <p className="text-xs text-zinc-500 mt-0.5 mb-3">Tu peux en choisir plusieurs.</p>
        <div className="flex flex-wrap gap-2">
          {LEAD_CHOICES.map((l) => {
            const on = prefs.leads.includes(l.min)
            return (
              <button key={l.min} onClick={() => toggleLead(l.min)} aria-pressed={on} className={`min-h-11 px-5 text-sm font-semibold border transition ${on ? 'bg-red-600 border-red-600' : 'border-zinc-700 text-zinc-300 active:bg-zinc-900'}`}>
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
      <div className="text-4xl sm:text-6xl font-black tabular-nums tracking-tight">{String(v).padStart(2, '0')}</div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mt-1">{u}</div>
    </div>
  )

  return (
    <div className="min-h-dvh w-full bg-black text-white">
      <header className="sticky top-0 z-30 w-full bg-black/95 backdrop-blur border-b border-zinc-800">
        <div className="h-1 bg-red-600" />
        <div className="flex items-center gap-3 px-4 sm:px-5 lg:px-6 h-14 lg:h-16">
          <button onClick={onBack} aria-label="Changer de mode" className="-ml-2 min-h-11 px-2 flex items-center gap-1.5 text-zinc-400 hover:text-white active:text-white">
            <span className="text-xl leading-none">‹</span>
            <span className="text-xs font-bold uppercase tracking-wider">Modes</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white font-black italic px-2 py-0.5 text-lg leading-none">F1</span>
            <span className="font-black uppercase tracking-tight text-lg leading-none">Manager</span>
          </div>
          <span className="ml-auto text-xs font-black uppercase tracking-[0.25em]">Rappels</span>
        </div>
      </header>

      <main className="w-full px-4 sm:px-5 lg:px-6 py-6 grid gap-6 lg:grid-cols-2 items-start">
        {/* Compte à rebours : fonctionne sans serveur ni autorisation */}
        <Section title="Prochaine session">
          <div className="px-4 pb-5">
            {calErr && <p className="text-sm text-zinc-400">Calendrier indisponible pour le moment (hors ligne ?).</p>}
            {!calendar && !calErr && <p className="text-sm text-zinc-500">Chargement du calendrier…</p>}
            {calendar && !next && <p className="text-sm text-zinc-400">Plus aucune session cette saison. Le calendrier de la prochaine saison arrive bientôt.</p>}
            {next && cd && (
              <>
                <p className="text-xl font-bold">{next.label}</p>
                <p className="text-sm text-zinc-400 mt-0.5">{next.gp} · {next.place}</p>
                <p className="text-xs text-zinc-500 mt-1 first-letter:uppercase">{formatWhen(next.start)}</p>
                {started ? (
                  <p className="mt-5 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-red-500"><span className="size-2 rounded-full bg-red-600 animate-pulse" />En cours</p>
                ) : (
                  <div className="mt-5 flex items-start gap-2" role="timer" aria-label="Compte à rebours">
                    {unit(cd.d, 'jours')}{unit(cd.h, 'heures')}{unit(cd.m, 'min')}{unit(cd.s, 'sec')}
                  </div>
                )}
                {weekend.length > 1 && (
                  <ul className="mt-6 border-t border-zinc-900">
                    {weekend.map((s) => (
                      <li key={s.id} className={`flex items-center gap-3 py-2.5 border-b border-zinc-900 text-sm ${s.start.getTime() + s.minutes * 60000 < now ? 'text-zinc-600 line-through' : ''}`}>
                        <span className={`size-1.5 rounded-full ${s.kind === 'race' ? 'bg-red-600' : 'bg-zinc-600'}`} aria-hidden />
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
              <div className="border-t border-zinc-900">
                <Toggle on={prefs.enabled} onClick={() => update({ ...prefs, enabled: !prefs.enabled })} sub={`Envoyés à ${user.email}`}>
                  Recevoir des rappels par email
                </Toggle>
              </div>
              <div className={prefs.enabled ? '' : 'opacity-40 pointer-events-none'} aria-disabled={!prefs.enabled}>
                {choices}
              </div>
              <div className="px-4 pb-4">
                <button
                  onClick={save}
                  disabled={!dirty || status === 'saving' || loading || (prefs.enabled && noKind)}
                  className="w-full min-h-12 bg-red-600 hover:bg-red-700 active:bg-red-700 font-semibold disabled:opacity-40 disabled:hover:bg-red-600"
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
              <div className="border-t border-zinc-900">{choices}</div>
            </Section>
          )}

          <Section title="Ton calendrier">
            <div className="px-4 pb-4 text-sm">
              <p className="text-zinc-400 leading-relaxed">Ajoute les sessions choisies ({nbIcs || '…'}) à l'app Calendrier de l'iPad, avec une alerte aux délais choisis. Ça marche toujours, sans compte.</p>
              <button onClick={downloadIcs} disabled={!calendar} className="mt-4 w-full min-h-12 border border-zinc-600 font-semibold active:bg-zinc-900 disabled:opacity-40">
                Ajouter au Calendrier (.ics)
              </button>
            </div>
          </Section>
        </div>
      </main>
    </div>
  )
}
