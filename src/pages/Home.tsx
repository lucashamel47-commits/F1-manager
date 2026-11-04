import Hero from '../components/Hero'
import { AuthCtas } from '../components/AuthForm'
import AppPreview from '../components/AppPreview'
import LandingNav from '../components/landing/LandingNav'
import { NumbersStrip, Features, Rails, FinalCta, Footer } from '../components/landing/Sections'
import Faq from '../components/landing/Faq'

export default function Home() {
  return (
    <div className="min-h-dvh text-white relative">
      <LandingNav />
      <main>
        <Hero ctas={<AuthCtas />} />
        <AppPreview />
        <NumbersStrip />
        <Features />
        <Rails />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
