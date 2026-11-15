import type { ReactNode } from 'react'
import { LogoGlyph } from '../components/Logo'
import AuthCard, { type AuthProps } from '../components/AuthForm'

/**
 * Coque des pages d'accès, structure Novex (sign-in / sign-up) : une colonne de 320 px centrée,
 * logo, titre court, petit « ← Retour », formulaire, lien pour basculer. Pas d'aperçu ni de visuel à côté.
 */
export function AuthShell({ title, back = true, children, footer }: { title: string; back?: boolean; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="auth-page flex min-h-dvh flex-col bg-[#08090a] text-[#f7f8f8]">
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="app-in w-full max-w-[320px]">
          <a href="#/" aria-label="F1 Manager, retour à l'accueil" className="mx-auto grid size-9 place-items-center">
            <LogoGlyph className="h-[30px] w-auto" />
          </a>
          <h1 className="mt-7 text-center text-[20px] font-[510] leading-6 tracking-[-0.01em]">{title}</h1>
          {back && (
            <a href="#/" className="mt-7 inline-flex min-h-8 items-center text-[13px] text-[#636464] transition-colors hover:text-[#f7f8f8]">← Retour à l'accueil</a>
          )}
          <div className={back ? 'mt-1.5' : 'mt-8'}>{children}</div>
          {footer && <p className="mt-9 text-center text-[13px] text-[#636464]">{footer}</p>}
        </div>
      </main>
      <footer className="pb-6 text-center">
        <a href="#/mentions" className="inline-flex min-h-9 items-center px-3 text-[12px] text-[#636464] transition-colors hover:text-[#939494]">Mentions légales & confidentialité</a>
      </footer>
    </div>
  )
}

/** Pages Connexion / Inscription. */
export default function AuthPage(props: AuthProps & { showConfetti: boolean }) {
  const { isLogin, showConfetti } = props
  return (
    <>
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
      <AuthShell
        key={isLogin ? 'login' : 'signup'}
        title={isLogin ? 'Connexion à F1 Manager' : 'Créer un compte F1 Manager'}
        footer={<>
          {isLogin ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
          <a href={isLogin ? '#/inscription' : '#/connexion'} className="text-[#939494] transition-colors hover:text-[#f7f8f8]">
            {isLogin ? 'S’inscrire' : 'Se connecter'}
          </a>
        </>}
      >
        <AuthCard {...props} />
      </AuthShell>
    </>
  )
}
