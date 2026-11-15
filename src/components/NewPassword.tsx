import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthShell } from '../pages/AuthPage'
import { authInput, authSubmit, AuthMessage } from './AuthForm'

/** Écran affiché après le clic sur le lien « mot de passe oublié » reçu par email (même coque que Connexion). */
export default function NewPassword({ onDone }: { onDone: () => void }) {
  const [pwd, setPwd] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwd.length < 6) return setMsg('6 caractères minimum pour le mot de passe.')
    setBusy(true)
    setMsg('')
    const { error } = await supabase!.auth.updateUser({ password: pwd })
    setBusy(false)
    if (error) setMsg('Impossible de changer le mot de passe. Redemande un lien.')
    else onDone()
  }

  return (
    <AuthShell title="Nouveau mot de passe" back={false}>
      <form onSubmit={submit} noValidate aria-busy={busy} className="space-y-2.5">
        <label htmlFor="new-pw" className="sr-only">Nouveau mot de passe</label>
        <input id="new-pw" type="password" autoComplete="new-password" placeholder="Nouveau mot de passe (6 caractères min.)" value={pwd} disabled={busy} aria-invalid={!!msg || undefined} onChange={(e) => setPwd(e.target.value)} className={authInput} />
        {msg && <AuthMessage text={msg} ok={false} />}
        <button disabled={busy} className={authSubmit}>
          {busy && <span className="size-3.5 animate-spin rounded-full border-2 border-black/25 border-t-black" aria-hidden />}
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </AuthShell>
  )
}
