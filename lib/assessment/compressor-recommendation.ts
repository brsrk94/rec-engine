import type { CompressorAssessment } from '@/hooks/use-assessment-storage'
import type { CompressorCatalogItem } from '@/lib/compressor-catalog'

import {
  COMPRESSOR_DISCOUNT_RATE,
  getCompressorLeastEfficiency,
  getCompressorTargetEfficiency,
  getCompressorTypeLabel,
  getDefaultCompressorCapex,
  normalizeCompressorRatingToKw,
} from '@/lib/assessment/compressor-benchmarks'

interface CompressorUpgradeMetrics {
  targetAnnualEnergy: number
  annualEnergySavings: number
  annualCostSavings: number
  annualEmissionSavings: number
  targetCapex: number
  incrementalUpgradeCost: number
  npvEnergySavings: number
  npvEmissionReduction: number
  paybackYears: number
  marginalAbatementCost: number
}

interface CompressorRecommendationCandidate {
  candidate: CompressorCatalogItem
  targetEfficiency: number
  ratingDifferenceKw: number
  exactRating: boolean
  matchesRequestedTargetType: boolean
  sameMake: boolean
  metrics: CompressorUpgradeMetrics
}

function parsePositiveNumber(value: string) {
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function formatWholeNumber(value: number) {
  return Math.max(0, Math.round(value))
}

function formatPaybackYears(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return 'N/A'
  }

  return value.toFixed(2)
}

function formatMacValue(value: number) {
  if (!Number.isFinite(value)) {
    return undefined
  }

  return value.toFixed(4)
}

function calculatePaybackYears(incrementalUpgradeCost: number, annualCostSavings: number) {
  if (!Number.isFinite(annualCostSavings) || annualCostSavings <= 0) {
    return Number.NaN
  }

  if (!Number.isFinite(incrementalUpgradeCost) || incrementalUpgradeCost <= 0) {
    return 0
  }

  return incrementalUpgradeCost / annualCostSavings
}

function buildManualFallbackRecommendation(
  assessment: CompressorAssessment,
  baselineAnnualEnergy: number,
  electricityTariff: number,
  targetAnnualEnergy: number,
  annualEnergySavings: number,
  annualCostSavings: number,
  annualEmissionSavings: number,
  incrementalUpgradeCost: number,
  paybackYears: number,
  targetEfficiency: number,
  marginalAbatementCost: number
) {
  const targetTypeLabel = getCompressorTypeLabel(assessment.target_compressor_type)

  return {
    currentSystem: {
      type: getCompressorTypeLabel(assessment.current_compressor_type),
      rating: `${assessment.compressor_rating || '0'} ${assessment.compressor_rating_unit}`,
      make: assessment.compressor_make || 'Not specified',
      model: assessment.compressor_model || 'Not specified',
      annualEnergy: formatWholeNumber(baselineAnnualEnergy),
      annualCost: formatWholeNumber(baselineAnnualEnergy * electricityTariff),
    },
    recommendations: [
      {
        id: 1,
        name: `${targetTypeLabel} Upgrade Option 1`,
        make: targetTypeLabel,
        model: `${assessment.target_compressor_rating || assessment.compressor_rating || '0'} ${
          assessment.target_compressor_rating_unit || assessment.compressor_rating_unit
        }`,
        badge: annualEnergySavings >= 0 ? 'Recommended' : 'Review Input',
        energySavings: formatWholeNumber(annualEnergySavings),
        costSavings: formatWholeNumber(annualCostSavings),
        emissionSavings: formatWholeNumber(annualEmissionSavings),
        upgradeCost: formatWholeNumber(incrementalUpgradeCost),
        paybackYears: formatPaybackYears(paybackYears),
        efficiency: Math.round(targetEfficiency * 100),
        details: `${assessment.target_compressor_rating || assessment.compressor_rating || '0'} ${
          assessment.target_compressor_rating_unit || assessment.compressor_rating_unit
        } | ${Math.round(targetEfficiency * 100)}% efficiency | ${targetTypeLabel}`,
        marginalAbatementCost: formatMacValue(marginalAbatementCost),
        currentAnnualEnergy: formatWholeNumber(baselineAnnualEnergy),
        recommendedAnnualEnergy: formatWholeNumber(targetAnnualEnergy),
        currentAnnualCost: formatWholeNumber(baselineAnnualEnergy * electricityTariff),
        recommendedAnnualCost: formatWholeNumber(targetAnnualEnergy * electricityTariff),
      },
    ],
    summary: {
      totalEnergySavings: formatWholeNumber(annualEnergySavings),
      totalCostSavings: formatWholeNumber(annualCostSavings),
      totalEmissionSavings: Number((Math.max(0, annualEmissionSavings) / 1000).toFixed(2)),
      averagePayback: formatPaybackYears(paybackYears),
    },
  }
}

export function buildCompressorRecommendation(
  assessment: CompressorAssessment,
  compressors: CompressorCatalogItem[]
) {
  const currentRatingKw = normalizeCompressorRatingToKw(
    assessment.compressor_rating,
    assessment.compressor_rating_unit
  )
  const desiredTargetRatingKw =
    normalizeCompressorRatingToKw(
      assessment.target_compressor_rating || assessment.compressor_rating,
      assessment.target_compressor_rating_unit || assessment.compressor_rating_unit
    ) || currentRatingKw
  const currentEfficiency = getCompressorLeastEfficiency(assessment.current_compressor_type)
  const selectedTargetEfficiency = getCompressorTargetEfficiency(assessment.target_compressor_type)
  const loadFactor = (parsePositiveNumber(assessment.compressor_load_factor) || 80) / 100
  const operatingHours = parsePositiveNumber(assessment.compressor_operating_hours_year)
  const electricityTariff = parsePositiveNumber(assessment.compressor_electricity_tariff)
  const gridEmissionFactor =
    parsePositiveNumber(assessment.compressor_grid_emission_factor) || 0.71
  const compressorAge = parsePositiveNumber(assessment.years_of_operation_current_compressor)
  const targetLifetime = parsePositiveNumber(assessment.lifetime_of_target_compressor) || 10
  const minimumRequiredRatingKw = desiredTargetRatingKw || currentRatingKw

  const calculatedBaselineEnergy =
    currentRatingKw && currentEfficiency
      ? (currentRatingKw * operatingHours * loadFactor) / currentEfficiency
      : 0
  const baselineAnnualEnergy = calculatedBaselineEnergy

  const currentCapex =
    parsePositiveNumber(assessment.capex_of_current_compressor) ||
    getDefaultCompressorCapex(
      assessment.current_compressor_type,
      assessment.compressor_rating,
      assessment.compressor_rating_unit
    )
  const presentValueOfCurrentCompressor =
    currentCapex * Math.pow(1 - COMPRESSOR_DISCOUNT_RATE, compressorAge)
  const lifetimeDiscountFactor =
    (1 - Math.pow(1 + COMPRESSOR_DISCOUNT_RATE, -targetLifetime)) / COMPRESSOR_DISCOUNT_RATE

  const availableCandidates = compressors.filter((candidate) => {
    if (candidate.make === assessment.compressor_make && candidate.model === assessment.compressor_model) {
      return false
    }

    if (!Number.isFinite(candidate.rated_power_kw) || candidate.rated_power_kw <= 0) {
      return false
    }

    if (minimumRequiredRatingKw > 0 && candidate.rated_power_kw < minimumRequiredRatingKw * 0.95) {
      return false
    }

    return true
  })

  const rankedPositiveCandidates = availableCandidates
    .map((candidate) => {
      const targetEfficiency = getCompressorTargetEfficiency(candidate.benchmark_type)
      const targetAnnualEnergy =
        candidate.rated_power_kw && targetEfficiency
          ? (candidate.rated_power_kw * loadFactor * operatingHours) / targetEfficiency
          : 0
      const annualEnergySavings = baselineAnnualEnergy - targetAnnualEnergy
      const annualCostSavings = annualEnergySavings * electricityTariff
      const annualEmissionSavings = annualEnergySavings * gridEmissionFactor
      const targetCapex = getDefaultCompressorCapex(
        candidate.benchmark_type,
        candidate.rated_power_kw,
        'kW'
      )
      const incrementalUpgradeCost = targetCapex - presentValueOfCurrentCompressor
      const npvEnergySavings = annualCostSavings * lifetimeDiscountFactor
      const npvEmissionReduction = annualEmissionSavings * lifetimeDiscountFactor
      const paybackYears = calculatePaybackYears(incrementalUpgradeCost, annualCostSavings)
      const marginalAbatementCost =
        npvEmissionReduction > 0
          ? (incrementalUpgradeCost - npvEnergySavings) / npvEmissionReduction
          : Number.NaN

      return {
        candidate,
        targetEfficiency,
        ratingDifferenceKw: Math.abs(candidate.rated_power_kw - desiredTargetRatingKw),
        exactRating: Math.abs(candidate.rated_power_kw - desiredTargetRatingKw) < 0.001,
        matchesRequestedTargetType: candidate.benchmark_type === assessment.target_compressor_type,
        sameMake: candidate.make === assessment.compressor_make,
        metrics: {
          targetAnnualEnergy,
          annualEnergySavings,
          annualCostSavings,
          annualEmissionSavings,
          targetCapex,
          incrementalUpgradeCost,
          npvEnergySavings,
          npvEmissionReduction,
          paybackYears,
          marginalAbatementCost,
        },
      }
    })
    .filter(
      (entry) =>
        entry.metrics.annualEnergySavings > 0 &&
        entry.metrics.annualCostSavings > 0 &&
        entry.metrics.annualEmissionSavings > 0
    )
    .sort((left, right) => {
      const leftMac = Number.isFinite(left.metrics.marginalAbatementCost)
        ? left.metrics.marginalAbatementCost
        : Number.POSITIVE_INFINITY
      const rightMac = Number.isFinite(right.metrics.marginalAbatementCost)
        ? right.metrics.marginalAbatementCost
        : Number.POSITIVE_INFINITY

      if (leftMac !== rightMac) {
        return leftMac - rightMac
      }

      if (left.matchesRequestedTargetType !== right.matchesRequestedTargetType) {
        return left.matchesRequestedTargetType ? -1 : 1
      }

      if (left.ratingDifferenceKw !== right.ratingDifferenceKw) {
        return left.ratingDifferenceKw - right.ratingDifferenceKw
      }

      if (left.exactRating !== right.exactRating) {
        return left.exactRating ? -1 : 1
      }

      if (left.sameMake !== right.sameMake) {
        return left.sameMake ? -1 : 1
      }

      return left.candidate.model.localeCompare(right.candidate.model)
    })

  const shortlistedCandidates = rankedPositiveCandidates.reduce<
    CompressorRecommendationCandidate[]
  >((shortlist, entry) => {
    if (shortlist.length >= 3) {
      return shortlist
    }

    const isDuplicateModel = shortlist.some(
      (savedEntry) =>
        savedEntry.candidate.make === entry.candidate.make &&
        savedEntry.candidate.model === entry.candidate.model
    )

    if (!isDuplicateModel) {
      shortlist.push(entry)
    }

    return shortlist
  }, [])

  if (shortlistedCandidates.length === 0) {
    const targetAnnualEnergy =
      desiredTargetRatingKw && selectedTargetEfficiency
        ? (desiredTargetRatingKw * loadFactor * operatingHours) / selectedTargetEfficiency
        : 0
    const annualEnergySavings = baselineAnnualEnergy - targetAnnualEnergy
    const annualCostSavings = annualEnergySavings * electricityTariff
    const annualEmissionSavings = annualEnergySavings * gridEmissionFactor
    const targetCapex =
      parsePositiveNumber(assessment.capex_of_target_compressor) ||
      getDefaultCompressorCapex(
        assessment.target_compressor_type,
        assessment.target_compressor_rating || assessment.compressor_rating,
        assessment.target_compressor_rating_unit || assessment.compressor_rating_unit
      )
    const incrementalUpgradeCost = targetCapex - presentValueOfCurrentCompressor
    const npvEnergySavings = annualCostSavings * lifetimeDiscountFactor
    const npvEmissionReduction = annualEmissionSavings * lifetimeDiscountFactor
    const paybackYears = calculatePaybackYears(incrementalUpgradeCost, annualCostSavings)
    const marginalAbatementCost =
      npvEmissionReduction > 0
        ? (incrementalUpgradeCost - npvEnergySavings) / npvEmissionReduction
        : Number.NaN

    return buildManualFallbackRecommendation(
      assessment,
      baselineAnnualEnergy,
      electricityTariff,
      targetAnnualEnergy,
      annualEnergySavings,
      annualCostSavings,
      annualEmissionSavings,
      incrementalUpgradeCost,
      paybackYears,
      selectedTargetEfficiency,
      marginalAbatementCost
    )
  }

  const leadRecommendation = shortlistedCandidates[0]

  return {
    currentSystem: {
      type: getCompressorTypeLabel(assessment.current_compressor_type),
      rating: `${assessment.compressor_rating || '0'} ${assessment.compressor_rating_unit}`,
      make: assessment.compressor_make || 'Not specified',
      model: assessment.compressor_model || 'Not specified',
      annualEnergy: formatWholeNumber(baselineAnnualEnergy),
      annualCost: formatWholeNumber(baselineAnnualEnergy * electricityTariff),
    },
    recommendations: shortlistedCandidates.map((entry, index) => ({
      id: index + 1,
      name: `${getCompressorTypeLabel(entry.candidate.benchmark_type)} Upgrade Option ${index + 1}`,
      make: entry.candidate.make,
      model: entry.candidate.model,
      badge: index === 0 ? 'Top Recommendation' : 'Recommended',
      energySavings: formatWholeNumber(entry.metrics.annualEnergySavings),
      costSavings: formatWholeNumber(entry.metrics.annualCostSavings),
      emissionSavings: formatWholeNumber(entry.metrics.annualEmissionSavings),
      upgradeCost: formatWholeNumber(entry.metrics.incrementalUpgradeCost),
      paybackYears: formatPaybackYears(entry.metrics.paybackYears),
      efficiency: Math.round(entry.targetEfficiency * 100),
      details: `${entry.candidate.rated_power_kw} kW | ${Math.round(
        entry.targetEfficiency * 100
      )}% efficiency | ${entry.candidate.benchmark_type_label}`,
      marginalAbatementCost: formatMacValue(entry.metrics.marginalAbatementCost),
      currentAnnualEnergy: formatWholeNumber(baselineAnnualEnergy),
      recommendedAnnualEnergy: formatWholeNumber(entry.metrics.targetAnnualEnergy),
      currentAnnualCost: formatWholeNumber(baselineAnnualEnergy * electricityTariff),
      recommendedAnnualCost: formatWholeNumber(entry.metrics.targetAnnualEnergy * electricityTariff),
    })),
    summary: {
      totalEnergySavings: formatWholeNumber(leadRecommendation.metrics.annualEnergySavings),
      totalCostSavings: formatWholeNumber(leadRecommendation.metrics.annualCostSavings),
      totalEmissionSavings: Number(
        (Math.max(0, leadRecommendation.metrics.annualEmissionSavings) / 1000).toFixed(2)
      ),
      averagePayback: formatPaybackYears(leadRecommendation.metrics.paybackYears),
    },
  }
}
