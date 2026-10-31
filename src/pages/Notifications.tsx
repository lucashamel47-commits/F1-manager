import { useEffect, useMemo, useState } from 'react'
import { getCalendar, type Race } from '../lib/f1api'
import { allSessions, buildIcs, countdown, formatWhen, KIND_LABEL, nextSession, type SessionKind } from '../lib/sessions'
import {
  activationCode, currentSubscription, disablePush, enablePush, isIOS, isStandalone, LEAD_CHOICES, loadPrefs, localTest,
  pushSupported, savePrefs, type Prefs,
} from '../lib/notify'

const KINDS: SessionKind[] = ['race', 'quali', 'sprint', 'fp']

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

export default function Notifications({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  const [calendar, setCalendar] = useState<Race[] | null>(null)
  const [calErr, setCalErr] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [sub, setSub] = useState<PushSubscription | null>(null)
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>(() => (pushSupported() ? Notification.permission : 'unsupported'))
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const ios = isIOS()
  const standalone = isStandalone()
  const canPush = pushSupported() && (!ios || standalone)

  useEffect(() => {
    getCalendar().then(setCalendar).catch(() => setCalErr(true))
    currentSubscription().then(setSub).catch(() => {})
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const sessions = useMemo(() => (calendar ? allSessions(calendar) : []), [calendar])
  const next = nextSession(sessions, now)
  const weekend = next ? sessions.filter((s) => s.round === next.round) : []
  const cd = next ? countdown(next.start.getTime() - now) : null
  const started = next ? next.start.getTime() <= now : false

  const update = (p: Prefs) => { setPrefs(p); savePrefs(p) }
  const toggleKind = (k: SessionKind) => update({ ...prefs, kinds: { ...prefs.kinds, [k]: !prefs.kinds[k] } })
  const toggleLead = (m: number) => {
    const leads = prefs.leads.includes(m) ? prefs.leads.filter((x) => x !== m) : [...prefs.leads, m].sort((a, b) => a - b)
    if (leads.length) update({ ...prefs, leads })
  }

  const activate = async () => {
    setBusy(true); setMsg(null)
    try {
      setSub(await enablePush())
      setPerm(Notification.permission)
    } catch (e) {
      setPerm(Notification.permission)
      setMsg(e instanceof Error && e.message === 'denied'
        ? 'Autorisation refusée. Va dans Réglages › Notifications › F1 Manager pour l\'autoriser, puis reviens ici.'
        : 'Autorisation non accordée. Réessaie quand tu veux.')
    } finally { setBusy(false) }
  }
  const deactivate = async () => { await disablePush(); setSub(null) }
  const test = async () => {
    try { await localTest(); setMsg('Notification test envoyée — regarde en haut de l\'écran.') } catch { setMsg('Impossible d\'envoyer la notification test.') }
  }

  const code = sub ? activationCode(sub, prefs) : ''
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { setMsg('Copie impossible : touche longuement le code pour le copier.') }
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
          <span className="ml-auto text-xs font-black uppercase tracking-[0.25em]">Notifications</span>
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
          <Section title="Quelles sessions ?">
            <div className="border-t border-zinc-900">
              {KINDS.map((k) => (
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
          </Section>

          <Section title="Notifications sur l'iPad">
            <div className="px-4 pb-4 text-sm">
              {!pushSupported() && !ios && (
                <p className="text-zinc-400">Ce navigateur ne gère pas les notifications push. Utilise le compte à rebours et le calendrier ci-dessous.</p>
              )}
              {ios && !standalone && (
                <div>
                  <p className="font-semibold text-base">Ajoute l'app à l'écran d'accueil</p>
                  <p className="text-zinc-400 mt-1">Sur iPad, les notifications ne marchent que si F1 Manager est installée comme une app (iPadOS 16.4 ou plus).</p>
                  <ol className="mt-4 grid gap-3">
                    {[
                      <>Dans Safari, touche l'icône <b>Partager</b> (le carré avec une flèche vers le haut).</>,
                      <>Choisis <b>« Sur l'écran d'accueil »</b>, puis <b>Ajouter</b>.</>,
                      <>Ouvre <b>F1 Manager</b> depuis l'écran d'accueil et reviens sur cet écran.</>,
                      <>Touche <b>Activer les notifications</b> et accepte l'autorisation.</>,
                    ].map((t, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="shrink-0 size-6 rounded-full border border-zinc-600 text-xs flex items-center justify-center text-zinc-300">{i + 1}</span>
                        <span className="text-zinc-300 leading-relaxed">{t}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {canPush && !sub && perm !== 'denied' && (
                <div>
                  <p className="text-zinc-400">Reçois une alerte avant chaque session choisie, même quand l'app est fermée.</p>
                  <button onClick={activate} disabled={busy} className="mt-4 w-full min-h-12 bg-red-600 hover:bg-red-700 active:bg-red-700 font-semibold disabled:opacity-60">
                    {busy ? 'Activation…' : 'Activer les notifications'}
                  </button>
                </div>
              )}
              {canPush && perm === 'denied' && (
                <p className="text-amber-400">Les notifications sont bloquées. Ouvre Réglages › Notifications › F1 Manager et autorise-les, puis reviens ici.</p>
              )}
              {canPush && sub && (
                <div>
                  <p className="flex items-center gap-2 font-semibold"><span className="size-2 rounded-full bg-green-500" />Notifications autorisées sur cet appareil</p>
                  <div className="mt-4 border-l-4 border-red-600 bg-black p-4">
                    <p className="font-semibold">Dernière étape : enregistre ton code</p>
                    <p className="text-zinc-400 mt-1 leading-relaxed">Les alertes sont envoyées par un robot gratuit (GitHub). Copie ce code et envoie-le à ton assistant : il l'ajoute au robot. Si tu changes tes réglages ci-dessus, renvoie le nouveau code.</p>
                    <textarea readOnly value={code} onFocus={(e) => e.currentTarget.select()} rows={4} aria-label="Code d'activation" className="mt-3 w-full bg-zinc-950 border border-zinc-800 p-2 text-[11px] font-mono text-zinc-400 break-all resize-none" />
                    <button onClick={copy} className="mt-2 w-full min-h-11 bg-white text-black font-bold text-xs uppercase tracking-wider active:bg-zinc-300">{copied ? 'Copié ✓' : 'Copier le code'}</button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button onClick={test} className="min-h-11 border border-zinc-700 text-sm font-semibold active:bg-zinc-900">Tester ici</button>
                    <button onClick={deactivate} className="min-h-11 border border-zinc-800 text-sm text-zinc-400 active:bg-zinc-900">Désactiver</button>
                  </div>
                </div>
              )}
              {msg && <p role="status" className="mt-3 text-xs text-zinc-400">{msg}</p>}
            </div>
          </Section>

          <Section title="Sans notification : ton calendrier">
            <div className="px-4 pb-4 text-sm">
              <p className="text-zinc-400 leading-relaxed">Ajoute toutes les sessions choisies ({nbIcs || '…'}) à l'app Calendrier de l'iPad, avec un rappel aux horaires choisis. Ça marche toujours, sans serveur.</p>
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
