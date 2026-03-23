import type {
  AssessmentCurrentSystemSnapshot,
  AssessmentRecommendationCardSnapshot,
  AssessmentRecommendationSummary,
} from '@/components/assessment/results/types'
import type { DGSetAssessment } from '@/hooks/use-assessment-storage'
import {
  getDGSetCatalogKey,
  getDGSpecificFuelConsumption,
  type DGSetCatalogItem,
} from '@/lib/dg-set-catalog'
import { getDefaultDGCapex } from '@/lib/assessment/dg-set-benchmarks'

export const DG_DEFAULTS = {
  powerFactor: 0.95,
  specificFuelConsumption: 0.26,
  dieselNetCalorificValueKwhPerLiter: 9.927,
  dieselEmissionFactorKgPerLiter: 2.66155,
  dieselRateInrPerLiter: 90,
  dualFuelKitCapexInr: 500000,
  dualFuelKitMaintenanceInrPerYear: 20000,
  dualFuelKitLifetimeYears: 10,
  discountFactorPercent: 8,
  dieselReplacementPercent: 70,
} as const

export const DG_REPLACEMENT_FUEL_OPTIONS = [
  { value: 'PNG', label: 'PNG' },
  { value: 'CNG', label: 'CNG' },
  { value: 'LPG', label: 'LPG' },
] as const

type DGReplacementFuel = (typeof DG_REPLACEMENT_FUEL_OPTIONS)[number]['value']

const DG_REPLACEMENT_FUEL_DATA: Record<
  DGReplacementFuel,
  {
    ncvKwhPerLiterEquivalent: number
    emissionFactorKgPerLiterEquivalent: number
    rateInrPerLiterEquivalent: number
    substitutionRange: string
  }
> = {
  PNG: {
    ncvKwhPerLiterEquivalent: 0.01,
    emissionFactorKgPerLiterEquivalent: 0.00208906,
    rateInrPerLiterEquivalent: 0.055,
    substitutionRange: '70-80%',
  },
  CNG: {
    ncvKwhPerLiterEquivalent: 2.224,
    emissionFactorKgPerLiterEquivalent: 0.4507,
    rateInrPerLiterEquivalent: 14,
    substitutionRange: '70-80%',
  },
  LPG: {
    ncvKwhPerLiterEquivalent: 6.761,
    emissionFactorKgPerLiterEquivalent: 1.55713,
    rateInrPerLiterEquivalent: 32,
    substitutionRange: '60-70%',
  },
}

interface DGCurrentBaselineMetrics {
  hasUserProvidedAnnualDieselConsumption: boolean
  manufacturer: string
  model: string
  ratedCapacityKva: number
  averageLoadPercent: number
  powerFactor: number
  averageLoadKva: number
  averageLoadOutputKw: number
  operatingHoursYear: number
  annualElectricityGeneratedKwh: number
  specificFuelConsumptionLPerKwh: number
  annualDieselConsumptionBeforeL: number
  annualEnergyConsumptionBeforeKwh: number
  annualEmissionsBeforeKg: number
  annualCostBeforeInr: number
  dieselRateInrPerLiter: number
  replacementFuelType: DGReplacementFuel
  dieselReplacementPercent: number
  dualFuelKitCapexInr: number
  dualFuelKitMaintenanceInrPerYear: number
  dualFuelKitLifetimeYears: number
  discountRate: number
  annuityFactor: number
}

interface DGSetRecommendationMetrics extends DGCurrentBaselineMetrics {
  candidateMake: string
  candidateModel: string
  candidateRatedCapacityKva: number
  candidateFuelConsumptionLphAtFullLoad: number
  candidateSpecificFuelConsumptionLPerKwh: number
  annualDieselConsumptionCandidateBeforeL: number
  annualEnergyConsumptionCandidateBeforeKwh: number
  annualDieselConsumptionAfterL: number
  annualDieselEnergyAfterKwh: number
  annualOtherFuelEnergyAfterKwh: number
  annualOtherFuelConsumptionAfterL: number
  annualDieselEmissionsAfterKg: number
  annualOtherFuelEmissionsAfterKg: number
  annualTotalEmissionsAfterKg: number
  annualDieselCostAfterInr: number
  annualOtherFuelCostAfterInr: number
  annualTotalCostAfterInr: number
  annualDieselSavingsL: number
  annualEmissionSavingsKg: number
  annualEmissionSavingsPercent: number
  annualCostSavingsInr: number
  annualCostSavingsPercent: number
  npvMaintenanceCostInr: number
  npvCostSavingsInr: number
  npvEmissionSavingsKg: number
  paybackYears: number
  marginalAbatementCostInrPerKg: number
  replacementFuelNcvKwhPerLiterEquivalent: number
  replacementFuelEmissionFactorKgPerLiterEquivalent: number
  replacementFuelRateInrPerLiterEquivalent: number
}

interface DGRecommendationCandidate {
  candidate: DGSetCatalogItem
  metrics: DGSetRecommendationMetrics
  capacityGapKva: number
  sameCurrentMake: boolean
}

export interface DGSetRecommendationResult {
  currentSystem: AssessmentCurrentSystemSnapshot
  recommendations: AssessmentRecommendationCardSnapshot[]
  summary: AssessmentRecommendationSummary
}

function parseNonNegativeNumber(value: string | number | null | undefined) {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value ?? '')
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function parsePositiveNumber(value: string | number | null | undefined) {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value ?? '')
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
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

function normalizeReplacementFuel(value: string | null | undefined): DGReplacementFuel {
  return DG_REPLACEMENT_FUEL_OPTIONS.find((fuel) => fuel.value === value)?.value ?? 'CNG'
}

function getCapacityToleranceKva(ratedCapacityKva: number) {
  if (ratedCapacityKva <= 25) {
    return 5
  }

  if (ratedCapacityKva <= 100) {
    return 10
  }

  return 20
}

function buildCurrentBaseline(assessment: DGSetAssessment): DGCurrentBaselineMetrics {
  const manufacturer = assessment.dg_manufacturer.trim() || 'User specified'
  const model = assessment.dg_model.trim() || 'DG Set'
  const ratedCapacityKva = parsePositiveNumber(assessment.dg_capacity_kva)
  const averageLoadPercent = Math.min(
    Math.max(parseNonNegativeNumber(assessment.current_loading_percent) || 75, 0),
    100
  )
  const powerFactor = parsePositiveNumber(assessment.power_factor) || DG_DEFAULTS.powerFactor
  const averageLoadKva = (ratedCapacityKva * averageLoadPercent) / 100
  const averageLoadOutputKw = averageLoadKva * powerFactor
  const operatingHoursYear = parsePositiveNumber(assessment.operating_hours_year) || 1000

  const annualElectricityGeneratedInput = parsePositiveNumber(
    assessment.annual_electricity_generated_kwh
  )
  const annualElectricityGeneratedKwh =
    annualElectricityGeneratedInput || averageLoadOutputKw * operatingHoursYear

  const specificFuelConsumptionLPerKwh =
    parsePositiveNumber(assessment.specific_fuel_consumption_l_per_kwh) ||
    DG_DEFAULTS.specificFuelConsumption

  const annualDieselConsumptionInput = parsePositiveNumber(assessment.annual_diesel_consumption_l)
  const hasUserProvidedAnnualDieselConsumption =
    assessment.has_annual_diesel_consumption_data === 'yes' && annualDieselConsumptionInput > 0
  const annualDieselConsumptionBeforeL =
    hasUserProvidedAnnualDieselConsumption
      ? annualDieselConsumptionInput
      : annualElectricityGeneratedKwh * specificFuelConsumptionLPerKwh

  const annualEnergyConsumptionBeforeKwh =
    annualDieselConsumptionBeforeL * DG_DEFAULTS.dieselNetCalorificValueKwhPerLiter
  const annualEmissionsBeforeKg =
    annualDieselConsumptionBeforeL * DG_DEFAULTS.dieselEmissionFactorKgPerLiter
  const dieselRateInrPerLiter =
    parsePositiveNumber(assessment.fuel_cost_per_liter) || DG_DEFAULTS.dieselRateInrPerLiter
  const annualCostBeforeInr = annualDieselConsumptionBeforeL * dieselRateInrPerLiter

  const replacementFuelType = normalizeReplacementFuel(assessment.fuel_type)
  const dieselReplacementPercent = Math.min(
    Math.max(
      parseNonNegativeNumber(assessment.diesel_replacement_percent) ||
        DG_DEFAULTS.dieselReplacementPercent,
      0
    ),
    100
  )
  const dualFuelKitCapexInr =
    parsePositiveNumber(assessment.dual_fuel_kit_capex_inr) ||
    getDefaultDGCapex(ratedCapacityKva) ||
    DG_DEFAULTS.dualFuelKitCapexInr
  const dualFuelKitMaintenanceInrPerYear =
    parseNonNegativeNumber(assessment.dual_fuel_kit_maintenance_inr_per_year) ||
    DG_DEFAULTS.dualFuelKitMaintenanceInrPerYear
  const dualFuelKitLifetimeYears =
    parsePositiveNumber(assessment.dual_fuel_kit_lifetime_years) ||
    DG_DEFAULTS.dualFuelKitLifetimeYears
  const discountRate =
    (parsePositiveNumber(assessment.discount_factor_percent) ||
      DG_DEFAULTS.discountFactorPercent) / 100
  const annuityFactor =
    discountRate > 0
      ? (1 - Math.pow(1 + discountRate, -dualFuelKitLifetimeYears)) / discountRate
      : dualFuelKitLifetimeYears

  return {
    hasUserProvidedAnnualDieselConsumption,
    manufacturer,
    model,
    ratedCapacityKva,
    averageLoadPercent,
    powerFactor,
    averageLoadKva,
    averageLoadOutputKw,
    operatingHoursYear,
    annualElectricityGeneratedKwh,
    specificFuelConsumptionLPerKwh,
    annualDieselConsumptionBeforeL,
    annualEnergyConsumptionBeforeKwh,
    annualEmissionsBeforeKg,
    annualCostBeforeInr,
    dieselRateInrPerLiter,
    replacementFuelType,
    dieselReplacementPercent,
    dualFuelKitCapexInr,
    dualFuelKitMaintenanceInrPerYear,
    dualFuelKitLifetimeYears,
    discountRate,
    annuityFactor,
  }
}

function calculateDGRecommendationMetrics(
  assessment: DGSetAssessment,
  currentBaseline: DGCurrentBaselineMetrics,
  candidate: DGSetCatalogItem | null
): DGSetRecommendationMetrics {
  const replacementFuel = DG_REPLACEMENT_FUEL_DATA[currentBaseline.replacementFuelType]
  const candidateMake = candidate?.make?.trim() || currentBaseline.manufacturer
  const candidateModel = candidate?.model?.trim() || currentBaseline.model
  const candidateRatedCapacityKva =
    candidate?.rated_capacity_kva && candidate.rated_capacity_kva > 0
      ? candidate.rated_capacity_kva
      : currentBaseline.ratedCapacityKva
  const candidateFuelConsumptionLphAtFullLoad =
    candidate?.fuel_consumption_lph_full_load && candidate.fuel_consumption_lph_full_load > 0
      ? candidate.fuel_consumption_lph_full_load
      : currentBaseline.specificFuelConsumptionLPerKwh *
        candidateRatedCapacityKva *
        currentBaseline.powerFactor
  const candidateSpecificFuelConsumptionLPerKwh =
    getDGSpecificFuelConsumption(candidate, currentBaseline.powerFactor) ??
    currentBaseline.specificFuelConsumptionLPerKwh

  const annualDieselConsumptionCandidateBeforeL = candidate
    ? currentBaseline.hasUserProvidedAnnualDieselConsumption &&
      currentBaseline.specificFuelConsumptionLPerKwh > 0
      ? currentBaseline.annualDieselConsumptionBeforeL *
        (candidateSpecificFuelConsumptionLPerKwh / currentBaseline.specificFuelConsumptionLPerKwh)
      : currentBaseline.annualElectricityGeneratedKwh * candidateSpecificFuelConsumptionLPerKwh
    : currentBaseline.annualDieselConsumptionBeforeL
  const annualEnergyConsumptionCandidateBeforeKwh =
    annualDieselConsumptionCandidateBeforeL * DG_DEFAULTS.dieselNetCalorificValueKwhPerLiter

  const annualDieselConsumptionAfterL =
    annualDieselConsumptionCandidateBeforeL * (1 - currentBaseline.dieselReplacementPercent / 100)
  const annualDieselEnergyAfterKwh =
    annualDieselConsumptionAfterL * DG_DEFAULTS.dieselNetCalorificValueKwhPerLiter
  const annualOtherFuelEnergyAfterKwh = Math.max(
    0,
    annualEnergyConsumptionCandidateBeforeKwh - annualDieselEnergyAfterKwh
  )
  const annualOtherFuelConsumptionAfterL =
    replacementFuel.ncvKwhPerLiterEquivalent > 0
      ? annualOtherFuelEnergyAfterKwh / replacementFuel.ncvKwhPerLiterEquivalent
      : 0

  const annualDieselEmissionsAfterKg =
    annualDieselConsumptionAfterL * DG_DEFAULTS.dieselEmissionFactorKgPerLiter
  const annualOtherFuelEmissionsAfterKg =
    annualOtherFuelConsumptionAfterL * replacementFuel.emissionFactorKgPerLiterEquivalent
  const annualTotalEmissionsAfterKg =
    annualDieselEmissionsAfterKg + annualOtherFuelEmissionsAfterKg

  const annualDieselCostAfterInr =
    annualDieselConsumptionAfterL * currentBaseline.dieselRateInrPerLiter
  const annualOtherFuelCostAfterInr =
    annualOtherFuelConsumptionAfterL * replacementFuel.rateInrPerLiterEquivalent
  const annualTotalCostAfterInr = annualDieselCostAfterInr + annualOtherFuelCostAfterInr

  const annualDieselSavingsL = Math.max(
    0,
    currentBaseline.annualDieselConsumptionBeforeL - annualDieselConsumptionAfterL
  )
  const annualEmissionSavingsKg = Math.max(
    0,
    currentBaseline.annualEmissionsBeforeKg - annualTotalEmissionsAfterKg
  )
  const annualEmissionSavingsPercent =
    currentBaseline.annualEmissionsBeforeKg > 0
      ? (annualEmissionSavingsKg / currentBaseline.annualEmissionsBeforeKg) * 100
      : 0
  const annualCostSavingsInr =
    currentBaseline.annualCostBeforeInr - annualTotalCostAfterInr
  const annualCostSavingsPercent =
    currentBaseline.annualCostBeforeInr > 0
      ? (annualCostSavingsInr / currentBaseline.annualCostBeforeInr) * 100
      : 0

  const npvMaintenanceCostInr =
    currentBaseline.dualFuelKitMaintenanceInrPerYear * currentBaseline.annuityFactor
  const npvCostSavingsInr = annualCostSavingsInr * currentBaseline.annuityFactor
  const npvEmissionSavingsKg = annualEmissionSavingsKg * currentBaseline.annuityFactor

  const paybackYears =
    annualCostSavingsInr > currentBaseline.dualFuelKitMaintenanceInrPerYear
      ? currentBaseline.dualFuelKitCapexInr /
        (annualCostSavingsInr - currentBaseline.dualFuelKitMaintenanceInrPerYear)
      : Number.NaN

  const marginalAbatementCostInrPerKg =
    npvEmissionSavingsKg > 0
      ? (currentBaseline.dualFuelKitCapexInr +
          npvMaintenanceCostInr -
          npvCostSavingsInr) /
        npvEmissionSavingsKg
      : Number.NaN

  return {
    ...currentBaseline,
    candidateMake,
    candidateModel,
    candidateRatedCapacityKva,
    candidateFuelConsumptionLphAtFullLoad,
    candidateSpecificFuelConsumptionLPerKwh,
    annualDieselConsumptionCandidateBeforeL,
    annualEnergyConsumptionCandidateBeforeKwh,
    annualDieselConsumptionAfterL,
    annualDieselEnergyAfterKwh,
    annualOtherFuelEnergyAfterKwh,
    annualOtherFuelConsumptionAfterL,
    annualDieselEmissionsAfterKg,
    annualOtherFuelEmissionsAfterKg,
    annualTotalEmissionsAfterKg,
    annualDieselCostAfterInr,
    annualOtherFuelCostAfterInr,
    annualTotalCostAfterInr,
    annualDieselSavingsL,
    annualEmissionSavingsKg,
    annualEmissionSavingsPercent,
    annualCostSavingsInr,
    annualCostSavingsPercent,
    npvMaintenanceCostInr,
    npvCostSavingsInr,
    npvEmissionSavingsKg,
    paybackYears,
    marginalAbatementCostInrPerKg,
    replacementFuelNcvKwhPerLiterEquivalent: replacementFuel.ncvKwhPerLiterEquivalent,
    replacementFuelEmissionFactorKgPerLiterEquivalent:
      replacementFuel.emissionFactorKgPerLiterEquivalent,
    replacementFuelRateInrPerLiterEquivalent: replacementFuel.rateInrPerLiterEquivalent,
  }
}

function compareDGRecommendationCandidates(
  left: DGRecommendationCandidate,
  right: DGRecommendationCandidate
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

  if (left.metrics.annualCostSavingsInr !== right.metrics.annualCostSavingsInr) {
    return right.metrics.annualCostSavingsInr - left.metrics.annualCostSavingsInr
  }

  if (left.metrics.annualEmissionSavingsKg !== right.metrics.annualEmissionSavingsKg) {
    return right.metrics.annualEmissionSavingsKg - left.metrics.annualEmissionSavingsKg
  }

  if (left.capacityGapKva !== right.capacityGapKva) {
    return left.capacityGapKva - right.capacityGapKva
  }

  if (
    left.metrics.candidateFuelConsumptionLphAtFullLoad !==
    right.metrics.candidateFuelConsumptionLphAtFullLoad
  ) {
    return (
      left.metrics.candidateFuelConsumptionLphAtFullLoad -
      right.metrics.candidateFuelConsumptionLphAtFullLoad
    )
  }

  if (left.sameCurrentMake !== right.sameCurrentMake) {
    return left.sameCurrentMake ? -1 : 1
  }

  if (left.candidate.make !== right.candidate.make) {
    return left.candidate.make.localeCompare(right.candidate.make)
  }

  return left.candidate.model.localeCompare(right.candidate.model)
}

function selectDiversifiedDGCandidates(candidates: DGRecommendationCandidate[], limit: number) {
  const sortedCandidates = [...candidates].sort(compareDGRecommendationCandidates)

  if (sortedCandidates.length <= limit) {
    return sortedCandidates
  }

  const selected: DGRecommendationCandidate[] = []
  const usedKeys = new Set<string>()
  const usedMakes = new Set<string>()

  const addCandidate = (entry?: DGRecommendationCandidate) => {
    if (!entry) {
      return false
    }

    const key = getDGSetCatalogKey(entry.candidate)

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

function buildCurrentSystem(metrics: DGCurrentBaselineMetrics): AssessmentCurrentSystemSnapshot {
  return {
    type: 'Diesel Generator Set',
    rating: `${formatWholeNumber(metrics.ratedCapacityKva)} kVA | ${formatWholeNumber(metrics.averageLoadPercent)}% avg load`,
    make: metrics.manufacturer,
    model: metrics.model,
    annualEnergy: formatWholeNumber(metrics.annualEnergyConsumptionBeforeKwh),
    annualCost: formatWholeNumber(metrics.annualCostBeforeInr),
  }
}

function buildRecommendationSnapshot(
  metrics: DGSetRecommendationMetrics,
  index: number,
  badge: string
): AssessmentRecommendationCardSnapshot {
  return {
    id: index + 1,
    name: `DG Upgrade Option ${index + 1}`,
    make: metrics.candidateMake,
    model: metrics.candidateModel,
    badge,
    energySavings: formatWholeNumber(metrics.annualDieselSavingsL),
    costSavings: formatWholeNumber(metrics.annualCostSavingsInr),
    emissionSavings: formatWholeNumber(metrics.annualEmissionSavingsKg),
    upgradeCost: formatWholeNumber(metrics.dualFuelKitCapexInr),
    paybackYears: formatPaybackYears(metrics.paybackYears),
    efficiency: Math.max(0, Math.round(metrics.annualEmissionSavingsPercent)),
    details: `${formatWholeNumber(metrics.candidateRatedCapacityKva)} kVA | ${metrics.candidateFuelConsumptionLphAtFullLoad.toFixed(1)} L/hr @100% | ${metrics.replacementFuelType} dual fuel retrofit`,
    marginalAbatementCost: formatMacValue(metrics.marginalAbatementCostInrPerKg),
    recommendedAnnualEnergy: formatWholeNumber(metrics.annualEnergyConsumptionCandidateBeforeKwh),
    currentAnnualCost: formatWholeNumber(metrics.annualCostBeforeInr),
    recommendedAnnualCost: formatWholeNumber(metrics.annualTotalCostAfterInr),
    currentAnnualEmissions: formatWholeNumber(metrics.annualEmissionsBeforeKg),
    recommendedAnnualEmissions: formatWholeNumber(metrics.annualTotalEmissionsAfterKg),
  }
}

function buildSummary(metrics: DGSetRecommendationMetrics): AssessmentRecommendationSummary {
  return {
    totalEnergySavings: formatWholeNumber(metrics.annualDieselSavingsL),
    totalCostSavings: formatWholeNumber(metrics.annualCostSavingsInr),
    totalEmissionSavings: Number((Math.max(0, metrics.annualEmissionSavingsKg) / 1000).toFixed(2)),
    averagePayback: formatPaybackYears(metrics.paybackYears),
    energyLabel: 'Diesel Savings',
    energyUnit: 'L/year',
    costLabel: 'Fuel Cost Savings',
    costUnit: '/year',
    emissionsLabel: 'CO2 Reduction',
    emissionsUnit: 'tCO2e/year',
    paybackLabel: 'Payback Period',
    paybackUnit: 'years',
  }
}

export function buildDGSetRecommendation(
  assessment: DGSetAssessment,
  dgSets: DGSetCatalogItem[] = []
): DGSetRecommendationResult {
  const currentBaseline = buildCurrentBaseline(assessment)
  const currentCatalogKey = assessment.dg_catalog_key
  const requiredAverageLoadKva =
    currentBaseline.powerFactor > 0
      ? currentBaseline.averageLoadOutputKw / currentBaseline.powerFactor
      : currentBaseline.averageLoadKva
  const capacityToleranceKva = getCapacityToleranceKva(currentBaseline.ratedCapacityKva || 25)

  const candidatePool = dgSets
    .filter((candidate) => {
      const candidateCapacity = candidate.rated_capacity_kva ?? 0
      const candidateKey = getDGSetCatalogKey(candidate)

      return (
        candidateKey !== currentCatalogKey &&
        candidateCapacity > 0 &&
        (candidate.fuel_consumption_lph_full_load ?? 0) > 0 &&
        candidateCapacity >= Math.max(requiredAverageLoadKva, 1)
      )
    })
    .map((candidate) => {
      const metrics = calculateDGRecommendationMetrics(assessment, currentBaseline, candidate)
      const capacityGapKva = Math.abs(
        (candidate.rated_capacity_kva ?? currentBaseline.ratedCapacityKva) -
          currentBaseline.ratedCapacityKva
      )

      if (
        metrics.annualDieselSavingsL <= 0 ||
        metrics.annualCostSavingsInr <= 0 ||
        metrics.annualEmissionSavingsKg <= 0
      ) {
        return null
      }

      return {
        candidate,
        metrics,
        capacityGapKva,
        sameCurrentMake:
          candidate.make.trim().toLowerCase() === currentBaseline.manufacturer.trim().toLowerCase(),
      }
    })
    .filter((candidate): candidate is DGRecommendationCandidate => candidate !== null)

  const closeCapacityCandidates = candidatePool.filter(
    (candidate) => candidate.capacityGapKva <= capacityToleranceKva
  )

  const shortlistedCandidates = selectDiversifiedDGCandidates(
    closeCapacityCandidates.length > 0 ? closeCapacityCandidates : candidatePool,
    3
  )

  if (shortlistedCandidates.length === 0) {
    const fallbackMetrics = calculateDGRecommendationMetrics(assessment, currentBaseline, null)

    return {
      currentSystem: buildCurrentSystem(currentBaseline),
      recommendations: [
        {
          ...buildRecommendationSnapshot(fallbackMetrics, 0, 'Scenario-based recommendation'),
          name: 'Dual Fuel Kit Retrofit',
          make: currentBaseline.manufacturer,
          model: currentBaseline.model,
        },
      ],
      summary: buildSummary(fallbackMetrics),
    }
  }

  return {
    currentSystem: buildCurrentSystem(currentBaseline),
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
