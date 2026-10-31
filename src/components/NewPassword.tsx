import { useState } from 'react'
import { supabase } from '../lib/supabase'

/** Écran affiché après le clic sur le lien « mot de passe oublié » reçu par email. */
export default function NewPassword({ onDone }: { onDone: () => void }) {
  const [pwd, setPwd] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwd.length < 6) return setMsg('6 caractères minimum')
    setBusy(true)
    const { error } = await supabase!.auth.updateUser({ password: pwd })
    setBusy(false)
    if (error) setMsg('Impossible de changer le mot de passe. Redemande un lien.')
    else onDone()
  }

  return (
    <div className="min-h-dvh bg-black text-white flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <p className="text-red-600 text-[11px] tracking-[0.5em] uppercase">Formula 1</p>
        <h1 className="text-2xl font-black tracking-tight">Nouveau mot de passe</h1>
        <input
          type="password" autoComplete="new-password" placeholder="Nouveau mot de passe" value={pwd} onChange={(e) => setPwd(e.target.value)}
          className="w-full px-4 py-4 text-base bg-zinc-950/70 rounded-xl border border-zinc-800 focus:border-zinc-600 outline-none"
        />
        <button disabled={busy} className="w-full py-4 bg-red-600 rounded-xl font-medium disabled:opacity-60">{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        {msg && <p className="text-xs text-center text-zinc-400">{msg}</p>}
      </form>
    </div>
  )
}
