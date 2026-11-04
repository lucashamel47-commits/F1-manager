import { useEffect, useState, type ReactNode } from 'react'

/** Hero calqué sur Novex : titre aligné à gauche (44 px / 560 / -0.035 em), sous-titre gris 16 px, bouton pilule blanc 44 px. Aucun fond décoratif. */
export default function Hero({ ctas }: { ctas: ReactNode }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])
  const reveal = (d: number) => `transition-all duration-700 ease-out motion-reduce:transition-none ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}` + (d ? ` [transition-delay:${d}ms]` : '')

  return (
    <section id="top">
      <div className="mx-auto w-full max-w-[82.5rem] px-6 pb-14 pt-16 sm:pb-16 sm:pt-24 lg:px-10">
        <h1 className={`max-w-[40rem] text-[2.25rem] font-[560] leading-[1.06] tracking-[-0.035em] sm:text-[2.75rem] ${reveal(0)}`}>
          Toute la F1,<br />au même endroit.
        </h1>
        <p className={`mt-5 max-w-xl text-base leading-6 tracking-[-0.011em] text-[#939494] ${reveal(100)}`}>
          Classements, calendrier, statistiques et live timing de la Formule 1, avec des rappels avant chaque session.
        </p>
        <div className={reveal(200)}>{ctas}</div>
      </div>
    </section>
  )
}
