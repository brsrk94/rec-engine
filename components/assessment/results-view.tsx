'use client'

import { useMemo } from 'react'
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
import { useAirConditionerCatalog } from '@/hooks/use-air-conditioner-catalog'
import { useBLDCFanCatalog } from '@/hooks/use-bldc-fan-catalog'
import { useCompressorCatalog } from '@/hooks/use-compressor-catalog'
import { useDGSetCatalog } from '@/hooks/use-dg-set-catalog'
import { useLEDCatalog } from '@/hooks/use-led-catalog'
import { useAssessmentStorage, type AssessmentData } from '@/hooks/use-assessment-storage'
import { useMotorCatalog } from '@/hooks/use-motor-catalog'
import { buildAirConditionerRecommendation } from '@/lib/assessment/air-conditioner-recommendation'
import { buildBLDCFanRecommendation } from '@/lib/assessment/bldc-fan-recommendation'
import { buildCompressorRecommendation } from '@/lib/assessment/compressor-recommendation'
import { buildDGSetRecommendation } from '@/lib/assessment/dg-set-recommendation'
import {
  assessmentEquipmentMeta,
  type AssessmentEquipmentKey,
} from '@/lib/assessment/equipment-meta'
import { buildLEDRetrofitRecommendation } from '@/lib/assessment/led-retrofit-recommendation'
import { buildMotorRecommendation } from '@/lib/motor-catalog'
import { formatIndianNumber } from '@/lib/formatting'


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
    catalog: airConditionerCatalog,
    errorMessage: airConditionerCatalogError,
    isLoading: isAirConditionerCatalogLoading,
    reload: reloadAirConditionerCatalog,
  } = useAirConditionerCatalog({
    enabled: isLoaded && equipmentType === 'air_conditioner',
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
  const {
    catalog: dgSetCatalog,
    errorMessage: dgSetCatalogError,
    isLoading: isDGSetCatalogLoading,
    reload: reloadDGSetCatalog,
  } = useDGSetCatalog({
    enabled: isLoaded && equipmentType === 'dg_set',
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

    if (equipmentType === 'air_conditioner') {
      if (!airConditionerCatalog) {
        return null
      }

      return buildAirConditionerRecommendation(
        data.air_conditioner,
        airConditionerCatalog.airConditioners
      )
    }

    if (equipmentType === 'led_retrofit') {
      if (!ledCatalog) {
        return null
      }

      return buildLEDRetrofitRecommendation(data.led_retrofit, ledCatalog.bulbs)
    }

    if (equipmentType === 'dg_set') {
      if (!dgSetCatalog) {
        return null
      }

      return buildDGSetRecommendation(data.dg_set, dgSetCatalog.dgSets)
    }

    return buildFallbackResults(equipmentType, data)
  }, [
    airConditionerCatalog,
    compressorCatalog,
    data,
    dgSetCatalog,
    equipmentType,
    fanCatalog,
    isLoaded,
    ledCatalog,
    motorCatalog,
  ])

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

  if (equipmentType === 'air_conditioner' && airConditionerCatalogError) {
    return (
      <ResultsErrorState
        title="Unable to load air conditioner recommendations"
        description={airConditionerCatalogError}
        primaryActionLabel="Back to Air Conditioner Assessment"
        onPrimaryAction={() => router.push('/assessment?type=air_conditioner')}
        onRetry={reloadAirConditionerCatalog}
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

  if (equipmentType === 'dg_set' && dgSetCatalogError) {
    return (
      <ResultsErrorState
        title="Unable to load DG set recommendations"
        description={dgSetCatalogError}
        primaryActionLabel="Back to DG Set Assessment"
        onPrimaryAction={() => router.push('/assessment?type=dg_set')}
        onRetry={reloadDGSetCatalog}
      />
    )
  }

  if (
    !isLoaded ||
    (equipmentType === 'motor' && isMotorCatalogLoading) ||
    (equipmentType === 'compressor' && isCompressorCatalogLoading) ||
    (equipmentType === 'bldc_fan' && isFanCatalogLoading) ||
    (equipmentType === 'air_conditioner' && isAirConditionerCatalogLoading) ||
    (equipmentType === 'led_retrofit' && isLEDCatalogLoading) ||
    (equipmentType === 'dg_set' && isDGSetCatalogLoading) ||
    !recommendationResult
  ) {
    return <ResultsLoadingState />
  }

  const isCompressorResults = equipmentType === 'compressor'

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

          {equipmentType !== 'motor' && equipmentType !== 'compressor' && equipmentType !== 'bldc_fan' && equipmentType !== 'led_retrofit' && equipmentType !== 'air_conditioner' && equipmentType !== 'dg_set' ? (
            <motion.div variants={staggerItemVariants}>
              <ResultsSummaryGrid summary={recommendationResult.summary} />
            </motion.div>
          ) : null}

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
