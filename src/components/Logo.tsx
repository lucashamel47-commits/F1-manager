/**
 * Logo F1 Manager, variante B : un « F » géométrique en trois blocs pleins,
 * avec deux coupes à 45°, dans les proportions de Novex (traits #F7F8F8 sur
 * fond #08090A). Marque originale, distincte du logo officiel F1.
 * Le nom est composé en Inter à côté du symbole, aux proportions du lockup :
 * écart 0,33 × hauteur du monogramme, corps ≈ hauteur, graisse 500, approches −1 %.
 */
import type { CSSProperties } from 'react'

const MARK_VIEW = '0 0 521 558'
const MARK_POLYS = [
  '0,0 521,0 521,131 131,131',
  '0,108 131,239 131,226 262,357 131,357 131,558 0,558',
  '239,226 390,226 521,357 370,357',
] as const

/** Rapport lockup : corps / hauteur du monogramme (hauteur d'œil Inter ≈ 0,727). */
const FONT_TO_MARK = 0.73 / 0.727
const GAP_TO_MARK = 0.33

export function LogoGlyph({ className = 'h-[18px] w-auto', style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox={MARK_VIEW} className={className} style={style} fill="currentColor" aria-hidden>
      {MARK_POLYS.map((points) => (
        <polygon key={points} points={points} />
      ))}
    </svg>
  )
}

/** Marque complète : symbole + « F1 Manager » en Inter. */
export function LogoFull({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const h = { sm: 15, md: 17, lg: 64 }[size]
  return (
    <span className={`inline-flex items-center text-white ${className}`} style={{ gap: h * GAP_TO_MARK }}>
      <LogoGlyph className="w-auto shrink-0" style={{ height: h }} />
      <span className="font-medium leading-none" style={{ fontSize: h * FONT_TO_MARK, letterSpacing: '-0.01em' }}>
        F1 Manager
      </span>
    </span>
  )
}
