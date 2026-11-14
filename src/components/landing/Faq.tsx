import { useId, useState } from 'react'
import Reveal from './Reveal'

// FAQ volontairement discrète (style Novex) : une colonne étroite, des lignes fines, un simple « + ».
// Les réponses reprennent ce que fait réellement l'app.
const ITEMS: { q: string; a: string }[] = [
  { q: "C'est gratuit ?", a: "Oui, entièrement : pas de paiement, pas d'abonnement, pas de pub. Seule la télémétrie pendant une session en direct peut dépendre d'un abonnement OpenF1 ; les sessions terminées sont gratuites." },
  { q: 'Comment créer un compte ?', a: "Touche « Créer un compte », entre ton email et un mot de passe de 6 caractères minimum. En cas d'oubli, le lien « Mot de passe oublié ? » est sur la page de connexion." },
  { q: 'Comment fonctionnent les rappels par email ?', a: "Dans « Rappels & calendrier », choisis les sessions et le délai (15 min à 1 jour avant), puis enregistre. Rien n'est envoyé tant que tu ne l'as pas activé. Pense à vérifier tes spams au premier envoi." },
  { q: 'Puis-je rejouer une course passée ?', a: "Oui : classement, écarts, pneus et carte du circuit, à ×1, ×10 ou ×50. Les sessions terminées sont mises en cache sur ton appareil." },
  { q: "Ça marche sur iPad ?", a: "Oui, l'interface est pensée pour le tactile. Dans Safari, touche Partager puis « Sur l'écran d'accueil » pour l'ouvrir en plein écran comme une app." },
  { q: "D'où viennent les données ?", a: "D'OpenF1 pour le live et de Jolpica-F1 pour les résultats, classements et calendrier. F1 Manager est un projet de fan indépendant, non affilié à Formula 1 ou à la FIA." },
]

export default function Faq() {
  const [open, setOpen] = useState<number | null>(null)
  const uid = useId()
  return (
    <section id="faq" className="mx-auto w-full max-w-[46rem] scroll-mt-24 px-6 pt-[120px] sm:pt-[168px]">
      <Reveal>
        <p className="kicker">FAQ</p>
        <h2 className="mt-5 text-[1.75rem] font-medium leading-[1.15] tracking-[-0.03em] sm:text-[2rem]">Questions fréquentes</h2>
      </Reveal>
      <Reveal delay={80}>
        <ul className="mt-10 border-b border-white/[0.08]">
          {ITEMS.map((it, i) => {
            const on = open === i
            return (
              <li key={it.q} className="border-t border-white/[0.08]">
                <h3>
                  <button
                    onClick={() => setOpen(on ? null : i)}
                    aria-expanded={on}
                    aria-controls={`${uid}-p${i}`}
                    id={`${uid}-b${i}`}
                    className="group flex min-h-14 w-full items-center justify-between gap-6 py-4 text-left text-[15px] font-normal text-[#c4c5c5] transition hover:text-white aria-expanded:text-white"
                  >
                    <span>{it.q}</span>
                    <svg viewBox="0 0 16 16" className={`size-3.5 shrink-0 text-[#636464] transition duration-300 group-hover:text-white ${on ? 'rotate-45 text-white' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden><path d="M8 2v12M2 8h12" /></svg>
                  </button>
                </h3>
                <div id={`${uid}-p${i}`} role="region" aria-labelledby={`${uid}-b${i}`} className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${on ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <p className="max-w-[38rem] pb-5 pr-8 text-sm leading-relaxed text-[#939494]">{it.a}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </Reveal>
    </section>
  )
}
