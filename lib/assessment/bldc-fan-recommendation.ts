import type { BLDCFanAssessment } from '@/hooks/use-assessment-storage'
import { getBLDCFanPowerWatts, type BLDCFanCatalogItem } from '@/lib/bldc-fan-catalog'

export const BLDC_FAN_ROOM_SIZE_OPTIONS = [
  {
    value: 'small',
    label: 'Small',
    areaLabel: 'Up to 75 sq. ft',
    sweepSizeLabel: '600-900 mm',
    approxFans: 1,
    capexMinInr: 2500,
    capexMaxInr: 6500,
    defaultDimensionsLabel: 'Approx. compact room',
  },
  {
    value: 'medium',
    label: 'Medium',
    areaLabel: '75-200 sq. ft',
    sweepSizeLabel: '1050-1200 mm',
    approxFans: 2,
    capexMinInr: 5000,
    capexMaxInr: 13000,
    defaultDimensionsLabel: 'Approx. mid-sized room',
  },
  {
    value: 'large',
    label: 'Large',
    areaLabel: '>200 sq. ft',
    sweepSizeLabel: '1250 mm',
    approxFans: 3,
    capexMinInr: 7500,
    capexMaxInr: 19500,
    defaultDimensionsLabel: 'Default 16 x 16 ft room',
  },
] as const

export type BLDCFanRoomSize = (typeof BLDC_FAN_ROOM_SIZE_OPTIONS)[number]['value']

interface BLDCFanScenarioMetrics {
  roomSize: (typeof BLDC_FAN_ROOM_SIZE_OPTIONS)[number]
  conventionalFanMake: string
  conventionalFanModel: string
  conventionalPowerRatingW: number
  dailyRuntimeHours: number
  workingDaysPerYear: number
  annualRuntimeHours: number
  electricityTariffInrPerKwh: number
  gridEmissionFactorKgPerKwh: number
  bldcFanMake: string
  bldcFanModel: string
  bldcPowerRatingW: number
  bldcSweepMm: number
  bldcAirDeliveryCmm: number
  bldcRatedSpeedRpm: number
  numberOfFansToSwitch: number
  capexBldcFanInrPerFan: number
  bldcInstallationCostInrPerFan: number
  conventionalInstallationCostInrPerFan: number
  currentYearsOfOperation: number
  discountFactor: number
  typicalLifetimeYears: number
  currentEnergyPerHourKwh: number
  currentAnnualEnergyPerFanKwh: number
  currentAnnualExpenditurePerFanInr: number
  currentEmissionsPerFanKg: number
  bldcEnergyPerHourKwh: number
  bldcAnnualEnergyPerFanKwh: number
  bldcAnnualExpenditurePerFanInr: number
  bldcEmissionsPerFanKg: number
  annualEnergySavingsPerFanKwh: number
  annualEnergyCostSavingsPerFanInr: number
  energyCostSavingsPercent: number
  annualEmissionsReducedPerFanKg: number
  emissionsSavedPercent: number
  totalCurrentAnnualEnergyKwh: number
  totalBLDCAnnualEnergyKwh: number
  totalCurrentAnnualExpenditureInr: number
  totalBLDCAnnualExpenditureInr: number
  totalCurrentEmissionsKg: number
  totalBLDCEmissionsKg: number
  totalCostSavingsPerAnnumInr: number
  totalEmissionsSavedPerAnnumKg: number
  totalCapexRequiredInr: number
  paybackYears: number
  presentValueConventionalFanInr: number
  incrementalCostPerFanInr: number
  lifetimeDiscountFactor: number
  npvEnergyCostSavingsPerFanInr: number
  npvEmissionsSavedPerFanKg: number
  marginalAbatementCostInrPerKg: number
}

interface BLDCFanRecommendationCandidate {
  candidate: BLDCFanCatalogItem
  metrics: BLDCFanScenarioMetrics
  roomFitGapMm: number
  sameSelectedMake: boolean
  sameSelectedModel: boolean
  powerRatingW: number
  airDeliveryCmm: number
}

function parsePositiveNumber(value: string) {
  const parsed = Number.parseFloat(value)
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

export function getBLDCFanRoomSizeConfig(roomSize: string | null | undefined) {
  return (
    BLDC_FAN_ROOM_SIZE_OPTIONS.find((option) => option.value === roomSize) ??
    BLDC_FAN_ROOM_SIZE_OPTIONS[2]
  )
}

function getRecommendedSweepRange(roomSize: ReturnType<typeof getBLDCFanRoomSizeConfig>) {
  switch (roomSize.value) {
    case 'small':
      return { minMm: 600, maxMm: 900 }
    case 'medium':
      return { minMm: 1050, maxMm: 1200 }
    case 'large':
    default:
      return { minMm: 1200, maxMm: 1400 }
  }
}

function getRoomFitGapMm(
  roomSize: ReturnType<typeof getBLDCFanRoomSizeConfig>,
  sweepMm: number
) {
  if (!Number.isFinite(sweepMm) || sweepMm <= 0) {
    return Number.POSITIVE_INFINITY
  }

  const { minMm, maxMm } = getRecommendedSweepRange(roomSize)

  if (sweepMm < minMm) {
    return minMm - sweepMm
  }

  if (sweepMm > maxMm) {
    return sweepMm - maxMm
  }

  return 0
}

function getRoomFitLabel(
  roomSize: ReturnType<typeof getBLDCFanRoomSizeConfig>,
  roomFitGapMm: number
) {
  return roomFitGapMm === 0
    ? `Best fit for ${roomSize.label.toLowerCase()} rooms`
    : `Closest catalog fit for ${roomSize.label.toLowerCase()} rooms`
}

function getSweepLabel(metrics: BLDCFanScenarioMetrics) {
  return metrics.bldcSweepMm
    ? `${metrics.bldcSweepMm} mm sweep`
    : `${metrics.roomSize.sweepSizeLabel} recommended sweep`
}

function compareBLDCFanCandidates(
  left: BLDCFanRecommendationCandidate,
  right: BLDCFanRecommendationCandidate
) {
  if (left.roomFitGapMm !== right.roomFitGapMm) {
    return left.roomFitGapMm - right.roomFitGapMm
  }

  const leftMac = Number.isFinite(left.metrics.marginalAbatementCostInrPerKg)
    ? left.metrics.marginalAbatementCostInrPerKg
    : Number.POSITIVE_INFINITY
  const rightMac = Number.isFinite(right.metrics.marginalAbatementCostInrPerKg)
    ? right.metrics.marginalAbatementCostInrPerKg
    : Number.POSITIVE_INFINITY

  if (leftMac !== rightMac) {
    return leftMac - rightMac
  }

  if (left.metrics.annualEnergyCostSavingsPerFanInr !== right.metrics.annualEnergyCostSavingsPerFanInr) {
    return right.metrics.annualEnergyCostSavingsPerFanInr - left.metrics.annualEnergyCostSavingsPerFanInr
  }

  if (left.airDeliveryCmm !== right.airDeliveryCmm) {
    return right.airDeliveryCmm - left.airDeliveryCmm
  }

  if (left.powerRatingW !== right.powerRatingW) {
    return left.powerRatingW - right.powerRatingW
  }

  if (left.sameSelectedModel !== right.sameSelectedModel) {
    return left.sameSelectedModel ? -1 : 1
  }

  if (left.sameSelectedMake !== right.sameSelectedMake) {
    return left.sameSelectedMake ? -1 : 1
  }

  if (left.candidate.make !== right.candidate.make) {
    return left.candidate.make.localeCompare(right.candidate.make)
  }

  return left.candidate.model.localeCompare(right.candidate.model)
}

function selectDiversifiedBLDCFanCandidates(
  candidates: BLDCFanRecommendationCandidate[],
  limit: number
) {
  const sortedCandidates = [...candidates].sort(compareBLDCFanCandidates)

  if (sortedCandidates.length <= limit) {
    return sortedCandidates
  }

  const selected: BLDCFanRecommendationCandidate[] = []
  const usedKeys = new Set<string>()
  const usedMakes = new Set<string>()

  const addCandidate = (entry?: BLDCFanRecommendationCandidate) => {
    if (!entry) {
      return false
    }

    const key = [entry.candidate.make, entry.candidate.model, entry.candidate.sweep_mm ?? ''].join('::')

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

export function calculateBLDCFanScenario(
  assessment: BLDCFanAssessment,
  catalogFanOverride: BLDCFanCatalogItem | null = null
): BLDCFanScenarioMetrics {
  const roomSize = getBLDCFanRoomSizeConfig(assessment.room_size)
  const selectedConventionalCatalogFan = assessment.selected_conventional_catalog_fan
  const catalogConventionalPowerRatingW = getBLDCFanPowerWatts(selectedConventionalCatalogFan)
  const conventionalFanMake =
    selectedConventionalCatalogFan?.make?.trim() ||
    assessment.conventional_fan_make.trim() ||
    'User specified'
  const conventionalFanModel =
    selectedConventionalCatalogFan?.model?.trim() ||
    assessment.conventional_fan_make_model.trim() ||
    'User specified'
  const conventionalPowerRatingW =
    catalogConventionalPowerRatingW ||
    parsePositiveNumber(assessment.conventional_fan_power_rating_w) ||
    75
  const dailyRuntimeHours = parsePositiveNumber(assessment.daily_runtime_hours)
  const workingDaysPerYear = parsePositiveNumber(assessment.working_days_per_year)
  const annualRuntimeHours = dailyRuntimeHours * workingDaysPerYear
  const electricityTariffInrPerKwh = parsePositiveNumber(assessment.electricity_tariff) || 8
  const gridEmissionFactorKgPerKwh =
    parsePositiveNumber(assessment.grid_emission_factor) || 0.716
  const selectedCatalogFan = catalogFanOverride ?? assessment.selected_catalog_fan
  const catalogPowerRatingW = getBLDCFanPowerWatts(selectedCatalogFan)
  const bldcFanMake =
    selectedCatalogFan?.make?.trim() || assessment.bldc_fan_make.trim() || 'Catalog selection'
  const bldcFanModel =
    selectedCatalogFan?.model?.trim() || assessment.bldc_fan_model.trim() || 'BLDC ceiling fan'
  const bldcPowerRatingW =
    catalogPowerRatingW || parsePositiveNumber(assessment.bldc_fan_power_rating_w) || 30
  const bldcSweepMm =
    selectedCatalogFan?.sweep_mm || parsePositiveNumber(assessment.bldc_fan_sweep_mm) || 0
  const bldcAirDeliveryCmm = selectedCatalogFan?.air_delivery_cmm ?? 0
  const bldcRatedSpeedRpm = selectedCatalogFan?.rated_speed_rpm ?? 0
  const numberOfFansToSwitch = parsePositiveNumber(assessment.number_of_fans_to_switch) || 1
  const capexBldcFanInrPerFan =
    parsePositiveNumber(assessment.capex_bldc_fan_inr_per_fan) || 4500
  const bldcInstallationCostInrPerFan =
    parsePositiveNumber(assessment.bldc_installation_cost_inr_per_fan) || 3000
  const conventionalInstallationCostInrPerFan =
    parsePositiveNumber(assessment.conventional_installation_cost_inr_per_fan) || 2000
  const currentYearsOfOperation = parsePositiveNumber(assessment.current_years_of_operation)
  const discountFactor = (parsePositiveNumber(assessment.discount_factor_percent) || 8) / 100
  const typicalLifetimeYears = parsePositiveNumber(assessment.bldc_lifetime_years) || 10

  const currentEnergyPerHourKwh = conventionalPowerRatingW / 1000
  const currentAnnualEnergyPerFanKwh = currentEnergyPerHourKwh * annualRuntimeHours
  const currentAnnualExpenditurePerFanInr =
    currentAnnualEnergyPerFanKwh * electricityTariffInrPerKwh
  const currentEmissionsPerFanKg = currentAnnualEnergyPerFanKwh * gridEmissionFactorKgPerKwh

  const bldcEnergyPerHourKwh = bldcPowerRatingW / 1000
  const bldcAnnualEnergyPerFanKwh = bldcEnergyPerHourKwh * annualRuntimeHours
  const bldcAnnualExpenditurePerFanInr = bldcAnnualEnergyPerFanKwh * electricityTariffInrPerKwh
  const bldcEmissionsPerFanKg = bldcAnnualEnergyPerFanKwh * gridEmissionFactorKgPerKwh

  const annualEnergySavingsPerFanKwh =
    currentAnnualEnergyPerFanKwh - bldcAnnualEnergyPerFanKwh
  const annualEnergyCostSavingsPerFanInr =
    currentAnnualExpenditurePerFanInr - bldcAnnualExpenditurePerFanInr
  const energyCostSavingsPercent =
    currentAnnualExpenditurePerFanInr > 0
      ? (annualEnergyCostSavingsPerFanInr / currentAnnualExpenditurePerFanInr) * 100
      : 0
  const annualEmissionsReducedPerFanKg = currentEmissionsPerFanKg - bldcEmissionsPerFanKg
  const emissionsSavedPercent =
    currentEmissionsPerFanKg > 0
      ? (annualEmissionsReducedPerFanKg / currentEmissionsPerFanKg) * 100
      : 0

  const totalCurrentAnnualEnergyKwh = currentAnnualEnergyPerFanKwh * numberOfFansToSwitch
  const totalBLDCAnnualEnergyKwh = bldcAnnualEnergyPerFanKwh * numberOfFansToSwitch
  const totalCurrentAnnualExpenditureInr =
    currentAnnualExpenditurePerFanInr * numberOfFansToSwitch
  const totalBLDCAnnualExpenditureInr = bldcAnnualExpenditurePerFanInr * numberOfFansToSwitch
  const totalCurrentEmissionsKg = currentEmissionsPerFanKg * numberOfFansToSwitch
  const totalBLDCEmissionsKg = bldcEmissionsPerFanKg * numberOfFansToSwitch
  const totalCostSavingsPerAnnumInr =
    annualEnergyCostSavingsPerFanInr * numberOfFansToSwitch
  const totalEmissionsSavedPerAnnumKg =
    annualEmissionsReducedPerFanKg * numberOfFansToSwitch

  const totalCapexRequiredInr = capexBldcFanInrPerFan * numberOfFansToSwitch
  const paybackYears =
    totalCostSavingsPerAnnumInr > 0
      ? totalCapexRequiredInr / totalCostSavingsPerAnnumInr
      : Number.NaN

  const presentValueConventionalFanInr =
    conventionalInstallationCostInrPerFan *
    Math.pow(Math.max(0, 1 - discountFactor), currentYearsOfOperation)
  const incrementalCostPerFanInr =
    bldcInstallationCostInrPerFan - presentValueConventionalFanInr
  const lifetimeDiscountFactor =
    discountFactor > 0
      ? (1 - Math.pow(1 + discountFactor, -typicalLifetimeYears)) / discountFactor
      : typicalLifetimeYears
  const npvEnergyCostSavingsPerFanInr =
    annualEnergyCostSavingsPerFanInr * lifetimeDiscountFactor
  const npvEmissionsSavedPerFanKg = annualEmissionsReducedPerFanKg * lifetimeDiscountFactor
  const marginalAbatementCostInrPerKg =
    npvEmissionsSavedPerFanKg > 0
      ? (incrementalCostPerFanInr - npvEnergyCostSavingsPerFanInr) / npvEmissionsSavedPerFanKg
      : Number.NaN

  return {
    roomSize,
    conventionalFanMake,
    conventionalFanModel,
    conventionalPowerRatingW,
    dailyRuntimeHours,
    workingDaysPerYear,
    annualRuntimeHours,
    electricityTariffInrPerKwh,
    gridEmissionFactorKgPerKwh,
    bldcFanMake,
    bldcFanModel,
    bldcPowerRatingW,
    bldcSweepMm,
    bldcAirDeliveryCmm,
    bldcRatedSpeedRpm,
    numberOfFansToSwitch,
    capexBldcFanInrPerFan,
    bldcInstallationCostInrPerFan,
    conventionalInstallationCostInrPerFan,
    currentYearsOfOperation,
    discountFactor,
    typicalLifetimeYears,
    currentEnergyPerHourKwh,
    currentAnnualEnergyPerFanKwh,
    currentAnnualExpenditurePerFanInr,
    currentEmissionsPerFanKg,
    bldcEnergyPerHourKwh,
    bldcAnnualEnergyPerFanKwh,
    bldcAnnualExpenditurePerFanInr,
    bldcEmissionsPerFanKg,
    annualEnergySavingsPerFanKwh,
    annualEnergyCostSavingsPerFanInr,
    energyCostSavingsPercent,
    annualEmissionsReducedPerFanKg,
    emissionsSavedPercent,
    totalCurrentAnnualEnergyKwh,
    totalBLDCAnnualEnergyKwh,
    totalCurrentAnnualExpenditureInr,
    totalBLDCAnnualExpenditureInr,
    totalCurrentEmissionsKg,
    totalBLDCEmissionsKg,
    totalCostSavingsPerAnnumInr,
    totalEmissionsSavedPerAnnumKg,
    totalCapexRequiredInr,
    paybackYears,
    presentValueConventionalFanInr,
    incrementalCostPerFanInr,
    lifetimeDiscountFactor,
    npvEnergyCostSavingsPerFanInr,
    npvEmissionsSavedPerFanKg,
    marginalAbatementCostInrPerKg,
  }
}

export function buildBLDCFanRecommendation(
  assessment: BLDCFanAssessment,
  fans: BLDCFanCatalogItem[] = []
) {
  const metrics = calculateBLDCFanScenario(assessment)
  const energySavingsPercent =
    metrics.currentAnnualEnergyPerFanKwh > 0
      ? (metrics.annualEnergySavingsPerFanKwh / metrics.currentAnnualEnergyPerFanKwh) * 100
      : 0

  const shortlistedCandidates = selectDiversifiedBLDCFanCandidates(
    fans
      .map((candidate) => {
        const powerRatingW = getBLDCFanPowerWatts(candidate)

        if (!Number.isFinite(powerRatingW) || !powerRatingW) {
          return null
        }

        const candidateMetrics = calculateBLDCFanScenario(assessment, candidate)

        if (
          candidateMetrics.annualEnergySavingsPerFanKwh <= 0 ||
          candidateMetrics.annualEnergyCostSavingsPerFanInr <= 0 ||
          candidateMetrics.annualEmissionsReducedPerFanKg <= 0
        ) {
          return null
        }

        return {
          candidate,
          metrics: candidateMetrics,
          roomFitGapMm: getRoomFitGapMm(metrics.roomSize, candidateMetrics.bldcSweepMm),
          sameSelectedMake: candidate.make === assessment.bldc_fan_make,
          sameSelectedModel: candidate.model === assessment.bldc_fan_model,
          powerRatingW,
          airDeliveryCmm: candidate.air_delivery_cmm ?? 0,
        }
      })
      .filter((candidate): candidate is BLDCFanRecommendationCandidate => candidate !== null),
    3
  )

  if (shortlistedCandidates.length === 0) {
    return {
      currentSystem: {
        type: 'Conventional induction motor ceiling fan',
        rating: `${metrics.conventionalPowerRatingW} W/fan | ${metrics.numberOfFansToSwitch} fan(s) | ${metrics.roomSize.label}`,
        make: metrics.conventionalFanMake,
        model: metrics.conventionalFanModel,
        annualEnergy: formatWholeNumber(metrics.totalCurrentAnnualEnergyKwh),
        annualCost: formatWholeNumber(metrics.totalCurrentAnnualExpenditureInr),
      },
      recommendations: [
        {
          id: 1,
          name: 'BLDC Ceiling Fan Upgrade',
          make: metrics.bldcFanMake,
          model: metrics.bldcFanModel,
          badge: `${Math.max(0, Math.round(energySavingsPercent))}% energy saved`,
          energySavings: formatWholeNumber(
            metrics.totalCurrentAnnualEnergyKwh - metrics.totalBLDCAnnualEnergyKwh
          ),
          costSavings: formatWholeNumber(metrics.totalCostSavingsPerAnnumInr),
          emissionSavings: formatWholeNumber(metrics.totalEmissionsSavedPerAnnumKg),
          upgradeCost: formatWholeNumber(metrics.totalCapexRequiredInr),
          paybackYears: formatPaybackYears(metrics.paybackYears),
          efficiency: Math.max(0, Math.round(energySavingsPercent)),
          details: `${metrics.bldcPowerRatingW} W | ${getSweepLabel(metrics)} | ${metrics.annualRuntimeHours.toFixed(0)} h/year`,
          marginalAbatementCost: formatMacValue(metrics.marginalAbatementCostInrPerKg),
          currentAnnualEnergy: formatWholeNumber(metrics.totalCurrentAnnualEnergyKwh),
          recommendedAnnualEnergy: formatWholeNumber(metrics.totalBLDCAnnualEnergyKwh),
          currentAnnualCost: formatWholeNumber(metrics.totalCurrentAnnualExpenditureInr),
          recommendedAnnualCost: formatWholeNumber(metrics.totalBLDCAnnualExpenditureInr),
          currentAnnualEmissions: formatWholeNumber(metrics.totalCurrentEmissionsKg),
          recommendedAnnualEmissions: formatWholeNumber(metrics.totalBLDCEmissionsKg),
        },
      ],
      summary: {
        totalEnergySavings: formatWholeNumber(
          metrics.totalCurrentAnnualEnergyKwh - metrics.totalBLDCAnnualEnergyKwh
        ),
        totalCostSavings: formatWholeNumber(metrics.totalCostSavingsPerAnnumInr),
        totalEmissionSavings: Number(
          (Math.max(0, metrics.totalEmissionsSavedPerAnnumKg) / 1000).toFixed(2)
        ),
        averagePayback: formatPaybackYears(metrics.paybackYears),
      },
    }
  }

  const leadRecommendation = shortlistedCandidates[0]

  return {
    currentSystem: {
      type: 'Conventional induction motor ceiling fan',
      rating: `${metrics.conventionalPowerRatingW} W/fan | ${metrics.numberOfFansToSwitch} fan(s) | ${metrics.roomSize.label}`,
      make: metrics.conventionalFanMake,
      model: metrics.conventionalFanModel,
      annualEnergy: formatWholeNumber(metrics.totalCurrentAnnualEnergyKwh),
      annualCost: formatWholeNumber(metrics.totalCurrentAnnualExpenditureInr),
    },
    recommendations: shortlistedCandidates.map((entry, index) => ({
      id: index + 1,
      name: `BLDC Ceiling Fan Recommendation ${index + 1}`,
      make: entry.candidate.make,
      model: entry.candidate.model,
      badge: index === 0 ? 'Top Recommendation' : 'Recommended',
      energySavings: formatWholeNumber(
        entry.metrics.totalCurrentAnnualEnergyKwh - entry.metrics.totalBLDCAnnualEnergyKwh
      ),
      costSavings: formatWholeNumber(entry.metrics.totalCostSavingsPerAnnumInr),
      emissionSavings: formatWholeNumber(entry.metrics.totalEmissionsSavedPerAnnumKg),
      upgradeCost: formatWholeNumber(entry.metrics.totalCapexRequiredInr),
      paybackYears: formatPaybackYears(entry.metrics.paybackYears),
      efficiency: Math.max(
        0,
        Math.round(
          entry.metrics.currentAnnualEnergyPerFanKwh > 0
            ? (entry.metrics.annualEnergySavingsPerFanKwh / entry.metrics.currentAnnualEnergyPerFanKwh) * 100
            : 0
        )
      ),
      details: `${entry.metrics.bldcPowerRatingW} W | ${getSweepLabel(entry.metrics)} | ${entry.metrics.bldcAirDeliveryCmm ? `${entry.metrics.bldcAirDeliveryCmm} CMM` : 'Air delivery N/A'} | ${getRoomFitLabel(entry.metrics.roomSize, entry.roomFitGapMm)}`,
      marginalAbatementCost: formatMacValue(entry.metrics.marginalAbatementCostInrPerKg),
      currentAnnualEnergy: formatWholeNumber(entry.metrics.totalCurrentAnnualEnergyKwh),
      recommendedAnnualEnergy: formatWholeNumber(entry.metrics.totalBLDCAnnualEnergyKwh),
      currentAnnualCost: formatWholeNumber(entry.metrics.totalCurrentAnnualExpenditureInr),
      recommendedAnnualCost: formatWholeNumber(entry.metrics.totalBLDCAnnualExpenditureInr),
      currentAnnualEmissions: formatWholeNumber(entry.metrics.totalCurrentEmissionsKg),
      recommendedAnnualEmissions: formatWholeNumber(entry.metrics.totalBLDCEmissionsKg),
    })),
    summary: {
      totalEnergySavings: formatWholeNumber(
        leadRecommendation.metrics.totalCurrentAnnualEnergyKwh -
          leadRecommendation.metrics.totalBLDCAnnualEnergyKwh
      ),
      totalCostSavings: formatWholeNumber(leadRecommendation.metrics.totalCostSavingsPerAnnumInr),
      totalEmissionSavings: Number(
        (Math.max(0, leadRecommendation.metrics.totalEmissionsSavedPerAnnumKg) / 1000).toFixed(2)
      ),
      averagePayback: formatPaybackYears(leadRecommendation.metrics.paybackYears),
    },
  }
}
