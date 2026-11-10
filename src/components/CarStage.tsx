import type { GridTeam } from '../data/grid'
import { teamCar, teamLogo } from '../data/grid'

/**
 * Présentation « studio » d'une monoplace 2026 : rendu officiel (profil, fond transparent),
 * posé sur un sol sombre avec une ombre douce et un liseré à la couleur de l'écurie.
 * Toutes les voitures ont le même cadrage : même largeur, même ligne de sol.
 */
export default function CarStage({ team, className = '', logo = true, size = 'md' }: { team: GridTeam; className?: string; logo?: boolean; size?: 'md' | 'lg' }) {
  return (
    <div className={`car-studio relative isolate overflow-hidden bg-[#0c0d0e] ${className}`} style={{ ['--team' as string]: team.color }}>
      <div aria-hidden className="car-studio-light" />
      <div aria-hidden className="car-studio-floor" />
      {logo && <img src={teamLogo(team)} alt="" className={`absolute left-4 top-4 z-10 opacity-80 ${size === 'lg' ? 'size-10 sm:size-12' : 'size-7'}`} />}
      <div className="absolute inset-x-[6%] bottom-[22%] top-[18%] flex items-end">
        <div aria-hidden className="car-studio-shadow" />
        <img src={teamCar(team)} alt={`Monoplace ${team.name} 2026`} loading="lazy" className="relative w-full object-contain object-bottom drop-shadow-[0_18px_22px_rgb(0_0_0_/_0.55)]" />
      </div>
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-px opacity-70" style={{ background: `linear-gradient(90deg, transparent, ${team.color}, transparent)` }} />
    </div>
  )
}
