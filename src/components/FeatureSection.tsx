import { useState } from 'react'

function Expandable({ short, full }: { short: string; full: string }) {
  const [open, setOpen] = useState(false)
  return (
    <p className="text-zinc-400 text-sm leading-relaxed">
      {open ? full : short}{' '}
      <button
        onClick={() => setOpen(!open)}
        className="text-zinc-300 text-xs underline underline-offset-4 decoration-white/20 hover:decoration-white/60 py-2 px-1"
      >
        {open ? 'réduire' : 'en savoir plus'}
      </button>
    </p>
  )
}

const icons = {
  suivi: 'M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10z',
  hors: 'M4 5h16v14H4zM4 10h16M9 5v14',
  live: 'M3 12h4l3-8 4 16 3-8h4',
}

function Card({ icon, kicker, title, children }: { icon: string; kicker: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-6 sm:p-7 text-left transition duration-300 hover:-translate-y-0.5 hover:border-white/20">
      <span className="inline-flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-accent-400">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={icon} /></svg>
      </span>
      <p className="mt-6 kicker">{kicker}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight leading-tight">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  )
}

export default function FeatureSection() {
  return (
    <div className="relative z-10 px-4 sm:px-6 pb-24 sm:pb-32 max-w-md md:max-w-5xl mx-auto grid gap-4 md:grid-cols-3">
      <Card icon={icons.suivi} kicker="Suivi" title={<>Tes pilotes.<br />Tes écuries.</>}>
        <Expandable
          short="Choisis qui tu suis. Classements et statistiques."
          full="Choisis tes pilotes et ton écurie préférés. Suis leurs performances, classements, statistiques et évolution tout au long de la saison dans un seul endroit."
        />
      </Card>
      <Card icon={icons.hors} kicker="Hors Course" title={<>Tout le championnat, hors week-end.</>}>
        <Expandable
          short="Classements, calendrier et données hors course."
          full="Classement pilotes et constructeurs, calendrier complet des courses, statistiques détaillées, suivi de tes favoris et toutes les données hors week-end."
        />
      </Card>
      <Card icon={icons.live} kicker="Live Timing" title={<>En course, en temps réel.</>}>
        <Expandable
          short="Positions, pneus et écarts en direct."
          full="Positions en temps réel, composés de pneus, prédictions d’arrêts et de changements de pneus avec l’IA, écarts et stratégie pendant les sessions et les courses."
        />
      </Card>
    </div>
  )
}
