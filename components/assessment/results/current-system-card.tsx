'use client'

import { Info } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatIndianNumber } from '@/lib/formatting'

import type { AssessmentCurrentSystemSnapshot } from './types'

interface CurrentSystemCardProps {
  currentSystem: AssessmentCurrentSystemSnapshot
}

const snapshotFields = [
  { key: 'type', label: 'Type' },
  { key: 'rating', label: 'Rating' },
  { key: 'make', label: 'Make' },
  { key: 'model', label: 'Model' },
] as const

function MetricInfoButton({
  ariaLabel,
  description,
  formula,
}: {
  ariaLabel: string
  description?: string
  formula?: string
}) {
  if (!description && !formula) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm text-left leading-relaxed" sideOffset={6}>
        {description ? <p>{description}</p> : null}
        {formula ? <p>{formula}</p> : null}
      </TooltipContent>
    </Tooltip>
  )
}

export function CurrentSystemCard({ currentSystem }: CurrentSystemCardProps) {
  return (
    <Card className="bg-white/94">
      <CardHeader>
        <CardTitle className="text-primary">Current System</CardTitle>
        <CardDescription>Your existing equipment configuration</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {snapshotFields.map((field) => (
            <div key={field.key} className="rounded-2xl border border-border/70 bg-secondary/35 px-4 py-3">
              <p className="whitespace-nowrap text-sm text-muted-foreground">{field.label}</p>
              <p className="truncate font-medium">{currentSystem[field.key]}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-border/70 bg-secondary/35 px-4 py-3">
            <div className="flex items-center gap-1.5">
              <p className="text-sm text-muted-foreground">
                {currentSystem.annualEnergyLabel ?? 'Annual Energy'}
              </p>
              <MetricInfoButton
                ariaLabel="Annual energy calculation info"
                description={currentSystem.annualEnergyDescription}
                formula={currentSystem.annualEnergyFormula}
              />
            </div>
            <p className="whitespace-nowrap font-medium">
              {formatIndianNumber(currentSystem.annualEnergy)} kWh/year
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-secondary/35 px-4 py-3">
            <div className="flex items-center gap-1.5">
              <p className="whitespace-nowrap text-sm text-muted-foreground">
                {currentSystem.annualCostLabel ?? 'Annual Cost'}
              </p>
              <MetricInfoButton
                ariaLabel="Annual cost calculation info"
                description={currentSystem.annualCostDescription}
                formula={currentSystem.annualCostFormula}
              />
            </div>
            <p className="whitespace-nowrap font-medium">
              INR {formatIndianNumber(currentSystem.annualCost)}
            </p>
          </div>
          {currentSystem.annualDieselConsumption != null ? (
            <div className="rounded-2xl border border-border/70 bg-secondary/35 px-4 py-3">
              <p className="whitespace-nowrap text-sm text-muted-foreground">
                {currentSystem.annualDieselConsumptionLabel ?? 'Annual Diesel Consumption'}
              </p>
              <p className="whitespace-nowrap font-medium">
                {formatIndianNumber(currentSystem.annualDieselConsumption)} L/year
              </p>
            </div>
          ) : null}
          {currentSystem.paybackYears != null ? (
            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 px-4 py-3">
              <p className="whitespace-nowrap text-sm text-muted-foreground">Payback Period</p>
              <p className="whitespace-nowrap font-semibold text-amber-700">
                {currentSystem.paybackYears} years
              </p>
            </div>
          ) : null}
          {currentSystem.marginalAbatementCost != null ? (
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/50 px-4 py-3">
              <p className="whitespace-nowrap text-sm text-muted-foreground">Marginal Abatement Cost</p>
              <p className="whitespace-nowrap font-semibold text-emerald-700">
                {currentSystem.marginalAbatementCost} INR/kgCO₂e
              </p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
