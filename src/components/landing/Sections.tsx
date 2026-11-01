import { useEffect, useRef, useState, type ReactNode } from 'react'
import { circuits } from '../../data/circuits'
import { drivers } from '../../data/divers'
import Reveal from './Reveal'

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function SectionHead({ kicker, title, children }: { kicker: string; title: ReactNode; children: ReactNode }) {
  return (
    <Reveal className="mb-12 grid items-end gap-6 md:grid-cols-[1.3fr_1fr] md:gap-16">
      <div>
        <p className="kicker">{kicker}</p>
        <h2 className="text-gradient mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">{title}</h2>
      </div>
      <p className="max-w-sm text-base leading-relaxed text-zinc-400 md:justify-self-end">{children}</p>
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
    { n: circuits.length, l: 'Grands Prix au calendrier' },
    { n: 22, l: 'pilotes sur la grille' },
    { n: 11, l: 'écuries' },
    { n: 9, l: 'vues en live timing' },
  ]
  return (
    <Reveal className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 sm:pb-32">
      <dl className="grid grid-cols-2 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] md:grid-cols-4">
        {items.map((it, i) => (
          <div key={it.l} className={`px-6 py-8 text-center sm:py-10 ${i % 2 === 1 ? 'border-l border-white/10' : ''} ${i > 1 ? 'border-t border-white/10 md:border-t-0' : ''} ${i > 0 ? 'md:border-l md:border-white/10' : ''}`}>
            <dt className="order-2 mt-2 text-sm text-zinc-500">{it.l}</dt>
            <dd className="text-gradient text-5xl font-semibold tracking-[-0.04em] sm:text-6xl"><CountUp to={it.n} /></dd>
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

function Card({ id, kicker, title, text, className = '', children }: { id?: string; kicker: string; title: string; text: string; className?: string; children: ReactNode }) {
  return (
    <Reveal className={className}>
      <article id={id} className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-6 transition duration-300 hover:-translate-y-0.5 hover:border-white/25 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-[radial-gradient(closest-side,rgb(99_102_241_/_0.22),transparent)] opacity-0 blur-2xl transition duration-500 group-hover:opacity-100" />
        <p className="kicker">{kicker}</p>
        <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-tight">{title}</h3>
        <p className="mt-2.5 max-w-md text-sm leading-relaxed text-zinc-400">{text}</p>
        <div className="mt-8 flex flex-1 items-end">{<div className="w-full">{children}</div>}</div>
      </article>
    </Reveal>
  )
}

export function Features() {
  return (
    <section id="fonctionnalites" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-24 sm:px-6 sm:pb-32">
      <SectionHead kicker="Fonctionnalités" title={<>Tout ce qu'il te faut pour suivre la saison.</>}>
        Un seul endroit pour les résultats, le direct et les rappels, pensé pour l'iPad comme pour l'ordinateur.
      </SectionHead>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" kicker="Live timing" title="La course en direct, tour par tour." text="Positions, écarts, pneus, secteurs et carte du circuit. Rejoue aussi n'importe quelle session passée à ×1, ×10 ou ×50.">
          <MiniTower />
        </Card>
        <Card kicker="Statistiques" title="Les chiffres qui comptent." text="Évolution des points, records et palmarès des champions depuis 1950.">
          <MiniChart />
        </Card>
        <Card kicker="Rappels par email" title="Ne rate plus une session." text="Active les rappels (c'est toi qui choisis) et reçois un email avant les sessions qui t'intéressent.">
          <MiniReminder />
        </Card>
        <Card className="lg:col-span-2" kicker="Favoris" title="Tes pilotes. Ton écurie." text="Choisis une fois tes favoris : ils reviennent en haut de ton accueil, avec leurs classements et leurs résultats.">
          <MiniFavs />
        </Card>
      </div>
    </section>
  )
}

/* ───────── FAQ ───────── */
const FAQ: { q: string; a: string }[] = [
  { q: 'Comment créer un compte ?', a: "Clique sur « Créer un compte », entre ton email et un mot de passe (6 caractères minimum). Selon la configuration, un lien de confirmation peut t'être envoyé par email." },
  { q: 'Que contient le mode Hors Course ?', a: "Les classements pilotes et constructeurs, le calendrier complet de la saison avec la fiche de chaque circuit, les statistiques et records, et tes favoris." },
  { q: 'Puis-je rejouer une course passée ?', a: "Oui. Dans le mode Live Timing, hors week-end de course, rejoue une course passée à ×1, ×10 ou ×50, avec les positions, les écarts, les pneus et la carte." },
  { q: 'Comment fonctionnent les rappels par email ?', a: "C'est une option que tu actives toi-même dans « Rappels & calendrier ». Tu choisis les sessions et le délai, puis tu reçois un email avant chacune d'elles." },
  { q: 'Ça marche sur iPad ?', a: "Oui, l'interface est pensée pour le tactile (grandes zones d'appui) et l'app peut s'installer sur l'écran d'accueil pour s'ouvrir comme une vraie application." },
  { q: "D'où viennent les données ?", a: "Des API ouvertes OpenF1 (live timing) et Jolpica-F1 (résultats et classements). F1 Manager est un projet indépendant, non affilié à Formula 1." },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-24 sm:px-6 sm:pb-32">
      <div className="grid gap-10 md:grid-cols-[1fr_1.4fr] md:gap-16">
        <Reveal>
          <p className="kicker">FAQ</p>
          <h2 className="text-gradient mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">Questions fréquentes.</h2>
          <p className="mt-5 max-w-xs text-base leading-relaxed text-zinc-400">Tout ce qu'il faut savoir avant de te lancer.</p>
        </Reveal>
        <Reveal delay={100}>
          <ul className="divide-y divide-white/[0.08] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
            {FAQ.map((f, i) => (
              <li key={f.q}>
                <h3>
                  <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} aria-controls={`faq-${i}`} className="flex min-h-16 w-full items-center justify-between gap-4 px-6 py-4 text-left text-[15px] font-medium transition hover:bg-white/[0.03]">
                    {f.q}
                    <span className={`grid size-7 shrink-0 place-items-center rounded-full border border-white/15 text-zinc-300 transition-transform duration-300 ${open === i ? 'rotate-45' : ''}`} aria-hidden>
                      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    </span>
                  </button>
                </h3>
                <div id={`faq-${i}`} role="region" className={`grid transition-[grid-template-rows] duration-300 ease-out ${open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden"><p className="px-6 pb-5 text-sm leading-relaxed text-zinc-400">{f.a}</p></div>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

/* ───────── Appel final + pied de page ───────── */
export function FinalCta({ onSignup, onLogin }: { onSignup: () => void; onLogin: () => void }) {
  return (
    <section className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 sm:pb-32">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-[2.25rem] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] px-6 py-16 text-center sm:py-24">
          <div aria-hidden className="absolute left-1/2 top-[-12rem] -z-10 h-[26rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(99_102_241_/_0.38),transparent)] blur-3xl" />
          <div aria-hidden className="noise absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay" />
          <h2 className="text-gradient mx-auto max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl">Prêt pour le prochain Grand Prix ?</h2>
          <p className="mx-auto mt-5 max-w-md text-base text-zinc-400">Crée ton compte en quelques secondes et choisis tes favoris.</p>
          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
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
    <footer className="relative overflow-hidden border-t border-white/[0.07]">
      <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <a href="#top" className="inline-flex items-center gap-2.5"><span className="rounded-md bg-white px-2 py-1 text-sm font-bold leading-none tracking-tight text-black">F1</span><span className="text-[15px] font-semibold tracking-tight">Manager</span></a>
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
        <div aria-hidden className="select-none overflow-hidden whitespace-nowrap pt-10 text-center text-[clamp(3rem,12.6vw,12rem)] font-semibold leading-[0.8] tracking-[-0.06em] text-white/[0.06] [mask-image:linear-gradient(180deg,#000_30%,transparent_95%)] [-webkit-mask-image:linear-gradient(180deg,#000_30%,transparent_95%)]">F1 Manager</div>
        <div className="flex flex-col gap-2 border-t border-white/[0.07] py-6 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 F1 Manager · Projet indépendant, non affilié à Formula 1.</p>
          <p>F1 et les marques associées appartiennent à leurs propriétaires.</p>
        </div>
      </div>
    </footer>
  )
}
