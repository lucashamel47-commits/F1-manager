// Notifications avant les sessions : réglages, abonnement Web Push (iOS 16.4+ / PWA sur l'écran d'accueil)
// et « code d'activation » à enregistrer côté serveur (voir scripts/notify.mjs et le README).
import type { SessionKind } from './sessions'

/** Clé publique VAPID (publique par nature). La clé privée est uniquement dans les secrets GitHub. */
export const VAPID_PUBLIC_KEY = 'BNXSI504-_ggYcqh6tdGd4UCfAHhWZI_ZRnXKyr1vfzZBdAz96F1ifLJ4y8gnxEv3wHHTakc6_Aqa-NposbfP3k'

export interface Prefs {
  kinds: Record<SessionKind, boolean>
  leads: number[] // minutes avant le début
}

export const LEAD_CHOICES = [
  { min: 15, label: '15 min' },
  { min: 60, label: '1 h' },
  { min: 180, label: '3 h' },
  { min: 1440, label: '1 jour' },
]

const KEY = 'f1-notif-prefs-v1'
export const DEFAULT_PREFS: Prefs = { kinds: { race: true, quali: true, sprint: true, fp: false }, leads: [60] }

export function loadPrefs(): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || 'null') as Prefs | null
    if (p && p.kinds && Array.isArray(p.leads)) return { kinds: { ...DEFAULT_PREFS.kinds, ...p.kinds }, leads: p.leads }
  } catch { /* réglages illisibles → défauts */ }
  return DEFAULT_PREFS
}
export const savePrefs = (p: Prefs) => localStorage.setItem(KEY, JSON.stringify(p))

export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

function urlBase64ToUint8Array(b64: string): Uint8Array<ArrayBuffer> {
  const s = (b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(s)
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

/** Doit être appelé depuis un geste de l'utilisateur (clic) pour que iOS affiche la demande d'autorisation. */
export async function enablePush(): Promise<PushSubscription> {
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error(perm === 'denied' ? 'denied' : 'dismissed')
  const reg = await navigator.serviceWorker.ready
  return (
    (await reg.pushManager.getSubscription()) ??
    reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) })
  )
}

export async function disablePush(): Promise<void> {
  const sub = await currentSubscription()
  await sub?.unsubscribe()
}

/** Notification locale immédiate : vérifie que les autorisations de l'iPad sont bonnes. */
export async function localTest(): Promise<void> {
  const reg = await navigator.serviceWorker.ready
  await reg.showNotification('F1 Manager 🏁', {
    body: 'Les notifications fonctionnent sur cet appareil.',
    icon: `${import.meta.env.BASE_URL}pwa-192x192.png`,
    tag: 'f1m-test',
  })
}

/** Code à envoyer à la personne qui gère le serveur d'envoi : abonnement + réglages (+ fuseau horaire). */
export function activationCode(sub: PushSubscription, prefs: Prefs): string {
  const kinds = (Object.keys(prefs.kinds) as SessionKind[]).filter((k) => prefs.kinds[k])
  const payload = { v: 1, sub: sub.toJSON(), kinds, leads: prefs.leads, tz: Intl.DateTimeFormat().resolvedOptions().timeZone }
  return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(payload)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
