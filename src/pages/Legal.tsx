import type { ReactNode } from 'react'
import { Brand } from '../components/landing/Sections'

const CONTACT = 'f1.managerrappel@gmail.com'

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-[#1d1e1f] py-10 sm:grid sm:grid-cols-[14rem_1fr] sm:gap-10 sm:py-12">
      <h2 className="text-[15px] font-medium tracking-[-0.01em] text-white">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-[#939494] sm:mt-0 [&_strong]:font-medium [&_strong]:text-[#d6d7d7] [&_a]:text-white [&_a]:underline [&_a]:decoration-white/30 [&_a]:underline-offset-4 hover:[&_a]:decoration-white">{children}</div>
    </section>
  )
}

/** Mentions légales et confidentialité : courte, lisible, accessible connecté ou non (#/mentions). */
export default function Legal() {
  const back = () => (history.length > 1 ? history.back() : window.location.assign('#/'))
  return (
    <div className="min-h-dvh text-white">
      <header className="sticky top-0 z-30 border-b border-[#1d1e1f] bg-[#08090a]">
        <div className="mx-auto flex h-16 w-full max-w-[56rem] items-center px-6">
          <a href="#/" aria-label="Accueil"><Brand /></a>
          <button onClick={back} className="ml-auto inline-flex h-9 items-center rounded-full border border-[#2b2c2d] px-4 text-[13px] font-medium text-[#c4c5c5] transition-colors hover:bg-[#161718] hover:text-white">Retour</button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[56rem] px-6 pb-28 pt-14 sm:pt-20">
        <h1 className="app-in text-[2.25rem] font-[560] leading-[1.06] tracking-[-0.035em] sm:text-[3rem]">Mentions légales<br className="sm:hidden" /> &amp; confidentialité</h1>
        <p className="app-in app-in-2 mt-6 max-w-xl text-[15px] text-[#939494]">F1 Manager est une app gratuite et non officielle, faite par un fan.</p>

        <div className="app-in app-in-3 mt-14">
          <Block id="non-officiel" title="Application non officielle">
            <p>F1 Manager <strong>n’est pas affiliée</strong> à Formula 1, à Formula One Management (FOM), à Formula One Licensing B.V., à la FIA ni à aucune écurie.</p>
            <p>F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX et les marques associées appartiennent à Formula One Licensing B.V. Les noms, logos, photos et couleurs des écuries et des pilotes appartiennent à leurs propriétaires respectifs et ne sont utilisés qu’à titre d’information.</p>
          </Block>

          <Block id="editeur" title="Éditeur et hébergement">
            <p><strong>Éditeur :</strong> projet personnel, non commercial, édité par un particulier. Contact : <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
            <p><strong>Hébergement du site :</strong> GitHub Pages, GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis.</p>
            <p><strong>Comptes et réglages :</strong> Supabase, Inc. (base de données et connexion).</p>
          </Block>

          <Block id="sources" title="Sources des données">
            <p><strong>Jolpica-F1</strong> (<a href="https://github.com/jolpica/jolpica-f1" target="_blank" rel="noopener noreferrer">jolpica-f1</a>) : calendrier, résultats, classements.</p>
            <p><strong>OpenF1</strong> (<a href="https://openf1.org" target="_blank" rel="noopener noreferrer">openf1.org</a>) : tours, secteurs, positions et rejeux des sessions passées.</p>
            <p><strong>F1 Live Timing</strong> : flux public de chronométrage pendant les sessions, lu directement par ton navigateur.</p>
            <p>Ces données sont fournies sans garantie : elles peuvent être en retard, incomplètes ou corrigées après coup.</p>
          </Block>

          <Block id="donnees" title="Données enregistrées">
            <p><strong>Ton compte :</strong> ton adresse email et ton mot de passe (chiffré, jamais lisible), gérés par Supabase.</p>
            <p><strong>Tes rappels :</strong> si tu les actives, tes choix de sessions, de délais et ton fuseau horaire. Les emails de rappel sont envoyés depuis <strong>{CONTACT}</strong>, uniquement à l’adresse de ton compte, et un journal des envois évite les doublons.</p>
            <p><strong>Sur ton appareil :</strong> tes pilotes et écurie favoris, et quelques préférences d’affichage, restent dans le navigateur (stockage local).</p>
            <p>Pas de publicité, pas de revente, pas de traceur publicitaire ni de mesure d’audience. Les photos officielles sont chargées depuis les serveurs de Formula 1.</p>
          </Block>

          <Block id="suppression" title="Supprimer tes données">
            <p><strong>Rappels :</strong> désactive-les à tout moment dans Rappels.</p>
            <p><strong>Compte :</strong> supprime-le toi-même, directement dans l’app : <strong>Rappels › Supprimer mon compte</strong>. Ton compte, tes réglages et ton journal de rappels sont effacés définitivement, sans démarche ni délai d’attente.</p>
            <p><strong>Sur ton appareil :</strong> effacer les données du site dans ton navigateur retire tes favoris.</p>
            <p>Pour toute question, ou pour demander l’accès ou la correction de tes données, écris à <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. Tu peux aussi saisir la CNIL si besoin.</p>
          </Block>
        </div>
        <p className="mt-6 text-[12px] text-[#636464]">Mis à jour le 14 novembre 2026.</p>
      </main>
    </div>
  )
}
