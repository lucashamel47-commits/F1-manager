import { useEffect, useRef, useState, type ReactNode } from 'react'
import { answer } from '../lib/chatEngine'

interface Msg {
  from: 'bot' | 'user'
  text: string
}

const WELCOME =
  'Salut ! Je suis l’assistant **F1 Manager** 🏁\nPose-moi une question sur la saison : classements, calendrier, prochain GP, résultats, pilotes et écuries.'
const START_CHIPS = ['Prochain GP', 'Classement pilotes', 'Classement constructeurs', 'Dernière course', 'Calendrier']

/** Petit rendu : **gras** + retours à la ligne. */
function renderText(text: string): ReactNode {
  return text.split('\n').map((line, i) => (
    <p key={i} className={line === '' ? 'h-2' : ''}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith('**') ? (
          <strong key={j} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        ),
      )}
    </p>
  ))
}

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([{ from: 'bot', text: WELCOME }])
  const [chips, setChips] = useState<string[]>(START_CHIPS)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [msgs, busy, open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Évite le défilement de la page derrière le panneau plein écran (téléphone)
  useEffect(() => {
    if (!open || window.innerWidth >= 640) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const send = async (text: string) => {
    const t = text.trim()
    if (!t || busy) return
    setInput('')
    setChips([])
    setMsgs((m) => [...m, { from: 'user', text: t }])
    setBusy(true)
    try {
      const [r] = await Promise.all([answer(t), new Promise((res) => setTimeout(res, 450))])
      setMsgs((m) => [...m, { from: 'bot', text: r.text }])
      setChips(r.chips ?? START_CHIPS)
    } catch {
      setMsgs((m) => [...m, { from: 'bot', text: 'Oups, je n’arrive pas à joindre l’API F1 pour le moment 🛠️ Réessaie dans un instant.' }])
      setChips(START_CHIPS)
    } finally {
      setBusy(false)
      if (window.innerWidth >= 640) inputRef.current?.focus()
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir l’assistant F1"
          className="fixed z-40 right-4 bottom-4 sm:right-6 sm:bottom-6 flex items-center gap-2 h-14 pl-4 pr-5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black uppercase tracking-wide text-sm shadow-[0_8px_30px_rgba(220,38,38,0.45)] transition"
          style={{ marginBottom: 'env(safe-area-inset-bottom)', marginRight: 'env(safe-area-inset-right)' }}
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
            <path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
          </svg>
          <span className="hidden sm:inline">Assistant</span>
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label="Assistant F1"
          className="fixed z-50 inset-0 sm:inset-auto sm:right-6 sm:bottom-6 sm:w-[420px] sm:h-[620px] sm:max-h-[calc(100dvh-3rem)] flex flex-col bg-black text-white sm:border sm:border-zinc-800 sm:shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
        >
          <div className="h-1 bg-red-600 shrink-0" />
          <header className="shrink-0 flex items-center gap-3 px-4 h-14 border-b border-zinc-800 bg-zinc-950" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <span className="bg-red-600 text-white font-black italic px-2 py-0.5 text-base leading-none">F1</span>
            <div className="leading-tight">
              <p className="font-black uppercase tracking-tight">Assistant</p>
              <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Données en direct • Jolpica
              </p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fermer l’assistant" className="ml-auto -mr-2 min-w-11 min-h-11 flex items-center justify-center text-zinc-400 hover:text-white text-2xl leading-none">
              ×
            </button>
          </header>

          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.08),transparent_60%)]" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] px-3.5 py-2.5 text-[15px] leading-relaxed break-words ${
                    m.from === 'user' ? 'bg-red-600 text-white rounded-2xl rounded-br-sm' : 'bg-zinc-900 text-zinc-200 border-l-4 border-red-600 rounded-r-lg'
                  }`}
                >
                  {renderText(m.text)}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="bg-zinc-900 border-l-4 border-red-600 rounded-r-lg px-4 py-3 flex gap-1.5" aria-label="L’assistant écrit">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {chips.length > 0 && (
            <div className="shrink-0 flex gap-2 overflow-x-auto px-4 py-2 border-t border-zinc-900 bg-black [scrollbar-width:none]">
              {chips.map((c) => (
                <button
                  key={c}
                  onClick={() => send(c)}
                  className="shrink-0 min-h-9 px-3 border border-zinc-700 hover:border-red-600 hover:text-white text-zinc-300 text-xs font-bold uppercase tracking-wide transition rounded-full"
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="shrink-0 flex items-center gap-2 p-3 border-t border-zinc-800 bg-zinc-950"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pose ta question F1…"
              aria-label="Ta question"
              enterKeyHint="send"
              autoComplete="off"
              className="flex-1 min-w-0 h-11 px-3 bg-black border border-zinc-700 focus:border-red-600 outline-none text-base text-white placeholder:text-zinc-600"
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Envoyer" className="h-11 w-11 shrink-0 flex items-center justify-center bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white transition">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </section>
      )}
    </>
  )
}
