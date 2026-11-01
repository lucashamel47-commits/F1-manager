import { useEffect, useState, type ReactNode } from 'react'
import { circuits } from '../data/circuits'

const LOADED_AT = Date.now()
const DAY = 864e5

function nextRace() {
  return circuits.find((c) => Date.parse(c.iso) + DAY >= LOADED_AT) ?? circuits[circuits.length - 1]
}

function HeroCards() {
  const c = nextRace()
  const diff = Math.ceil((Date.parse(c.iso) - LOADED_AT) / DAY)
  const when = diff > 1 ? `Dans ${diff} jours` : diff === 1 ? 'Demain' : "Aujourd'hui"
  const date = new Date(c.iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  const top = [
    { a: 'ANT', n: 'Kimi Antonelli', p: 365, c: '#27F4D2', w: 100 },
    { a: 'RUS', n: 'George Russell', p: 242, c: '#27F4D2', w: 66 },
    { a: 'HAM', n: 'Lewis Hamilton', p: 241, c: '#E8002D', w: 65 },
  ]
  return (
    <div className="relative hidden h-[27rem] lg:block" aria-hidden>
      <div className="animate-float absolute right-0 top-0 w-[19rem] rotate-[2deg] rounded-3xl border border-white/[0.12] bg-white/[0.04] p-5 shadow-[0_30px_80px_-30px_rgb(0_0_0_/_0.9)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <p className="kicker">Prochain GP</p>
          <span className="rounded-full bg-accent-500/20 px-2.5 py-0.5 text-[10px] font-medium text-accent-300">{when}</span>
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight">{c.flag} {c.name}</p>
        <p className="text-xs text-zinc-500">{c.circuit} · {date}</p>
        <svg viewBox="0 0 200 90" className="mt-4 w-full">
          <path d="M26 66 C14 42 44 20 78 25 S126 58 148 38 S184 16 174 50 S118 80 82 76 S36 84 26 66Z" fill="none" stroke="rgb(255 255 255 / .1)" strokeWidth="8" strokeLinecap="round" />
          <path className="preview-trace" pathLength="1" d="M26 66 C14 42 44 20 78 25 S126 58 148 38 S184 16 174 50 S118 80 82 76 S36 84 26 66Z" fill="none" stroke="url(#hc)" strokeWidth="2.6" strokeLinecap="round" />
          <defs><linearGradient id="hc" x1="0" x2="1"><stop offset="0" stopColor="#7d9bff" /><stop offset="1" stopColor="#b08cff" /></linearGradient></defs>
        </svg>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-white/[0.05] py-2"><p className="text-sm font-semibold tabular-nums">{c.laps ?? '—'}</p><p className="text-[10px] text-zinc-500">Tours</p></div>
          <div className="rounded-xl bg-white/[0.05] py-2"><p className="text-sm font-semibold tabular-nums">{c.length}</p><p className="text-[10px] text-zinc-500">Longueur</p></div>
        </div>
      </div>
      <div className="animate-float-slow absolute bottom-0 left-2 w-[18rem] -rotate-[2.5deg] rounded-3xl border border-white/[0.12] bg-[#101114]/80 p-5 shadow-[0_30px_80px_-30px_rgb(0_0_0_/_0.9)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <p className="kicker">Championnat</p>
          <span className="flex items-center gap-1.5 text-[10px] text-zinc-500"><i className="size-1.5 rounded-full bg-red-500 animate-pulse" />Exemple</span>
        </div>
        <ul className="mt-3 space-y-3">
          {top.map((t, i) => (
            <li key={t.a} className="flex items-center gap-3">
              <span className="w-3 text-xs tabular-nums text-zinc-500">{i + 1}</span>
              <span className="h-5 w-1 rounded-full" style={{ background: t.c }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{t.n}</span>
                <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/[0.07]"><span className="block h-full rounded-full" style={{ width: `${t.w}%`, background: `linear-gradient(90deg, ${t.c}55, ${t.c})` }} /></span>
              </span>
              <span className="w-9 text-right text-[13px] font-semibold tabular-nums">{t.p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Hero : fond animé (aurore + grille + grain), titre en dégradé, à gauche le texte et l'appel à l'action, à droite des cartes flottantes ou le formulaire. */
export default function Hero({ ctas, form }: { ctas: ReactNode; form: ReactNode }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])
  const reveal = (d: number) => `transition-all duration-[900ms] ease-out motion-reduce:transition-none ${visible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-5 blur-sm'}` + (d ? ` [transition-delay:${d}ms]` : '')

  return (
    <section id="top" className="relative isolate">
      {/* fond décoratif : aurore douce, grille masquée, grain. Rien d'animé sauf deux halos en transform (léger). */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[-4rem] -z-10 h-[52rem] overflow-hidden">
        <div className="animate-aurora absolute left-[12%] top-[-12rem] h-[34rem] w-[44rem] rounded-full bg-[radial-gradient(closest-side,rgb(91_107_242_/_0.42),transparent)] blur-3xl" />
        <div className="animate-aurora-b absolute right-[6%] top-[-8rem] h-[30rem] w-[38rem] rounded-full bg-[radial-gradient(closest-side,rgb(139_92_246_/_0.30),transparent)] blur-3xl" />
        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgb(255_255_255_/_0.045)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255_/_0.045)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000,transparent)] [-webkit-mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000,transparent)]" />
        <div className="noise absolute inset-0 opacity-[0.07] mix-blend-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#08090a]" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.2fr_0.8fr] lg:pb-16 lg:pt-20">
        <div className="text-center lg:text-left">
          <span className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-2 pr-4 text-xs text-zinc-300 backdrop-blur ${reveal(0)}`}>
            <span className="rounded-full bg-accent-500/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-300">Live</span>
            Rejeu des courses en live timing
          </span>
          <h1 className={`mt-7 text-[2.9rem] font-semibold leading-[0.98] tracking-[-0.045em] min-[420px]:text-6xl sm:text-7xl lg:text-[4.5rem] xl:text-[5rem] ${reveal(100)}`}>
            <span className="text-gradient">Toute la F1,</span>
            <br />
            <span className="text-gradient-accent">au même endroit.</span>
          </h1>
          <p className={`mx-auto mt-6 max-w-lg text-base leading-relaxed text-zinc-400 sm:text-lg lg:mx-0 ${reveal(220)}`}>
            Classements, calendrier, statistiques et live timing de la Formule 1. Choisis tes pilotes, suis ta saison, reçois un rappel avant chaque session.
          </p>
          <div className={reveal(340)}>{ctas}</div>
        </div>
        <div className={reveal(300)}>{form ?? <HeroCards />}</div>
      </div>
    </section>
  )
}
