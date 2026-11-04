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

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="grid h-7 place-items-center rounded-lg bg-white text-[#0a0a0a] px-2 text-[13px] font-bold leading-none tracking-tight">F1</span>
      <span className="text-[1.05rem] font-semibold leading-none tracking-[-0.02em]">Manager</span>
    </span>
  )
}

/** Barre du haut : verre sombre, sans fond blanc, contenu centré à la largeur de la page. */
export function TopBar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <header className={`sticky top-0 z-30 w-full border-b border-[#2b2c2d] bg-[#08090a]  ${className}`}>
      {children}
    </header>
  )
}

export default function MotorNav({ active, onNavigate, onExit, onBack, crumb, extra }: Props) {
  return (
    <TopBar>
      <div className="app-wrap flex items-center gap-3 h-16 lg:h-[4.5rem]">
        <button
          onClick={onExit}
          aria-label="Changer de mode"
          className="-ml-2 min-h-11 min-w-11 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 text-xl active:text-white"
        >
          ‹
        </button>
        <button onClick={() => onNavigate('home')} className="flex items-center min-h-11" aria-label="F1 Manager, accueil">
          <LogoMark />
        </button>
        <span className="hidden xl:inline whitespace-nowrap pl-3 ml-1 border-l border-white/10 text-zinc-500 text-xs">Hors course</span>
        <nav className="seg hidden md:inline-flex ml-auto" aria-label="Navigation principale">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => onNavigate(it.key)}
              aria-current={active === it.key ? 'page' : undefined}
              className="seg-item !min-h-9 !px-3 lg:!px-4 !text-xs lg:!text-sm"
            >
              {it.key === 'live' && <span className="inline-block size-1.5 rounded-full bg-red-500 animate-pulse" aria-hidden />}
              {it.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="md:hidden px-3 pb-3">
        <nav className="seg w-full" aria-label="Navigation principale">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => onNavigate(it.key)}
              aria-current={active === it.key ? 'page' : undefined}
              className="seg-item flex-auto !min-h-9 !px-3 !text-xs"
            >
              {it.key === 'live' && <span className="inline-block size-1.5 rounded-full bg-red-500 animate-pulse" aria-hidden />}
              {it.label}
            </button>
          ))}
        </nav>
      </div>
      {onBack && (
        <div className={`${extra ? 'hidden md:block' : 'block'}`}>
          <div className="app-wrap flex items-center gap-3 pb-1">
            <button onClick={onBack} className="-ml-2 px-2 min-h-11 text-sm text-zinc-400 hover:text-white active:text-white">
              ← Retour
            </button>
            {crumb && <span className="text-xs text-zinc-600 truncate">{crumb}</span>}
          </div>
        </div>
      )}
      {extra && <div className="app-wrap pb-3 pt-1">{extra}</div>}
    </TopBar>
  )
}

export function SectionTitle({ kicker, title, className = '', h1 = false, desc }: { kicker: string; title: string; className?: string; h1?: boolean; desc?: string }) {
  const Tag = h1 ? 'h1' : 'h2'
  return (
    <div className={`${h1 ? 'mb-12 sm:mb-16 app-in' : 'mb-8 sm:mb-10'} ${className}`}>
      <p className="kicker">
        
        {kicker}
      </p>
      <Tag className={`text-gradient mt-5 font-medium tracking-[-0.035em] ${h1 ? 'text-[2rem] leading-[1.06] sm:text-[2.75rem]' : 'text-[1.75rem] leading-[1.1] sm:text-[2.625rem]'}`}>{title}</Tag>
      {desc && <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">{desc}</p>}
    </div>
  )
}
