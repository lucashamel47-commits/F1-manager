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
    <div className="min-h-dvh text-white flex items-center justify-center px-4">
      <form onSubmit={submit} className="glass w-full max-w-sm space-y-4 rounded-3xl p-6">
        <p className="text-accent-400 text-[11px] font-medium tracking-[0.22em] uppercase">Formula 1</p>
        <h1 className="text-2xl font-semibold tracking-tight">Nouveau mot de passe</h1>
        <input
          type="password" autoComplete="new-password" placeholder="Nouveau mot de passe" value={pwd} onChange={(e) => setPwd(e.target.value)}
          className="w-full min-h-14 px-5 text-base bg-white/[0.04] rounded-2xl border border-white/10 placeholder:text-zinc-500 focus:border-white/30 outline-none"
        />
        <button disabled={busy} className="btn-primary w-full min-h-14 rounded-full font-semibold disabled:opacity-60">{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        {msg && <p className="text-xs text-center text-zinc-400">{msg}</p>}
      </form>
    </div>
  )
}
