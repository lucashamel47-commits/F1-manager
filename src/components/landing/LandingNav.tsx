import { useEffect, useState } from 'react'

const links = [
  { href: '#apercu', label: 'Aperçu' },
  { href: '#fonctionnalites', label: 'Fonctionnalités' },
  { href: '#faq', label: 'FAQ' },
]

export default function LandingNav({ onSignup, onLogin }: { onSignup: () => void; onLogin: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header className={`sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 border-b ${scrolled ? 'border-white/[0.08] bg-[#08090a]/70 backdrop-blur-xl' : 'border-transparent bg-transparent'}`}>
      <div className="mx-auto flex h-16 max-w-[77.5rem] items-center gap-6 px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5" aria-label="F1 Manager, haut de page">
          <span className="rounded-md bg-gradient-to-br from-[#5b7cff] to-[#7a5cf5] px-2 py-1 text-sm font-bold leading-none tracking-tight text-white">F1</span>
          <span className="text-[15px] font-semibold tracking-tight">Manager</span>
        </a>
        <nav aria-label="Sections de la page" className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="rounded-full px-3.5 py-2 text-sm text-zinc-400 transition hover:bg-white/[0.06] hover:text-white">{l.label}</a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button onClick={onLogin} className="min-h-11 rounded-full px-4 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white">Se connecter</button>
          <button onClick={onSignup} className="btn-primary min-h-11 rounded-full px-5 text-sm font-semibold active:scale-[0.97]">Créer un compte</button>
        </div>
      </div>
    </header>
  )
}
