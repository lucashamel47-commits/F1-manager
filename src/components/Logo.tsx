/**
 * Logo F1 Manager : un « M » géométrique plein, incliné vers l'avant (idée de vitesse),
 * blanc sur noir, sans dégradé ni halo. Marque originale, distincte du logo officiel F1.
 */
export const LOGO_POINTS = '0,24 4.8,0 10.8,0 15,9 22.8,0 28.8,0 24,24 18,24 20.7,10.5 13,19 8.7,10.5 6,24'

export function LogoGlyph({ className = 'h-[18px] w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28.8 24" className={className} fill="currentColor" aria-hidden>
      <polygon points={LOGO_POINTS} />
    </svg>
  )
}

/** Marque complète : symbole + « F1 Manager » en Inter. */
export function LogoFull({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = {
    sm: { g: 'h-[15px] w-auto', t: 'text-[15px]', gap: 'gap-2' },
    md: { g: 'h-[17px] w-auto', t: 'text-[16px]', gap: 'gap-2.5' },
    lg: { g: 'h-[64px] w-auto', t: 'text-[56px]', gap: 'gap-6' },
  }[size]
  return (
    <span className={`inline-flex items-center ${s.gap} text-white ${className}`}>
      <LogoGlyph className={s.g} />
      <span className={`${s.t} font-semibold leading-none tracking-[-0.035em]`}>F1 Manager</span>
    </span>
  )
}
