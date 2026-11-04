import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'

const TEXT = 'F1 Manager'
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Grand logo du pied de page, interactif :
 * - un projecteur blanc suit le doigt / le curseur et allume les lettres au passage ;
 * - chaque lettre se soulève selon sa distance au pointeur (effet vague) ;
 * - un clic ou un appui lance le « départ » : 5 feux rouges s'allument un à un, s'éteignent, et les lettres
 *   s'illuminent d'un éclair de gauche à droite.
 * Décoratif (aria-hidden) ; le bouton des feux reste accessible au clavier. Animations réduites : pas de soulèvement ni de vague.
 */
export default function FooterWordmark() {
  const box = useRef<HTMLDivElement>(null)
  const letters = useRef<(HTMLSpanElement | null)[]>([])
  const raf = useRef(0)
  const down = useRef<{ x: number; y: number } | null>(null)
  const [lights, setLights] = useState(0)
  const [go, setGo] = useState(false)
  const busy = useRef(false)
  const timers = useRef<number[]>([])

  // position de chaque lettre (pour que le dégradé de chaque lettre soit calé sur le curseur)
  const measure = useCallback(() => {
    letters.current.forEach((el) => { if (el) el.style.setProperty('--lx', `${el.offsetLeft}px`) })
  }, [])
  useEffect(() => {
    measure()
    const el = box.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure])
  useEffect(() => () => { timers.current.forEach(clearTimeout); cancelAnimationFrame(raf.current) }, [])

  const track = (clientX: number, clientY: number) => {
    const el = box.current
    if (!el) return
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect()
      const x = clientX - r.left, y = clientY - r.top
      el.style.setProperty('--mx', `${x}px`)
      el.style.setProperty('--my', `${y}px`)
      const radius = r.width * 0.13
      letters.current.forEach((l) => {
        if (!l) return
        const cx = l.offsetLeft + l.offsetWidth / 2
        const k = Math.max(0, 1 - Math.abs(x - cx) / radius)
        l.style.setProperty('--k', (k * k * (3 - 2 * k)).toFixed(3))
      })
    })
  }
  const leave = () => {
    const el = box.current
    cancelAnimationFrame(raf.current)
    if (!el) return
    el.style.setProperty('--mx', '-9999px')
    letters.current.forEach((l) => l?.style.setProperty('--k', '0'))
  }
  const onMove = (e: PointerEvent) => track(e.clientX, e.clientY)

  const start = () => {
    if (busy.current) return
    busy.current = true
    const t = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))
    if (reduced()) {
      setLights(5)
      t(() => { setLights(0); busy.current = false }, 900)
      return
    }
    for (let i = 1; i <= 5; i++) t(() => setLights(i), i * 260)
    t(() => { setLights(0); setGo(true) }, 5 * 260 + 700)
    t(() => { setGo(false); busy.current = false }, 5 * 260 + 700 + 1700)
  }
  const onClick = (e: React.MouseEvent) => {
    const d = down.current
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12) return // glissement : pas un clic
    start()
  }

  return (
    <div className="relative select-none pt-16 sm:pt-24">
      <button type="button" onClick={start} aria-label="Lancer le départ : animation des feux" className="mx-auto mb-5 flex min-h-11 items-center justify-center gap-2.5 rounded-full px-4 outline-offset-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <i key={n} aria-hidden className={`size-3 rounded-full transition duration-150 ${lights >= n ? 'bg-[#ff2a1f]' : 'bg-[#2b2c2d]'}`} />
        ))}
      </button>
      <div
        ref={box}
        aria-hidden
        onPointerMove={onMove}
        onPointerDown={(e) => { down.current = { x: e.clientX, y: e.clientY }; track(e.clientX, e.clientY) }}
        onPointerLeave={leave}
        onPointerCancel={leave}
        onClick={onClick}
        data-go={go ? '' : undefined}
        className="wordmark overflow-hidden whitespace-nowrap pb-2 pt-6 text-center text-[clamp(3rem,12.6vw,12rem)] font-semibold leading-[0.8] tracking-[-0.06em] [mask-image:linear-gradient(180deg,#000_45%,transparent_98%)] [-webkit-mask-image:linear-gradient(180deg,#000_45%,transparent_98%)]"
        style={{ '--mx': '-9999px', '--my': '0px' } as CSSProperties}
      >
        {TEXT.split('').map((ch, i) => (
          <span key={i} ref={(el) => { letters.current[i] = el }} className="wm-letter" style={{ '--i': i } as CSSProperties}>{ch === ' ' ? '\u00a0' : ch}</span>
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] tracking-wide text-zinc-600 [@media(hover:hover)]:hidden">Touche et glisse sur les lettres</p>
    </div>
  )
}
