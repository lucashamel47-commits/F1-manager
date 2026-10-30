import type { CSSProperties } from 'react'

// Les images sont orientées vers la GAUCHE : l'arrière (aileron, roues arrière) est à droite.
// Chaque filet d'air naît à l'arrière de la voiture et file vers la droite.
// x / y : point de départ (% du cadre) · len : longueur · h : épaisseur (px)
// o : opacité max · dur / delay : durée et décalage (s)
const flows = [
  // bout d'aileron arrière (plus long, plus net)
  { x: 92.5, y: 42.5, len: 44, h: 1.5, o: 0.85, dur: 1.15, delay: 0 },
  { x: 92, y: 46.5, len: 34, h: 1.2, o: 0.7, dur: 0.95, delay: 0.55 },
  { x: 91, y: 50.5, len: 40, h: 1.3, o: 0.65, dur: 1.3, delay: 0.25 },
  // dessus du capot moteur / aileron
  { x: 88.5, y: 38, len: 24, h: 1, o: 0.5, dur: 1.1, delay: 0.8 },
  // roue arrière + diffuseur
  { x: 89, y: 56, len: 20, h: 1.2, o: 0.55, dur: 0.85, delay: 0.1 },
  { x: 89.5, y: 61.5, len: 32, h: 1.4, o: 0.65, dur: 1.0, delay: 0.7 },
  { x: 88, y: 66, len: 40, h: 1.3, o: 0.6, dur: 1.2, delay: 0.4 },
  { x: 86.5, y: 69.5, len: 18, h: 1, o: 0.4, dur: 0.8, delay: 0.95 },
]

/** Voiture + effet de vitesse réaliste (filets d'air effilés, tourbillons d'aileron, flou de mouvement, air chaud). */
export default function CarStage({ src, className = '' }: { src: string; className?: string }) {
  return (
    <div className={`car-stage relative ${className}`}>
      <div aria-hidden="true" className="speed-fx">
        <div className="heat-haze" />
        <svg className="vortex" viewBox="0 0 100 67" preserveAspectRatio="none" overflow="visible">
          <defs>
            <linearGradient id="vx" gradientUnits="userSpaceOnUse" x1="92" y1="0" x2="150" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="vortex-line" d="M92.5 42.5 C 102 39.5, 111 45.5, 122 42.5 S 140 40.5, 150 43" stroke="url(#vx)" />
          <path className="vortex-line v2" d="M92 46.5 C 101 49.5, 112 43.5, 123 46.5 S 139 48, 150 46" stroke="url(#vx)" />
        </svg>
        {flows.map((f, i) => (
          <span
            key={i}
            className="airflow"
            style={
              {
                left: `${f.x}%`,
                top: `${f.y}%`,
                width: `${f.len}%`,
                height: `${f.h}px`,
                '--o': f.o,
                animationDuration: `${f.dur}s`,
                animationDelay: `${f.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      {/* Flou de mouvement : images fantômes décalées vers l'arrière, dégradées */}
      <div className="car-photo">
        <img src={src} alt="" loading="lazy" className="relative block w-full h-full object-contain" />
        <img src={src} alt="" aria-hidden="true" className="car-ghost g1" />
        <img src={src} alt="" aria-hidden="true" className="car-ghost g2" />
      </div>
    </div>
  )
}
