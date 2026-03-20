import { Button } from '@/components/ui/button'
import { Leaf, TrendingDown, Zap } from 'lucide-react'
import Link from 'next/link'

export function HeroSection() {
  const metrics = [
    {
      icon: TrendingDown,
      value: '30%',
      label: 'Average energy saving potential',
      mobileLabel: 'Avg. savings',
    },
    {
      icon: Zap,
      value: '2 yr',
      label: 'Typical payback window',
      mobileLabel: 'Payback',
    },
    {
      icon: Leaf,
      value: '25%',
      label: 'Indicative CO2 reduction',
      mobileLabel: 'CO2 reduction',
    },
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary/40 via-background to-background pt-8 sm:pt-10 md:pt-14">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[25rem] sm:h-[27rem] md:h-[29rem]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(5, 160, 112, 0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(5, 160, 112, 0.14) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'linear-gradient(to bottom, black 0%, black 76%, transparent 100%)',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(5,160,112,0.10),transparent_58%)]" />
      <div className="relative z-10 mx-auto max-w-7xl px-3 pb-9 sm:px-4 sm:pb-12 md:px-6 md:pb-20">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex h-9 items-center justify-center rounded-3xl border border-[#05a070] bg-[linear-gradient(180deg,rgba(235,250,244,0.95),rgba(223,246,237,0.98))] px-5 text-base font-medium tracking-[-0.02em] text-[#05a070] sm:px-6 sm:text-lg">
            <span>Midori</span>
            <sup className="ml-0.5 self-start pt-2 text-[0.48em] font-medium leading-none">
              TM
            </sup>
          </div>
          <h1 className="mt-5 text-balance text-[1.8rem] font-bold leading-[1.08] tracking-tight sm:mt-6 sm:text-4xl sm:leading-tight md:text-5xl lg:text-6xl">
            Optimize Your{' '}
            <span className="bg-[linear-gradient(135deg,#10b981_0%,#006ded_100%)] bg-clip-text text-transparent">
              Energy Efficiency
            </span>
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
                className="neo-cta h-8 w-full rounded-3xl gap-2 px-5 text-base font-bold tracking-[-0.01em] sm:w-auto"
              >
                Start Assessment
              </Button>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-2 sm:mt-10 sm:gap-4 md:mt-12">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="neo-card homepage-card min-w-0 rounded-[22px] p-3 text-center sm:rounded-[26px] sm:p-6 sm:text-left"
              >
                <div className="flex flex-col items-center gap-2 text-primary sm:flex-row sm:items-center sm:gap-3">
                  <div className="brand-gradient-icon flex h-9 w-9 items-center justify-center rounded-full sm:h-12 sm:w-12">
                    <metric.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className="text-lg font-bold tracking-tight sm:text-3xl">{metric.value}</span>
                </div>
                <p className="mt-2 min-w-0 text-balance break-words text-[10px] leading-3.5 text-muted-foreground sm:mt-4 sm:text-sm sm:leading-5">
                  <span className="sm:hidden">{metric.mobileLabel}</span>
                  <span className="hidden sm:inline">{metric.label}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="neo-panel homepage-card brand-surface mt-8 rounded-[30px] p-4 text-left sm:p-6 md:mt-10 md:p-7">
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
                <div className="neo-card homepage-card rounded-2xl bg-white/80 px-4 py-3">
                  <p className="text-sm font-medium">Motor catalog data</p>
                  <p className="mt-1 text-sm text-muted-foreground">Make, model, class, capex</p>
                </div>
                <div className="neo-card homepage-card rounded-2xl bg-white/80 px-4 py-3">
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
