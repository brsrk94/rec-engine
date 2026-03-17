import { ClipboardList, Cpu, FileCheck } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: ClipboardList,
    title: 'Enter Equipment Details',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'Compare Upgrade Paths',
  },
  {
    number: '03',
    icon: FileCheck,
    title: 'Get Recommendations',
  },
]

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 bg-background py-12 sm:py-14 md:scroll-mt-28 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            How It Works
          </h2>
        </div>

        <div className="relative mt-8 sm:mt-10">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
            {steps.map((step, index) => (
              <div key={index} className="rounded-3xl border-2 border-slate-900/10 bg-card p-4 text-left shadow-[4px_4px_0_0_rgba(15,23,42,0.10)] sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="neo-chip inline-flex h-10 min-w-10 items-center justify-center rounded-2xl bg-primary/10 px-3 text-sm font-bold text-primary sm:h-11 sm:min-w-11">
                    {step.number}
                  </div>
                  <div className="neo-chip flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground sm:h-11 sm:w-11">
                    <step.icon className="h-5 w-5" />
                  </div>
                </div>

                <h3 className="text-base font-semibold sm:text-xl">{step.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
