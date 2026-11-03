import { useEffect, useRef, useState, type ReactNode } from 'react'
import { circuits } from '../../data/circuits'
import { drivers } from '../../data/divers'
import Reveal from './Reveal'
import FooterWordmark from './FooterWordmark'

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function SectionHead({ kicker, title, children }: { kicker: string; title: ReactNode; children: ReactNode }) {
  return (
    <Reveal className="mb-20 grid items-end gap-8 sm:mb-28 md:grid-cols-[1.5fr_1fr] md:gap-24">
      <div>
        <p className="kicker">{kicker}</p>
        <h2 className="text-gradient mt-6 text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.045em] sm:text-6xl lg:text-[4.25rem]">{title}</h2>
      </div>
      <p className="max-w-[18rem] text-lg leading-relaxed text-zinc-400 sm:text-xl md:justify-self-end">{children}</p>
    </Reveal>
  )
}

/* ───────── Chiffres réels de l'app ───────── */
function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [v, setV] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced() || typeof IntersectionObserver === 'undefined') { const t = setTimeout(() => setV(to), 0); return () => clearTimeout(t) }
    let raf = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const f = (t: number) => { const k = Math.min(1, (t - t0) / 1200); setV(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(f) }
      raf = requestAnimationFrame(f)
    }, { threshold: 0.6 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [to])
  return <span ref={ref} className="tabular-nums">{v}</span>
}

export function NumbersStrip() {
  const items = [
    { n: circuits.length, l: 'Grands Prix' },
    { n: 22, l: 'pilotes' },
    { n: 11, l: 'écuries' },
    { n: 9, l: 'vues en direct' },
  ]
  return (
    <Reveal className="mx-auto max-w-[77.5rem] px-4 pb-40 pt-12 sm:px-6 sm:pb-56 sm:pt-20">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-16 text-center md:grid-cols-4">
        {items.map((it) => (
          <div key={it.l} className="flex flex-col-reverse items-center gap-4">
            <dt className="text-base text-zinc-500">{it.l}</dt>
            <dd className="text-gradient text-6xl font-semibold tracking-[-0.05em] sm:text-7xl lg:text-8xl"><CountUp to={it.n} /></dd>
          </div>
        ))}
      </dl>
    </Reveal>
  )
}

/* ───────── Mini visuels des cartes ───────── */
function MiniTower() {
  const base = [
    { a: 'ANT', c: '#27F4D2', t: 'M' }, { a: 'LEC', c: '#E8002D', t: 'H' }, { a: 'VER', c: '#3671C6', t: 'M' },
    { a: 'NOR', c: '#FF8000', t: 'S' }, { a: 'HAM', c: '#E8002D', t: 'H' },
  ]
  const [order, setOrder] = useState(() => base.map((_, i) => i))
  useEffect(() => {
    if (reduced()) return
    const id = setInterval(() => setOrder((o) => { const i = 1 + Math.floor(Math.random() * (o.length - 1)); const n = [...o]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n }), 2200)
    return () => clearInterval(id)
  }, [])
  const tc = { S: '#ff5b50', M: '#ffd23f', H: '#e8e9ea' } as const
  return (
    <div className="relative mx-auto w-full max-w-sm" style={{ height: 5 * 44 }} aria-hidden>
      {base.map((d, i) => {
        const pos = order.indexOf(i)
        return (
          <div key={d.a} className="absolute inset-x-0 flex h-10 items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 transition-transform duration-700 ease-out" style={{ transform: `translateY(${pos * 44}px)` }}>
            <span className="w-3 text-xs tabular-nums text-zinc-500">{pos + 1}</span>
            <span className="h-4 w-1 rounded-full" style={{ background: d.c }} />
            <span className="text-sm font-semibold">{d.a}</span>
            <span className="ml-auto text-xs tabular-nums text-zinc-400">{pos === 0 ? 'Leader' : `+${(pos * 1.4 + 0.6).toFixed(1)}`}</span>
            <span className="grid size-5 place-items-center rounded-full border text-[9px] font-bold" style={{ color: tc[d.t as 'S'], borderColor: tc[d.t as 'S'] }}>{d.t}</span>
          </div>
        )
      })}
    </div>
  )
}

function MiniChart() {
  const pts = [10, 24, 30, 46, 52, 71, 78, 100]
  const xy = pts.map((v, i) => `${(i / 7) * 220},${88 - v * 0.78}`)
  return (
    <svg viewBox="0 0 220 100" className="mt-2 w-full" aria-hidden>
      <defs><linearGradient id="mc" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8b9cff" stopOpacity=".35" /><stop offset="1" stopColor="#8b9cff" stopOpacity="0" /></linearGradient></defs>
      {[20, 45, 70].map((y) => <line key={y} x1="0" x2="220" y1={y} y2={y} stroke="rgb(255 255 255 / .06)" />)}
      <path d={`M0 100 L${xy.join(' L')} L220 100Z`} fill="url(#mc)" className="draw-fade" />
      <polyline className="draw" pathLength="1" points={xy.join(' ')} fill="none" stroke="#9aa8ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline className="draw" style={{ animationDelay: '.25s' }} pathLength="1" points={[6, 14, 28, 33, 49, 55, 60, 74].map((v, i) => `${(i / 7) * 220},${88 - v * 0.78}`).join(' ')} fill="none" stroke="#27F4D2" strokeOpacity=".8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MiniReminder() {
  return (
    <div className="space-y-2.5" aria-hidden>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#5b7cff] to-[#7a5cf5] text-white">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7ZM10 20a2 2 0 0 0 4 0" /></svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold">Qualifications dans 1 h</span>
          <span className="block truncate text-xs text-zinc-500">GP Mexico City · Autódromo Hermanos Rodríguez</span>
        </span>
      </div>
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <span className="text-[13px] text-zinc-300">Recevoir des rappels par email</span>
        <span className="relative h-6 w-11 rounded-full bg-accent-500"><span className="absolute left-[22px] top-0.5 size-5 rounded-full bg-white shadow" /></span>
      </div>
    </div>
  )
}

function MiniFavs() {
  const picks = ['lec', 'ham']
  return (
    <div className="flex flex-wrap items-center gap-3" aria-hidden>
      {drivers.map((d) => {
        const on = picks.includes(d.id)
        const ini = d.name.split(' ').map((p) => p[0]).join('')
        return (
          <span key={d.id} className="relative">
            <span className="grid size-14 place-items-center rounded-full text-sm font-semibold transition" style={{ background: `${d.color}${on ? '40' : '22'}`, boxShadow: on ? `0 0 0 2px ${d.color}, 0 0 24px -4px ${d.color}` : `0 0 0 1px ${d.color}55` }}>{ini}</span>
            {on && <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-white text-black"><svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></span>}
          </span>
        )
      })}
      <span className="ml-1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-zinc-300"><i className="size-2 rounded-full" style={{ background: '#E8002D' }} />Ton écurie : Ferrari</span>
    </div>
  )
}

function Card({ kicker, title, text, wide = false, className = '', children }: { kicker: string; title: string; text: string; wide?: boolean; className?: string; children: ReactNode }) {
  return (
    <Reveal className={className}>
      <article className={`group relative h-full overflow-hidden rounded-[2rem] border border-white/[0.06] bg-white/[0.025] p-8 transition duration-500 hover:bg-white/[0.04] sm:p-12 ${wide ? 'lg:grid lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20 lg:p-16' : 'flex flex-col'}`}>
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-[radial-gradient(closest-side,rgb(99_102_241_/_0.2),transparent)] opacity-0 blur-2xl transition duration-700 group-hover:opacity-100" />
        <div>
          <p className="kicker">{kicker}</p>
          <h3 className="mt-5 text-3xl font-semibold leading-[1.1] tracking-[-0.035em] sm:text-4xl">{title}</h3>
          <p className="mt-4 max-w-xs text-base leading-relaxed text-zinc-400 sm:text-lg">{text}</p>
        </div>
        <div className={wide ? 'mt-14 lg:mt-0' : 'mt-14 flex flex-1 items-end'}><div className="w-full">{children}</div></div>
      </article>
    </Reveal>
  )
}

export function Features() {
  return (
    <section id="fonctionnalites" className="mx-auto max-w-[77.5rem] scroll-mt-24 px-4 pb-40 sm:px-6 sm:pb-56">
      <SectionHead kicker="Fonctionnalités" title={<>Tout pour suivre la saison.</>}>
        Résultats, direct et rappels, au même endroit.
      </SectionHead>
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
        <Card wide className="lg:col-span-2" kicker="Live timing" title="La course en direct." text="Positions, écarts, pneus et carte du circuit. Rejeu des courses passées.">
          <MiniTower />
        </Card>
        <Card kicker="Statistiques" title="Les chiffres qui comptent." text="Points, records et palmarès depuis 1950.">
          <MiniChart />
        </Card>
        <Card kicker="Rappels par email" title="Ne rate plus une session." text="Un email avant les sessions que tu choisis.">
          <MiniReminder />
        </Card>
        <Card wide className="lg:col-span-2" kicker="Favoris" title="Tes pilotes. Ton écurie." text="Tes favoris reviennent en haut de ton accueil.">
          <MiniFavs />
        </Card>
      </div>
    </section>
  )
}

/* ───────── Appel final + pied de page ───────── */
export function FinalCta({ onSignup, onLogin }: { onSignup: () => void; onLogin: () => void }) {
  return (
    <section className="relative mx-auto max-w-[77.5rem] px-4 pb-40 sm:px-6 sm:pb-56">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-[2.5rem] border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent px-6 py-28 text-center sm:py-44">
          <div aria-hidden className="absolute left-1/2 top-[-12rem] -z-10 h-[26rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(99_102_241_/_0.38),transparent)] blur-3xl" />
          <div aria-hidden className="noise absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay" />
          <h2 className="text-gradient mx-auto max-w-3xl text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.05em] sm:text-7xl">Prêt pour le prochain Grand Prix ?</h2>
          <p className="mx-auto mt-7 max-w-md text-lg text-zinc-400">Crée ton compte en quelques secondes.</p>
          <div className="mt-14 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <button onClick={onSignup} className="min-h-14 rounded-full bg-white px-9 text-base font-semibold text-black transition hover:bg-zinc-200 active:scale-[0.98]">Créer un compte</button>
            <button onClick={onLogin} className="btn-ghost min-h-14 rounded-full px-9 text-base font-medium text-zinc-100 active:scale-[0.98]">Se connecter</button>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export function Footer() {
  const col = 'space-y-1'
  const a = 'inline-flex min-h-9 items-center text-sm text-zinc-400 transition hover:text-white'
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.05]">
      <div className="mx-auto max-w-[77.5rem] px-4 pt-24 sm:px-6 sm:pt-32">
        <div className="grid gap-14 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <a href="#top" className="inline-flex items-center gap-2.5"><span className="rounded-md bg-gradient-to-br from-[#5b7cff] to-[#7a5cf5] px-2 py-1 text-sm font-bold leading-none tracking-tight text-white">F1</span><span className="text-[15px] font-semibold tracking-tight">Manager</span></a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">Classements, calendrier, statistiques et live timing de la Formule 1.</p>
          </div>
          <nav aria-label="Produit"><p className="kicker mb-3">Produit</p><ul className={col}>
            <li><a className={a} href="#apercu">Aperçu</a></li><li><a className={a} href="#fonctionnalites">Fonctionnalités</a></li><li><a className={a} href="#faq">FAQ</a></li>
          </ul></nav>
          <nav aria-label="Modes"><p className="kicker mb-3">Dans l'app</p><ul className={col}>
            <li><span className={a}>Hors Course</span></li><li><span className={a}>Live Timing</span></li><li><span className={a}>Rappels &amp; calendrier</span></li>
          </ul></nav>
          <nav aria-label="Données"><p className="kicker mb-3">Données</p><ul className={col}>
            <li><a className={a} href="https://openf1.org" target="_blank" rel="noopener noreferrer">OpenF1</a></li>
            <li><a className={a} href="https://github.com/jolpica/jolpica-f1" target="_blank" rel="noopener noreferrer">Jolpica-F1</a></li>
          </ul></nav>
        </div>
        <FooterWordmark />
        <div className="flex flex-col gap-2 border-t border-white/[0.05] py-8 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 F1 Manager · Projet indépendant, non affilié à Formula 1.</p>
          <p>F1 et les marques associées appartiennent à leurs propriétaires.</p>
        </div>
      </div>
    </footer>
  )
}
