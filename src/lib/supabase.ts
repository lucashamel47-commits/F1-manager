// Comptes en ligne (Supabase). Sans les deux variables d'environnement, `supabase` vaut null :
// l'app retombe sur l'ancien mode local et masque tout ce qui concerne les comptes / rappels par email.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase = url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null
export const supabaseEnabled = supabase !== null

export const APP_URL = `${location.origin}${import.meta.env.BASE_URL}`
