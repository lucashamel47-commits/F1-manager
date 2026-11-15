import { useEffect, useRef, useState } from 'react'
import { APP_VERSION, MAX_MESSAGE, MAX_SUBJECT, SUPPORT_CATEGORIES, SUPPORT_EMAIL, deviceInfo, mailtoHref, queueSupport, type SupportCategory } from '../lib/support'

/**
 * Formulaire « Écrire au support » (style Novex) : catégorie, objet, message.
 * Email du compte, version, page et appareil sont joints automatiquement.
 * Monté une fois dans App ; s'ouvre via openSupport() (événement « f1-support-open »).
 */
export default function SupportForm({ email, page }: { email?: string; page: string }) {
  const [open, setOpen] = useState(false)
  const [cat, setCat] = useState<SupportCategory>('Bug')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'mail'>('idle')
  const [error, setError] = useState('')
  const first = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const on = () => { setOpen(true); setState('idle'); setError('') }
    window.addEventListener('f1-support-open', on)
    return () => window.removeEventListener('f1-support-open', on)
  }, [])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    setTimeout(() => first.current?.focus(), 50)
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  const meta = { version: APP_VERSION, page, device: deviceInfo() }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim().length < 5) return setError('Écris quelques mots pour qu’on puisse t’aider.')
    setError('')
    setState('sending')
    const m = { cat, subject: subject.trim(), message: message.trim(), ...meta }
    try {
      const ok = email ? await queueSupport(m) : false
      if (ok) { setState('sent'); setSubject(''); setMessage('') }
      else { window.location.href = mailtoHref(m, email); setState('mail') }
    } catch (err) {
      setState('idle')
      setError(err instanceof Error && err.message.includes('attente') ? err.message : 'L’envoi a échoué. Réessaie, ou écris-nous directement à ' + SUPPORT_EMAIL + '.')
    }
  }

  const field = 'w-full rounded-xl border border-[#2b2c2d] bg-[#0c0d0e] px-3.5 text-[15px] text-white placeholder:text-[#5a5b5c] outline-none transition focus:border-[#5a5b5c]'

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden />
      <div role="dialog" aria-modal="true" aria-labelledby="support-title" data-support-form
        className="app-in relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[1.5rem] border border-[#2b2c2d] bg-[#101112] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 text-white sm:max-w-[30rem] sm:rounded-[1.5rem] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="support-title" className="text-[22px] font-medium tracking-[-0.03em]">Écrire au support</h2>
            <p className="mt-1.5 text-[14px] leading-snug text-[#939494]">Un bug, une question, une idée : une vraie personne te répond par email.</p>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Fermer" className="-mr-2 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-[#939494] hover:bg-white/[0.06] hover:text-white">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        {state === 'sent' || state === 'mail' ? (
          <div className="py-8 text-center" role="status">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#f7f8f8] text-[#08090a]">
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </span>
            <p className="mt-5 text-[17px] font-medium">{state === 'sent' ? 'Message envoyé' : 'Ton app Mail s’est ouverte'}</p>
            <p className="mx-auto mt-2 max-w-xs text-[14px] leading-snug text-[#939494]">
              {state === 'sent' ? <>On te répond à <span className="text-[#d6d7d7]">{email}</span>, en général sous 48 h.</> : <>Il ne reste qu’à appuyer sur Envoyer. Sinon, écris-nous à <span className="text-[#d6d7d7]">{SUPPORT_EMAIL}</span>.</>}
            </p>
            <button onClick={() => setOpen(false)} className="mt-7 h-11 rounded-full bg-[#f7f8f8] px-6 text-[14px] font-medium text-[#08090a]">Fermer</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-5">
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-[#c4c5c5]">Sujet</legend>
              <div role="radiogroup" aria-label="Catégorie" className="grid grid-cols-4 gap-1 rounded-full border border-[#2b2c2d] bg-[#0c0d0e] p-1">
                {SUPPORT_CATEGORIES.map((c, i) => (
                  <button key={c} ref={i === 0 ? first : undefined} type="button" role="radio" aria-checked={cat === c} onClick={() => setCat(c)}
                    className={`h-9 rounded-full text-[13px] font-medium transition ${cat === c ? 'bg-[#f7f8f8] text-[#08090a]' : 'text-[#a9aaab] hover:text-white'}`}>{c}</button>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="mb-2 block text-[13px] font-medium text-[#c4c5c5]">Objet</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={MAX_SUBJECT} placeholder={cat === 'Bug' ? 'Ex. Le direct ne charge pas' : cat === 'Idée' ? 'Ex. Ajouter les pneus en direct' : 'En quelques mots'} className={`${field} h-11`} />
            </label>
            <label className="block">
              <span className="mb-2 block text-[13px] font-medium text-[#c4c5c5]">Message</span>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={MAX_MESSAGE} rows={5} required placeholder={cat === 'Bug' ? 'Qu’est-ce qui s’est passé ? Qu’est-ce que tu attendais ?' : 'Dis-nous tout.'} className={`${field} resize-none py-3 leading-relaxed`} />
            </label>
            <div className="rounded-xl border border-[#1d1e1f] bg-[#0c0d0e] px-3.5 py-3 text-[12.5px] leading-relaxed text-[#7b7c7c]">
              <p><span className="text-[#a9aaab]">Réponse à :</span> {email || 'ton adresse email (via ton app Mail)'}</p>
              <p>Version, page et appareil sont joints automatiquement pour nous aider.</p>
            </div>
            {error && <p role="alert" className="text-[13px] text-[#f0b4b4]">{error}</p>}
            <button type="submit" disabled={state === 'sending'} className="flex h-12 w-full items-center justify-center rounded-full bg-[#f7f8f8] text-[15px] font-medium text-[#08090a] transition hover:bg-white disabled:opacity-60">
              {state === 'sending' ? 'Envoi…' : 'Envoyer'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
