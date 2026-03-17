"use client"

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
      className="scroll-mt-24 bg-background py-14 md:scroll-mt-28 md:py-24"
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
              <div key={index} className="rounded-3xl border border-border/80 bg-card p-5 text-left shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="inline-flex h-11 min-w-11 items-center justify-center rounded-2xl bg-primary/10 px-3 text-sm font-bold text-primary">
                    {step.number}
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                    <step.icon className="h-5 w-5" />
                  </div>
                </div>

                <h3 className="text-lg font-semibold sm:text-xl">{step.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
