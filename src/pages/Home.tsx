import Hero from '../components/Hero'
import AuthCard, { AuthCtas } from '../components/AuthForm'
import AppPreview from '../components/AppPreview'
import LandingNav, { AnnouncementBar } from '../components/landing/LandingNav'
import { NumbersStrip, Features, Faq, FinalCta, Footer } from '../components/landing/Sections'
import Reveal from '../components/landing/Reveal'

interface Props {
  showAuth: boolean
  setShowAuth: (v: boolean) => void
  isLogin: boolean
  setIsLogin: (v: boolean) => void
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  message: string
  showConfetti: boolean
  onSubmit: (e: React.FormEvent) => void
  busy?: boolean
  onForgot?: () => void
}

export default function Home(props: Props) {
  const open = (login: boolean) => {
    props.setIsLogin(login)
    props.setShowAuth(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  return (
    <div className="min-h-dvh text-white relative">
      {props.showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                background: ['#8b9cff', '#fff', '#b08cff'][i % 3],
                animationDelay: `${i * 0.03}s`,
              }}
            />
          ))}
        </div>
      )}

      <AnnouncementBar />
      <LandingNav onSignup={() => open(false)} onLogin={() => open(true)} />
      <main>
        <Hero
          ctas={<AuthCtas showAuth={props.showAuth} setShowAuth={props.setShowAuth} setIsLogin={props.setIsLogin} />}
          form={props.showAuth ? <AuthCard {...props} /> : null}
        />
        <Reveal><AppPreview /></Reveal>
        <NumbersStrip />
        <Features />
        <Faq />
        <FinalCta onSignup={() => open(false)} onLogin={() => open(true)} />
      </main>
      <Footer />
    </div>
  )
}