import { Calculator, Lightbulb, Clock, TrendingUp } from 'lucide-react'

const features = [
  {
    icon: Calculator,
    title: 'Calculation-Based Insights',
  },
  {
    icon: Clock,
    title: 'Quick Assessment',
  },
  {
    icon: TrendingUp,
    title: 'ROI Focused',
  },
]

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-24 bg-background py-12 sm:py-14 md:scroll-mt-28 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Why Choose Fitsol?
          </h2>
        </div>

        <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-xl border-2 border-slate-900/10 bg-card p-4 shadow-[4px_4px_0_0_rgba(15,23,42,0.10)] sm:p-5"
            >
              <div className="neo-chip mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-12 sm:w-12">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
