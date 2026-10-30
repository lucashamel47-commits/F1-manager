
// Les images de voitures sont orientées vers la GAUCHE : l'arrière (aileron) est à droite.
// Les traits partent donc de l'arrière de la voiture (~84 % de la largeur) et filent vers la droite.
const lines = [
  { top: '40%', width: '20%', height: 2, dur: '1.1s', delay: '0.3s' },
  { top: '45%', width: '30%', height: 3, dur: '0.9s', delay: '0s' },
  { top: '51%', width: '38%', height: 4, dur: '1.2s', delay: '0.5s' },
  { top: '57%', width: '26%', height: 3, dur: '1s', delay: '0.7s' },
  { top: '62%', width: '34%', height: 3, dur: '1.3s', delay: '0.2s' },
  { top: '67%', width: '18%', height: 2, dur: '0.95s', delay: '0.6s' },
]

/** Voiture + traînée blanche qui part de l'arrière (à droite) de la monoplace. */
export default function CarStage({ src, className = '' }: { src: string; className?: string }) {
  return (
    <div className={`car-stage relative ${className}`}>
      <div aria-hidden="true" className="speed-trail-wrap">
        {lines.map((l, i) => (
          <span
            key={i}
            className="speed-trail"
            style={{ top: l.top, width: l.width, height: l.height, animationDuration: l.dur, animationDelay: l.delay }}
          />
        ))}
      </div>
      <img src={src} alt="" loading="lazy" className="relative block w-full h-full object-contain mix-blend-screen" />
    </div>
  )
}

