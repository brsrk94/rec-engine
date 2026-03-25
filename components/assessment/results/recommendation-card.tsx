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

function getComparisonPanels(equipmentType?: string) {
  if (equipmentType === 'dg_set') {
    return [
      {
        key: 'energy',
        title: 'Annual Energy Savings',
        currentKey: 'currentAnnualEnergy',
        targetKey: 'dieselEnergyReplaced',
        savingsKey: 'recommendedAnnualEnergy',
        unit: 'kWh',
        savingsLabel: 'Savings',
      },
      {
        key: 'cost',
        title: 'Annual Fuel Cost Savings',
        currentKey: 'currentAnnualCost',
        targetKey: 'recommendedAnnualCost',
        savingsKey: 'costSavings',
        unit: 'INR',
        savingsLabel: 'Savings',
      },
      {
        key: 'emissions',
        title: 'Annual Emissions Reductions',
        currentKey: 'currentAnnualEmissions',
        targetKey: 'recommendedAnnualEmissions',
        savingsKey: 'emissionSavings',
        unit: 'kgCO2e',
        savingsLabel: 'Reduction',
      },
    ] as const
  }

  return [
    {
      key: 'energy',
      title: 'Annual Energy Savings',
      currentKey: 'currentAnnualEnergy',
      targetKey: 'recommendedAnnualEnergy',
      savingsKey: 'energySavings',
      unit: 'kWh',
      savingsLabel: 'Savings',
    },
    {
      key: 'cost',
      title: 'Annual Energy Cost Savings',
      currentKey: 'currentAnnualCost',
      targetKey: 'recommendedAnnualCost',
      savingsKey: 'costSavings',
      unit: 'INR',
      savingsLabel: 'Savings',
    },
    {
      key: 'emissions',
      title: 'Annual Emissions Reductions',
      currentKey: 'currentAnnualEmissions',
      targetKey: 'recommendedAnnualEmissions',
      savingsKey: 'emissionSavings',
      unit: 'kgCO2e',
      savingsLabel: 'Reduction',
    },
  ] as const
}

function getComparisonPanelTooltip(
  panelKey: 'energy' | 'cost' | 'emissions',
  equipmentType?: string
) {
  if (equipmentType === 'motor') {
    switch (panelKey) {
      case 'energy':
        return 'Current annual energy = (motor rating in kW / current motor class least efficiency) x operating hours x number of motors. Recommended uses the target motor class least efficiency. Savings = Current - Recommended.'
      case 'cost':
        return 'Current annual cost = current annual energy x electricity tariff. Recommended annual cost = recommended annual energy x electricity tariff. Savings = Current - Recommended.'
      case 'emissions':
        return 'Current annual emissions = current annual energy x grid emission factor. Recommended annual emissions = recommended annual energy x grid emission factor. Reduction = Current - Recommended.'
    }
  }

  if (equipmentType === 'compressor') {
    switch (panelKey) {
      case 'energy':
        return 'Current annual energy = (current compressor rating x load factor x operating hours) / current compressor efficiency. Recommended uses target compressor rating and target compressor efficiency. Savings = Current - Recommended.'
      case 'cost':
        return 'Current annual cost = current annual energy x electricity tariff. Recommended annual cost = recommended annual energy x electricity tariff. Savings = Current - Recommended.'
      case 'emissions':
        return 'Current annual emissions = current annual energy x grid emission factor. Recommended annual emissions = recommended annual energy x grid emission factor. Reduction = Current - Recommended.'
    }
  }

  switch (panelKey) {
    case 'energy':
      return 'Shows the current estimate, the recommended estimate, and the difference between them.'
    case 'cost':
      return 'Shows the current annual cost, the recommended annual cost, and the savings.'
    case 'emissions':
      return 'Shows the current emissions, the recommended emissions, and the reduction.'
  }
}

function formatComparisonValue(value: number | undefined, unit: string, formatter: (value: number) => string) {
  return unit === 'INR' ? `INR ${formatter(value ?? 0)}` : `${formatter(value ?? 0)} ${unit}`
}

function MetricValue({ value, accentClassName, prefix, suffix }: MetricValueProps) {
  return (
    <p className={`flex items-baseline gap-1 whitespace-nowrap text-lg font-semibold ${accentClassName}`}>
      {prefix ? <span className="text-xs font-medium text-muted-foreground">{prefix}</span> : null}
      <span>{value}</span>
      {suffix ? <span className="text-xs font-medium text-muted-foreground">{suffix}</span> : null}
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
    case 'air_conditioner':
      return 'For air conditioners, this is the target AC capex minus the discounted present value of the current AC.'
    case 'led_retrofit':
      return 'For LED retrofit, this is the LED capex per LED multiplied by the number of bulbs being replaced.'
    case 'dg_set':
      return 'For DG sets, this is the capex of installing the dual fuel kit, including kit and installation.'
    default:
      return 'This is the capital investment value used for the recommendation.'
  }
}

function getMarginalAbatementCostTooltip() {
  return 'Marginal Abatement Cost shows the net cost to avoid 1 kgCO2e over the upgrade lifetime. Lower is better, and a negative value means the upgrade saves money while reducing emissions.'
}

function getMetricCopy(equipmentType?: string) {
  if (equipmentType === 'dg_set') {
    return {
      energy: 'Diesel Savings',
      energyUnit: 'L/year',
      cost: 'Fuel Cost Savings',
      costUnit: '/year',
      emissions: 'CO2 Reduction',
      emissionsUnit: 'kgCO2e/year',
    }
  }

  return {
    energy: 'Energy Savings',
    energyUnit: 'kWh/yr',
    cost: 'Energy Cost Savings',
    costUnit: '/yr',
    emissions: 'CO2 Reduction',
    emissionsUnit: 'kgCO2e/year',
  }
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
  const isTopRecommendation = recommendation.badge === 'Top Recommendation'
  const metricCopy = getMetricCopy(equipmentType)
  const isMotorCard = equipmentType === 'motor'
  const isCompressorCard = equipmentType === 'compressor'
  const isBLDCFanCard = equipmentType === 'bldc_fan'
  const isLEDRetrofitCard = equipmentType === 'led_retrofit'
  const isAirConditionerCard = equipmentType === 'air_conditioner'
  const isDGSetCard = equipmentType === 'dg_set'
  const useCompactComparisonLayout = isMotorCard || isCompressorCard || isBLDCFanCard || isLEDRetrofitCard || isAirConditionerCard || isDGSetCard
  const showEstimatedInvestment = !useCompactComparisonLayout
  const showMotorHeadlineMetrics = !useCompactComparisonLayout
  const showRecommendationDetails = !useCompactComparisonLayout

  return (
    <Card className="gap-0 overflow-hidden border-border/70 bg-white/94 py-0">
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 p-4 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="brand-gradient-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14">
                <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge
                    className={cn(
                      isTopRecommendation
                        ? 'bg-[#05a070] text-white'
                        : 'bg-[#05a070] text-white'
                    )}
                  >
                    {recommendation.badge}
                  </Badge>
                  {motorComparison?.efficiencyClass ? (
                    <Badge
                      variant="outline"
                      className="border-transparent bg-[#05a070] text-white"
                    >
                      {motorComparison.efficiencyClass}
                    </Badge>
                  ) : null}
                </div>
                <h3 className="truncate text-lg font-bold text-primary sm:text-xl">
                  {recommendation.name}
                </h3>
                <p className="truncate text-sm font-semibold text-primary sm:text-base">
                  {recommendation.make} - {recommendation.model}
                </p>
                {showRecommendationDetails && recommendation.details ? (
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {recommendation.details}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div
            className={cn(
              'grid gap-3 sm:gap-4',
              showMotorHeadlineMetrics ? 'lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-2'
            )}
          >
            {showMotorHeadlineMetrics ? (
              <>
                <div className="rounded-2xl border border-border/70 bg-secondary/40 p-3">
                  <p className="whitespace-nowrap text-sm text-muted-foreground">{metricCopy.energy}</p>
                  <MetricValue
                    value={formatMetricValue(recommendation.energySavings)}
                    accentClassName="text-primary"
                    suffix={metricCopy.energyUnit}
                  />
                </div>
                <div className="rounded-2xl border border-border/70 bg-secondary/40 p-3">
                  <p className="whitespace-nowrap text-sm text-muted-foreground">{metricCopy.cost}</p>
                  <MetricValue
                    value={formatMetricValue(recommendation.costSavings)}
                    accentClassName="text-green-600"
                    prefix="INR"
                    suffix={metricCopy.costUnit}
                  />
                </div>
                <div className="rounded-2xl border border-border/70 bg-secondary/40 p-3">
                  <p className="whitespace-nowrap text-sm text-muted-foreground">{metricCopy.emissions}</p>
                  <MetricValue
                    value={formatMetricValue(recommendation.emissionSavings)}
                    accentClassName="text-emerald-600"
                    suffix={metricCopy.emissionsUnit}
                  />
                </div>
              </>
            ) : null}
            {motorComparison ? (
                <div className="rounded-2xl border border-border/70 bg-secondary/40 p-3">
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
                <div className="rounded-2xl border border-border/70 bg-secondary/40 p-3">
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
                <div className="rounded-2xl border border-border/70 bg-secondary/40 p-3">
                  <p className="text-sm text-muted-foreground">Efficiency</p>
                  <div className="flex items-center gap-2">
                    <Progress value={Math.min(recommendation.efficiency, 100)} className="h-2 flex-1" />
                    <span className="text-sm font-medium">{recommendation.efficiency}%</span>
                  </div>
                </div>
            )}
            {useCompactComparisonLayout ? (
              <div className="rounded-2xl border border-border/70 bg-secondary/40 p-3">
                <p className="text-sm text-muted-foreground">Payback Period</p>
                <p className="text-lg font-semibold text-primary">
                  {recommendation.paybackYears}
                  {recommendation.paybackYears !== 'N/A' ? ' years' : ''}
                </p>
              </div>
            ) : null}
          </div>

          {motorComparison ? (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {getComparisonPanels(equipmentType).map((panel) => (
                <div key={panel.key} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <MetricLabelWithTooltip
                    label={panel.title}
                    tooltip={getComparisonPanelTooltip(panel.key, equipmentType)}
                    className="text-foreground"
                  />
                  <div className="mt-3 space-y-2 text-sm">
                    {(() => {
                      const labels = {
                        motor: { current: 'Current Motor', target: 'Recommended Motor' },
                        compressor: { current: 'Current Compressor', target: 'Recommended Compressor' },
                        bldc_fan: { current: 'Current Fan', target: 'Recommended Fan' },
                        air_conditioner: { current: 'Current AC', target: 'Recommended AC' },
                        dg_set: { current: 'Current System', target: 'Dual Fuel Kit' },
                        led_retrofit: { current: 'Current Lighting', target: 'LED Retrofit' }
                      }[equipmentType || ''] || { current: 'Current', target: 'Recommended' };
                      
                      return (
                        <>
                          <div className="flex items-center justify-between gap-3">
                            <span className="shrink-0 text-muted-foreground">{labels.current}</span>
                            <span className="truncate whitespace-nowrap text-right font-medium">
                              {formatComparisonValue(
                                motorComparison[panel.currentKey],
                                panel.unit,
                                formatMetricValue
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="shrink-0 font-medium text-primary">{labels.target}</span>
                            <span className="truncate whitespace-nowrap text-right font-medium">
                              {formatComparisonValue(
                                motorComparison[panel.targetKey],
                                panel.unit,
                                formatMetricValue
                              )}
                            </span>
                          </div>
                        </>
                      )
                    })()}
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-800">
                      <span className="shrink-0">{panel.savingsLabel}</span>
                      <span className="truncate whitespace-nowrap text-right font-semibold">
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

        {!hideFinancialSidebar && !useCompactComparisonLayout ? (
          <div className="brand-surface flex flex-col justify-center gap-6 border-t border-border/70 bg-secondary/30 p-4 sm:p-6 lg:w-64 lg:border-l lg:border-t-0">
            {showEstimatedInvestment ? (
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
            ) : null}
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
