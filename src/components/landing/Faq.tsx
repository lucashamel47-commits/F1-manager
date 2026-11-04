import { useId, useMemo, useState, type ReactNode } from 'react'
import Reveal from './Reveal'

type Cat = 'compte' | 'rappels' | 'live' | 'appli' | 'donnees'

const Ico = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{children}</svg>
)

const CATS: { id: Cat; label: string; icon: ReactNode }[] = [
  { id: 'compte', label: 'Compte', icon: <Ico><circle cx="12" cy="8" r="3.6" /><path d="M5 20c.8-3.6 3.6-5.4 7-5.4s6.2 1.8 7 5.4" /></Ico> },
  { id: 'rappels', label: 'Rappels', icon: <Ico><path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7ZM10 20a2 2 0 0 0 4 0" /></Ico> },
  { id: 'live', label: 'Live & rejeu', icon: <Ico><path d="M3 12h4l2.5-6 4 12 2.5-6H21" /></Ico> },
  { id: 'appli', label: 'iPad & appli', icon: <Ico><rect x="5" y="3" width="14" height="18" rx="3" /><path d="M11 18h2" /></Ico> },
  { id: 'donnees', label: 'Données', icon: <Ico><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></Ico> },
]

interface Item { cat: Cat; q: string; a: string[]; tip?: string }

// Toutes les réponses reprennent ce que fait réellement l'app (voir le code, le README et SETUP.md).
const ITEMS: Item[] = [
  {
    cat: 'compte', q: 'Comment créer un compte ?',
    a: [
      "Clique sur « Créer un compte », entre ton email et un mot de passe de 6 caractères minimum. Si la confirmation par email est activée, tu reçois un lien : clique dessus, puis connecte-toi.",
      "En cas d'oubli, le lien « Mot de passe oublié ? » apparaît sur l'écran de connexion dès que les comptes en ligne sont actifs.",
    ],
  },
  {
    cat: 'compte', q: "C'est gratuit ?",
    a: [
      "Oui : l'app ne propose ni paiement ni abonnement, et elle est hébergée gratuitement (GitHub Pages).",
      "Une seule nuance, qui vient d'OpenF1 et pas de nous : pendant une session en direct, certaines données comme la télémétrie peuvent demander un abonnement OpenF1. Les sessions terminées sont gratuites.",
    ],
  },
  {
    cat: 'compte', q: 'Quelles données sont enregistrées ?',
    a: [
      "Ton email et ton mot de passe sont gérés par Supabase, le service qui s'occupe des comptes. Tes réglages de rappel (sessions, délais, fuseau horaire) sont rattachés à ton compte et visibles par toi seul.",
      "Tes pilotes et ton écurie favoris, ainsi que les données mises en cache, restent dans le navigateur de ton appareil.",
    ],
  },
  {
    cat: 'compte', q: 'Puis-je supprimer mon compte ?',
    a: [
      "Pas encore de bouton dans l'app : la suppression se fait côté administrateur du projet, et elle efface aussi tes réglages de rappel et l'historique des envois.",
      "Pour simplement arrêter les emails, désactive les rappels dans « Rappels & calendrier ».",
    ],
  },
  {
    cat: 'rappels', q: 'Comment activer les rappels par email ?',
    a: [
      "Une fois connecté, ouvre « Rappels & calendrier », active les rappels par email, coche les sessions voulues (Course, Qualifications, Sprint, Essais libres) puis un ou plusieurs délais (15 min, 1 h, 3 h ou 1 jour avant), et enregistre.",
      "C'est toi qui décides : rien n'est envoyé tant que tu n'as pas activé l'option. Les envois sont vérifiés environ toutes les 15 minutes, un léger retard est possible.",
    ],
    tip: "Je ne reçois rien ? Regarde dans tes courriers indésirables (spam), marque le message comme « Pas un spam » et ajoute l'expéditeur à tes contacts : les rappels partent d'une adresse Gmail dédiée à l'app.",
  },
  {
    cat: 'rappels', q: 'Et si je ne veux pas de compte ?',
    a: ["Dans « Rappels & calendrier », tu peux ajouter les sessions choisies à l'app Calendrier de l'iPad (fichier .ics), avec une alerte aux délais de ton choix. Ça marche toujours, sans compte."],
  },
  {
    cat: 'live', q: 'Que montre le Live Timing ?',
    a: ["Pendant les sessions : classement en direct, carte du circuit avec les voitures, pneus et stratégie, chronos par secteur, télémétrie de chaque pilote, direction de course, radios et météo. Hors week-end, tu vois le compte à rebours de la prochaine session."],
  },
  {
    cat: 'live', q: 'Puis-je rejouer une course passée ?',
    a: ["Oui, hors week-end de course : rejoue une course passée à ×1, ×10 ou ×50, avec les positions, les écarts, les pneus et la carte. Les sessions terminées sont gratuites et mises en cache sur ton appareil."],
  },
  {
    cat: 'live', q: 'Que contient le mode Hors Course ?',
    a: ["Les classements pilotes et constructeurs, le calendrier de la saison avec la fiche de chaque circuit, les statistiques et records, et tes favoris."],
  },
  {
    cat: 'appli', q: "Ça marche sur iPad, et peut-on l'installer ?",
    a: [
      "Oui, l'interface est pensée pour le tactile. Pour l'installer : ouvre l'app dans Safari, touche Partager, puis « Sur l'écran d'accueil ».",
      "Elle s'ouvre alors en plein écran comme une vraie application, avec un mode hors ligne (dernières données et images de circuits en cache).",
    ],
  },
  {
    cat: 'donnees', q: "D'où viennent les données ?",
    a: ["D'OpenF1 pour le live timing et les sessions, et de Jolpica-F1 pour les résultats, les classements et le calendrier : deux API ouvertes. F1 Manager est un projet indépendant, non affilié à Formula 1."],
  },
]

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  const [cat, setCat] = useState<Cat | 'all'>('all')
  const [query, setQuery] = useState('')
  const uid = useId()
  const rows = useMemo(() => {
    const q = norm(query.trim())
    return ITEMS.map((it, i) => ({ it, i })).filter(({ it }) => (cat === 'all' || it.cat === cat) && (!q || norm(`${it.q} ${it.a.join(' ')} ${it.tip ?? ''}`).includes(q)))
  }, [cat, query])
  const catOf = (c: Cat) => CATS.find((x) => x.id === c)!

  return (
    <section id="faq" className="mx-auto w-full max-w-[82.5rem] scroll-mt-24 px-6 pt-[120px] sm:pt-[168px] lg:px-10">
      <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <p className="kicker">FAQ</p>
          <h2 className="mt-8 text-[2rem] font-medium leading-[1.1] tracking-[-0.035em] sm:text-[2.625rem]">Questions fréquentes.</h2>
          <p className="mt-5 max-w-xs text-lg leading-snug text-[#636464]">L'essentiel avant de te lancer.</p>

          <div className="group relative mt-10 flex items-center rounded-full border border-[#2b2c2d] bg-[#101112] transition focus-within:border-[#636464]">
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 size-[18px] text-zinc-500 transition group-focus-within:text-white" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
            <label htmlFor={`${uid}-s`} className="sr-only">Rechercher dans la FAQ</label>
            <input id={`${uid}-s`} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une question" className="min-h-12 w-full bg-transparent pl-11 pr-4 text-[15px] outline-none placeholder:text-zinc-500 [&:focus-visible]:outline-none" />
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5" role="group" aria-label="Filtrer par thème">
            {[{ id: 'all' as const, label: 'Tout' }, ...CATS].map((c) => (
              <button key={c.id} onClick={() => setCat(c.id)} aria-pressed={cat === c.id} className={`min-h-9 rounded-full border px-3.5 text-[13px] font-medium transition ${cat === c.id ? 'border-white bg-white text-[#0a0a0a]' : 'border-[#2b2c2d] text-[#c4c5c5] hover:border-[#636464] hover:text-white'}`}>{c.label}</button>
            ))}
          </div>

          <div className="mt-14 hidden rounded-[1.25rem] border border-[#2b2c2d] bg-[#101112] p-8 lg:block">
            <p className="text-base font-medium tracking-tight">Encore une question ?</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[#939494]">Le plus simple, c'est d'essayer : crée ton compte et fais le tour de l'app.</p>
            <a href="#/inscription" className="btn-primary mt-5 inline-flex h-11 items-center justify-center rounded-full px-[22px] text-[15px] active:scale-[0.98]">Créer un compte</a>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <p role="status" className="sr-only">{rows.length} question{rows.length > 1 ? 's' : ''} affichée{rows.length > 1 ? 's' : ''}</p>
          <ul className="border-b border-[#2b2c2d]">
            {rows.map(({ it, i }) => {
              const on = open === i
              const c = catOf(it.cat)
              return (
                <li key={it.q} className="border-t border-[#2b2c2d]">
                  <h3>
                    <button onClick={() => setOpen(on ? null : i)} aria-expanded={on} aria-controls={`${uid}-p${i}`} id={`${uid}-b${i}`} className="flex min-h-[5rem] w-full items-center gap-5 py-5 text-left">
                      <span className={`grid size-9 shrink-0 place-items-center rounded-full border transition duration-200 ${on ? 'border-white bg-white text-[#0a0a0a]' : 'border-[#2b2c2d] text-[#939494]'}`}>{c.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-medium leading-snug tracking-[-0.015em] sm:text-lg">{it.q}</span>
                        <span className="mt-0.5 block text-xs text-[#636464]">{c.label}</span>
                      </span>
                      <span className={`grid size-8 shrink-0 place-items-center rounded-full border transition duration-300 ${on ? 'rotate-45 border-[#636464] text-white' : 'border-[#2b2c2d] text-[#939494]'}`} aria-hidden>
                        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                      </span>
                    </button>
                  </h3>
                  <div id={`${uid}-p${i}`} role="region" aria-labelledby={`${uid}-b${i}`} className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(.22,.61,.36,1)] motion-reduce:transition-none ${on ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <div className="space-y-3 pb-8 pr-6 text-base leading-relaxed text-[#939494] sm:pl-14 sm:pr-14">
                        {it.a.map((p) => <p key={p}>{p}</p>)}
                        {it.tip && (
                          <p className="flex gap-3 rounded-xl border border-[#2b2c2d] bg-[#101112] p-4 text-sm leading-relaxed text-[#c4c5c5]">
                            <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0 text-[#f7f8f8]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" /></svg>
                            <span><strong className="font-medium text-[#f7f8f8]">Astuce.</strong> {it.tip}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
          {rows.length === 0 && (
            <div className="rounded-[1.25rem] border border-dashed border-[#2b2c2d] px-6 py-12 text-center">
              <p className="text-base font-medium">Aucune question ne correspond.</p>
              <p className="mt-1.5 text-sm text-[#636464]">Essaie un autre mot, ou affiche tous les thèmes.</p>
              <button onClick={() => { setQuery(''); setCat('all') }} className="btn-ghost mt-5 h-11 rounded-full px-[22px] text-[15px]">Tout afficher</button>
            </div>
          )}
          <div className="mt-8 rounded-[1.25rem] border border-[#2b2c2d] bg-[#101112] p-6 text-center lg:hidden">
            <p className="text-base font-semibold">Encore une question ?</p>
            <p className="mt-1.5 text-sm text-[#939494]">Le plus simple, c'est d'essayer : crée ton compte.</p>
            <a href="#/inscription" className="btn-primary mt-4 inline-flex h-11 items-center justify-center rounded-full px-[22px] text-[15px]">Créer un compte</a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
