import { Brand } from '../components/landing/Sections'
import AuthCard, { type AuthProps } from '../components/AuthForm'

/** Page dédiée connexion / inscription : logo, formulaire, lien pour passer de l'un à l'autre, retour à l'accueil. */
export default function AuthPage(props: AuthProps & { showConfetti: boolean }) {
  const { isLogin, showConfetti } = props
  return (
    <div className="auth-page flex min-h-dvh flex-col text-white">
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-50">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="animate-confetti absolute h-1.5 w-1.5 rounded-full"
              style={{ left: `${(i * 37 + 11) % 100}%`, background: ['#f7f8f8', '#939494', '#fff'][i % 3], animationDelay: `${i * 0.03}s` }}
            />
          ))}
        </div>
      )}
      <header className="mx-auto flex h-16 w-full max-w-[82.5rem] items-center justify-between px-6 lg:px-10">
        <a href="#/" aria-label="F1 Manager, retour à l'accueil">
          <Brand />
        </a>
        <a href="#/" className="inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-[#939494] transition hover:text-white">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
          Retour à l'accueil
        </a>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-20 pt-6 sm:px-6">
        <AuthCard {...props} />
        <p className="mt-6 text-sm text-zinc-400">
          {isLogin ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
          <a href={isLogin ? '#/inscription' : '#/connexion'} className="font-medium text-white underline underline-offset-4 decoration-white/30 transition hover:decoration-white">
            {isLogin ? 'Créer un compte' : 'Se connecter'}
          </a>
        </p>
      </main>
    </div>
  )
}
