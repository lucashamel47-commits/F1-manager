/** Halo lumineux qui suit la souris (ou le doigt) sur les cartes « verre ». Purement décoratif. */
export function initSpotlight() {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  let cur: HTMLElement | null = null
  let raf = 0
  const clear = () => {
    if (cur) { cur.style.setProperty('--sa', '0'); cur = null }
  }
  window.addEventListener('pointermove', (e) => {
    const t = e.target
    if (!(t instanceof Element)) return
    const el = t.closest<HTMLElement>('.bg-zinc-950, .glass, .panel')
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      if (el !== cur) clear()
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--sx', `${e.clientX - r.left}px`)
      el.style.setProperty('--sy', `${e.clientY - r.top}px`)
      el.style.setProperty('--sa', '1')
      cur = el
    })
  }, { passive: true })
  document.addEventListener('pointerleave', clear)
  window.addEventListener('blur', clear)
}
