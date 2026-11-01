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
    <header className="sticky top-0 z-30 w-full bg-[#08090a]/75 backdrop-blur-xl backdrop-saturate-150 border-b border-white/[0.08]">
      <div className="flex items-center gap-3 px-4 sm:px-5 lg:px-6 h-14 lg:h-16">
        <button
          onClick={onExit}
          aria-label="Changer de mode"
          className="-ml-2 min-h-11 min-w-11 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 text-xl active:text-white"
        >
          ‹
        </button>
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2 min-h-11">
          <span className="bg-white text-black font-bold px-2 py-1 rounded-md text-sm leading-none tracking-tight">F1</span>
          <span className="font-semibold tracking-tight text-lg leading-none">Manager</span>
          <span className="hidden lg:inline whitespace-nowrap ml-2 pl-3 border-l border-white/10 text-zinc-500 text-xs">
            Hors course
          </span>
        </button>
        <nav className="hidden md:flex ml-auto items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1" aria-label="Navigation principale">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => onNavigate(it.key)}
              aria-current={active === it.key ? 'page' : undefined}
              className={`min-h-9 px-3 lg:px-4 rounded-full text-xs lg:text-sm font-medium transition-colors ${
                active === it.key ? 'bg-white text-black shadow-[0_2px_12px_-2px_rgb(255_255_255_/_0.35)]' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {it.key === 'live' && <span className="inline-block size-1.5 mr-1.5 mb-0.5 rounded-full bg-red-500 animate-pulse" aria-hidden />}
              {it.label}
            </button>
          ))}
        </nav>
      </div>
      <nav className="md:hidden flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none]" aria-label="Navigation principale">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => onNavigate(it.key)}
            aria-current={active === it.key ? 'page' : undefined}
            className={`flex-auto px-3 min-h-10 rounded-full text-xs font-medium whitespace-nowrap ${
              active === it.key ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {it.key === 'live' && <span className="inline-block size-1.5 mr-1 mb-0.5 rounded-full bg-red-500 animate-pulse" aria-hidden />}
            {it.label}
          </button>
        ))}
      </nav>
      {onBack && (
        <div className={`${extra ? 'hidden md:flex' : 'flex'} items-center gap-3 px-4 sm:px-5 lg:px-6 border-t border-white/[0.06]`}>
          <button onClick={onBack} className="min-h-11 text-sm text-zinc-300 hover:text-white active:text-white">
            ← Retour
          </button>
          {crumb && <span className="text-xs text-zinc-500 truncate">{crumb}</span>}
        </div>
      )}
      {extra && <div className="px-4 sm:px-5 lg:px-6 border-t border-white/[0.06]">{extra}</div>}
    </header>
  )
}

export function SectionTitle({ kicker, title, className = '', h1 = false, desc }: { kicker: string; title: string; className?: string; h1?: boolean; desc?: string }) {
  const Tag = h1 ? 'h1' : 'h2'
  return (
    <div className={className}>
      <p className="inline-flex items-center gap-2 text-accent-400 text-xs font-medium uppercase tracking-[0.2em]">
        <span className="size-1.5 rounded-full bg-accent-400 shadow-[0_0_10px_2px_rgb(99_102_241_/_0.7)]" aria-hidden />
        {kicker}
      </p>
      <Tag className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.035em] leading-[1.05] text-gradient">{title}</Tag>
      {desc && <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">{desc}</p>}
    </div>
  )
}
