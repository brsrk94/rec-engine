'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, RotateCcw } from 'lucide-react'

import {
  AssessmentEquipmentImage,
  ASSESSMENT_EQUIPMENT_ASSETS,
  type AssessmentEquipmentId,
} from '@/components/assessment/equipment-image'
import { CurrentSystemCard } from '@/components/assessment/results/current-system-card'
import { RecommendationCard } from '@/components/assessment/results/recommendation-card'
import { ResultsErrorState } from '@/components/assessment/results/results-error-state'
import { ResultsLoadingState } from '@/components/assessment/results/results-loading-state'
import { ResultsSummaryGrid } from '@/components/assessment/results/results-summary-grid'
import type {
  AssessmentRecommendationCardSnapshot,
  MotorComparisonSnapshot,
} from '@/components/assessment/results/types'
import { StickyShellHeader } from '@/components/layout/sticky-shell-header'
import {
  fadeUpVariants,
  staggerContainerVariants,
  staggerItemVariants,
} from '@/components/motion/variants'
import { Button } from '@/components/ui/button'
import { useCompressorCatalog } from '@/hooks/use-compressor-catalog'
import { useAssessmentStorage, type AssessmentData } from '@/hooks/use-assessment-storage'
import { useMotorCatalog } from '@/hooks/use-motor-catalog'
import { buildCompressorRecommendation } from '@/lib/assessment/compressor-recommendation'
import {
  assessmentEquipmentMeta,
  type AssessmentEquipmentKey,
} from '@/lib/assessment/equipment-meta'
import { buildMotorRecommendation, type MotorRecommendationResult } from '@/lib/motor-catalog'
import { formatIndianNumber } from '@/lib/formatting'

function ChartPanelSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="neo-card h-[380px] rounded-3xl bg-card p-4 sm:h-[420px] sm:p-6"
        >
          <div className="h-full animate-pulse rounded-[22px] bg-muted/40" />
        </div>
      ))}
    </div>
  )
}

const MotorRecommendationCharts = dynamic(
  () =>
    import('@/components/assessment/motor-recommendation-charts').then(
      (module) => module.MotorRecommendationCharts
    ),
  {
    ssr: false,
    loading: () => <ChartPanelSkeleton />,
  }
)

const CompressorRecommendationCharts = dynamic(
  () =>
    import('@/components/assessment/compressor-recommendation-charts').then(
      (module) => module.CompressorRecommendationCharts
    ),
  {
    ssr: false,
    loading: () => <ChartPanelSkeleton />,
  }
)

function isKnownEquipmentType(value: string): value is AssessmentEquipmentKey {
  return value in assessmentEquipmentMeta
}

function isMotorComparisonSnapshot(
  recommendation: AssessmentRecommendationCardSnapshot
): recommendation is AssessmentRecommendationCardSnapshot & MotorComparisonSnapshot {
  return (
    'currentAnnualEnergy' in recommendation &&
    'recommendedAnnualEnergy' in recommendation &&
    'energySavings' in recommendation &&
    'currentAnnualCost' in recommendation &&
    'recommendedAnnualCost' in recommendation &&
    'costSavings' in recommendation &&
    'currentAnnualEmissions' in recommendation &&
    'recommendedAnnualEmissions' in recommendation &&
    'emissionSavings' in recommendation
  )
}

function formatPositiveMetric(value: number) {
  return formatIndianNumber(Math.max(0, value))
}

function buildFallbackResults(equipmentType: string, assessments: AssessmentData) {
  if (equipmentType === 'compressor') {
    return null
  }

  if (equipmentType === 'bldc_fan') {
    const fanAssessment = assessments.bldc_fan
    const currentFanWattage = parseFloat(fanAssessment.current_wattage) || 75
    const fanCount = parseInt(fanAssessment.number_of_fans) || 1
    const annualRuntimeHours = parseFloat(fanAssessment.operating_hours_year) || 3000
    const electricityTariff = parseFloat(fanAssessment.electricity_tariff) || 8
    const targetFanWattage = 28

    const currentAnnualEnergy = (currentFanWattage * fanCount * annualRuntimeHours) / 1000
    const upgradedAnnualEnergy = (targetFanWattage * fanCount * annualRuntimeHours) / 1000
    const annualEnergySavings = currentAnnualEnergy - upgradedAnnualEnergy
    const annualCostSavings = annualEnergySavings * electricityTariff
    const annualEmissionSavings = annualEnergySavings * 0.71
    const upgradeCost = 2500 * fanCount
    const paybackPeriodYears = annualCostSavings > 0 ? upgradeCost / annualCostSavings : 0

    return {
      currentSystem: {
        type: 'Conventional AC Fan',
        rating: `${currentFanWattage}W x ${fanCount} units`,
        make: 'Various',
        model: 'Standard Ceiling Fan',
        annualEnergy: Math.round(currentAnnualEnergy),
        annualCost: Math.round(currentAnnualEnergy * electricityTariff),
      },
      recommendations: [
        {
          id: 1,
          name: 'BLDC Ceiling Fan',
          make: 'Atomberg / Orient',
          model: 'Energy Efficient BLDC',
          badge: '65% Savings',
          energySavings: Math.round(annualEnergySavings),
          costSavings: Math.round(annualCostSavings),
          emissionSavings: Math.round(annualEmissionSavings),
          upgradeCost: Math.round(upgradeCost),
          paybackYears: paybackPeriodYears.toFixed(1),
          efficiency: 90,
        },
      ],
      summary: {
        totalEnergySavings: Math.round(annualEnergySavings),
        totalCostSavings: Math.round(annualCostSavings),
        totalEmissionSavings: Math.round(annualEmissionSavings / 1000),
        averagePayback: paybackPeriodYears.toFixed(1),
      },
    }
  }

  return {
    currentSystem: {
      type: 'Current Equipment',
      rating: 'As specified',
      make: 'Various',
      model: 'Not specified',
      annualEnergy: 50000,
      annualCost: 400000,
    },
    recommendations: [
      {
        id: 1,
        name: 'High Efficiency Upgrade',
        make: 'Fitsol Recommended',
        model: 'Premium Series',
        badge: 'Recommended',
        energySavings: 15000,
        costSavings: 120000,
        emissionSavings: 10650,
        upgradeCost: 300000,
        paybackYears: '2.5',
        efficiency: 92,
      },
    ],
    summary: {
      totalEnergySavings: 15000,
      totalCostSavings: 120000,
      totalEmissionSavings: 10.65,
      averagePayback: '2.5',
    },
  }
}

export function ResultsView() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data, isLoaded, clearAll } = useAssessmentStorage()
  const prefersReducedMotion = useReducedMotion()

  const rawEquipmentType = searchParams.get('type') || 'motor'
  const equipmentType = isKnownEquipmentType(rawEquipmentType) ? rawEquipmentType : 'motor'
  const equipmentMeta = assessmentEquipmentMeta[equipmentType]

  const {
    catalog: motorCatalog,
    errorMessage: motorCatalogError,
    isLoading: isMotorCatalogLoading,
    reload: reloadMotorCatalog,
  } = useMotorCatalog({
    enabled: isLoaded && equipmentType === 'motor',
  })
  const {
    catalog: compressorCatalog,
    errorMessage: compressorCatalogError,
    isLoading: isCompressorCatalogLoading,
    reload: reloadCompressorCatalog,
  } = useCompressorCatalog({
    enabled: isLoaded && equipmentType === 'compressor',
  })

  const recommendationResult = useMemo(() => {
    if (!isLoaded) {
      return null
    }

    if (equipmentType === 'motor') {
      if (!motorCatalog) {
        return null
      }

      return buildMotorRecommendation(data.motor, motorCatalog.motors)
    }

    if (equipmentType === 'compressor') {
      if (!compressorCatalog) {
        return null
      }

      return buildCompressorRecommendation(data.compressor, compressorCatalog.compressors)
    }

    return buildFallbackResults(equipmentType, data)
  }, [compressorCatalog, data, equipmentType, isLoaded, motorCatalog])

  if (equipmentType === 'motor' && motorCatalogError) {
    return (
      <ResultsErrorState
        title="Unable to load motor recommendations"
        description={motorCatalogError}
        primaryActionLabel="Back to Motor Assessment"
        onPrimaryAction={() => router.push('/assessment?type=motor')}
        onRetry={reloadMotorCatalog}
      />
    )
  }

  if (equipmentType === 'compressor' && compressorCatalogError) {
    return (
      <ResultsErrorState
        title="Unable to load compressor recommendations"
        description={compressorCatalogError}
        primaryActionLabel="Back to Compressor Assessment"
        onPrimaryAction={() => router.push('/assessment?type=compressor')}
        onRetry={reloadCompressorCatalog}
      />
    )
  }

  if (
    !isLoaded ||
    (equipmentType === 'motor' && isMotorCatalogLoading) ||
    (equipmentType === 'compressor' && isCompressorCatalogLoading) ||
    !recommendationResult
  ) {
    return <ResultsLoadingState />
  }

  const motorResults =
    equipmentType === 'motor' ? (recommendationResult as MotorRecommendationResult) : null

  const startFreshAssessment = () => {
    clearAll()
    router.push('/assessment')
  }

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={prefersReducedMotion ? false : 'hidden'}
      animate="visible"
      variants={staggerContainerVariants}
    >
      <StickyShellHeader>
        <div className="flex items-center gap-2">
          <Link href={`/assessment?type=${equipmentType}`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 px-2 text-white hover:bg-white/10 hover:text-white sm:h-[29px] sm:px-3"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Edit Inputs</span>
            </Button>
          </Link>
        </div>
      </StickyShellHeader>

      <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8 md:px-6 md:py-12">
        <motion.div className="mb-6 sm:mb-8" variants={fadeUpVariants}>
          <div className="flex items-start gap-2.5 sm:items-center sm:gap-3">
            <AssessmentEquipmentImage
              equipmentId={
                (equipmentType in ASSESSMENT_EQUIPMENT_ASSETS
                  ? equipmentType
                  : 'motor') as AssessmentEquipmentId
              }
              className="h-10 w-10 rounded-xl sm:h-14 sm:w-14"
              roundedClassName="rounded-xl"
              sizes="(min-width: 640px) 56px, 40px"
              priority
            />
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight sm:text-2xl md:text-3xl">
                {equipmentMeta.title} Assessment Results
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Based on your equipment specifications
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div className="mb-8" variants={fadeUpVariants}>
          <ResultsSummaryGrid summary={recommendationResult.summary} />
        </motion.div>

        <motion.div className="space-y-6" variants={staggerContainerVariants}>
          {motorResults ? (
            <motion.div variants={staggerItemVariants}>
              <MotorRecommendationCharts
                currentSystem={motorResults.currentSystem}
                recommendations={motorResults.recommendations}
              />
            </motion.div>
          ) : null}

          {equipmentType === 'compressor' ? (
            <motion.div variants={staggerItemVariants}>
              <CompressorRecommendationCharts
                currentSystem={recommendationResult.currentSystem}
                recommendations={recommendationResult.recommendations}
              />
            </motion.div>
          ) : null}

          <motion.div variants={staggerItemVariants}>
            <CurrentSystemCard currentSystem={recommendationResult.currentSystem} />
          </motion.div>

          <motion.section aria-labelledby="recommended-upgrades-heading" variants={staggerItemVariants}>
            <h2 id="recommended-upgrades-heading" className="mb-4 text-xl font-semibold">
              Recommended Upgrades
            </h2>
            <div className="space-y-4">
              {recommendationResult.recommendations.map((recommendation) => {
                const motorComparison = isMotorComparisonSnapshot(
                  recommendation as AssessmentRecommendationCardSnapshot
                )
                  ? (recommendation as MotorComparisonSnapshot & AssessmentRecommendationCardSnapshot)
                  : undefined

                return (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    motorComparison={motorComparison}
                    formatMetricValue={formatPositiveMetric}
                    hideFinancialSidebar={equipmentType === 'compressor'}
                  />
                )
              })}
            </div>
          </motion.section>

          <motion.div
            className="flex flex-col gap-4 pt-6 sm:flex-row sm:justify-start"
            variants={staggerItemVariants}
          >
            <Button
              variant="outline"
              onClick={startFreshAssessment}
              className="w-full gap-2 sm:w-auto"
            >
              <RotateCcw className="h-4 w-4" />
              Start New Assessment
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </motion.div>
  )
}
