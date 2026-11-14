import type { ReactNode } from 'react'
import { LogoFull } from './Logo'

export type NavKey = 'home' | 'standings' | 'calendar' | 'stats' | 'favorites' | 'live'


interface Props {
  active?: NavKey
  onNavigate?: (k: NavKey) => void
  onExit?: () => void
  onBack?: () => void
  crumb?: string
  /** Contenu collé sous la barre (ex. onglets de section) : reste visible au défilement. */
  extra?: ReactNode
}

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <LogoFull className={className} />
  )
}

/** Logo cliquable : ramène toujours à l'accueil de l'app (Live / Saison / Rappels). */
export function LogoButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center min-h-11 rounded-lg" aria-label="F1 Manager, retour à l'accueil">
      <LogoMark />
    </button>
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

/** Barre de page sous la barre latérale : « ← Retour » + fil d'Ariane, et onglets de section éventuels. */
export default function MotorNav({ onBack, crumb, extra }: Props) {
  if (!onBack && !extra) return null
  return (
    <TopBar>
      {onBack && (
        <div className="app-wrap flex h-14 items-center gap-3">
          <button onClick={onBack} className="-ml-2 px-2 min-h-11 text-sm text-zinc-400 hover:text-white active:text-white">
            ← Retour
          </button>
          {crumb && <span className="text-xs text-zinc-600 truncate">{crumb}</span>}
        </div>
      )}
      {extra && <div className={`app-wrap pb-3 ${onBack ? 'pt-0' : 'pt-3'}`}>{extra}</div>}
    </TopBar>
  )
}

// Titres épurés : plus de sur-titre ni de sous-titre (kicker / desc gardés dans la signature pour compatibilité).
export function SectionTitle({ title, className = '', h1 = false }: { kicker?: string; title: string; className?: string; h1?: boolean; desc?: string }) {
  const Tag = h1 ? 'h1' : 'h2'
  return (
    <div className={`${h1 ? 'mb-12 sm:mb-16 app-in' : 'mb-8 sm:mb-10'} ${className}`}>
      <Tag className={`text-gradient font-medium tracking-[-0.035em] ${h1 ? 'text-[2rem] leading-[1.06] sm:text-[2.75rem]' : 'text-[1.75rem] leading-[1.1] sm:text-[2.625rem]'}`}>{title}</Tag>
    </div>
  )
}
