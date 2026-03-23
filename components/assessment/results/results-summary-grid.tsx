'use client'

import { Clock, DollarSign, Leaf, TrendingDown } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { formatIndianNumber } from '@/lib/formatting'

import type { AssessmentRecommendationSummary } from './types'

interface ResultsSummaryGridProps {
  summary: AssessmentRecommendationSummary
  className?: string
}

interface SummaryCardDefinition {
  key: 'energy' | 'cost' | 'emissions' | 'payback'
  label: string
  unit: string
  icon: typeof TrendingDown
  wrapperClassName: string
  iconClassName: string
  prefix?: string
}

const summaryCards: SummaryCardDefinition[] = [
  {
    key: 'energy',
    label: 'Energy Savings',
    unit: 'kWh/year',
    icon: TrendingDown,
    wrapperClassName: 'border-border/70 bg-white',
    iconClassName: 'brand-gradient-icon',
  },
  {
    key: 'cost',
    label: 'Cost Savings',
    unit: '/year',
    prefix: 'INR ',
    icon: DollarSign,
    wrapperClassName: 'border-border/70 bg-white',
    iconClassName: 'brand-gradient-icon',
  },
  {
    key: 'emissions',
    label: 'CO2 Reduction',
    unit: 'tCO2e/year',
    icon: Leaf,
    wrapperClassName: 'border-border/70 bg-white',
    iconClassName: 'brand-gradient-icon',
  },
  {
    key: 'payback',
    label: 'Payback Period',
    unit: 'years',
    icon: Clock,
    wrapperClassName: 'border-border/70 bg-white',
    iconClassName: 'brand-gradient-icon',
  },
]

export function ResultsSummaryGrid({
  summary,
  className,
}: ResultsSummaryGridProps) {
  const summaryValues = {
    energy: formatIndianNumber(Math.max(0, summary.totalEnergySavings)),
    cost: formatIndianNumber(Math.max(0, summary.totalCostSavings)),
    emissions: formatIndianNumber(Math.max(0, summary.totalEmissionSavings), {
      maximumFractionDigits: 2,
    }),
    payback: summary.averagePayback,
  }

  return (
    <div className={className}>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const overrideLabel =
            card.key === 'energy'
              ? summary.energyLabel
              : card.key === 'cost'
                ? summary.costLabel
                : card.key === 'emissions'
                  ? summary.emissionsLabel
                  : summary.paybackLabel
          const overrideUnit =
            card.key === 'energy'
              ? summary.energyUnit
              : card.key === 'cost'
                ? summary.costUnit
                : card.key === 'emissions'
                  ? summary.emissionsUnit
                  : summary.paybackUnit

          return (
          <Card key={card.key} className={card.wrapperClassName}>
            <CardContent className="flex items-center gap-3 p-3.5 sm:gap-4 sm:p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12 ${card.iconClassName}`}>
                <card.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="whitespace-nowrap text-sm text-muted-foreground">
                  {overrideLabel ?? card.label}
                </p>
                <p className="whitespace-nowrap text-xl font-bold sm:text-2xl">
                  {card.prefix ?? ''}
                  {summaryValues[card.key]}
                  {!(card.key === 'payback' && summaryValues.payback === 'N/A') ? (
                    <span className="ml-1 text-xs font-medium text-muted-foreground sm:text-sm">
                      {overrideUnit ?? card.unit}
                    </span>
                  ) : null}
                </p>
              </div>
            </CardContent>
          </Card>
          )
        })}
      </div>
    </div>
  )
}
