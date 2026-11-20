import { useState } from 'react'
import { shareOrCopy, viewUrl } from '../lib/share'

interface Props {
  title: string
  text: string
  hash: string
  className?: string
}

/** Bouton « Partager » : feuille système si elle existe, sinon copie du lien + toast. */
export default function ShareButton({ title, text, hash, className = '' }: Props) {
  const [copied, setCopied] = useState(false)

  const onClick = async () => {
    try {
      const result = await shareOrCopy({ title, text, url: viewUrl(hash) })
      if (result === 'copied') {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2200)
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
    }
  }

  return (
    <>
      <button
        type="button"
        data-share
        onClick={onClick}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-[#2b2c2d] px-5 text-[14px] font-medium text-[#d6d7d7] hover:bg-[#161718] ${className}`}
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
          <path d="M16 6l-4-4-4 4M12 2v14" />
        </svg>
        Partager
      </button>
      {copied && (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 z-[70] flex justify-center px-6"
          style={{ bottom: 'max(6.5rem, calc(env(safe-area-inset-bottom) + 5.5rem))' }}
        >
          <p className="rounded-full border border-[#2b2c2d] bg-[#121314] px-5 py-3 text-sm text-[#d6d7d7]">Lien copié</p>
        </div>
      )}
    </>
  )
}
