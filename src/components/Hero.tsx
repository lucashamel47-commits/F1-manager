import { useEffect, useState, type ReactNode } from 'react'

/** Hero : fond animé (aurore + grille + grain), titre en dégradé, centré ; quand le formulaire est ouvert, texte à gauche et formulaire à droite. */
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

      <div className={`mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:pb-24 lg:pt-28 ${form ? 'grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]' : ''}`}>
        <div className={form ? 'text-center lg:text-left' : 'text-center'}>
          <h1 className={`text-[2.9rem] font-semibold leading-[1] tracking-[-0.045em] min-[420px]:text-6xl sm:text-7xl ${form ? 'lg:text-[4.5rem]' : 'lg:text-[5.5rem]'} ${reveal(100)}`}>
            <span className="text-gradient">Toute la F1,</span>
            <br />
            <span className="text-gradient-accent">au même endroit.</span>
          </h1>
          <p className={`mt-7 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg ${form ? 'mx-auto lg:mx-0' : 'mx-auto'} ${reveal(220)}`}>
            Classements, calendrier, statistiques et live timing de la Formule 1.
          </p>
          <div className={reveal(340)}>{ctas}</div>
        </div>
        {form && <div className={reveal(0)}>{form}</div>}
      </div>
    </section>
  )
}
