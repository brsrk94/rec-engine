'use client'

import { CheckCircle2, Info } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatIndianNumber } from '@/lib/formatting'
import { cn } from '@/lib/utils'

import type {
  AssessmentRecommendationCardSnapshot,
  MotorComparisonSnapshot,
} from './types'

interface RecommendationCardProps {
  recommendation: AssessmentRecommendationCardSnapshot
  motorComparison?: MotorComparisonSnapshot
  formatMetricValue: (value: number) => string
  hideFinancialSidebar?: boolean
  equipmentType?: string
}

interface MetricValueProps {
  value: string
  accentClassName: string
  prefix?: string
  suffix?: string
}

const comparisonPanels = [
  {
    key: 'energy',
    title: 'Annual Energy',
    currentKey: 'currentAnnualEnergy',
    targetKey: 'recommendedAnnualEnergy',
    savingsKey: 'energySavings',
    unit: 'kWh',
    savingsLabel: 'Savings',
  },
  {
    key: 'cost',
    title: 'Annual Cost',
    currentKey: 'currentAnnualCost',
    targetKey: 'recommendedAnnualCost',
    savingsKey: 'costSavings',
    unit: 'INR',
    savingsLabel: 'Savings',
  },
  {
    key: 'emissions',
    title: 'Annual Emissions',
    currentKey: 'currentAnnualEmissions',
    targetKey: 'recommendedAnnualEmissions',
    savingsKey: 'emissionSavings',
    unit: 'kgCO2e',
    savingsLabel: 'Reduction',
  },
] as const

function formatComparisonValue(value: number, unit: string, formatter: (value: number) => string) {
  return unit === 'INR' ? `INR ${formatter(value)}` : `${formatter(value)} ${unit}`
}

function MetricValue({ value, accentClassName, prefix, suffix }: MetricValueProps) {
  return (
    <p className={`text-lg font-semibold ${accentClassName}`}>
      {prefix ? <span className="mr-1 text-xs font-medium text-muted-foreground">{prefix}</span> : null}
      <span>{value}</span>
      {suffix ? <span className="ml-1 text-xs font-medium text-muted-foreground">{suffix}</span> : null}
    </p>
  )
}

function getEstimatedInvestmentTooltip(equipmentType?: string) {
  switch (equipmentType) {
    case 'motor':
      return 'Calculated as the target motor capex minus the discounted value of the current motor, then scaled by motor rating and quantity.'
    case 'compressor':
      return 'Calculated as the target compressor capex minus the discounted value of the current compressor.'
    case 'bldc_fan':
      return 'For BLDC fans, this is the BLDC fan capex per fan multiplied by the number of fans being replaced. Installation costs are used in MAC, not here.'
    default:
      return 'This is the capital investment value used for the recommendation.'
  }
}

function getMarginalAbatementCostTooltip() {
  return 'Marginal Abatement Cost shows the net cost to avoid 1 kgCO2e over the upgrade lifetime. Lower is better, and a negative value means the upgrade saves money while reducing emissions.'
}

function MetricLabelWithTooltip({
  label,
  tooltip,
  className,
}: {
  label: string
  tooltip?: string
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`${label} info`}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-left leading-relaxed" sideOffset={6}>
            {tooltip}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}

export function RecommendationCard({
  recommendation,
  motorComparison,
  formatMetricValue,
  hideFinancialSidebar = false,
  equipmentType,
}: RecommendationCardProps) {
  const estimatedInvestmentTooltip = getEstimatedInvestmentTooltip(equipmentType)
  const marginalAbatementCostTooltip = getMarginalAbatementCostTooltip()

  return (
    <Card className="overflow-hidden border-primary/30">
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge className="bg-primary text-primary-foreground">{recommendation.badge}</Badge>
                {motorComparison?.efficiencyClass ? (
                  <Badge variant="outline">{motorComparison.efficiencyClass}</Badge>
                ) : null}
              </div>
              <h3 className="text-lg font-bold text-foreground sm:text-xl">{recommendation.name}</h3>
              <p className="break-words text-sm font-semibold text-foreground/90 sm:text-base">
                {recommendation.make} - {recommendation.model}
              </p>
              {recommendation.details ? (
                <p className="mt-1 break-words text-sm font-semibold text-foreground/80">
                  {recommendation.details}
                </p>
              ) : null}
            </div>
            <CheckCircle2 className="h-7 w-7 shrink-0 text-primary sm:h-8 sm:w-8" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <div className="neo-chip rounded-2xl bg-secondary/50 p-3">
              <p className="text-sm text-muted-foreground">Energy Savings</p>
              <MetricValue
                value={formatMetricValue(recommendation.energySavings)}
                accentClassName="text-primary"
                suffix="kWh/yr"
              />
            </div>
            <div className="neo-chip rounded-2xl bg-secondary/50 p-3">
              <p className="text-sm text-muted-foreground">Energy Cost Savings</p>
              <MetricValue
                value={formatMetricValue(recommendation.costSavings)}
                accentClassName="text-green-600"
                prefix="INR"
                suffix="/yr"
              />
            </div>
            <div className="neo-chip rounded-2xl bg-secondary/50 p-3">
              <p className="text-sm text-muted-foreground">CO2 Reduction</p>
              <MetricValue
                value={formatMetricValue(recommendation.emissionSavings)}
                accentClassName="text-emerald-600"
                suffix="kgCO2e/year"
              />
            </div>
            {motorComparison ? (
              <div className="neo-chip rounded-2xl bg-secondary/50 p-3">
                <MetricLabelWithTooltip
                  label="Marginal Abatement Cost"
                  tooltip={marginalAbatementCostTooltip}
                />
                <p className="text-lg font-semibold text-emerald-700">
                  {recommendation.marginalAbatementCost ?? 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">INR/kgCO2e</p>
              </div>
            ) : recommendation.marginalAbatementCost ? (
              <div className="neo-chip rounded-2xl bg-secondary/50 p-3">
                <MetricLabelWithTooltip
                  label="Marginal Abatement Cost"
                  tooltip={marginalAbatementCostTooltip}
                />
                <p className="text-lg font-semibold text-emerald-700">
                  {recommendation.marginalAbatementCost}
                </p>
                <p className="text-xs text-muted-foreground">INR/kgCO2e</p>
              </div>
            ) : (
              <div className="neo-chip rounded-2xl bg-secondary/50 p-3">
                <p className="text-sm text-muted-foreground">Efficiency</p>
                <div className="flex items-center gap-2">
                  <Progress value={Math.min(recommendation.efficiency, 100)} className="h-2 flex-1" />
                  <span className="text-sm font-medium">{recommendation.efficiency}%</span>
                </div>
              </div>
            )}
          </div>

          {motorComparison ? (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {comparisonPanels.map((panel) => (
                <div key={panel.key} className="neo-card rounded-xl bg-background p-4">
                  <p className="text-sm font-medium text-foreground">{panel.title}</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Current</span>
                      <span className="font-medium">
                        {formatComparisonValue(
                          motorComparison[panel.currentKey],
                          panel.unit,
                          formatMetricValue
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Recommended</span>
                      <span className="font-medium">
                        {formatComparisonValue(
                          motorComparison[panel.targetKey],
                          panel.unit,
                          formatMetricValue
                        )}
                      </span>
                    </div>
                    <div className="neo-chip flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
                      <span>{panel.savingsLabel}</span>
                      <span className="font-semibold">
                        {formatComparisonValue(
                          motorComparison[panel.savingsKey],
                          panel.unit,
                          formatMetricValue
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {!hideFinancialSidebar ? (
          <div className="flex flex-col justify-center gap-4 border-t bg-secondary/30 p-4 sm:p-6 lg:w-64 lg:border-l lg:border-t-0">
            <div className="text-center">
              <MetricLabelWithTooltip
                label="Estimated Investment"
                tooltip={estimatedInvestmentTooltip}
                className="justify-center"
              />
              <p className="text-xl font-bold sm:text-2xl">
                INR {formatIndianNumber(recommendation.upgradeCost)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Payback Period</p>
              <p className="text-xl font-semibold text-primary">
                {recommendation.paybackYears}
                {recommendation.paybackYears !== 'N/A' ? ' years' : ''}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
