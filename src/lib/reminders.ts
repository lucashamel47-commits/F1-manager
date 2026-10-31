// Réglages des rappels : choix des sessions et des délais. Copie locale (localStorage) pour le calendrier .ics,
// et copie en ligne (table Supabase `reminder_prefs`, voir supabase/migrations) pour les rappels par email.
import type { SessionKind } from './sessions'
import { supabase } from './supabase'

export interface Prefs {
  enabled: boolean // rappels par email activés (opt-in)
  kinds: Record<SessionKind, boolean>
  leads: number[] // minutes avant le début
}

export const LEAD_CHOICES = [
  { min: 15, label: '15 min' },
  { min: 60, label: '1 h' },
  { min: 180, label: '3 h' },
  { min: 1440, label: '1 jour' },
]

const KEY = 'f1-reminder-prefs-v1'
export const DEFAULT_PREFS: Prefs = { enabled: false, kinds: { race: true, quali: true, sprint: true, fp: false }, leads: [60] }
const KINDS: SessionKind[] = ['race', 'quali', 'sprint', 'fp']

export function loadLocal(): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || 'null') as Prefs | null
    if (p && p.kinds && Array.isArray(p.leads)) return { enabled: !!p.enabled, kinds: { ...DEFAULT_PREFS.kinds, ...p.kinds }, leads: p.leads }
  } catch { /* réglages illisibles → défauts */ }
  return DEFAULT_PREFS
}
export const saveLocal = (p: Prefs) => localStorage.setItem(KEY, JSON.stringify(p))

const timezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris'

/** Réglages enregistrés en ligne pour cet utilisateur (null = jamais enregistrés). */
export async function fetchRemote(userId: string): Promise<Prefs | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('reminder_prefs').select('enabled,kinds,leads').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (!data) return null
  const kinds = { race: false, quali: false, sprint: false, fp: false } as Record<SessionKind, boolean>
  for (const k of data.kinds as string[]) if (KINDS.includes(k as SessionKind)) kinds[k as SessionKind] = true
  return { enabled: !!data.enabled, kinds, leads: (data.leads as number[]).length ? (data.leads as number[]) : [60] }
}

export async function saveRemote(userId: string, p: Prefs): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('reminder_prefs').upsert(
    { user_id: userId, enabled: p.enabled, kinds: KINDS.filter((k) => p.kinds[k]), leads: p.leads, tz: timezone() },
    { onConflict: 'user_id' },
  )
  if (error) throw error
}
