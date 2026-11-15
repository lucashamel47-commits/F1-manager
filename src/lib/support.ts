// « Écrire au support » : formulaire dans l'app, livré par email à l'adresse du support.
//
// Gratuit et sans aucun secret côté site :
// 1) l'utilisateur connecté envoie le formulaire → le message est rangé dans SA propre fiche Supabase
//    (user_metadata.support_outbox, que chaque compte a le droit de modifier) ;
// 2) le robot GitHub (.github/workflows/send-support.yml, toutes les 10 min) lit ces messages avec la clé
//    service_role, les envoie par Gmail SMTP (secrets GitHub déjà en place) puis les retire de la file.
// Sans compte (page d'accueil) ou sans Supabase : le formulaire ouvre l'app Mail avec le message pré-rempli.
import { supabase } from './supabase'

export const SUPPORT_EMAIL = 'f1.managerrappel@gmail.com'
export const SUPPORT_PREFIX = '[F1 Manager support]'
export const SUPPORT_CATEGORIES = ['Bug', 'Question', 'Idée', 'Autre'] as const
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number]

export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev'

export interface SupportMessage {
  id: string
  cat: SupportCategory
  subject: string
  message: string
  ts: string
  version: string
  page: string
  device: string
}

const MAX_PENDING = 3
export const MAX_MESSAGE = 2000
export const MAX_SUBJECT = 120

export function deviceInfo(): string {
  const ua = navigator.userAgent
  const os = /iPad|Macintosh.*Mobile|Macintosh.*Touch/.test(ua) && navigator.maxTouchPoints > 1 ? 'iPadOS'
    : /iPhone/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Autre'
  const browser = /CriOS|Chrome\//.test(ua) && !/Edg\//.test(ua) ? 'Chrome' : /Edg\//.test(ua) ? 'Edge' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Navigateur'
  const pwa = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone ? ' · app installée' : ''
  return `${os} · ${browser} · écran ${window.screen.width}×${window.screen.height} · fenêtre ${window.innerWidth}×${window.innerHeight}${pwa}`
}

export const subjectLine = (cat: string, subject: string) => `${SUPPORT_PREFIX} ${cat} – ${subject || 'Sans titre'}`

export function bodyText(m: Pick<SupportMessage, 'message' | 'version' | 'page' | 'device'>, email?: string) {
  return `${m.message}\n\n— — —\nCompte : ${email || 'non connecté'}\nVersion : ${m.version}\nPage : ${m.page}\nAppareil : ${m.device}`
}

export function mailtoHref(m: Pick<SupportMessage, 'cat' | 'subject' | 'message' | 'version' | 'page' | 'device'>, email?: string) {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subjectLine(m.cat, m.subject))}&body=${encodeURIComponent(bodyText(m, email))}`
}

/** Range le message dans la file du compte connecté. Renvoie false si l'envoi en ligne est impossible (→ repli email). */
export async function queueSupport(m: Omit<SupportMessage, 'id' | 'ts'>): Promise<boolean> {
  if (!supabase) return false
  // fiche fraîche (le robot a pu vider la file entre-temps : on ne renvoie jamais un message déjà parti)
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return false
  const meta = data.user.user_metadata ?? {}
  const sent: string[] = Array.isArray(meta.support_sent) ? meta.support_sent : []
  const pending: SupportMessage[] = (Array.isArray(meta.support_outbox) ? meta.support_outbox : []).filter((x: SupportMessage) => !sent.includes(x.id))
  if (pending.length >= MAX_PENDING) throw new Error('Tu as déjà plusieurs messages en attente. Réessaie dans quelques minutes.')
  const item: SupportMessage = {
    ...m,
    subject: m.subject.slice(0, MAX_SUBJECT),
    message: m.message.slice(0, MAX_MESSAGE),
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
  }
  const { error: e2 } = await supabase.auth.updateUser({ data: { support_outbox: [...pending, item] } })
  if (e2) throw e2
  return true
}

/** Ouvre le formulaire depuis n'importe où (barre latérale, feuille « Plus », pied de page). */
export const openSupport = () => window.dispatchEvent(new Event('f1-support-open'))
