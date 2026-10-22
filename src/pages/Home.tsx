import { useState } from 'react'
import Hero from '../components/Hero'
import AuthForm from '../components/AuthForm'
import FeatureSection from '../components/FeatureSection'

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
}

export default function Home(props: Props) {
  return (
    <div className="min-h-screen bg-black text-white relative">
      {props.showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                background: ['#e10600', '#fff', '#ffcc00'][i % 3],
                animationDelay: `${i * 0.03}s`,
              }}
            />
          ))}
        </div>
      )}

      <Hero />
      <AuthForm {...props} />
      <FeatureSection />

      <div className="relative z-10 text-center pb-20 pt-10 text-zinc-600 text-[11px] tracking-wide border-t border-zinc-900/50">
  F1 Manager • Saison 2026
</div>
    </div>
  )
}