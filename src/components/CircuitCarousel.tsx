import { useCallback, useEffect, useRef, useState } from 'react'
import { circuits, daysUntil, fmtDay, type Circuit } from '../data/circuits'
import type { RaceWinner } from '../lib/f1api'

interface Props {
  nextRound: number
  winners: Record<number, RaceWinner>
  winnersState: 'loading' | 'ok' | 'error'
  onOpen: (c: Circuit) => void
}

const Chevron = ({ dir }: { dir: 'l' | 'r' }) => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={dir === 'l' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
  </svg>
)

function status(c: Circuit, nextRound: number) {
  if (c.round === nextRound) {
    const d = daysUntil(c.iso)
    return { kind: 'next' as const, label: d <= 0 ? 'Ce week-end' : d === 1 ? 'Demain' : `Dans ${d} jours` }
  }
  return { kind: c.round < nextRound ? ('done' as const) : ('later' as const), label: '' }
}

export default function CircuitCarousel({ nextRound, winners, winnersState, onOpen }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [edge, setEdge] = useState({ start: true, end: false })
  const nextIdx = Math.max(0, circuits.findIndex((c) => c.round === nextRound))

  const cardAt = (i: number) => ref.current?.children[i] as HTMLElement | undefined

  const goTo = useCallback((i: number, smooth = true) => {
    const el = ref.current
    const card = cardAt(Math.max(0, Math.min(circuits.length - 1, i)))
    if (el && card) el.scrollTo({ left: card.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft || '0'), behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  // Au chargement : on place le prochain GP au début de la rangée (sans bouger la page).
  useEffect(() => { goTo(nextIdx, false) }, [goTo, nextIdx])

  const onScroll = useCallback(() => {
    const el = ref.current
    if (!el) return
    const pl = parseFloat(getComputedStyle(el).paddingLeft || '0')
    let best = 0
    let bd = Infinity
    for (let i = 0; i < el.children.length; i++) {
      const d = Math.abs((el.children[i] as HTMLElement).offsetLeft - pl - el.scrollLeft)
      if (d < bd) { bd = d; best = i }
    }
    setActive(best)
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 })
  }, [])

  // Les largeurs changent (images, rotation de l'iPad) : on recalcule l'état des flèches.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(onScroll)
    ro.observe(el)
    Array.from(el.children).forEach((c) => ro.observe(c))
    onScroll()
    return () => ro.disconnect()
  }, [onScroll])

  const page = (dir: 1 | -1) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  return (
    <section aria-labelledby="circuits-title" className="col-span-full min-w-0">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div className="min-w-0">
          <p className="text-red-600 text-[11px] tracking-[0.35em] sm:tracking-[0.5em] uppercase">Calendrier</p>
          <h2 id="circuits-title" className="mt-1 text-xl sm:text-2xl font-black uppercase tracking-tight">Les circuits</h2>
          <p className="mt-1 text-sm text-zinc-400">Faites défiler les {circuits.length} Grands Prix. Touchez un circuit pour ouvrir sa fiche.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {active !== nextIdx && (
            <button onClick={() => goTo(nextIdx)} className="min-h-11 px-3 text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-400 active:text-white">
              Prochain GP
            </button>
          )}
          <div className="hidden md:flex gap-2">
            {(['l', 'r'] as const).map((d) => (
              <button
                key={d}
                onClick={() => page(d === 'l' ? -1 : 1)}
                disabled={d === 'l' ? edge.start : edge.end}
                aria-label={d === 'l' ? 'Circuits précédents' : 'Circuits suivants'}
                className="size-11 grid place-items-center border border-zinc-700 text-white hover:border-red-600 hover:bg-zinc-900 active:bg-zinc-800 disabled:opacity-30 disabled:hover:border-zinc-700 disabled:hover:bg-transparent transition"
              >
                <Chevron dir={d} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={ref}
        onScroll={onScroll}
        role="region"
        aria-label="Circuits de la saison"
        className="relative -mx-4 sm:-mx-5 lg:-mx-6 px-4 sm:px-5 lg:px-6 scroll-pl-4 sm:scroll-pl-5 lg:scroll-pl-6 flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory overscroll-x-contain pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {circuits.map((c) => {
          const st = status(c, nextRound)
          const w = winners[c.round]
          return (
            <button
              key={c.round}
              onClick={() => onOpen(c)}
              aria-label={`${c.name}, manche ${c.round}, ouvrir la fiche`}
              className={`group snap-start shrink-0 w-[82%] sm:w-[46%] lg:w-[31.5%] xl:w-[23.5%] text-left bg-zinc-950 border transition active:scale-[0.99] ${
                st.kind === 'next' ? 'border-red-600' : 'border-zinc-800 hover:border-zinc-500'
              }`}
            >
              <div className="relative aspect-video bg-zinc-100 overflow-hidden">
                {c.map ? (
                  <img src={c.map} alt="" loading="lazy" draggable={false} className="absolute inset-0 w-full h-full object-contain p-3 group-hover:scale-105 transition duration-500" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-xs text-zinc-500 px-4 text-center">Plan bientôt disponible</div>
                )}
                <span className="absolute top-2.5 left-2.5 bg-black text-white text-[11px] font-bold uppercase tracking-widest px-2 py-1">R{c.round}</span>
                {st.kind === 'next' && <span className="absolute top-2.5 right-2.5 bg-red-600 text-white text-[11px] font-bold uppercase tracking-widest px-2 py-1">Prochain GP</span>}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="min-w-0 truncate text-lg font-black uppercase tracking-tight"><span className="mr-2" aria-hidden>{c.flag}</span>{c.name}</h3>
                  <span className="text-zinc-500 group-hover:text-white transition shrink-0"><Chevron dir="r" /></span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-400 truncate">{c.circuit} · {c.country} · {fmtDay(c.iso)}</p>
                <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-zinc-900 pt-3 text-xs">
                  <div><dt className="text-zinc-500">Tours</dt><dd className="mt-0.5 font-semibold tabular-nums">{c.laps ?? '—'}</dd></div>
                  <div><dt className="text-zinc-500">Longueur</dt><dd className="mt-0.5 font-semibold tabular-nums whitespace-nowrap">{c.length.replace(' km', '')} km</dd></div>
                  <div><dt className="text-zinc-500">Record</dt><dd className="mt-0.5 font-semibold tabular-nums">{c.record ?? '—'}</dd></div>
                </dl>
                <p className={`mt-3 text-xs truncate ${st.kind === 'next' ? 'text-red-500 font-semibold' : 'text-zinc-400'}`}>
                  {st.kind === 'next' && st.label}
                  {st.kind === 'later' && 'À venir'}
                  {st.kind === 'done' && (w ? <>Vainqueur : <span className="text-white font-semibold">{w.name}</span></> : winnersState === 'loading' ? 'Résultat en chargement…' : 'Course terminée')}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-0.5 pt-1" role="group" aria-label="Position dans la saison">
        {circuits.map((c, i) => (
          <button key={c.round} onClick={() => goTo(i)} aria-label={`Aller à ${c.name}`} aria-current={active === i} className="h-6 w-3.5 grid place-items-center">
            <span className={`block rounded-full transition-all ${active === i ? 'h-1.5 w-4 bg-red-600' : c.round === nextRound ? 'size-1.5 bg-red-600/60' : 'size-1.5 bg-zinc-700'}`} />
          </button>
        ))}
      </div>
    </section>
  )
}
