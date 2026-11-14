import { useEffect, useState } from 'react'
import { Brand } from './Sections'

const links = [
  { href: '#apercu', label: 'Aperçu' },
  { href: '#fonctionnalites', label: 'Fonctionnalités' },
  { href: '#faq', label: 'FAQ' },
]

/** Barre du haut calquée sur Novex : fond --background, liens 13 px gris, « Se connecter » gris, bouton pilule blanc 32 px. Pas de bandeau blanc. */
export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header className={`sticky top-0 z-40 border-b bg-[#08090a] ${scrolled ? 'border-[#2b2c2d]' : 'border-transparent'}`}>
      <div className="mx-auto flex h-16 w-full max-w-[82.5rem] items-center gap-4 whitespace-nowrap px-5 sm:gap-8 sm:px-6 lg:px-10">
        <a href="#top" aria-label="F1 Manager, haut de page" className="shrink-0"><Brand /></a>
        <nav aria-label="Sections de la page" className="hidden items-center md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="inline-flex h-8 items-center rounded-lg px-2.5 text-[13px] tracking-[-0.01em] text-[#636464] hover:text-[#f7f8f8]">{l.label}</a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <a href="#/connexion" className="inline-flex h-8 items-center rounded-full px-2.5 text-[13px] font-medium tracking-[-0.01em] text-[#939494] sm:px-3.5 hover:text-white">Se connecter</a>
          <a href="#/inscription" className="inline-flex h-8 items-center rounded-full bg-white px-3.5 text-[13px] font-medium tracking-[-0.01em] text-[#0a0a0a] hover:bg-[#e4e5e5]">Créer un compte</a>
        </div>
      </div>
    </header>
  )
}
