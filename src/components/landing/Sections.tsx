import { useEffect, useRef, useState, type ReactNode } from 'react'
import { circuits } from '../../data/circuits'
import { drivers } from '../../data/divers'
import Reveal from './Reveal'
import { TEAMS, teamLogo } from '../../data/grid'
import FooterWordmark from './FooterWordmark'
import { LogoFull, LogoGlyph } from '../Logo'

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const TODAY = new Date().toISOString().slice(0, 10)

/* Largeur et gouttières de Novex : conteneur 1240 px, 40 px de chaque côté (24 px sur mobile). */
const WRAP = 'mx-auto w-full max-w-[82.5rem] px-6 lg:px-10'

/** Marque : symbole géométrique + nom. */
export function Brand({ className = '' }: { className?: string }) {
  return (
    <LogoFull size="sm" className={className} />
  )
}

/**
 * Tête de section, structure Novex : une ligne « étiquette (gauche) + pastilles (droite) », puis le titre à gauche
 * (42 px / 500 / -0.035 em) et un paragraphe gris à droite.
 */
function SectionHead({ kicker, chips, title, children }: { kicker: string; chips?: string[]; title: ReactNode; children: ReactNode }) {
  return (
    <Reveal>
      <div className="flex items-center justify-between gap-4">
        <p className="kicker">{kicker}</p>
        {chips && (
          <div className="flex flex-wrap justify-end gap-2">
            {chips.map((c) => <span key={c} className="inline-flex h-8 items-center rounded-full border border-[#2b2c2d] px-3.5 text-[13px] text-[#c4c5c5]">{c}</span>)}
          </div>
        )}
      </div>
      <div className="mt-16 grid gap-6 sm:mt-24 md:grid-cols-[1.45fr_1fr] md:items-start md:gap-24">
        <h2 className="max-w-[44rem] text-[2rem] font-medium leading-[1.1] tracking-[-0.035em] sm:text-[2.625rem]">{title}</h2>
        <p className="max-w-[22rem] text-lg leading-[1.45] tracking-[-0.011em] text-[#636464] md:justify-self-end md:text-xl">{children}</p>
      </div>
    </Reveal>
  )
}

/** Cadre de contenu Novex : grand rectangle arrondi, fond --surface légèrement dégradé, liseré --border. */
function Frame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[1.5rem] border border-[#2b2c2d] bg-gradient-to-b from-[#161718] to-[#0c0d0e] ${className}`}>{children}</div>
  )
}

/* ───────── Pastille de chiffres (équivalent de « Used by 2,000+ traders ») ───────── */
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
  ]
  const dots = ['#27F4D2', '#E8002D', '#3671C6', '#FF8000']
  return (
    <Reveal className={`${WRAP} flex justify-center pt-8`}>
      <div className="inline-flex h-[46px] items-center gap-4 rounded-full border border-[rgb(247_248_248_/_0.1)] bg-[#161718] py-[5px] pl-[5px] pr-[18px] text-base text-[#cbcdcd]">
        <span className="flex h-9 items-center gap-1.5 rounded-full bg-[#0c0d0e] px-3" aria-hidden>
          {dots.map((c) => <i key={c} className="size-2.5 rounded-full" style={{ background: c }} />)}
        </span>
        <span className="font-[450]">
          {items.map((it, i) => <span key={it.l}>{i > 0 && <span className="px-2 text-[#636464]">·</span>}<b className="font-medium text-[#f7f8f8]"><CountUp to={it.n} /></b> {it.l}</span>)}
        </span>
      </div>
    </Reveal>
  )
}

/* ───────── Visuels des cadres ───────── */
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
    <div className="relative mx-auto w-full max-w-md" style={{ height: 5 * 46 }} aria-hidden>
      {base.map((d, i) => {
        const pos = order.indexOf(i)
        return (
          <div key={d.a} className="absolute inset-x-0 flex h-10 items-center gap-3 rounded-[10px] border border-[#2b2c2d] bg-[#141516] px-4 transition-transform duration-700 ease-out" style={{ transform: `translateY(${pos * 46}px)` }}>
            <span className="w-3 text-xs tabular-nums text-[#636464]">{pos + 1}</span>
            <span className="h-4 w-1 rounded-full" style={{ background: d.c }} />
            <span className="text-sm font-medium">{d.a}</span>
            <span className="ml-auto text-xs tabular-nums text-[#939494]">{pos === 0 ? 'Leader' : `+${(pos * 1.4 + 0.6).toFixed(1)}`}</span>
            <span className="grid size-5 place-items-center rounded-full border text-[9px] font-bold" style={{ color: tc[d.t as 'S'], borderColor: tc[d.t as 'S'] }}>{d.t}</span>
          </div>
        )
      })}
    </div>
  )
}

function MiniChart() {
  const a = [10, 24, 30, 46, 52, 71, 78, 100]
  const b = [6, 14, 28, 33, 49, 55, 60, 74]
  const pt = (arr: number[]) => arr.map((v, i) => `${(i / 7) * 220},${88 - v * 0.78}`)
  return (
    <svg viewBox="0 0 220 100" className="w-full" aria-hidden>
      {[20, 45, 70].map((y) => <line key={y} x1="0" x2="220" y1={y} y2={y} stroke="#2b2c2d" />)}
      <polyline className="draw" pathLength="1" points={pt(a).join(' ')} fill="none" stroke="#f7f8f8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline className="draw" style={{ animationDelay: '.25s' }} pathLength="1" points={pt(b).join(' ')} fill="none" stroke="#27F4D2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MiniReminder() {
  return (
    <div className="space-y-2.5" aria-hidden>
      <div className="flex items-center gap-3 rounded-2xl border border-[#2b2c2d] bg-[#141516] p-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f7f8f8] text-[#0a0a0a]">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7ZM10 20a2 2 0 0 0 4 0" /></svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">Qualifications dans 1 h</span>
          <span className="block truncate text-xs text-[#636464]">GP Mexico City · Autódromo Hermanos Rodríguez</span>
        </span>
      </div>
      <div className="flex items-center justify-between rounded-2xl border border-[#2b2c2d] px-4 py-3">
        <span className="text-[13px] text-[#c4c5c5]">Recevoir des rappels par email</span>
        <span className="relative h-6 w-11 rounded-full bg-white"><span className="absolute left-[22px] top-0.5 size-5 rounded-full bg-[#0a0a0a]" /></span>
      </div>
    </div>
  )
}

function MiniFavs() {
  const picks = ['lec', 'ham']
  return (
    <div className="flex flex-wrap items-center justify-center gap-4" aria-hidden>
      {drivers.map((d) => {
        const on = picks.includes(d.id)
        const ini = d.name.split(' ').map((p) => p[0]).join('')
        return (
          <span key={d.id} className="relative">
            <span className="grid size-14 place-items-center rounded-full border text-sm font-medium transition" style={{ borderColor: on ? '#f7f8f8' : '#2b2c2d', background: on ? '#222324' : '#141516' }}>{ini}<i className="absolute bottom-1 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full" style={{ background: d.color }} /></span>
            {on && <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-white text-black"><svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></span>}
          </span>
        )
      })}
      <span className="inline-flex h-9 items-center gap-2 rounded-full border border-[#2b2c2d] bg-[#161718] px-4 text-[13px] text-[#c4c5c5]"><i className="size-2 rounded-full" style={{ background: '#E8002D' }} />Ton écurie : Ferrari</span>
    </div>
  )
}

/* ───────── Fonctionnalités : une section Novex par fonction (étiquette + pastilles, titre | texte, cadre) ───────── */
export function Features() {
  return (
    <div id="fonctionnalites" className="scroll-mt-20">
      <section className={`${WRAP} pt-[88px]`}>
        <SectionHead kicker="Fonctionnalités" chips={['Live timing', 'Rejeu']} title="La course en direct, sans ouvrir dix onglets.">
          Positions, écarts, pneus et carte du circuit. Et le rejeu des courses passées.
        </SectionHead>
        <Reveal className="mt-16 sm:mt-24"><Frame className="px-6 py-14 sm:py-20"><MiniTower /></Frame></Reveal>
      </section>

      <section className={`${WRAP} pt-[88px]`}>
        <SectionHead kicker="Fonctionnalités" chips={['Statistiques', 'Rappels']} title="Les chiffres qui comptent. Les sessions que tu ne rates pas.">
          Points, records et palmarès depuis 1950. Un email avant les sessions que tu choisis.
        </SectionHead>
        <Reveal className="mt-16 grid gap-4 sm:mt-24 md:grid-cols-2">
          <Frame className="flex flex-col justify-between gap-12 p-8 sm:p-12">
            <div><p className="kicker">Statistiques</p><p className="mt-4 max-w-xs text-xl font-medium leading-snug tracking-[-0.02em]">Compare les saisons, pilote par pilote.</p></div>
            <MiniChart />
          </Frame>
          <Frame className="flex flex-col justify-between gap-12 p-8 sm:p-12">
            <div><p className="kicker">Rappels par email</p><p className="mt-4 max-w-xs text-xl font-medium leading-snug tracking-[-0.02em]">Un email avant chaque session choisie.</p></div>
            <MiniReminder />
          </Frame>
        </Reveal>
      </section>

      <section className={`${WRAP} pt-[88px]`}>
        <SectionHead kicker="Fonctionnalités" chips={['Favoris']} title="Tes pilotes. Ton écurie.">
          Tes favoris reviennent en haut de ton accueil.
        </SectionHead>
        <Reveal className="mt-16 sm:mt-24"><Frame className="px-6 py-14 sm:py-20"><MiniFavs /></Frame></Reveal>
      </section>
    </div>
  )
}

/* ───────── Canal+ : rangées de contenu à défilement horizontal ───────── */
// Les 11 écuries 2026, présentées par leur logo officiel et leur couleur.

function RailArrows({ target }: { target: React.RefObject<HTMLDivElement | null> }) {
  const go = (d: number) => target.current?.scrollBy({ left: d * target.current.clientWidth * 0.8, behavior: reduced() ? 'auto' : 'smooth' })
  const b = 'grid size-9 place-items-center rounded-full border border-[#2b2c2d] bg-[#161718] text-[#c4c5c5] hover:bg-[#222324] hover:text-white'
  return (
    <div className="hidden gap-2 sm:flex">
      <button type="button" aria-label="Précédent" onClick={() => go(-1)} className={b}><svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg></button>
      <button type="button" aria-label="Suivant" onClick={() => go(1)} className={b}><svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg></button>
    </div>
  )
}

export function Rails() {
  const cars = useRef<HTMLDivElement>(null)
  const cal = useRef<HTMLDivElement>(null)
  const nextIdx = Math.max(0, circuits.findIndex((c) => c.iso >= TODAY))
  const fmt = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return (
    <section aria-label="Saison" className="space-y-16 pt-[88px] sm:space-y-20">
      <Reveal className={WRAP}>
        <div className="mb-5 flex items-end justify-between"><h2 className="rail-title">Les écuries de la saison</h2><RailArrows target={cars} /></div>
        <div ref={cars} className="rail">
          {TEAMS.map((t) => (
            <figure key={t.id} className="group w-[16rem] sm:w-[20rem]">
              <div
                className="rail-card relative flex aspect-[16/10] items-center justify-center"
                style={{ background: `color-mix(in srgb, ${t.color} 8%, #141516)` }}
              >
                <span aria-hidden className="absolute inset-x-0 top-0 h-0.5" style={{ background: t.color }} />
                <img src={teamLogo(t)} alt="" className="relative size-16 sm:size-[4.5rem] object-contain transition duration-500 ease-out group-hover:scale-105" />
              </div>
              <figcaption className="rail-cap mt-2">{t.name}</figcaption>
            </figure>
          ))}
        </div>
      </Reveal>
      <Reveal className={WRAP}>
        <div className="mb-5 flex items-end justify-between"><h2 className="rail-title">Calendrier {TODAY.slice(0, 4)}</h2><RailArrows target={cal} /></div>
        <div ref={cal} className="rail">
          {circuits.map((c, i) => (
            <div key={c.round} className="w-[11.5rem] sm:w-[13rem]">
              <div className={`rail-card flex aspect-[4/3] flex-col justify-between p-4 ${i === nextIdx ? '!border-[#f7f8f8]' : ''}`}>
                <div className="flex items-center justify-between text-xs text-[#939494]"><span className="tabular-nums">Manche {c.round}</span><span>{fmt(c.iso)}</span></div>
                <div><span className="text-3xl" aria-hidden>{c.flag}</span><p className="rail-title mt-2 !text-[1.25rem]">{c.name}</p></div>
              </div>
              <p className="rail-cap mt-2 truncate">{c.circuit}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}

/* ───────── Appel final + pied de page ───────── */
export function FinalCta() {
  return (
    <section className={`${WRAP} pb-6 pt-[120px] text-center sm:pt-[168px]`}>
      <Reveal>
        <h2 className="mx-auto max-w-3xl text-[2.5rem] font-medium leading-[1.05] tracking-[-0.04em] sm:text-[4rem]">Prêt pour le prochain Grand Prix ?</h2>
        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <a href="#/inscription" className="btn-primary inline-flex h-11 items-center justify-center rounded-full px-[22px] text-[15px] active:scale-[0.98]">Créer un compte</a>
          <a href="#/connexion" className="btn-ghost inline-flex h-11 items-center justify-center rounded-full px-[22px] text-[15px] active:scale-[0.98]">Se connecter</a>
        </div>
      </Reveal>
    </section>
  )
}

export function Footer() {
  const a = 'inline-flex min-h-8 items-center text-[13px] tracking-[-0.01em] text-[#939494] transition hover:text-white'
  const h = 'mb-4 text-[13px] font-medium tracking-[-0.01em] text-[#f7f8f8]'
  return (
    <footer className="relative">
      <div className={WRAP}><FooterWordmark /></div>
      <div className="border-t border-[#2b2c2d]">
        <div className={`${WRAP} pb-7 pt-[72px]`}>
          <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-[6rem_repeat(4,1fr)]">
            <a href="#top" aria-label="F1 Manager, haut de page" className="md:-mt-0.5"><LogoGlyph className="h-6 w-auto text-white" /></a>
            <nav aria-label="Produit"><p className={h}>Produit</p><ul>
              <li><a className={a} href="#apercu">Aperçu</a></li><li><a className={a} href="#fonctionnalites">Fonctionnalités</a></li><li><a className={a} href="#faq">FAQ</a></li>
            </ul></nav>
            <nav aria-label="Modes"><p className={h}>Dans l'app</p><ul>
              <li><span className={a}>Hors Course</span></li><li><span className={a}>Live Timing</span></li><li><span className={a}>Rappels &amp; calendrier</span></li>
            </ul></nav>
            <nav aria-label="Compte"><p className={h}>Compte</p><ul>
              <li><a className={a} href="#/inscription">Créer un compte</a></li><li><a className={a} href="#/connexion">Se connecter</a></li>
            </ul></nav>
            <nav aria-label="Données"><p className={h}>Données</p><ul>
              <li><a className={a} href="https://openf1.org" target="_blank" rel="noopener noreferrer">OpenF1</a></li>
              <li><a className={a} href="https://github.com/jolpica/jolpica-f1" target="_blank" rel="noopener noreferrer">Jolpica-F1</a></li>
            </ul></nav>
          </div>
          <div className="mt-16 flex flex-col gap-2 border-t border-[#2b2c2d] pt-6 text-xs text-[#636464] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 F1 Manager · Projet indépendant, non affilié à Formula 1.</p>
            <p>F1 et les marques associées appartiennent à leurs propriétaires.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
