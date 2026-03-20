import { ClipboardList, Cpu, FileCheck } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: ClipboardList,
    title: 'Enter Equipment Details',
    mobileTitle: 'Enter Details',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'Compare Upgrade Paths',
    mobileTitle: 'Compare Paths',
  },
  {
    number: '03',
    icon: FileCheck,
    title: 'Get Recommendations',
    mobileTitle: 'Get Recos',
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
          <div className="grid grid-cols-3 gap-2 sm:gap-6 md:grid-cols-3 xl:gap-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className="neo-card homepage-card-static min-w-0 rounded-[22px] p-3 text-center sm:rounded-[30px] sm:p-6 sm:text-left"
              >
                <div className="mb-3 flex flex-col items-center gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-primary/10 bg-primary/5 px-2 text-xs font-bold text-primary sm:h-11 sm:min-w-11 sm:px-3 sm:text-sm">
                    {step.number}
                  </div>
                  <div className="brand-gradient-icon flex h-8 w-8 items-center justify-center rounded-full sm:h-11 sm:w-11">
                    <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>

                <h3 className="min-w-0 text-balance break-words text-[11px] font-semibold leading-4 text-primary sm:text-xl sm:leading-7">
                  <span className="sm:hidden">{step.mobileTitle}</span>
                  <span className="hidden sm:inline">{step.title}</span>
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
