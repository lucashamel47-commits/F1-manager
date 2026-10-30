import type { CSSProperties } from 'react'

const lines = [
  { top: '38%', width: '34%', height: 1, dur: '2.1s', delay: '0.9s' },
  { top: '44%', width: '52%', height: 2, dur: '1.7s', delay: '0s' },
  { top: '50%', width: '68%', height: 3, dur: '2.3s', delay: '0.5s' },
  { top: '57%', width: '44%', height: 2, dur: '1.9s', delay: '1.1s' },
  { top: '63%', width: '58%', height: 2, dur: '2.6s', delay: '0.2s' },
]

/** Traînée lumineuse animée derrière une monoplace (voiture orientée vers la gauche). */
export default function SpeedTrail({ color }: { color: string }) {
  return (
    <div aria-hidden="true" className="speed-trail-wrap" style={{ '--trail': color } as CSSProperties}>
      <div className="trail-glow" />
      {lines.map((l, i) => (
        <span
          key={i}
          className="speed-trail"
          style={{ top: l.top, width: l.width, height: l.height, animationDuration: l.dur, animationDelay: l.delay }}
        />
      ))}
    </div>
  )
}
