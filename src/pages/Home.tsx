import Hero from '../components/Hero'
import { AuthCtas } from '../components/AuthForm'
import AppPreview from '../components/AppPreview'
import LandingNav from '../components/landing/LandingNav'
import { NumbersStrip, Features, FinalCta, Footer } from '../components/landing/Sections'
import Faq from '../components/landing/Faq'
import Reveal from '../components/landing/Reveal'

export default function Home() {
  return (
    <div className="min-h-dvh text-white relative">
      <LandingNav />
      <main>
        <Hero ctas={<AuthCtas />} />
        <Reveal><AppPreview /></Reveal>
        <NumbersStrip />
        <Features />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
