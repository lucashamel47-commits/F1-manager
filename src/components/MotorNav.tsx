import type { ReactNode } from 'react'

export type NavKey = 'home' | 'standings' | 'calendar' | 'stats' | 'favorites' | 'live'

const items: { key: NavKey; label: string }[] = [
  { key: 'home', label: 'Accueil' },
  { key: 'live', label: 'Live' },
  { key: 'standings', label: 'Classements' },
  { key: 'calendar', label: 'Calendrier' },
  { key: 'stats', label: 'Statistiques' },
  { key: 'favorites', label: 'Favoris' },
]

interface Props {
  active: NavKey
  onNavigate: (k: NavKey) => void
  onExit: () => void
  onBack?: () => void
  crumb?: string
  /** Contenu collé sous la barre (ex. onglets de section) : reste visible au défilement. */
  extra?: ReactNode
}

export default function MotorNav({ active, onNavigate, onExit, onBack, crumb, extra }: Props) {
  return (
    <header className="sticky top-0 z-30 w-full bg-black/95 backdrop-blur border-b border-zinc-800">
      <div className="h-1 bg-red-600" />
      <div className="flex items-center gap-3 px-4 sm:px-5 lg:px-6 h-14 lg:h-16">
        <button
          onClick={onExit}
          aria-label="Changer de mode"
          className="-ml-2 min-h-11 min-w-11 flex items-center justify-center text-zinc-400 hover:text-white text-xl active:text-white"
        >
          ‹
        </button>
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2 min-h-11">
          <span className="bg-red-600 text-white font-black italic px-2 py-0.5 text-lg leading-none">F1</span>
          <span className="font-black uppercase tracking-tight text-lg leading-none">Manager</span>
          <span className="hidden lg:inline whitespace-nowrap ml-2 pl-3 border-l border-zinc-700 text-zinc-500 uppercase text-xs tracking-[0.3em]">
            Hors course
          </span>
        </button>
        <nav className="hidden md:flex ml-auto h-full items-stretch" aria-label="Navigation principale">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => onNavigate(it.key)}
              aria-current={active === it.key ? 'page' : undefined}
              className={`px-3 lg:px-5 text-xs lg:text-sm font-bold uppercase tracking-wider border-b-4 transition-colors ${
                active === it.key ? 'border-red-600 text-white' : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              {it.key === 'live' && <span className="inline-block size-1.5 mr-1.5 mb-0.5 rounded-full bg-red-600 animate-pulse" aria-hidden />}
              {it.label}
            </button>
          ))}
        </nav>
      </div>
      <nav className="md:hidden flex overflow-x-auto border-t border-zinc-900 px-1 [scrollbar-width:none]" aria-label="Navigation principale">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => onNavigate(it.key)}
            aria-current={active === it.key ? 'page' : undefined}
            className={`flex-auto px-1.5 min-h-11 text-[10px] min-[420px]:text-[11px] font-bold uppercase tracking-normal border-b-4 whitespace-nowrap ${
              active === it.key ? 'border-red-600 text-white' : 'border-transparent text-zinc-400'
            }`}
          >
            {it.key === 'live' && <span className="inline-block size-1.5 mr-1 mb-0.5 rounded-full bg-red-600 animate-pulse" aria-hidden />}
            {it.label}
          </button>
        ))}
      </nav>
      {onBack && (
        <div className={`${extra ? 'hidden md:flex' : 'flex'} items-center gap-3 px-4 sm:px-5 lg:px-6 border-t border-zinc-900 bg-zinc-950/80`}>
          <button onClick={onBack} className="min-h-11 text-sm text-zinc-300 hover:text-white active:text-white">
            ← Retour
          </button>
          {crumb && <span className="text-xs uppercase tracking-widest text-zinc-500 truncate">{crumb}</span>}
        </div>
      )}
      {extra && <div className="px-4 sm:px-5 lg:px-6 border-t border-zinc-900 bg-black/95">{extra}</div>}
    </header>
  )
}

export function SectionTitle({ kicker, title, className = '', h1 = false, desc }: { kicker: string; title: string; className?: string; h1?: boolean; desc?: string }) {
  const Tag = h1 ? 'h1' : 'h2'
  return (
    <div className={`border-l-4 border-red-600 pl-3 ${className}`}>
      <p className="text-red-500 text-xs font-bold uppercase tracking-[0.25em]">{kicker}</p>
      <Tag className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight leading-none">{title}</Tag>
      {desc && <p className="mt-2 text-sm text-zinc-400 max-w-2xl">{desc}</p>}
    </div>
  )
}
