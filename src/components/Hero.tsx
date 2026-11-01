import { useEffect, useState } from 'react'

export default function Hero() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {/* Halo bleu‑violet + grille très discrète : purement décoratif, aucune animation permanente (léger pour l'iPad). */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[760px] overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-[-260px] h-[620px] w-[920px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(99_102_241_/_0.30),rgb(139_92_246_/_0.08)_55%,transparent)] blur-2xl" />
        <div
          className="absolute inset-0 opacity-[0.5] [background-image:linear-gradient(rgb(255_255_255_/_0.045)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255_/_0.045)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_60%_55%_at_50%_0%,#000,transparent)] [-webkit-mask-image:radial-gradient(ellipse_60%_55%_at_50%_0%,#000,transparent)]"
        />
      </div>
      <div className={`relative z-10 flex flex-col items-center text-center pt-20 sm:pt-28 pb-10 sm:pb-12 px-4 sm:px-6 transition-all duration-1000 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-zinc-300 backdrop-blur">
          <span className="size-1.5 rounded-full bg-accent-400 shadow-[0_0_10px_2px_rgb(99_102_241_/_0.8)]" aria-hidden />
          Saison 2026
        </span>
        <h1 className="mt-7 text-gradient-accent text-5xl min-[400px]:text-6xl sm:text-7xl md:text-8xl font-semibold tracking-[-0.045em] leading-[0.95]">
          F1 Manager
        </h1>
        <p className="mt-6 max-w-md text-base sm:text-lg text-zinc-400 leading-relaxed">
          Classements, calendrier, stats et live timing de la Formule 1, réunis au même endroit.
        </p>
      </div>
    </>
  )
}
