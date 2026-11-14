/* Mouvements discrets façon Novex : fondu de page, nombres qui défilent. Tout est coupé si « réduire les animations » est actif. */
import { useEffect, useRef, useState } from 'react'

export const prefersReduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const ease = (t: number) => 1 - Math.pow(1 - t, 3)

/** Valeur numérique animée vers `target` (ease-out). Saute directement à la valeur si les animations sont réduites. */
export function useTween(target: number, ms = 700): number {
  const [v, setV] = useState(target)
  const from = useRef(target)
  const cur = useRef(target)
  useEffect(() => {
    if (!Number.isFinite(target)) return
    if (prefersReduced() || cur.current === target) { cur.current = target; setV(target); return }
    from.current = cur.current
    const t0 = performance.now()
    let raf = 0
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms)
      cur.current = from.current + (target - from.current) * ease(k)
      setV(cur.current)
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

/** Fondu doux de la page quand `key` change (opacité seule : ne casse ni les barres fixes ni le sticky). */
export function usePageFade(key: unknown) {
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (prefersReduced()) return
    const el = document.getElementById('root')?.firstElementChild as HTMLElement | null
    el?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.22,.61,.36,1)' })
  }, [key])
}
