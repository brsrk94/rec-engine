import { Navigation } from '@/components/navigation'
import { HeroSection } from '@/components/hero-section'
import { FeaturesSection } from '@/components/features-section'
import { EquipmentSection } from '@/components/equipment-section'
import { HowItWorksSection } from '@/components/how-it-works-section'
import { Footer } from '@/components/footer'

export default function HomePage() {
  return (
    <main>
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <EquipmentSection />
      <HowItWorksSection />
      <Footer />
    </main>
  )
}
