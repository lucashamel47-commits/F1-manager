import { useState } from 'react'

function Expandable({ short, full }: { short: string; full: string }) {
  const [open, setOpen] = useState(false)
  return (
    <p className="text-zinc-500 text-sm leading-relaxed">
      {open ? full : short}{' '}
      <button
  onClick={() => setOpen(!open)}
  className="text-zinc-500 text-xs underline-offset-2 hover:underline py-2 px-1"
>
        {open ? 'réduire' : 'en savoir plus'}
      </button>
    </p>
  )
}

export default function FeatureSection() {
  return (
    <div className="relative z-10 px-4 sm:px-6 pb-24 sm:pb-32 space-y-16 sm:space-y-24 max-w-md md:max-w-5xl mx-auto md:space-y-0 md:grid md:grid-cols-3 md:gap-10 lg:gap-16">
      <div className="text-center">
        <p className="text-red-600 text-[11px] tracking-[0.5em] uppercase mb-4">Suivi</p>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Tes pilotes.<br />Tes écuries.</h2>
        <Expandable
          short="Choisis qui tu suis. Classements et statistiques."
          full="Choisis tes pilotes et ton écurie préférés. Suis leurs performances, classements, statistiques et évolution tout au long de la saison dans un seul endroit."
        />
      </div>

      <div className="text-center">
        <p className="text-red-600 text-[11px] tracking-[0.5em] uppercase mb-4">Hors Course</p>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Tout le championnat,<br />hors week-end.</h2>
        <Expandable
          short="Classements, calendrier et données hors course."
          full="Classement pilotes et constructeurs, calendrier complet des courses, statistiques détaillées, suivi de tes favoris et toutes les données hors week-end."
        />
      </div>

      <div className="text-center">
        <p className="text-red-600 text-[11px] tracking-[0.5em] uppercase mb-4">Live Timing</p>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">En course,<br />en temps réel.</h2>
        <Expandable
  short="Positions, pneus et écarts en direct."
  full="Positions en temps réel, composés de pneus, prédictions d’arrêts et de changements de pneus avec l’IA, écarts et stratégie pendant les sessions et les courses."
/>
      </div>
    </div>
  )
}