// Envoi des notifications Web Push avant les sessions de F1. Lancé toutes les 15 min par .github/workflows/notify.yml.
//
// Entrées (variables d'environnement) :
//   VAPID_PRIVATE_KEY    clé privée VAPID (secret GitHub)
//   PUSH_SUBSCRIPTIONS   un « code d'activation » par ligne (secret GitHub, voir scripts/add-subscription.mjs)
//   VAPID_PUBLIC_KEY     optionnel (défaut : celle de l'app)
//   SEND_TEST=1          envoie aussi une notification de test à tous les abonnés
//   DRY_RUN=1            n'envoie rien, affiche seulement ce qui partirait
//   WINDOW_START / WINDOW_END   (ISO) forcent la fenêtre de temps (tests en local)
//
// Fenêtre : de l'heure de démarrage du dernier run réussi jusqu'à celle de ce run → aucune notification
// ratée ni envoyée deux fois, même si le cron de GitHub prend du retard.
import webpush from 'web-push'

const API = 'https://api.jolpi.ca/ergast/f1'
const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BNXSI504-_ggYcqh6tdGd4UCfAHhWZI_ZRnXKyr1vfzZBdAz96F1ifLJ4y8gnxEv3wHHTakc6_Aqa-NposbfP3k'
const APP_URL = 'https://lucashamel47-commits.github.io/F1-manager/'
const DRY = process.env.DRY_RUN === '1'
const MIN = 60_000

const FIELDS = [
  ['FirstPractice', 'Essais libres 1', 'fp'], ['SecondPractice', 'Essais libres 2', 'fp'], ['ThirdPractice', 'Essais libres 3', 'fp'],
  ['SprintQualifying', 'Qualifications sprint', 'sprint'], ['SprintShootout', 'Qualifications sprint', 'sprint'], ['Sprint', 'Sprint', 'sprint'],
  ['Qualifying', 'Qualifications', 'quali'],
]
const gpName = (r) => 'GP ' + (r.Circuit?.Location?.locality || r.raceName.replace(/\s*Grand Prix.*$/i, '')).trim()
const at = (o) => (o?.date ? new Date(`${o.date}T${o.time ?? '13:00:00Z'}`) : null)

async function sessions() {
  const year = new Date().getFullYear()
  const out = []
  for (const y of [year, year + 1]) {
    const res = await fetch(`${API}/${y}.json`)
    if (!res.ok) continue
    const { MRData } = await res.json()
    for (const r of MRData.RaceTable.Races) {
      const base = { gp: gpName(r), id: `${y}-${r.round}` }
      for (const [key, label, kind] of FIELDS) {
        const start = at(r[key])
        if (start && !Number.isNaN(+start)) out.push({ ...base, label, kind, start })
      }
      const start = at(r)
      if (start && !Number.isNaN(+start)) out.push({ ...base, label: 'Course', kind: 'race', start })
    }
  }
  return out
}

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } })
  if (!res.ok) throw new Error(`GitHub ${res.status} ${path}`)
  return res.json()
}

async function window() {
  if (process.env.WINDOW_START && process.env.WINDOW_END) return [new Date(process.env.WINDOW_START), new Date(process.env.WINDOW_END)]
  const end = new Date()
  let start = new Date(end - 20 * MIN)
  if (process.env.GITHUB_RUN_ID && process.env.GITHUB_TOKEN) {
    try {
      const repo = process.env.GITHUB_REPOSITORY
      const cur = await gh(`/repos/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`)
      const last = await gh(`/repos/${repo}/actions/workflows/notify.yml/runs?status=success&per_page=1`)
      const runEnd = new Date(cur.run_started_at)
      const prev = last.workflow_runs?.[0] && new Date(last.workflow_runs[0].run_started_at)
      if (prev && runEnd - prev > 0 && runEnd - prev < 6 * 60 * MIN) start = prev
      else start = new Date(runEnd - 20 * MIN)
      return [start, runEnd]
    } catch (e) {
      console.warn('Fenêtre par défaut (20 min) :', e.message)
    }
  }
  return [start, end]
}

const decode = (code) => JSON.parse(Buffer.from(code.trim(), 'base64url').toString('utf8'))
const leadText = (m) => (m >= 1440 ? `${m / 1440} jour${m > 1440 ? 's' : ''}` : m >= 60 ? `${m / 60} h` : `${m} min`)
const hhmm = (d, tz) => new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(d).replace(':', ' h ')
const day = (d, tz) => new Intl.DateTimeFormat('fr-FR', { weekday: 'long', timeZone: tz }).format(d)

function plan(subs, list, [from, to]) {
  const jobs = []
  for (const sub of subs) {
    for (const s of list) {
      if (!sub.kinds.includes(s.kind)) continue
      for (const lead of sub.leads) {
        const fire = new Date(s.start - lead * MIN)
        if (fire > from && fire <= to) {
          const left = Math.max(0, Math.round((s.start - new Date()) / MIN))
          const when = process.env.WINDOW_START ? leadText(lead) : left >= 90 ? `${Math.round(left / 60)} h` : `${left} min`
          jobs.push({
            sub,
            tag: `${s.id}-${s.kind}-${s.label}-${lead}`,
            title: `${s.label} · ${s.gp}`,
            body: `Début dans ${when} — ${day(s.start, sub.tz)} à ${hhmm(s.start, sub.tz)}.`,
          })
        }
      }
    }
  }
  return jobs
}

async function send(job) {
  const payload = JSON.stringify({ title: job.title, body: job.body, tag: job.tag, url: APP_URL })
  if (DRY) return console.log('[dry-run]', job.title, '|', job.body, '|', job.sub.sub.endpoint.slice(0, 40))
  try {
    await webpush.sendNotification(job.sub.sub, payload, { TTL: 3600, urgency: 'high' })
    console.log('envoyé :', job.title)
  } catch (e) {
    if (e.statusCode === 404 || e.statusCode === 410) console.warn(`abonnement expiré (${e.statusCode}) : ${job.sub.sub.endpoint.slice(0, 50)}… → refais un code dans l'app`)
    else console.error('échec :', e.statusCode ?? '', e.body ?? e.message)
  }
}

const lines = (process.env.PUSH_SUBSCRIPTIONS ?? '').split('\n').map((l) => l.trim()).filter(Boolean)
if (!lines.length) { console.log('Aucun abonné : rien à faire.'); process.exit(0) }
const subs = []
for (const l of lines) {
  try {
    const d = decode(l)
    if (d.v === 1 && d.sub?.endpoint && Array.isArray(d.kinds) && Array.isArray(d.leads)) subs.push({ tz: 'Europe/Paris', ...d })
  } catch { console.warn('code d\'activation illisible, ignoré') }
}
if (!DRY) webpush.setVapidDetails(APP_URL, PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)

const w = await window()
console.log(`${subs.length} abonné(s) · fenêtre ${w[0].toISOString()} → ${w[1].toISOString()}`)
const jobs = plan(subs, await sessions(), w)
if (process.env.SEND_TEST === '1') {
  for (const sub of subs) jobs.push({ sub, tag: 'f1m-test', title: 'F1 Manager 🏁', body: 'Test réussi : les notifications du robot fonctionnent.' })
}
console.log(`${jobs.length} notification(s) à envoyer`)
for (const j of jobs) await send(j)
