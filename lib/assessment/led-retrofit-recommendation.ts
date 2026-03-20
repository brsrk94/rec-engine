import type { LEDRetrofitAssessment } from '@/hooks/use-assessment-storage'
import {
  getLEDCapexBandForLumens,
  getLEDCapexEstimateForLumens,
  getLEDPowerWatts,
  type LEDCatalogItem,
} from '@/lib/led-catalog'

interface LEDRetrofitScenarioMetrics {
  ledMake: string
  conventionalBulbModel: string
  conventionalBulbPowerRatingW: number
  dailyRuntimeHours: number
  workingDaysPerYear: number
  annualRuntimeHours: number
  electricityTariffInrPerKwh: number
  gridEmissionFactorKgPerKwh: number
  ledModel: string
  ledPowerRatingW: number
  ledLumens: number
  ledColourTemperature: string
  ledLuminousEfficacy: number
  numberOfBulbsToSwitch: number
  ledCapexInrPerLed: number
  ledInstallationCostInrPerLed: number
  conventionalBulbInstallationCostInrPerBulb: number
  currentYearsOfOperation: number
  discountFactor: number
  ledLifetimeYears: number
  conventionalEnergyPerHourKwh: number
  conventionalAnnualEnergyPerBulbKwh: number
  conventionalAnnualExpenditurePerBulbInr: number
  conventionalEmissionsPerBulbKg: number
  ledEnergyPerHourKwh: number
  ledAnnualEnergyPerLedKwh: number
  ledAnnualExpenditurePerLedInr: number
  ledEmissionsPerLedKg: number
  annualEnergySavingsPerLedKwh: number
  annualEnergyCostSavingsPerLedInr: number
  energyCostSavingsPercent: number
  annualEmissionsReducedPerLedKg: number
  emissionsSavedPercent: number
  totalCurrentAnnualEnergyKwh: number
  totalLedAnnualEnergyKwh: number
  totalCurrentAnnualExpenditureInr: number
  totalLedAnnualExpenditureInr: number
  totalCurrentEmissionsKg: number
  totalLedEmissionsKg: number
  totalCostSavingsPerAnnumInr: number
  totalEmissionsSavedPerAnnumKg: number
  totalCapexRequiredInr: number
  paybackYears: number
  presentValueConventionalBulbInr: number
  incrementalCostPerLedInr: number
  lifetimeDiscountFactor: number
  npvEnergyCostSavingsPerLedInr: number
  npvEmissionsSavedPerLedKg: number
  marginalAbatementCostInrPerKg: number
}

interface LEDRecommendationCandidate {
  candidate: LEDCatalogItem
  metrics: LEDRetrofitScenarioMetrics
  lumenGapRatio: number
  sameSelectedMake: boolean
  sameSelectedModel: boolean
}

const DEFAULT_GRID_EMISSION_FACTOR = 0.716

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

function formatPercent(value: number) {
  return Math.max(0, Math.round(value))
}

function getLumenGapRatio(referenceLumens: number, candidateLumens: number) {
  if (
    !Number.isFinite(referenceLumens) ||
    referenceLumens <= 0 ||
    !Number.isFinite(candidateLumens) ||
    candidateLumens <= 0
  ) {
    return 0
  }

  return Math.abs(candidateLumens - referenceLumens) / referenceLumens
}

function compareLEDCandidates(left: LEDRecommendationCandidate, right: LEDRecommendationCandidate) {
  if (left.lumenGapRatio !== right.lumenGapRatio) {
    return left.lumenGapRatio - right.lumenGapRatio
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

  if (left.metrics.annualEnergyCostSavingsPerLedInr !== right.metrics.annualEnergyCostSavingsPerLedInr) {
    return right.metrics.annualEnergyCostSavingsPerLedInr - left.metrics.annualEnergyCostSavingsPerLedInr
  }

  if (left.metrics.ledLuminousEfficacy !== right.metrics.ledLuminousEfficacy) {
    return right.metrics.ledLuminousEfficacy - left.metrics.ledLuminousEfficacy
  }

  if (left.metrics.ledPowerRatingW !== right.metrics.ledPowerRatingW) {
    return left.metrics.ledPowerRatingW - right.metrics.ledPowerRatingW
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

function selectDiversifiedLEDCandidates(candidates: LEDRecommendationCandidate[], limit: number) {
  const sortedCandidates = [...candidates].sort(compareLEDCandidates)

  if (sortedCandidates.length <= limit) {
    return sortedCandidates
  }

  const selected: LEDRecommendationCandidate[] = []
  const usedKeys = new Set<string>()
  const usedMakes = new Set<string>()

  const addCandidate = (entry?: LEDRecommendationCandidate) => {
    if (!entry) {
      return false
    }

    const key = [entry.candidate.make, entry.candidate.model, entry.candidate.model_no ?? ''].join('::')

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

export function calculateLEDRetrofitScenario(
  assessment: LEDRetrofitAssessment,
  catalogBulbOverride: LEDCatalogItem | null = null
): LEDRetrofitScenarioMetrics {
  const selectedCatalogLed = catalogBulbOverride ?? assessment.selected_catalog_led
  const conventionalBulbModel =
    assessment.conventional_bulb_model.trim() || 'User specified incandescent bulb'
  const conventionalBulbPowerRatingW =
    parsePositiveNumber(assessment.conventional_bulb_power_rating_w) ||
    parsePositiveNumber(assessment.wattage_per_fixture)
  const dailyRuntimeHours = parsePositiveNumber(assessment.daily_runtime_hours)
  const workingDaysPerYear = parsePositiveNumber(assessment.working_days_per_year)
  const annualRuntimeHours =
    dailyRuntimeHours > 0 && workingDaysPerYear > 0
      ? dailyRuntimeHours * workingDaysPerYear
      : parsePositiveNumber(assessment.operating_hours_year)
  const electricityTariffInrPerKwh = parsePositiveNumber(assessment.electricity_tariff) || 8
  const gridEmissionFactorKgPerKwh = DEFAULT_GRID_EMISSION_FACTOR
  const ledMake =
    selectedCatalogLed?.make?.trim() || assessment.led_make.trim() || 'LED'
  const ledModel =
    selectedCatalogLed?.model?.trim() || assessment.led_model.trim() || 'User specified LED'
  const ledPowerRatingW =
    getLEDPowerWatts(selectedCatalogLed) ||
    parsePositiveNumber(assessment.led_power_rating_w)
  const ledLumens = selectedCatalogLed?.lumens ?? 0
  const ledColourTemperature = selectedCatalogLed?.colour_temperature ?? ''
  const ledLuminousEfficacy = selectedCatalogLed?.estimated_luminous_efficacy_lm_w ?? 0
  const numberOfBulbsToSwitch =
    parsePositiveNumber(assessment.number_of_bulbs_to_switch) ||
    parsePositiveNumber(assessment.number_of_fixtures) ||
    1
  const lumensBasedCapex = getLEDCapexEstimateForLumens(ledLumens)
  const ledCapexInrPerLed =
    parsePositiveNumber(assessment.led_capex_inr_per_led) || lumensBasedCapex?.approxCapexInr || 0
  const ledInstallationCostInrPerLed =
    parsePositiveNumber(assessment.led_installation_cost_inr_per_led) || 100
  const conventionalBulbInstallationCostInrPerBulb =
    parsePositiveNumber(assessment.conventional_bulb_installation_cost_inr_per_bulb) || 20
  const currentYearsOfOperation = parsePositiveNumber(assessment.current_years_of_operation)
  const discountFactor = (parsePositiveNumber(assessment.discount_factor_percent) || 8) / 100
  const ledLifetimeYears = parsePositiveNumber(assessment.led_lifetime_years) || 10

  const conventionalEnergyPerHourKwh = conventionalBulbPowerRatingW / 1000
  const conventionalAnnualEnergyPerBulbKwh = conventionalEnergyPerHourKwh * annualRuntimeHours
  const conventionalAnnualExpenditurePerBulbInr =
    conventionalAnnualEnergyPerBulbKwh * electricityTariffInrPerKwh
  const conventionalEmissionsPerBulbKg =
    conventionalAnnualEnergyPerBulbKwh * gridEmissionFactorKgPerKwh

  const ledEnergyPerHourKwh = ledPowerRatingW / 1000
  const ledAnnualEnergyPerLedKwh = ledEnergyPerHourKwh * annualRuntimeHours
  const ledAnnualExpenditurePerLedInr = ledAnnualEnergyPerLedKwh * electricityTariffInrPerKwh
  const ledEmissionsPerLedKg = ledAnnualEnergyPerLedKwh * gridEmissionFactorKgPerKwh

  const annualEnergySavingsPerLedKwh =
    conventionalAnnualEnergyPerBulbKwh - ledAnnualEnergyPerLedKwh
  const annualEnergyCostSavingsPerLedInr =
    conventionalAnnualExpenditurePerBulbInr - ledAnnualExpenditurePerLedInr
  const energyCostSavingsPercent =
    conventionalAnnualExpenditurePerBulbInr > 0
      ? (annualEnergyCostSavingsPerLedInr / conventionalAnnualExpenditurePerBulbInr) * 100
      : 0
  const annualEmissionsReducedPerLedKg =
    conventionalEmissionsPerBulbKg - ledEmissionsPerLedKg
  const emissionsSavedPercent =
    conventionalEmissionsPerBulbKg > 0
      ? (annualEmissionsReducedPerLedKg / conventionalEmissionsPerBulbKg) * 100
      : 0

  const totalCurrentAnnualEnergyKwh =
    conventionalAnnualEnergyPerBulbKwh * numberOfBulbsToSwitch
  const totalLedAnnualEnergyKwh = ledAnnualEnergyPerLedKwh * numberOfBulbsToSwitch
  const totalCurrentAnnualExpenditureInr =
    conventionalAnnualExpenditurePerBulbInr * numberOfBulbsToSwitch
  const totalLedAnnualExpenditureInr = ledAnnualExpenditurePerLedInr * numberOfBulbsToSwitch
  const totalCurrentEmissionsKg = conventionalEmissionsPerBulbKg * numberOfBulbsToSwitch
  const totalLedEmissionsKg = ledEmissionsPerLedKg * numberOfBulbsToSwitch
  const totalCostSavingsPerAnnumInr =
    annualEnergyCostSavingsPerLedInr * numberOfBulbsToSwitch
  const totalEmissionsSavedPerAnnumKg =
    annualEmissionsReducedPerLedKg * numberOfBulbsToSwitch
  const totalCapexRequiredInr = ledCapexInrPerLed * numberOfBulbsToSwitch
  const paybackYears =
    totalCostSavingsPerAnnumInr > 0
      ? totalCapexRequiredInr / totalCostSavingsPerAnnumInr
      : Number.NaN

  const presentValueConventionalBulbInr =
    conventionalBulbInstallationCostInrPerBulb *
    Math.pow(Math.max(0, 1 - discountFactor), currentYearsOfOperation)
  const incrementalCostPerLedInr = ledCapexInrPerLed - presentValueConventionalBulbInr
  const lifetimeDiscountFactor =
    discountFactor > 0
      ? (1 - Math.pow(1 + discountFactor, -ledLifetimeYears)) / discountFactor
      : ledLifetimeYears
  const npvEnergyCostSavingsPerLedInr =
    annualEnergyCostSavingsPerLedInr * lifetimeDiscountFactor
  const npvEmissionsSavedPerLedKg =
    annualEmissionsReducedPerLedKg * lifetimeDiscountFactor
  const marginalAbatementCostInrPerKg =
    npvEmissionsSavedPerLedKg > 0
      ? (incrementalCostPerLedInr - npvEnergyCostSavingsPerLedInr) / npvEmissionsSavedPerLedKg
      : Number.NaN

  return {
    ledMake,
    conventionalBulbModel,
    conventionalBulbPowerRatingW,
    dailyRuntimeHours,
    workingDaysPerYear,
    annualRuntimeHours,
    electricityTariffInrPerKwh,
    gridEmissionFactorKgPerKwh,
    ledModel,
    ledPowerRatingW,
    ledLumens,
    ledColourTemperature,
    ledLuminousEfficacy,
    numberOfBulbsToSwitch,
    ledCapexInrPerLed,
    ledInstallationCostInrPerLed,
    conventionalBulbInstallationCostInrPerBulb,
    currentYearsOfOperation,
    discountFactor,
    ledLifetimeYears,
    conventionalEnergyPerHourKwh,
    conventionalAnnualEnergyPerBulbKwh,
    conventionalAnnualExpenditurePerBulbInr,
    conventionalEmissionsPerBulbKg,
    ledEnergyPerHourKwh,
    ledAnnualEnergyPerLedKwh,
    ledAnnualExpenditurePerLedInr,
    ledEmissionsPerLedKg,
    annualEnergySavingsPerLedKwh,
    annualEnergyCostSavingsPerLedInr,
    energyCostSavingsPercent,
    annualEmissionsReducedPerLedKg,
    emissionsSavedPercent,
    totalCurrentAnnualEnergyKwh,
    totalLedAnnualEnergyKwh,
    totalCurrentAnnualExpenditureInr,
    totalLedAnnualExpenditureInr,
    totalCurrentEmissionsKg,
    totalLedEmissionsKg,
    totalCostSavingsPerAnnumInr,
    totalEmissionsSavedPerAnnumKg,
    totalCapexRequiredInr,
    paybackYears,
    presentValueConventionalBulbInr,
    incrementalCostPerLedInr,
    lifetimeDiscountFactor,
    npvEnergyCostSavingsPerLedInr,
    npvEmissionsSavedPerLedKg,
    marginalAbatementCostInrPerKg,
  }
}

function getRecommendationDetails(metrics: LEDRetrofitScenarioMetrics) {
  const details = [
    `${metrics.ledPowerRatingW} W`,
    metrics.ledLumens > 0 ? `${formatWholeNumber(metrics.ledLumens)} lm` : null,
    metrics.ledColourTemperature || null,
    metrics.ledLuminousEfficacy > 0
      ? `${metrics.ledLuminousEfficacy.toFixed(0)} lm/W`
      : null,
  ].filter(Boolean)

  return details.join(' | ')
}

function buildSingleRecommendationResult(metrics: LEDRetrofitScenarioMetrics) {
  return {
    currentSystem: {
      type: 'Conventional incandescent bulb',
      rating: `${metrics.conventionalBulbPowerRatingW} W/bulb | ${metrics.numberOfBulbsToSwitch} bulb(s)`,
      make: 'Incandescent',
      model: metrics.conventionalBulbModel,
      annualEnergy: formatWholeNumber(metrics.totalCurrentAnnualEnergyKwh),
      annualCost: formatWholeNumber(metrics.totalCurrentAnnualExpenditureInr),
    },
    recommendations: [
      {
        id: 1,
        name: 'LED Upgrade Option 1',
        make: metrics.ledMake,
        model: metrics.ledModel,
        badge: 'Top Recommendation',
        energySavings: formatWholeNumber(
          metrics.totalCurrentAnnualEnergyKwh - metrics.totalLedAnnualEnergyKwh
        ),
        costSavings: formatWholeNumber(metrics.totalCostSavingsPerAnnumInr),
        emissionSavings: formatWholeNumber(metrics.totalEmissionsSavedPerAnnumKg),
        upgradeCost: formatWholeNumber(metrics.totalCapexRequiredInr),
        paybackYears: formatPaybackYears(metrics.paybackYears),
        efficiency: formatPercent(metrics.energyCostSavingsPercent),
        details: getRecommendationDetails(metrics),
        marginalAbatementCost: formatMacValue(metrics.marginalAbatementCostInrPerKg),
        currentAnnualEnergy: formatWholeNumber(metrics.totalCurrentAnnualEnergyKwh),
        recommendedAnnualEnergy: formatWholeNumber(metrics.totalLedAnnualEnergyKwh),
        currentAnnualCost: formatWholeNumber(metrics.totalCurrentAnnualExpenditureInr),
        recommendedAnnualCost: formatWholeNumber(metrics.totalLedAnnualExpenditureInr),
        currentAnnualEmissions: formatWholeNumber(metrics.totalCurrentEmissionsKg),
        recommendedAnnualEmissions: formatWholeNumber(metrics.totalLedEmissionsKg),
      },
    ],
    summary: {
      totalEnergySavings: formatWholeNumber(
        metrics.totalCurrentAnnualEnergyKwh - metrics.totalLedAnnualEnergyKwh
      ),
      totalCostSavings: formatWholeNumber(metrics.totalCostSavingsPerAnnumInr),
      totalEmissionSavings: Number(
        (Math.max(0, metrics.totalEmissionsSavedPerAnnumKg) / 1000).toFixed(2)
      ),
      averagePayback: formatPaybackYears(metrics.paybackYears),
    },
  }
}

export function buildLEDRetrofitRecommendation(
  assessment: LEDRetrofitAssessment,
  bulbs: LEDCatalogItem[] = []
) {
  const metrics = calculateLEDRetrofitScenario(assessment)
  const selectedCatalogBulb = assessment.selected_catalog_led
  const referenceLumens = selectedCatalogBulb?.lumens ?? 0
  const referenceBand = getLEDCapexBandForLumens(referenceLumens)

  const mappedCandidates = bulbs
    .map((candidate) => {
      const candidateMetrics = calculateLEDRetrofitScenario(assessment, candidate)

      if (
        candidateMetrics.annualEnergySavingsPerLedKwh <= 0 ||
        candidateMetrics.annualEnergyCostSavingsPerLedInr <= 0 ||
        candidateMetrics.annualEmissionsReducedPerLedKg <= 0
      ) {
        return null
      }

      return {
        candidate,
        metrics: candidateMetrics,
        lumenGapRatio: getLumenGapRatio(referenceLumens, candidate.lumens ?? 0),
        sameSelectedMake: candidate.make === selectedCatalogBulb?.make,
        sameSelectedModel: candidate.model === selectedCatalogBulb?.model,
      }
    })
    .filter((candidate): candidate is LEDRecommendationCandidate => candidate !== null)

  const primaryCandidates =
    referenceBand && mappedCandidates.filter((candidate) => {
      const candidateBand = getLEDCapexBandForLumens(candidate.candidate.lumens ?? 0)
      return candidateBand?.label === referenceBand.label
    }).length >= 3
      ? mappedCandidates.filter((candidate) => {
          const candidateBand = getLEDCapexBandForLumens(candidate.candidate.lumens ?? 0)
          return candidateBand?.label === referenceBand.label
        })
      : mappedCandidates

  const shortlistedCandidates = selectDiversifiedLEDCandidates(primaryCandidates, 3)

  if (shortlistedCandidates.length === 0) {
    return buildSingleRecommendationResult(metrics)
  }

  const leadRecommendation = shortlistedCandidates[0]

  return {
    currentSystem: {
      type: 'Conventional incandescent bulb',
      rating: `${metrics.conventionalBulbPowerRatingW} W/bulb | ${metrics.numberOfBulbsToSwitch} bulb(s)`,
      make: 'Incandescent',
      model: metrics.conventionalBulbModel,
      annualEnergy: formatWholeNumber(metrics.totalCurrentAnnualEnergyKwh),
      annualCost: formatWholeNumber(metrics.totalCurrentAnnualExpenditureInr),
    },
    recommendations: shortlistedCandidates.map((entry, index) => ({
      id: index + 1,
      name: `LED Upgrade Option ${index + 1}`,
      make: entry.metrics.ledMake,
      model: entry.metrics.ledModel,
      badge: index === 0 ? 'Top Recommendation' : 'Recommended',
      energySavings: formatWholeNumber(
        entry.metrics.totalCurrentAnnualEnergyKwh - entry.metrics.totalLedAnnualEnergyKwh
      ),
      costSavings: formatWholeNumber(entry.metrics.totalCostSavingsPerAnnumInr),
      emissionSavings: formatWholeNumber(entry.metrics.totalEmissionsSavedPerAnnumKg),
      upgradeCost: formatWholeNumber(entry.metrics.totalCapexRequiredInr),
      paybackYears: formatPaybackYears(entry.metrics.paybackYears),
      efficiency: formatPercent(entry.metrics.energyCostSavingsPercent),
      details: getRecommendationDetails(entry.metrics),
      marginalAbatementCost: formatMacValue(entry.metrics.marginalAbatementCostInrPerKg),
      currentAnnualEnergy: formatWholeNumber(entry.metrics.totalCurrentAnnualEnergyKwh),
      recommendedAnnualEnergy: formatWholeNumber(entry.metrics.totalLedAnnualEnergyKwh),
      currentAnnualCost: formatWholeNumber(entry.metrics.totalCurrentAnnualExpenditureInr),
      recommendedAnnualCost: formatWholeNumber(entry.metrics.totalLedAnnualExpenditureInr),
      currentAnnualEmissions: formatWholeNumber(entry.metrics.totalCurrentEmissionsKg),
      recommendedAnnualEmissions: formatWholeNumber(entry.metrics.totalLedEmissionsKg),
    })),
    summary: {
      totalEnergySavings: formatWholeNumber(
        leadRecommendation.metrics.totalCurrentAnnualEnergyKwh -
          leadRecommendation.metrics.totalLedAnnualEnergyKwh
      ),
      totalCostSavings: formatWholeNumber(leadRecommendation.metrics.totalCostSavingsPerAnnumInr),
      totalEmissionSavings: Number(
        (Math.max(0, leadRecommendation.metrics.totalEmissionsSavedPerAnnumKg) / 1000).toFixed(2)
      ),
      averagePayback: formatPaybackYears(leadRecommendation.metrics.paybackYears),
    },
  }
}
