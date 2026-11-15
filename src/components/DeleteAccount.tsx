import { useState } from 'react'
import { deleteMyAccount } from '../lib/account'

export interface DeleteAccountUser {
  id: string
  email: string
}

/** Suppression du compte : discrète, en deux temps (taper SUPPRIMER), sans rouge criard. */
export default function DeleteAccount({ user, onDeleted }: { user: DeleteAccountUser; onDeleted: () => void }) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'err'>('idle')
  const ok = typed.trim().toUpperCase() === 'SUPPRIMER'
  const cancel = () => { setOpen(false); setTyped(''); setState('idle') }
  const confirm = async () => {
    if (!ok) return
    setState('busy')
    try {
      await deleteMyAccount(user.id)
      onDeleted()
    } catch {
      setState('err')
    }
  }
  if (!open) {
    return (
      <div className="mt-6 flex justify-start">
        <button onClick={() => setOpen(true)} className="min-h-11 px-4 rounded-full text-[13px] font-medium text-[#7d7e7e] hover:text-[#d6d7d7] hover:bg-white/[0.04]">
          Supprimer mon compte
        </button>
      </div>
    )
  }
  return (
    <section aria-label="Supprimer mon compte" className="mt-10 rounded-[1.75rem] border border-[#2b2c2d] bg-[#0d0e0f] p-7 sm:p-8">
      <h2 className="text-[17px] font-medium tracking-[-0.01em] text-white">Supprimer ton compte ?</h2>
      <p className="mt-3 text-sm leading-relaxed text-[#939494]">
        Ton compte <strong className="font-medium text-[#d6d7d7]">{user.email}</strong> et tes réglages de rappel seront effacés définitivement. Plus aucun email ne te sera envoyé. Cette action est irréversible.
      </p>
      <label className="mt-6 block text-xs text-[#7d7e7e]" htmlFor="confirm-delete">Tape <span className="font-semibold tracking-[0.08em] text-[#d6d7d7]">SUPPRIMER</span> pour confirmer</label>
      <input
        id="confirm-delete"
        value={typed}
        onChange={(e) => { setTyped(e.target.value); setState('idle') }}
        onKeyDown={(e) => { if (e.key === 'Enter') confirm() }}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        placeholder="SUPPRIMER"
        className="mt-2 w-full min-h-12 rounded-full border border-[#2b2c2d] bg-[#08090a] px-5 text-[15px] tracking-[0.06em] text-white placeholder:text-[#3d3e3f] outline-none focus:border-[#636464]"
      />
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
        <button onClick={cancel} disabled={state === 'busy'} className="btn-ghost min-h-12 flex-1 rounded-full">Annuler</button>
        <button onClick={confirm} disabled={!ok || state === 'busy'} className="btn-primary min-h-12 flex-1 rounded-full disabled:opacity-30">
          {state === 'busy' ? 'Suppression…' : 'Supprimer définitivement'}
        </button>
      </div>
      <p role="status" className="mt-3 min-h-4 text-xs text-amber-400">{state === 'err' && 'La suppression n’a pas abouti. Vérifie ta connexion et réessaie.'}</p>
    </section>
  )
}
