// Envoie par email les messages « Écrire au support » laissés dans l'app. Lancé par .github/workflows/send-support.yml.
//
// L'app range chaque message dans la fiche du compte qui l'écrit (user_metadata.support_outbox) : aucun secret côté site,
// et personne ne peut écrire dans la fiche d'un autre. Ici, avec la clé service_role, on lit ces files, on envoie chaque
// message par Gmail SMTP à SUPPORT_TO (Répondre-à = l'utilisateur), on l'archive en JSON dans le bucket Storage PRIVÉ
// « support-archive » (AAAA/MM/<horodatage>-<id>.json, lisible seulement avec la clé service_role), puis on le retire de la file.
//
// Variables : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GMAIL_USER, GMAIL_APP_PASSWORD (secrets GitHub déjà en place).
// Optionnel : SUPPORT_TO (défaut f1.managerrappel@gmail.com), DRY_RUN=1 (affiche sans envoyer ni archiver),
// SKIP_EMAIL=1 (archive seulement, pour les tests), SUPPORT_BUCKET (défaut support-archive), SMTP_HOST / SMTP_PORT / SMTP_SECURE (tests).
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '')
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const GMAIL_USER = process.env.GMAIL_USER || ''
const GMAIL_PASS = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '')
const TO = process.env.SUPPORT_TO || 'f1.managerrappel@gmail.com'
const PREFIX = '[F1 Manager support]'
const CATS = ['Bug', 'Question', 'Idée', 'Autre']
const DRY = process.env.DRY_RUN === '1'
const SKIP_EMAIL = process.env.SKIP_EMAIL === '1'
const BUCKET = process.env.SUPPORT_BUCKET || 'support-archive'

if (!SUPABASE_URL || !KEY || (!(GMAIL_USER && GMAIL_PASS) && !DRY && !SKIP_EMAIL)) {
  console.error('Configuration incomplète : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GMAIL_USER et GMAIL_APP_PASSWORD sont requis.')
  process.exit(1)
}

const auth = (path, init = {}) =>
  fetch(`${SUPABASE_URL}/auth/v1/${path}`, { ...init, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...init.headers } })

const storage = (path, init = {}) =>
  fetch(`${SUPABASE_URL}/storage/v1/${path}`, { ...init, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, ...init.headers } })

// bucket privé créé au premier besoin (aucun SQL) ; s'il existait en public, on le repasse en privé
let bucketReady = false
const ensureBucket = async () => {
  if (bucketReady) return
  const got = await storage(`bucket/${BUCKET}`)
  if (got.ok) {
    const b = await got.json()
    if (b.public) {
      const r = await storage(`bucket/${BUCKET}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ public: false }) })
      if (!r.ok) throw new Error(`Bucket ${BUCKET} public et impossible à rendre privé : ${r.status}`)
    }
  } else {
    const r = await storage('bucket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }) })
    if (!r.ok && r.status !== 409) throw new Error(`Création du bucket ${BUCKET} : ${r.status} ${await r.text()}`)
  }
  bucketReady = true
}

const archive = async (rec) => {
  await ensureBucket()
  const d = new Date(rec.date)
  const when = Number.isNaN(d.getTime()) ? new Date() : d
  const yyyy = String(when.getUTCFullYear()), mm = String(when.getUTCMonth() + 1).padStart(2, '0')
  const stamp = when.toISOString().replace(/[:.]/g, '-')
  const path = `${yyyy}/${mm}/${stamp}-${rec.id.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64)}.json`
  const r = await storage(`object/${BUCKET}/${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-upsert': 'true' }, body: JSON.stringify(rec, null, 2),
  })
  if (!r.ok) throw new Error(`Archive ${path} : ${r.status} ${await r.text()}`)
  return path
}

const clip = (v, n) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, n)
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

// comptes avec des messages en attente
const queue = []
for (let page = 1; ; page++) {
  const res = await auth(`admin/users?page=${page}&per_page=1000`)
  if (!res.ok) throw new Error(`Liste des comptes : ${res.status} ${await res.text()}`)
  const { users = [] } = await res.json()
  for (const u of users) {
    const box = u.user_metadata?.support_outbox
    if (Array.isArray(box) && box.length) queue.push(u)
  }
  if (users.length < 1000) break
}

let transport = null
const mailer = async () => {
  if (transport) return transport
  const { default: nodemailer } = await import('nodemailer')
  const port = Number(process.env.SMTP_PORT || 465)
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com', port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === '1' : port === 465,
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  })
  return transport
}

let sent = 0, failed = 0, archivedCount = 0
for (const u of queue) {
  const done = []
  for (const m of u.user_metadata.support_outbox.slice(0, 5)) {
    if (!m || typeof m !== 'object' || typeof m.id !== 'string') continue
    const cat = CATS.includes(m.cat) ? m.cat : 'Autre'
    const subject = `${PREFIX} ${cat} – ${clip(m.subject, 120) || 'Sans titre'}`
    const message = String(m.message ?? '').slice(0, 4000)
    const info = [
      ['Compte', u.email ?? '—'], ['Catégorie', cat], ['Envoyé le', clip(m.ts, 40)],
      ['Version', clip(m.version, 60)], ['Page', clip(m.page, 80)], ['Appareil', clip(m.device, 200)],
    ]
    const text = `${message}\n\n— — —\n${info.map(([k, v]) => `${k} : ${v}`).join('\n')}\n`
    const html = `<div style="font:15px/1.55 -apple-system,Segoe UI,Inter,sans-serif;color:#111">
<p style="white-space:pre-wrap;margin:0 0 20px">${esc(message)}</p>
<table style="font-size:13px;color:#555;border-top:1px solid #ddd;padding-top:10px">${info.map(([k, v]) => `<tr><td style="padding:2px 14px 2px 0;color:#888">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table></div>`
    if (DRY) { console.log(`[simulation] ${subject} (de ${u.email})`); continue }
    // 1) archive (rejouable sans doublon : même chemin, écrasé) ; 2) email. Retiré de la file une fois l'email parti
    // (ou archivé si SKIP_EMAIL). Un échec d'archive est signalé (workflow en rouge) mais ne renvoie pas l'email.
    const rec = {
      id: m.id, date: clip(m.ts, 40) || new Date().toISOString(), category: cat, subject: clip(m.subject, 120),
      message, email: u.email ?? null, user_id: u.id, version: clip(m.version, 60), page: clip(m.page, 80),
      device: clip(m.device, 200), archived_at: new Date().toISOString(),
    }
    let archived = false
    try { console.log(`Archivé : ${await archive(rec)}`); archived = true; archivedCount++ } catch (e) { failed++; console.error(e.message) }
    if (SKIP_EMAIL) { if (archived) done.push(m.id); continue }
    try {
      await (await mailer()).sendMail({ from: `F1 Manager <${GMAIL_USER}>`, to: TO, replyTo: u.email || undefined, subject, text, html })
      done.push(m.id); sent++
    } catch (e) {
      failed++; console.error(`Échec d'envoi (${u.id.slice(0, 8)}…) : ${e.message}`)
    }
  }
  if (!done.length) continue
  // fiche relue juste avant d'écrire : on ne retire que ce qui est parti (un message ajouté entre-temps reste dans la file)
  const fresh = await auth(`admin/users/${u.id}`)
  if (!fresh.ok) { console.error(`Relecture impossible (${u.id.slice(0, 8)}…)`); failed++; continue }
  const meta = (await fresh.json()).user_metadata ?? {}
  const rest = (Array.isArray(meta.support_outbox) ? meta.support_outbox : []).filter((m) => !done.includes(m?.id))
  const sentIds = [...(Array.isArray(meta.support_sent) ? meta.support_sent : []), ...done].slice(-10)
  const res = await auth(`admin/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ user_metadata: { support_outbox: rest, support_sent: sentIds } }) })
  if (!res.ok) { console.error(`Mise à jour de la file impossible (${u.id.slice(0, 8)}…) : ${res.status}`); failed++ }
}
transport?.close?.()
console.log(`${queue.length} compte(s) avec des messages, ${sent} email(s) envoyé(s), ${archivedCount} archivé(s), ${failed} échec(s).`)
if (failed) process.exit(1)
