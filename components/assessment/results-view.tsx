'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, RotateCcw } from 'lucide-react'

import { CurrentSystemCard } from '@/components/assessment/results/current-system-card'
import { RecommendationCard } from '@/components/assessment/results/recommendation-card'
import { ResultsErrorState } from '@/components/assessment/results/results-error-state'
import { ResultsLoadingState } from '@/components/assessment/results/results-loading-state'
import { ResultsSummaryGrid } from '@/components/assessment/results/results-summary-grid'
import type {
  AssessmentRecommendationCardSnapshot,
  MotorComparisonSnapshot,
} from '@/components/assessment/results/types'
import {
  fadeUpVariants,
  staggerContainerVariants,
  staggerItemVariants,
} from '@/components/motion/variants'
import { Button } from '@/components/ui/button'
import { useBLDCFanCatalog } from '@/hooks/use-bldc-fan-catalog'
import { useCompressorCatalog } from '@/hooks/use-compressor-catalog'
import { useLEDCatalog } from '@/hooks/use-led-catalog'
import { useAssessmentStorage, type AssessmentData } from '@/hooks/use-assessment-storage'
import { useMotorCatalog } from '@/hooks/use-motor-catalog'
import { buildBLDCFanRecommendation } from '@/lib/assessment/bldc-fan-recommendation'
import { buildCompressorRecommendation } from '@/lib/assessment/compressor-recommendation'
import {
  assessmentEquipmentMeta,
  type AssessmentEquipmentKey,
} from '@/lib/assessment/equipment-meta'
import { buildLEDRetrofitRecommendation } from '@/lib/assessment/led-retrofit-recommendation'
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

const BLDCFanRecommendationCharts = dynamic(
  () =>
    import('@/components/assessment/bldc-fan-recommendation-charts').then(
      (module) => module.BLDCFanRecommendationCharts
    ),
  {
    ssr: false,
    loading: () => <ChartPanelSkeleton />,
  }
)

const LEDRetrofitRecommendationCharts = dynamic(
  () =>
    import('@/components/assessment/led-retrofit-recommendation-charts').then(
      (module) => module.LEDRetrofitRecommendationCharts
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
    return buildBLDCFanRecommendation(assessments.bldc_fan)
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
  const {
    catalog: fanCatalog,
    errorMessage: fanCatalogError,
    isLoading: isFanCatalogLoading,
    reload: reloadFanCatalog,
  } = useBLDCFanCatalog({
    enabled: isLoaded && equipmentType === 'bldc_fan',
  })
  const {
    catalog: ledCatalog,
    errorMessage: ledCatalogError,
    isLoading: isLEDCatalogLoading,
    reload: reloadLEDCatalog,
  } = useLEDCatalog({
    enabled: isLoaded && equipmentType === 'led_retrofit',
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

    if (equipmentType === 'bldc_fan') {
      if (!fanCatalog) {
        return null
      }

      return buildBLDCFanRecommendation(data.bldc_fan, fanCatalog.fans)
    }

    if (equipmentType === 'led_retrofit') {
      if (!ledCatalog) {
        return null
      }

      return buildLEDRetrofitRecommendation(data.led_retrofit, ledCatalog.bulbs)
    }

    return buildFallbackResults(equipmentType, data)
  }, [compressorCatalog, data, equipmentType, fanCatalog, isLoaded, ledCatalog, motorCatalog])

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

  if (equipmentType === 'bldc_fan' && fanCatalogError) {
    return (
      <ResultsErrorState
        title="Unable to load BLDC fan recommendations"
        description={fanCatalogError}
        primaryActionLabel="Back to BLDC Fan Assessment"
        onPrimaryAction={() => router.push('/assessment?type=bldc_fan')}
        onRetry={reloadFanCatalog}
      />
    )
  }

  if (equipmentType === 'led_retrofit' && ledCatalogError) {
    return (
      <ResultsErrorState
        title="Unable to load LED recommendations"
        description={ledCatalogError}
        primaryActionLabel="Back to LED Retrofit Assessment"
        onPrimaryAction={() => router.push('/assessment?type=led_retrofit')}
        onRetry={reloadLEDCatalog}
      />
    )
  }

  if (
    !isLoaded ||
    (equipmentType === 'motor' && isMotorCatalogLoading) ||
    (equipmentType === 'compressor' && isCompressorCatalogLoading) ||
    (equipmentType === 'bldc_fan' && isFanCatalogLoading) ||
    (equipmentType === 'led_retrofit' && isLEDCatalogLoading) ||
    !recommendationResult
  ) {
    return <ResultsLoadingState />
  }

  const motorResults =
    equipmentType === 'motor' ? (recommendationResult as MotorRecommendationResult) : null
  const isCompressorResults = equipmentType === 'compressor'
  const isBLDCFanResults = equipmentType === 'bldc_fan'
  const isLEDRetrofitResults = equipmentType === 'led_retrofit'

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
      <main className="mx-auto max-w-6xl px-3 py-8 sm:px-4 sm:py-10 md:px-6 md:py-14">
        <motion.div
          className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between"
          variants={fadeUpVariants}
        >
          <Link href={`/assessment?type=${equipmentType}`}>
            <Button variant="outline" className="w-full gap-2 sm:w-auto">
              <ArrowLeft className="h-4 w-4" />
              Edit Inputs
            </Button>
          </Link>
        </motion.div>

        <motion.div className="space-y-6" variants={staggerContainerVariants}>
          <motion.div variants={staggerItemVariants}>
            <CurrentSystemCard currentSystem={recommendationResult.currentSystem} />
          </motion.div>

          <motion.div variants={staggerItemVariants}>
            <ResultsSummaryGrid summary={recommendationResult.summary} />
          </motion.div>

          <motion.section aria-labelledby="recommended-upgrades-heading" variants={staggerItemVariants}>
            <h2 id="recommended-upgrades-heading" className="mb-4 text-xl font-semibold text-primary">
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
                    equipmentType={equipmentType}
                  />
                )
              })}
            </div>
          </motion.section>

          {isCompressorResults ? (
            <motion.div variants={staggerItemVariants}>
              <CompressorRecommendationCharts
                currentSystem={recommendationResult.currentSystem}
                recommendations={recommendationResult.recommendations}
              />
            </motion.div>
          ) : null}

          {motorResults ? (
            <motion.div variants={staggerItemVariants}>
              <MotorRecommendationCharts
                currentSystem={motorResults.currentSystem}
                recommendations={motorResults.recommendations}
              />
            </motion.div>
          ) : null}

          {isBLDCFanResults ? (
            <motion.div variants={staggerItemVariants}>
              <BLDCFanRecommendationCharts
                currentSystem={recommendationResult.currentSystem}
                recommendations={recommendationResult.recommendations}
              />
            </motion.div>
          ) : null}

          {isLEDRetrofitResults ? (
            <motion.div variants={staggerItemVariants}>
              <LEDRetrofitRecommendationCharts
                currentSystem={recommendationResult.currentSystem}
                recommendations={recommendationResult.recommendations}
              />
            </motion.div>
          ) : null}

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
