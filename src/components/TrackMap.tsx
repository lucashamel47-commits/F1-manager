import { useRef, useState } from 'react'

/** Plan du circuit : on glisse le doigt (ou la souris) sur le tracé pour lire une vitesse estimée.
 *  `touch-action: pan-y` → le défilement vertical de la page reste possible (plus de blocage). */
export default function TrackMap({ src, alt, unavailable }: { src?: string; alt: string; unavailable?: string }) {
  const [pt, setPt] = useState<{ x: number; y: number; speed: number } | null>(null)
  const down = useRef(false)

  const read = (clientX: number, clientY: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    const y = Math.min(1, Math.max(0, (clientY - r.top) / r.height))
    let speed: number
    if (x > 0.62 && y < 0.45) speed = 251 + Math.sin(x * 40) * 3
    else if (x < 0.35 && y < 0.42) speed = 162 + Math.sin(y * 12) * 10
    else if (x > 0.32 && x < 0.62 && y > 0.38) speed = 175 + Math.cos(x * 9) * 8
    else speed = 198 + Math.sin(x * 6 + y * 4) * 12
    setPt({ x, y, speed: Math.round(speed) })
  }

  if (!src) {
    return (
      <div className="aspect-video grid place-items-center bg-zinc-950 border border-zinc-900 text-center px-6">
        <div>
          <p className="text-sm text-zinc-300">Plan du circuit bientôt disponible</p>
          {unavailable && <p className="text-xs text-zinc-500 mt-1">{unavailable}</p>}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        className="relative overflow-hidden border border-zinc-800 bg-zinc-100 select-none touch-pan-y cursor-crosshair"
        onPointerDown={(e) => { down.current = true; read(e.clientX, e.clientY, e.currentTarget) }}
        onPointerMove={(e) => { if (down.current || e.pointerType === 'mouse') read(e.clientX, e.clientY, e.currentTarget) }}
        onPointerUp={() => { down.current = false; setPt(null) }}
        onPointerCancel={() => { down.current = false; setPt(null) }}
        onPointerLeave={() => { down.current = false; setPt(null) }}
      >
        <img src={src} alt={alt} draggable={false} className="w-full h-auto max-h-[60vh] object-contain p-3 sm:p-5 pointer-events-none" />
        {pt && (
          <>
            <span className="absolute size-4 -ml-2 -mt-2 rounded-full bg-red-600 ring-4 ring-red-600/30 pointer-events-none" style={{ left: `${pt.x * 100}%`, top: `${pt.y * 100}%` }} />
            <div
              className="absolute bg-black text-white rounded-sm px-3 py-1.5 text-center text-xs shadow-xl pointer-events-none whitespace-nowrap"
              style={{ left: `${Math.min(85, Math.max(15, pt.x * 100))}%`, top: pt.y < 0.25 ? `${pt.y * 100 + 8}%` : `${pt.y * 100 - 4}%`, transform: pt.y < 0.25 ? 'translate(-50%, 0)' : 'translate(-50%, -100%)' }}
            >
              <p className="font-semibold text-sm tabular-nums">{pt.speed} km/h</p>
              <p className="text-zinc-400 text-[11px]">Vitesse estimée</p>
            </div>
          </>
        )}
      </div>
      <p className="mt-2 text-xs text-zinc-500">Glissez le doigt sur le tracé pour voir la vitesse estimée.</p>
    </div>
  )
}
