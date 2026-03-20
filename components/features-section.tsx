import { Calculator, Lightbulb, Clock, TrendingUp } from 'lucide-react'

const features = [
  {
    icon: Calculator,
    title: 'Calculation-Based Insights',
    mobileTitle: 'Calc Insights',
  },
  {
    icon: Clock,
    title: 'Quick Assessment',
    mobileTitle: 'Quick Assess',
  },
  {
    icon: TrendingUp,
    title: 'ROI Focused',
    mobileTitle: 'ROI Focus',
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

        <div className="mt-8 grid grid-cols-3 gap-2 sm:mt-10 sm:gap-5 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="neo-card homepage-card flex min-h-[112px] min-w-0 flex-col items-center justify-center gap-2 rounded-[22px] p-3 text-center sm:min-h-[148px] sm:rounded-[26px] sm:gap-4 sm:p-6"
            >
              <div className="brand-gradient-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14">
                <feature.icon className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <h3 className="min-w-0 text-balance break-words text-[11px] font-semibold leading-4 text-primary sm:text-lg sm:leading-6">
                <span className="sm:hidden">{feature.mobileTitle}</span>
                <span className="hidden sm:inline">{feature.title}</span>
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
