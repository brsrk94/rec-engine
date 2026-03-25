import type {
  AssessmentCurrentSystemSnapshot,
  AssessmentRecommendationCardSnapshot,
  AssessmentRecommendationSummary,
} from '@/components/assessment/results/types'
import type { AirConditionerAssessment } from '@/hooks/use-assessment-storage'
import {
  convertCapacityToKw,
  convertCapacityToTon,
  getAirConditionerCatalogKey,
  type AirConditionerCatalogItem,
  type AirConditionerStarRating,
  type AirConditionerType,
} from '@/lib/air-conditioner-catalog'
import {
  AIR_CONDITIONER_DEFAULTS,
  getAirConditionerStarLabel,
  getAirConditionerTypeLabel,
  getDefaultAirConditionerCapex,
  getDefaultAirConditionerISEER,
  normalizeAirConditionerStarRating,
  normalizeAirConditionerType,
} from '@/lib/assessment/air-conditioner-benchmarks'

interface AirConditionerScenarioMetrics {
  currentMake: string
  currentModel: string
  targetMake: string
  targetModel: string
  currentType: AirConditionerType
  targetType: AirConditionerType
  currentStarRating: AirConditionerStarRating
  targetStarRating: AirConditionerStarRating
  currentCapacityKw: number
  currentCapacityTon: number
  targetCapacityKw: number
  targetCapacityTon: number
  operatingHoursYear: number
  loadFactorFraction: number
  electricityTariffInrPerKwh: number
  gridEmissionFactorKgPerKwh: number
  currentCapexInr: number
  targetCapexInr: number
  ageYears: number
  lifetimeYears: number
  discountRate: number
  currentIseer: number
  targetIseer: number
  annualCoolingOutputKwh: number
  currentAnnualEnergyKwh: number
  targetAnnualEnergyKwh: number
  annualEnergySavingsKwh: number
  currentAnnualCostInr: number
  targetAnnualCostInr: number
  annualCostSavingsInr: number
  currentAnnualEmissionsKg: number
  targetAnnualEmissionsKg: number
  annualEmissionSavingsKg: number
  presentValueCurrentAirConditionerInr: number
  incrementalUpgradeCostInr: number
  lifetimeDiscountFactor: number
  npvEnergyCostSavingsInr: number
  npvEmissionSavingsKg: number
  paybackYears: number
  marginalAbatementCostInrPerKg: number
}

interface AirConditionerRecommendationCandidate {
  candidate: AirConditionerCatalogItem
  metrics: AirConditionerScenarioMetrics
  capacityGapTon: number
  starRating: number
  sameCurrentMake: boolean
}

export interface AirConditionerRecommendationResult {
  currentSystem: AssessmentCurrentSystemSnapshot
  recommendations: AssessmentRecommendationCardSnapshot[]
  summary: AssessmentRecommendationSummary
}

const CATALOG_BACKED_AC_TYPES = new Set<AirConditionerType>([
  'split_fixed_speed',
  'split_inverter',
])

function parsePositiveNumber(value: string | number | null | undefined) {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value ?? '')
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function parsePercentage(value: string | number | null | undefined, fallbackPercent: number) {
  const parsed = parsePositiveNumber(value)
  const normalizedPercent = parsed || fallbackPercent
  return Math.min(Math.max(normalizedPercent, 0), 100) / 100
}

function formatWholeNumber(value: number) {
  return Math.round(value)
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

function formatCapacityValue(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 'N/A'
  }

  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}

function formatCapacityLabel(capacityTon: number, capacityKw: number) {
  if (capacityTon > 0) {
    return `${formatCapacityValue(capacityTon)} TR`
  }

  if (capacityKw > 0) {
    return `${formatCapacityValue(capacityKw)} kW`
  }

  return 'Capacity N/A'
}

function getCapacityToleranceTon(capacityTon: number) {
  if (capacityTon <= 1) {
    return 0.35
  }

  if (capacityTon <= 2) {
    return 0.5
  }

  if (capacityTon <= 4) {
    return 0.75
  }

  return 1.25
}

function normalizeAssessmentType(value: string | null | undefined, fallback: AirConditionerType) {
  return normalizeAirConditionerType(value) ?? fallback
}

function normalizeAssessmentStarRating(
  value: string | number | null | undefined,
  fallback: AirConditionerStarRating
) {
  return normalizeAirConditionerStarRating(value) ?? fallback
}

export function calculateAirConditionerScenario(
  assessment: AirConditionerAssessment,
  catalogCandidate: AirConditionerCatalogItem | null = null
): AirConditionerScenarioMetrics {
  const currentType = normalizeAssessmentType(assessment.current_ac_type, 'split_fixed_speed')
  const targetType = catalogCandidate
    ? catalogCandidate.normalized_ac_type
    : normalizeAssessmentType(assessment.target_ac_type, currentType)
  const currentStarRating = normalizeAssessmentStarRating(assessment.current_ac_star_rating, '3')
  const targetStarRating = catalogCandidate
    ? normalizeAssessmentStarRating(catalogCandidate.star_rating, '3')
    : normalizeAssessmentStarRating(assessment.target_ac_star_rating, currentStarRating)

  const currentCapacityInput = parsePositiveNumber(assessment.current_cooling_capacity)
  const targetCapacityInput = parsePositiveNumber(assessment.target_ac_capacity) || currentCapacityInput
  const currentCapacityKw = convertCapacityToKw(
    currentCapacityInput,
    assessment.current_cooling_capacity_unit
  )
  const currentCapacityTon = convertCapacityToTon(
    currentCapacityInput,
    assessment.current_cooling_capacity_unit
  )
  const catalogTargetCapacityTon = catalogCandidate?.capacity_ton ?? 0
  const catalogTargetCapacityKw =
    catalogCandidate?.cooling_capacity_kw ??
    convertCapacityToKw(catalogTargetCapacityTon, 'TR')
  const targetCapacityKw = catalogCandidate
    ? catalogTargetCapacityKw
    : convertCapacityToKw(targetCapacityInput, assessment.target_ac_capacity_unit)
  const targetCapacityTon = catalogCandidate
    ? catalogTargetCapacityTon
    : convertCapacityToTon(targetCapacityInput, assessment.target_ac_capacity_unit)

  const operatingHoursYear =
    parsePositiveNumber(assessment.operating_hours_year) ||
    AIR_CONDITIONER_DEFAULTS.operatingHoursYear
  const loadFactorFraction = parsePercentage(
    assessment.load_factor,
    AIR_CONDITIONER_DEFAULTS.loadFactorPercent
  )
  const electricityTariffInrPerKwh =
    parsePositiveNumber(assessment.electricity_tariff) ||
    AIR_CONDITIONER_DEFAULTS.electricityTariffInrPerKwh
  const gridEmissionFactorKgPerKwh =
    parsePositiveNumber(assessment.grid_emission_factor) ||
    AIR_CONDITIONER_DEFAULTS.gridEmissionFactorKgPerKwh
  const ageYears = parsePositiveNumber(assessment.current_ac_age_years)
  const lifetimeYears =
    parsePositiveNumber(assessment.lifetime_of_target_ac) || AIR_CONDITIONER_DEFAULTS.lifetimeYears
  const discountRate =
    parsePercentage(
      assessment.discount_rate_percent,
      AIR_CONDITIONER_DEFAULTS.discountRatePercent
    ) || AIR_CONDITIONER_DEFAULTS.discountRatePercent / 100

  const currentCapexInr =
    parsePositiveNumber(assessment.capex_of_current_ac) ||
    getDefaultAirConditionerCapex(currentType, currentStarRating, currentCapacityTon)
  const targetCapexInr =
    parsePositiveNumber(assessment.capex_of_target_ac) ||
    getDefaultAirConditionerCapex(
      targetType,
      targetStarRating,
      targetCapacityTon || currentCapacityTon
    )

  const currentIseer = getDefaultAirConditionerISEER(currentStarRating, currentType)
  const targetIseer = getDefaultAirConditionerISEER(targetStarRating, targetType)
  const annualCoolingOutputKwh = currentCapacityKw * operatingHoursYear
  const currentAnnualEnergyKwh =
    currentIseer > 0 ? annualCoolingOutputKwh / currentIseer : Number.NaN
  const targetAnnualEnergyKwh =
    targetIseer > 0 ? annualCoolingOutputKwh / targetIseer : Number.NaN
  const annualEnergySavingsKwh = currentAnnualEnergyKwh - targetAnnualEnergyKwh

  const currentAnnualCostInr = currentAnnualEnergyKwh * electricityTariffInrPerKwh
  const targetAnnualCostInr = targetAnnualEnergyKwh * electricityTariffInrPerKwh
  const annualCostSavingsInr = currentAnnualCostInr - targetAnnualCostInr

  const currentAnnualEmissionsKg = currentAnnualEnergyKwh * gridEmissionFactorKgPerKwh
  const targetAnnualEmissionsKg = targetAnnualEnergyKwh * gridEmissionFactorKgPerKwh
  const annualEmissionSavingsKg = currentAnnualEmissionsKg - targetAnnualEmissionsKg

  const presentValueCurrentAirConditionerInr =
    currentCapexInr * Math.pow(Math.max(0, 1 - discountRate), ageYears)
  const incrementalUpgradeCostInr = targetCapexInr - presentValueCurrentAirConditionerInr
  const lifetimeDiscountFactor =
    discountRate > 0
      ? (1 - Math.pow(1 + discountRate, -lifetimeYears)) / discountRate
      : lifetimeYears
  const npvEnergyCostSavingsInr = annualCostSavingsInr * lifetimeDiscountFactor
  const npvEmissionSavingsKg = annualEmissionSavingsKg * lifetimeDiscountFactor
  const paybackYears =
    annualCostSavingsInr > 0 ? Math.max(0, incrementalUpgradeCostInr) / annualCostSavingsInr : Number.NaN
  const marginalAbatementCostInrPerKg =
    npvEmissionSavingsKg > 0
      ? (incrementalUpgradeCostInr - npvEnergyCostSavingsInr) / npvEmissionSavingsKg
      : Number.NaN

  return {
    currentMake: assessment.current_ac_make.trim() || 'User specified',
    currentModel: assessment.current_ac_model.trim() || 'Current AC',
    targetMake: catalogCandidate?.make?.trim() || 'Target AC',
    targetModel: catalogCandidate?.model?.trim() || 'User-defined specification',
    currentType,
    targetType,
    currentStarRating,
    targetStarRating,
    currentCapacityKw,
    currentCapacityTon,
    targetCapacityKw,
    targetCapacityTon,
    operatingHoursYear,
    loadFactorFraction,
    electricityTariffInrPerKwh,
    gridEmissionFactorKgPerKwh,
    currentCapexInr,
    targetCapexInr,
    ageYears,
    lifetimeYears,
    discountRate,
    currentIseer,
    targetIseer,
    annualCoolingOutputKwh,
    currentAnnualEnergyKwh,
    targetAnnualEnergyKwh,
    annualEnergySavingsKwh,
    currentAnnualCostInr,
    targetAnnualCostInr,
    annualCostSavingsInr,
    currentAnnualEmissionsKg,
    targetAnnualEmissionsKg,
    annualEmissionSavingsKg,
    presentValueCurrentAirConditionerInr,
    incrementalUpgradeCostInr,
    lifetimeDiscountFactor,
    npvEnergyCostSavingsInr,
    npvEmissionSavingsKg,
    paybackYears,
    marginalAbatementCostInrPerKg,
  }
}

function compareAirConditionerCandidates(
  left: AirConditionerRecommendationCandidate,
  right: AirConditionerRecommendationCandidate
) {
  const leftMac = Number.isFinite(left.metrics.marginalAbatementCostInrPerKg)
    ? left.metrics.marginalAbatementCostInrPerKg
    : Number.POSITIVE_INFINITY
  const rightMac = Number.isFinite(right.metrics.marginalAbatementCostInrPerKg)
    ? right.metrics.marginalAbatementCostInrPerKg
    : Number.POSITIVE_INFINITY

  if (leftMac !== rightMac) {
    return leftMac - rightMac
  }

  if (left.capacityGapTon !== right.capacityGapTon) {
    return left.capacityGapTon - right.capacityGapTon
  }

  if (left.starRating !== right.starRating) {
    return right.starRating - left.starRating
  }

  if (left.metrics.targetAnnualEnergyKwh !== right.metrics.targetAnnualEnergyKwh) {
    return left.metrics.targetAnnualEnergyKwh - right.metrics.targetAnnualEnergyKwh
  }

  if (left.sameCurrentMake !== right.sameCurrentMake) {
    return left.sameCurrentMake ? -1 : 1
  }

  if (left.candidate.make !== right.candidate.make) {
    return left.candidate.make.localeCompare(right.candidate.make)
  }

  return left.candidate.model.localeCompare(right.candidate.model)
}

function selectDiversifiedAirConditionerCandidates(
  candidates: AirConditionerRecommendationCandidate[],
  limit: number
) {
  const sortedCandidates = [...candidates].sort(compareAirConditionerCandidates)

  if (sortedCandidates.length <= limit) {
    return sortedCandidates
  }

  const selected: AirConditionerRecommendationCandidate[] = []
  const usedKeys = new Set<string>()
  const usedMakes = new Set<string>()

  const addCandidate = (entry?: AirConditionerRecommendationCandidate) => {
    if (!entry) {
      return false
    }

    const key = getAirConditionerCatalogKey(entry.candidate)

    if (usedKeys.has(key)) {
      return false
    }

    selected.push(entry)
    usedKeys.add(key)
    usedMakes.add(entry.candidate.make)
    return true
  }

  addCandidate(sortedCandidates[0])

  for (const entry of sortedCandidates) {
    if (selected.length >= limit) {
      break
    }

    if (usedMakes.has(entry.candidate.make)) {
      continue
    }

    addCandidate(entry)
  }

  for (const entry of sortedCandidates) {
    if (selected.length >= limit) {
      break
    }

    addCandidate(entry)
  }

  return selected.slice(0, limit)
}

function buildCurrentSystem(metrics: AirConditionerScenarioMetrics): AssessmentCurrentSystemSnapshot {
  return {
    type: getAirConditionerTypeLabel(metrics.currentType),
    rating: `${formatCapacityLabel(metrics.currentCapacityTon, metrics.currentCapacityKw)} | ${getAirConditionerStarLabel(metrics.currentStarRating)}`,
    make: metrics.currentMake,
    model: metrics.currentModel,
    annualEnergy: formatWholeNumber(metrics.currentAnnualEnergyKwh),
    annualCost: formatWholeNumber(metrics.currentAnnualCostInr),
  }
}

function buildRecommendationSnapshot(
  metrics: AirConditionerScenarioMetrics,
  index: number,
  badge: string
): AssessmentRecommendationCardSnapshot {
  const energySavingsPercent =
    metrics.currentAnnualEnergyKwh > 0
      ? (metrics.annualEnergySavingsKwh / metrics.currentAnnualEnergyKwh) * 100
      : 0

  return {
    id: index + 1,
    name: `Air Conditioner Recommendation ${index + 1}`,
    make: metrics.targetMake,
    model: metrics.targetModel,
    badge,
    energySavings: formatWholeNumber(metrics.annualEnergySavingsKwh),
    costSavings: formatWholeNumber(metrics.annualCostSavingsInr),
    emissionSavings: formatWholeNumber(metrics.annualEmissionSavingsKg),
    upgradeCost: Math.round(metrics.incrementalUpgradeCostInr),
    paybackYears: formatPaybackYears(metrics.paybackYears),
    efficiency: Math.max(0, Math.round(energySavingsPercent)),
    details: `${getAirConditionerTypeLabel(metrics.targetType)} | ${formatCapacityLabel(metrics.targetCapacityTon, metrics.targetCapacityKw)} | ${getAirConditionerStarLabel(metrics.targetStarRating)} | ISEER ${metrics.targetIseer.toFixed(2)}`,
    marginalAbatementCost: formatMacValue(metrics.marginalAbatementCostInrPerKg),
    currentAnnualEnergy: formatWholeNumber(metrics.currentAnnualEnergyKwh),
    recommendedAnnualEnergy: formatWholeNumber(metrics.targetAnnualEnergyKwh),
    currentAnnualCost: formatWholeNumber(metrics.currentAnnualCostInr),
    recommendedAnnualCost: formatWholeNumber(metrics.targetAnnualCostInr),
    currentAnnualEmissions: formatWholeNumber(metrics.currentAnnualEmissionsKg),
    recommendedAnnualEmissions: formatWholeNumber(metrics.targetAnnualEmissionsKg),
  }
}

function buildSummary(metrics: AirConditionerScenarioMetrics): AssessmentRecommendationSummary {
  return {
    totalEnergySavings: formatWholeNumber(metrics.annualEnergySavingsKwh),
    totalCostSavings: formatWholeNumber(metrics.annualCostSavingsInr),
    totalEmissionSavings: Number((Math.max(0, metrics.annualEmissionSavingsKg) / 1000).toFixed(2)),
    averagePayback: formatPaybackYears(metrics.paybackYears),
  }
}

export function buildAirConditionerRecommendation(
  assessment: AirConditionerAssessment,
  airConditioners: AirConditionerCatalogItem[] = []
): AirConditionerRecommendationResult {
  const baseMetrics = calculateAirConditionerScenario(assessment)
  const requestedTargetType = normalizeAssessmentType(assessment.target_ac_type, baseMetrics.targetType)
  const requestedTargetStarRating = normalizeAssessmentStarRating(
    assessment.target_ac_star_rating,
    baseMetrics.targetStarRating
  )
  const requestedTargetCapacityTon =
    parsePositiveNumber(assessment.target_ac_capacity) > 0
      ? convertCapacityToTon(
          parsePositiveNumber(assessment.target_ac_capacity),
          assessment.target_ac_capacity_unit
        )
      : baseMetrics.currentCapacityTon
  const capacityToleranceTon = getCapacityToleranceTon(requestedTargetCapacityTon || baseMetrics.currentCapacityTon)

  const candidatePool = CATALOG_BACKED_AC_TYPES.has(requestedTargetType)
    ? airConditioners
        .map((candidate) => {
          const candidateMetrics = calculateAirConditionerScenario(assessment, candidate)
          const starRating = Number(
            normalizeAirConditionerStarRating(candidate.star_rating) ?? requestedTargetStarRating
          )
          const capacityGapTon = Math.abs(
            (candidate.capacity_ton ?? candidateMetrics.targetCapacityTon) - requestedTargetCapacityTon
          )

          if (
            candidateMetrics.annualEnergySavingsKwh <= 0 ||
            candidateMetrics.annualCostSavingsInr <= 0 ||
            candidateMetrics.annualEmissionSavingsKg <= 0
          ) {
            return null
          }

          return {
            candidate,
            metrics: candidateMetrics,
            capacityGapTon,
            starRating,
            sameCurrentMake:
              candidate.make.trim().toLowerCase() === baseMetrics.currentMake.trim().toLowerCase(),
          }
        })
        .filter(
          (candidate): candidate is AirConditionerRecommendationCandidate => candidate !== null
        )
    : []

  const matchingTypeCandidates = candidatePool.filter(
    (candidate) => candidate.candidate.normalized_ac_type === requestedTargetType
  )
  const closeCapacityCandidates = matchingTypeCandidates.filter(
    (candidate) => candidate.capacityGapTon <= capacityToleranceTon
  )
  const matchingStarCandidates = closeCapacityCandidates.filter(
    (candidate) => candidate.starRating >= Number(requestedTargetStarRating)
  )

  const shortlistedCandidates = selectDiversifiedAirConditionerCandidates(
    matchingStarCandidates.length > 0
      ? matchingStarCandidates
      : closeCapacityCandidates.length > 0
        ? closeCapacityCandidates
        : matchingTypeCandidates.length > 0
          ? matchingTypeCandidates
          : candidatePool.filter((candidate) => candidate.capacityGapTon <= capacityToleranceTon),
    3
  )

  if (shortlistedCandidates.length === 0) {
    return {
      currentSystem: buildCurrentSystem(baseMetrics),
      recommendations: [
        {
          ...buildRecommendationSnapshot(baseMetrics, 0, 'Scenario-based recommendation'),
          name: 'High-Efficiency AC Upgrade',
          make: getAirConditionerTypeLabel(baseMetrics.targetType),
          model: `${getAirConditionerStarLabel(baseMetrics.targetStarRating)} target scenario`,
        },
      ],
      summary: buildSummary(baseMetrics),
    }
  }

  return {
    currentSystem: buildCurrentSystem(baseMetrics),
    recommendations: shortlistedCandidates.map((candidate, index) =>
      buildRecommendationSnapshot(
        candidate.metrics,
        index,
        index === 0 ? 'Top Recommendation' : 'Recommended'
      )
    ),
    summary: buildSummary(shortlistedCandidates[0].metrics),
  }
}
