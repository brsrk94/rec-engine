import { Button } from '@/components/ui/button'
import { ArrowRight, BadgeCheck, Leaf, TrendingDown, Zap } from 'lucide-react'
import Link from 'next/link'

export function HeroSection() {
  const metrics = [
    {
      icon: TrendingDown,
      value: '30%',
      label: 'Average energy saving potential',
    },
    {
      icon: Zap,
      value: '2 yr',
      label: 'Typical payback window',
    },
    {
      icon: Leaf,
      value: '25%',
      label: 'Indicative CO2 reduction',
    },
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary/40 via-background to-background pt-0">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(6,95,70,0.12),transparent_62%)]" />
      <div className="mx-auto max-w-7xl px-3 pb-9 pt-2 sm:px-4 sm:pb-12 md:px-6 md:pb-20 md:pt-2">
        <div className="mx-auto max-w-5xl text-center">
          <div className="neo-chip mx-auto flex max-w-[20rem] flex-wrap items-center justify-center gap-1.5 rounded-full bg-primary/6 px-2 py-1.5 text-center text-[11px] leading-tight font-medium text-primary transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:max-w-full sm:gap-2 sm:px-3 sm:py-2 sm:text-sm">
            <BadgeCheck className="h-4 w-4" />
            Industrial energy upgrade recommendations
          </div>

          <h1 className="mt-5 text-balance text-[1.8rem] font-bold leading-[1.08] tracking-tight sm:mt-6 sm:text-4xl sm:leading-tight md:text-5xl lg:text-6xl">
            Optimize Your{' '}
            <span className="text-primary">Energy Efficiency</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-6 text-muted-foreground sm:mt-6 sm:max-w-3xl sm:text-lg md:text-xl">
            Get smart upgrade recommendations for your industrial equipment.
            Reduce energy costs, lower emissions, and evaluate better-performing
            equipment with a faster, cleaner assessment flow.
          </p>

          <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <Link href="/assessment" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="neo-cta h-12 w-full rounded-[18px] gap-2 bg-white px-4 text-base font-extrabold tracking-[-0.01em] text-[#065F46] hover:bg-white/90 sm:w-auto sm:px-5"
              >
                Start Free Assessment
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 md:mt-12 xl:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="neo-card rounded-2xl bg-card p-4 text-left sm:p-6"
              >
                <div className="flex items-center gap-2.5 text-primary sm:gap-3">
                  <div className="neo-chip flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 sm:h-11 sm:w-11">
                    <metric.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[1.65rem] font-bold tracking-tight sm:text-3xl">{metric.value}</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground sm:mt-4">{metric.label}</p>
              </div>
            ))}
          </div>

          <div className="neo-panel mt-8 rounded-3xl bg-card p-4 text-left sm:p-6 md:mt-10 md:p-7">
            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">
                  Built For Fast Evaluations
                </p>
                <h2 className="mt-3 text-lg font-semibold tracking-tight sm:text-2xl">
                  Assess motors, compressors, fans, ACs, lighting, and DG sets in one place.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  The homepage is now lighter and the heavy mockup has been removed,
                  so the site focuses on getting people into the assessment flow quickly.
                </p>
              </div>
              <div className="grid gap-3">
                <div className="neo-card rounded-2xl bg-muted/35 px-4 py-3">
                  <p className="text-sm font-medium">Motor catalog data</p>
                  <p className="mt-1 text-sm text-muted-foreground">Make, model, class, capex</p>
                </div>
                <div className="neo-card rounded-2xl bg-muted/35 px-4 py-3">
                  <p className="text-sm font-medium">Instant decision outputs</p>
                  <p className="mt-1 text-sm text-muted-foreground">Savings, payback, emissions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
