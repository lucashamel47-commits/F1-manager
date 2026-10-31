// Envoi des rappels par email avant les sessions de F1. Lancé toutes les 15 min par .github/workflows/send-reminders.yml.
// fetch vers Supabase (PostgREST) et Jolpica (calendrier) ; email via Gmail SMTP (nodemailer).
//
// Variables d'environnement :
//   SUPABASE_URL                 ex. https://abcd1234.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    clé « service_role » (secret GitHub, ne jamais la mettre dans l'app)
//   GMAIL_USER                   adresse Gmail d'envoi (secret GitHub)
//   GMAIL_APP_PASSWORD           « mot de passe d'application » Google à 16 caractères (secret GitHub)
//   DRY_RUN=1                    n'envoie rien, affiche seulement ce qui partirait
//   SEND_TEST=1                  envoie un email de test à tous les inscrits actifs
//   NOW / SMTP_HOST / SMTP_PORT / SMTP_SECURE / JOLPICA_URL   (tests en local)
//
// Principe : pour chaque inscrit, chaque session choisie et chaque délai choisi, l'heure d'envoi = début − délai.
// On envoie si cette heure est passée depuis moins de 90 min, si la session n'a pas commencé et si l'inscrit
// n'a pas modifié ses réglages après cette heure. Avant d'envoyer, on « réserve » la ligne dans reminder_log
// (clé primaire user_id + session + délai) : deux runs en parallèle ou un retard du cron ne peuvent jamais créer de doublon.
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '')
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const GMAIL_USER = process.env.GMAIL_USER || ''
const GMAIL_PASS = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '') // Google l'affiche par blocs de 4 : on enlève les espaces
const JOLPICA = process.env.JOLPICA_URL || 'https://api.jolpi.ca/ergast/f1'
const APP_URL = 'https://lucashamel47-commits.github.io/F1-manager/'
const DRY = process.env.DRY_RUN === '1'
const NOW = process.env.NOW ? new Date(process.env.NOW) : new Date()
const MIN = 60_000
const MAX_LATE = 90 * MIN

if (!SUPABASE_URL || !SERVICE_KEY || (!(GMAIL_USER && GMAIL_PASS) && !DRY)) {
  console.error('Configuration incomplète : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GMAIL_USER et GMAIL_APP_PASSWORD sont requis.')
  process.exit(1)
}

const FIELDS = [
  ['FirstPractice', 'Essais libres 1', 'fp'], ['SecondPractice', 'Essais libres 2', 'fp'], ['ThirdPractice', 'Essais libres 3', 'fp'],
  ['SprintQualifying', 'Qualifications sprint', 'sprint'], ['SprintShootout', 'Qualifications sprint', 'sprint'], ['Sprint', 'Sprint', 'sprint'],
  ['Qualifying', 'Qualifications', 'quali'],
]
const gpName = (r) => 'GP ' + (r.Circuit?.Location?.locality || r.raceName.replace(/\s*Grand Prix.*$/i, '')).trim()
const at = (o) => (o?.date ? new Date(`${o.date}T${o.time ?? '13:00:00Z'}`) : null)
const valid = (d) => d && !Number.isNaN(+d)

async function sessions() {
  const year = NOW.getUTCFullYear()
  const out = []
  for (const y of [year, year + 1]) {
    const res = await fetch(`${JOLPICA}/${y}.json`)
    if (!res.ok) continue
    const { MRData } = await res.json()
    for (const r of MRData.RaceTable.Races) {
      const base = { gp: gpName(r), place: `${r.Circuit?.Location?.locality ?? ''}, ${r.Circuit?.Location?.country ?? ''}` }
      for (const [key, label, kind] of FIELDS) {
        const start = at(r[key])
        if (valid(start)) out.push({ ...base, id: `${y}-${r.round}-${key}`, label, kind, start })
      }
      const start = at(r)
      if (valid(start)) out.push({ ...base, id: `${y}-${r.round}-Race`, label: 'Course', kind: 'race', start })
    }
  }
  return out
}

// ---------- Supabase ----------
const sb = (path, init = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', ...init.headers },
  })

async function subscribers() {
  const out = []
  for (let from = 0; ; from += 1000) {
    const res = await sb('reminder_prefs?enabled=eq.true&email=not.is.null&select=user_id,email,kinds,leads,tz,updated_at', {
      headers: { Range: `${from}-${from + 999}`, 'Range-Unit': 'items' },
    })
    if (!res.ok) throw new Error(`Supabase reminder_prefs ${res.status} ${await res.text()}`)
    const page = await res.json()
    out.push(...page)
    if (page.length < 1000) return out
  }
}

/** Réserve (user, session, délai). Vrai si on est le premier : à nous d'envoyer. */
async function claim(userId, sessionId, lead) {
  const res = await sb('reminder_log?on_conflict=user_id,session_id,lead_min', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
    body: JSON.stringify({ user_id: userId, session_id: sessionId, lead_min: lead }),
  })
  if (!res.ok) throw new Error(`Supabase reminder_log ${res.status} ${await res.text()}`)
  return (await res.json()).length > 0
}
const unclaim = (userId, sessionId, lead) =>
  sb(`reminder_log?user_id=eq.${userId}&session_id=eq.${encodeURIComponent(sessionId)}&lead_min=eq.${lead}`, { method: 'DELETE' })

// ---------- Email ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const safeTz = (tz) => { try { new Intl.DateTimeFormat('fr-FR', { timeZone: tz }); return tz } catch { return 'Europe/Paris' } }
const fmt = (d, tz, o) => new Intl.DateTimeFormat('fr-FR', { timeZone: safeTz(tz), ...o }).format(d)
const heure = (d, tz) => fmt(d, tz, { hour: '2-digit', minute: '2-digit' }).replace(':', ' h ')
const jour = (d, tz) => fmt(d, tz, { weekday: 'long', day: 'numeric', month: 'long' })
const delai = (min) => (min >= 120 ? `${Math.round(min / 60)} h` : min >= 60 ? '1 h' : `${Math.max(1, min)} min`)

function template(title, lines) {
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#fff;border-top:4px solid #e10600">
<tr><td style="padding:24px 28px 8px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#71717a"><b style="color:#e10600">F1</b> Manager</td></tr>
<tr><td style="padding:0 28px;font-size:24px;font-weight:800;line-height:1.25">${esc(title)}</td></tr>
${lines.map((l) => `<tr><td style="padding:10px 28px 0;font-size:16px;line-height:1.5;color:#27272a">${l}</td></tr>`).join('\n')}
<tr><td style="padding:24px 28px 8px"><a href="${APP_URL}" style="display:inline-block;background:#e10600;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;font-size:15px">Ouvrir F1 Manager</a></td></tr>
<tr><td style="padding:20px 28px 28px;font-size:12px;color:#71717a;line-height:1.5">Tu reçois cet email parce que tu as activé les rappels dans F1 Manager. Pour les arrêter : ouvre l'app › Rappels › désactive les rappels par email.</td></tr>
</table></td></tr></table></body></html>`
  return { html, text: `${title}\n\n${lines.map((l) => l.replace(/<[^>]+>/g, '')).join('\n')}\n\n${APP_URL}\n\nPour arrêter les rappels : app › Rappels › désactive les rappels par email.` }
}

function reminderMail(p, s, lead) {
  const left = Math.max(1, Math.round((s.start - NOW) / MIN))
  const title = `${s.label} · ${s.gp} — dans ${delai(Math.min(left, lead))}`
  return {
    subject: `🏁 ${s.label} · ${s.gp} dans ${delai(Math.min(left, lead))}`,
    ...template(title, [
      `<b>${esc(s.label)}</b> — ${esc(s.gp)} (${esc(s.place)})`,
      `Début <b>${esc(jour(s.start, p.tz))} à ${esc(heure(s.start, p.tz))}</b> (heure : ${esc(safeTz(p.tz))}).`,
    ]),
  }
}

let transport = null
async function send(to, mail) {
  if (!transport) {
    const { default: nodemailer } = await import('nodemailer')
    const port = Number(process.env.SMTP_PORT || 465)
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === '1' : port === 465,
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
      pool: true,
      maxConnections: 1,
    })
  }
  await transport.sendMail({ from: `F1 Manager <${GMAIL_USER}>`, to, subject: mail.subject, html: mail.html, text: mail.text })
}

// ---------- Run ----------
const subs = await subscribers()
console.log(`${subs.length} inscrit(s) actif(s) · ${NOW.toISOString()}${DRY ? ' · DRY_RUN' : ''}`)
if (!subs.length && process.env.SEND_TEST !== '1') process.exit(0)

const list = await sessions()
let sent = 0, skipped = 0, failed = 0
for (const p of subs) {
  const updated = new Date(p.updated_at)
  for (const s of list) {
    if (!p.kinds.includes(s.kind) || s.start <= NOW) continue
    for (const lead of p.leads) {
      const fire = new Date(s.start - lead * MIN)
      if (fire > NOW || NOW - fire > MAX_LATE || fire < updated) continue
      try {
        if (DRY) { console.log(`[dry-run] ${p.email} ← ${s.label} · ${s.gp} (−${lead} min)`); sent++; continue }
        if (!(await claim(p.user_id, s.id, lead))) { skipped++; continue }
        try {
          await send(p.email, reminderMail(p, s, lead))
          sent++
          console.log(`envoyé : ${s.label} · ${s.gp} (−${lead} min)`)
        } catch (e) {
          await unclaim(p.user_id, s.id, lead) // on réessaiera au prochain run
          throw e
        }
      } catch (e) {
        failed++
        console.error('échec :', e.message)
      }
    }
  }
}

if (process.env.SEND_TEST === '1' && !DRY) {
  for (const p of subs) {
    try {
      await send(p.email, { subject: 'F1 Manager 🏁 Test des rappels', ...template('Test réussi 🏁', ['Les rappels par email de F1 Manager fonctionnent.']) })
      sent++
    } catch (e) { failed++; console.error('échec test :', e.message) }
  }
}
transport?.close()
console.log(`Terminé : ${sent} envoyé(s), ${skipped} déjà envoyé(s), ${failed} échec(s).`)
if (failed) process.exit(1)
