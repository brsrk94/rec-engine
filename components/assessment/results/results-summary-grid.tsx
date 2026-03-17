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
    wrapperClassName: 'border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10',
    iconClassName: 'neo-chip bg-primary/20 text-primary',
  },
  {
    key: 'cost',
    label: 'Cost Savings',
    unit: '/year',
    prefix: 'INR ',
    icon: DollarSign,
    wrapperClassName: 'border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10',
    iconClassName: 'neo-chip bg-green-500/20 text-green-600',
  },
  {
    key: 'emissions',
    label: 'CO2 Reduction',
    unit: 'tCO2e/year',
    icon: Leaf,
    wrapperClassName: 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10',
    iconClassName: 'neo-chip bg-emerald-500/20 text-emerald-600',
  },
  {
    key: 'payback',
    label: 'Payback Period',
    unit: 'years',
    icon: Clock,
    wrapperClassName: 'border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10',
    iconClassName: 'neo-chip bg-blue-500/20 text-blue-600',
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
        {summaryCards.map((card) => (
            <Card key={card.key} className={card.wrapperClassName}>
              <CardContent className="flex items-center gap-3 p-3.5 sm:gap-4 sm:p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12 ${card.iconClassName}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold sm:text-2xl">
                  {card.prefix ?? ''}
                  {summaryValues[card.key]}
                  {!(card.key === 'payback' && summaryValues.payback === 'N/A') ? (
                    <span className="mt-0.5 block text-xs font-medium text-muted-foreground sm:ml-1 sm:mt-0 sm:inline sm:text-sm">
                      {card.unit}
                    </span>
                  ) : null}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
