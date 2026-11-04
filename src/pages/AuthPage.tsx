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
              style={{ left: `${(i * 37 + 11) % 100}%`, background: ['#8b9cff', '#fff', '#b08cff'][i % 3], animationDelay: `${i * 0.03}s` }}
            />
          ))}
        </div>
      )}
      <header className="mx-auto flex h-16 w-full max-w-[77.5rem] items-center justify-between px-4 sm:px-6">
        <a href="#/" className="flex items-center gap-2.5" aria-label="F1 Manager, retour à l'accueil">
          <span className="rounded-md bg-white px-2 py-1 text-sm font-bold leading-none tracking-tight text-black">F1</span>
          <span className="text-[15px] font-semibold tracking-tight">Manager</span>
        </a>
        <a href="#/" className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm text-zinc-400 transition hover:text-white">
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
