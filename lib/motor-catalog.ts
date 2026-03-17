export interface MotorCatalogItem {
  make: string
  model: string
  designation: string | null
  display_name: string | null
  series: string | null
  efficiency_class: string
  rated_power_kw: number
  frame_size: string | null
  poles: number | null
  efficiency_50: number | null
  efficiency_75: number | null
  efficiency_100: number | null
  capex_min_inr_per_kw: number | null
  capex_max_inr_per_kw: number | null
  estimated_price_min_inr: number | null
  estimated_price_max_inr: number | null
}

export interface MotorCatalogPayload {
  makeCounts: Array<{
    make: string
    count: number
  }>
  motors: MotorCatalogItem[]
}

export interface MotorAssessmentCatalogState {
  motor_make: string
  motor_model: string
  motor_rating: string
  motor_rating_unit: 'kW' | 'HP'
  current_motor_efficiency_class: string
  target_motor_efficiency_class: string
  load_factor: string
  operating_hours_year: string
  electricity_tariff: string
  grid_emission_factor: string
  number_of_motors: string
  years_of_operation_current_motor_class: string
  lifetime_of_target_motor_class: string
  capex_of_current_motor_class: string
  capex_of_target_motor_class: string
  selected_catalog_motor: MotorCatalogItem | null
  target_catalog_motor: MotorCatalogItem | null
}

export interface MotorUpgradeMetrics {
  ratedPowerCurrentKw: number
  inputPowerCurrentKw: number
  annualEnergyCurrentKwh: number
  inputPowerTargetKw: number
  annualEnergyTargetKwh: number
  annualEnergySavingsKwh: number
  annualCostCurrentInr: number
  annualCostTargetInr: number
  annualEmissionsCurrentKg: number
  annualEmissionsTargetKg: number
  annualEmissionsSavingsKg: number
  annualEnergyCostSavingsInr: number
  annualEnergyCostSavingsPerKwInr: number
  presentValueCurrentPerKw: number
  incrementalCostPerKw: number
  totalIncrementalCostInr: number
  npvEnergyCostSavingsInr: number
  npvEnergyCostSavingsPerKwInr: number
  paybackYears: number
  npvEmissionsReducedKg: number
  npvEmissionsReducedPerKwKg: number
  marginalAbatementCost: number
}

export interface MotorRecommendationCandidate {
  candidate: MotorCatalogItem
  metrics: MotorUpgradeMetrics
  targetEfficiency: number
  capexTargetPerKw: number
  exactRating: boolean
  ratingDifferenceKw: number
  sameClassFallback: boolean
}

export interface MotorRecommendationCard {
  id: number
  name: string
  make: string
  model: string
  badge: string
  energySavings: number
  costSavings: number
  emissionSavings: number
  upgradeCost: number
  paybackYears: string
  efficiency: number
  marginalAbatementCost: string
  details: string
  efficiencyClass: string
  ratedPowerKw: number
  currentAnnualEnergy: number
  recommendedAnnualEnergy: number
  currentAnnualCost: number
  recommendedAnnualCost: number
  currentAnnualEmissions: number
  recommendedAnnualEmissions: number
}

export interface MotorRecommendationResult {
  currentSystem: {
    type: string
    rating: string
    make: string
    model: string
    annualEnergy: number
    annualCost: number
  }
  recommendations: MotorRecommendationCard[]
  summary: {
    totalEnergySavings: number
    totalCostSavings: number
    totalEmissionSavings: number
    averagePayback: string
  }
  calculationBreakdown: Array<{
    label: string
    value: string
    unit: string
  }>
  chartData: {
    energyTrendYears: string[]
    energyTrendSeries: Array<{
      name: string
      color: string
      data: number[]
      dashed?: boolean
    }>
    energySplitData: Array<{
      value: number
      name: string
    }>
    bestRecommendationLabel: string
    highlightMetrics: Array<{
      label: string
      value: string
      unit: string
    }>
  }
  recommendationNote: string
}

export const MOTOR_CLASS_ORDER = ['IE1', 'IE2', 'IE3', 'IE4', 'IE5'] as const

export const MOTOR_CLASS_BENCHMARKS = {
  IE1: {
    efficiencyLeast: 0.75,
    efficiencyMax: 0.85,
    capexLeastInrPerKw: 3500,
    capexMaxInrPerKw: 4500,
  },
  IE2: {
    efficiencyLeast: 0.85,
    efficiencyMax: 0.89,
    capexLeastInrPerKw: 4000,
    capexMaxInrPerKw: 5000,
  },
  IE3: {
    efficiencyLeast: 0.9,
    efficiencyMax: 0.94,
    capexLeastInrPerKw: 4800,
    capexMaxInrPerKw: 6200,
  },
  IE4: {
    efficiencyLeast: 0.94,
    efficiencyMax: 0.96,
    capexLeastInrPerKw: 6000,
    capexMaxInrPerKw: 8000,
  },
  IE5: {
    efficiencyLeast: 0.96,
    efficiencyMax: 0.97,
    capexLeastInrPerKw: 9000,
    capexMaxInrPerKw: 12000,
  },
} as const

const MOTOR_RECOMMENDATION_COLORS = ['#0F766E', '#10B981', '#60A5FA'] as const

function getMotorClassIndex(efficiencyClass: string) {
  return MOTOR_CLASS_ORDER.indexOf(efficiencyClass as (typeof MOTOR_CLASS_ORDER)[number])
}

function parsePositiveNumber(value: string) {
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function formatMetricValue(value: number, decimals = 2) {
  if (!Number.isFinite(value)) {
    return '0'
  }

  return value.toLocaleString('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals > 0 ? 0 : 0,
  })
}

function getLegendLabel(candidate: MotorCatalogItem, index: number) {
  return `#${index + 1} ${candidate.make} - ${candidate.model}`
}

function normalizeMotorMake(make: string | null | undefined) {
  return make?.trim().toLowerCase() ?? ''
}

function getRecommendationCandidateKey(entry: MotorRecommendationCandidate) {
  return [
    normalizeMotorMake(entry.candidate.make),
    entry.candidate.model.trim().toLowerCase(),
    entry.candidate.efficiency_class,
    entry.candidate.rated_power_kw.toFixed(4),
  ].join('::')
}

function compareRecommendationCandidates(
  left: MotorRecommendationCandidate,
  right: MotorRecommendationCandidate
) {
  const leftMac = left.metrics.marginalAbatementCost
  const rightMac = right.metrics.marginalAbatementCost

  if (leftMac !== rightMac) {
    return leftMac - rightMac
  }

  if (left.exactRating !== right.exactRating) {
    return left.exactRating ? -1 : 1
  }

  if (left.metrics.paybackYears !== right.metrics.paybackYears) {
    return left.metrics.paybackYears - right.metrics.paybackYears
  }

  if (left.ratingDifferenceKw !== right.ratingDifferenceKw) {
    return left.ratingDifferenceKw - right.ratingDifferenceKw
  }

  if (left.targetEfficiency !== right.targetEfficiency) {
    return right.targetEfficiency - left.targetEfficiency
  }

  return left.candidate.model.localeCompare(right.candidate.model)
}

function selectDiversifiedRecommendationCandidates(
  scoredCandidates: MotorRecommendationCandidate[],
  limit: number,
  currentMake?: string
) {
  const sortedCandidates = [...scoredCandidates].sort(compareRecommendationCandidates)

  if (limit <= 1 || sortedCandidates.length <= 1) {
    return sortedCandidates.slice(0, limit)
  }

  const normalizedCurrentMake = normalizeMotorMake(currentMake)
  const selected: MotorRecommendationCandidate[] = []
  const usedKeys = new Set<string>()
  const usedMakes = new Set<string>()

  const pickCandidate = (entry?: MotorRecommendationCandidate) => {
    if (!entry) {
      return false
    }

    const key = getRecommendationCandidateKey(entry)

    if (usedKeys.has(key)) {
      return false
    }

    selected.push(entry)
    usedKeys.add(key)
    usedMakes.add(normalizeMotorMake(entry.candidate.make))
    return true
  }

  pickCandidate(sortedCandidates[0])

  if (normalizedCurrentMake) {
    pickCandidate(
      sortedCandidates.find(
        (entry) => normalizeMotorMake(entry.candidate.make) === normalizedCurrentMake
      )
    )

    pickCandidate(
      sortedCandidates.find(
        (entry) => normalizeMotorMake(entry.candidate.make) !== normalizedCurrentMake
      )
    )
  }

  for (const entry of sortedCandidates) {
    if (selected.length >= limit) {
      break
    }

    const make = normalizeMotorMake(entry.candidate.make)

    if (usedMakes.has(make)) {
      continue
    }

    pickCandidate(entry)
  }

  for (const entry of sortedCandidates) {
    if (selected.length >= limit) {
      break
    }

    pickCandidate(entry)
  }

  return [...selected].sort(compareRecommendationCandidates).slice(0, limit)
}

export function getMotorClassBenchmark(efficiencyClass: string) {
  return MOTOR_CLASS_BENCHMARKS[efficiencyClass as keyof typeof MOTOR_CLASS_BENCHMARKS] ?? null
}

export function getMotorBenchmarkCapexPerKw(efficiencyClass: string) {
  const benchmark = getMotorClassBenchmark(efficiencyClass)
  if (!benchmark) {
    return null
  }

  return benchmark.capexLeastInrPerKw
}

export function normalizeMotorRatingToKw(
  rating: string | number,
  unit: 'kW' | 'HP'
) {
  const value = typeof rating === 'number' ? rating : parseFloat(rating)

  if (!Number.isFinite(value) || value <= 0) {
    return 0
  }

  return unit === 'HP' ? value * 0.746 : value
}

export function getCatalogMotorEfficiency(motor: MotorCatalogItem | null) {
  if (!motor) {
    return null
  }

  const efficiency =
    motor.efficiency_100 ?? motor.efficiency_75 ?? motor.efficiency_50 ?? null

  if (typeof efficiency === 'number' && Number.isFinite(efficiency) && efficiency > 0) {
    return efficiency / 100
  }

  return getMotorClassBenchmark(motor.efficiency_class)?.efficiencyLeast ?? null
}

export function getCatalogMotorCapexPerKw(motor: MotorCatalogItem | null) {
  if (!motor) {
    return null
  }

  return getMotorBenchmarkCapexPerKw(motor.efficiency_class)
}

function getComparableTargetMotors(
  motors: MotorCatalogItem[],
  targetClass: string,
  ratingKw: number,
  currentMotor: MotorCatalogItem | null,
  _limit: number
) {
  let candidates = motors.filter(
    (motor) => motor.efficiency_class === targetClass && Number.isFinite(motor.rated_power_kw)
  )

  if (currentMotor && targetClass === currentMotor.efficiency_class) {
    const currentEfficiency =
      getCatalogMotorEfficiency(currentMotor) ??
      getMotorClassBenchmark(currentMotor.efficiency_class)?.efficiencyLeast ??
      0

    candidates = candidates.filter((motor) => {
      if (motor.make === currentMotor.make && motor.model === currentMotor.model) {
        return false
      }

      const candidateEfficiency =
        getCatalogMotorEfficiency(motor) ??
        getMotorClassBenchmark(motor.efficiency_class)?.efficiencyLeast ??
        0

      return candidateEfficiency > currentEfficiency + 0.0001
    })
  }

  if (candidates.length === 0) {
    return []
  }

  if (!Number.isFinite(ratingKw) || ratingKw <= 0) {
    return candidates
  }

  return [...candidates].sort(
    (left, right) =>
      Math.abs(left.rated_power_kw - ratingKw) - Math.abs(right.rated_power_kw - ratingKw)
  )
}

function calculateMotorUpgradeMetrics({
  ratingKw,
  numberOfMotors,
  loadFactor,
  operatingHours,
  electricityTariff,
  gridEmissionFactor,
  currentYears,
  targetLifetime,
  capexCurrentPerKw,
  capexTargetPerKw,
  currentEfficiency,
  targetEfficiency,
}: {
  ratingKw: number
  numberOfMotors: number
  loadFactor: number
  operatingHours: number
  electricityTariff: number
  gridEmissionFactor: number
  currentYears: number
  targetLifetime: number
  capexCurrentPerKw: number
  capexTargetPerKw: number
  currentEfficiency: number
  targetEfficiency: number
}) {
  const discountRate = 0.08
  const capacityBasisKw = ratingKw * numberOfMotors
  const ratedPowerCurrentKw = ratingKw * loadFactor * numberOfMotors
  const inputPowerCurrentKw = currentEfficiency > 0 ? ratedPowerCurrentKw / currentEfficiency : 0
  const annualEnergyCurrentKwh = inputPowerCurrentKw * operatingHours
  const inputPowerTargetKw = targetEfficiency > 0 ? ratedPowerCurrentKw / targetEfficiency : 0
  const annualEnergyTargetKwh = inputPowerTargetKw * operatingHours
  const annualEnergySavingsKwh = annualEnergyCurrentKwh - annualEnergyTargetKwh
  const annualCostCurrentInr = annualEnergyCurrentKwh * electricityTariff
  const annualCostTargetInr = annualEnergyTargetKwh * electricityTariff
  const annualEmissionsCurrentKg = annualEnergyCurrentKwh * gridEmissionFactor
  const annualEmissionsTargetKg = annualEnergyTargetKwh * gridEmissionFactor
  const annualEmissionsSavingsKg = annualEnergySavingsKwh * gridEmissionFactor
  const annualEnergyCostSavingsInr = annualEnergySavingsKwh * electricityTariff
  const annualEnergyCostSavingsPerKwInr =
    capacityBasisKw > 0 ? annualEnergyCostSavingsInr / capacityBasisKw : 0
  const annualEmissionsSavingsPerKwKg =
    capacityBasisKw > 0 ? annualEmissionsSavingsKg / capacityBasisKw : 0
  const presentValueCurrentPerKw = capexCurrentPerKw * Math.pow(1 - discountRate, currentYears)
  const incrementalCostPerKw = capexTargetPerKw - presentValueCurrentPerKw
  const totalIncrementalCostInr = incrementalCostPerKw * capacityBasisKw
  const annuityFactor =
    discountRate > 0
      ? (1 - Math.pow(1 + discountRate, -targetLifetime)) / discountRate
      : targetLifetime
  const npvEnergyCostSavingsInr = annualEnergyCostSavingsInr * annuityFactor
  const npvEnergyCostSavingsPerKwInr = annualEnergyCostSavingsPerKwInr * annuityFactor
  const paybackYears =
    annualEnergyCostSavingsPerKwInr > 0
      ? incrementalCostPerKw / annualEnergyCostSavingsPerKwInr
      : Number.POSITIVE_INFINITY
  const npvEmissionsReducedKg = annualEmissionsSavingsKg * annuityFactor
  const npvEmissionsReducedPerKwKg = annualEmissionsSavingsPerKwKg * annuityFactor
  const marginalAbatementCost =
    npvEmissionsReducedPerKwKg > 0
      ? (incrementalCostPerKw - npvEnergyCostSavingsPerKwInr) / npvEmissionsReducedPerKwKg
      : Number.POSITIVE_INFINITY

  return {
    ratedPowerCurrentKw,
    inputPowerCurrentKw,
    annualEnergyCurrentKwh,
    inputPowerTargetKw,
    annualEnergyTargetKwh,
    annualEnergySavingsKwh,
    annualCostCurrentInr,
    annualCostTargetInr,
    annualEmissionsCurrentKg,
    annualEmissionsTargetKg,
    annualEmissionsSavingsKg,
    annualEnergyCostSavingsInr,
    annualEnergyCostSavingsPerKwInr,
    presentValueCurrentPerKw,
    incrementalCostPerKw,
    totalIncrementalCostInr,
    npvEnergyCostSavingsInr,
    npvEnergyCostSavingsPerKwInr,
    paybackYears,
    npvEmissionsReducedKg,
    npvEmissionsReducedPerKwKg,
    marginalAbatementCost,
  }
}

function buildCandidateMetrics(
  candidate: MotorCatalogItem,
  ratingKw: number,
  assessment: MotorAssessmentCatalogState,
  currentMotorEfficiency: number
) {
  return calculateMotorUpgradeMetrics({
    ratingKw:
      normalizeMotorRatingToKw(assessment.motor_rating, assessment.motor_rating_unit) || ratingKw,
    numberOfMotors: parsePositiveNumber(assessment.number_of_motors) || 1,
    loadFactor: (parsePositiveNumber(assessment.load_factor) || 80) / 100,
    operatingHours: parsePositiveNumber(assessment.operating_hours_year),
    electricityTariff: parsePositiveNumber(assessment.electricity_tariff),
    gridEmissionFactor: parsePositiveNumber(assessment.grid_emission_factor),
    currentYears: parsePositiveNumber(assessment.years_of_operation_current_motor_class),
    targetLifetime: parsePositiveNumber(assessment.lifetime_of_target_motor_class) || 10,
    capexCurrentPerKw:
      parsePositiveNumber(assessment.capex_of_current_motor_class) ||
      getCatalogMotorCapexPerKw(assessment.selected_catalog_motor) ||
      getMotorBenchmarkCapexPerKw(assessment.current_motor_efficiency_class) ||
      0,
    capexTargetPerKw:
      getCatalogMotorCapexPerKw(candidate) ||
      parsePositiveNumber(assessment.capex_of_target_motor_class) ||
      getMotorBenchmarkCapexPerKw(candidate.efficiency_class) ||
      0,
    currentEfficiency: currentMotorEfficiency,
    targetEfficiency:
      getCatalogMotorEfficiency(candidate) ||
      getMotorClassBenchmark(candidate.efficiency_class)?.efficiencyLeast ||
      0,
  })
}

export function findRecommendedTargetMotors(
  motors: MotorCatalogItem[],
  targetClass: string,
  ratingKw: number,
  preferredMake?: string,
  assessment?: MotorAssessmentCatalogState,
  limit = 3,
  currentMotor?: MotorCatalogItem | null
) {
  const referenceMotor = currentMotor ?? assessment?.selected_catalog_motor ?? null
  const currentMake = preferredMake || referenceMotor?.make || ''
  const candidates = getComparableTargetMotors(
    motors,
    targetClass,
    ratingKw,
    referenceMotor,
    limit
  )

  if (candidates.length === 0) {
    return []
  }

  const currentMotorEfficiency =
    getCatalogMotorEfficiency(referenceMotor) ||
    getMotorClassBenchmark(
      assessment?.current_motor_efficiency_class || referenceMotor?.efficiency_class || ''
    )?.efficiencyLeast ||
    0

  const scoredCandidates = candidates.map((candidate) => {
    const metrics =
      assessment && currentMotorEfficiency > 0
        ? buildCandidateMetrics(candidate, ratingKw, assessment, currentMotorEfficiency)
        : calculateMotorUpgradeMetrics({
            ratingKw,
            numberOfMotors: 1,
            loadFactor: 1,
            operatingHours: 1,
            electricityTariff: 1,
            gridEmissionFactor: 1,
            currentYears: 0,
            targetLifetime: 1,
            capexCurrentPerKw:
              getMotorBenchmarkCapexPerKw(referenceMotor?.efficiency_class ?? targetClass) || 0,
            capexTargetPerKw:
              getCatalogMotorCapexPerKw(candidate) ||
              getMotorBenchmarkCapexPerKw(candidate.efficiency_class) ||
              0,
            currentEfficiency:
              currentMotorEfficiency ||
              getMotorClassBenchmark(referenceMotor?.efficiency_class ?? targetClass)
                ?.efficiencyLeast ||
              0,
            targetEfficiency:
              getCatalogMotorEfficiency(candidate) ||
              getMotorClassBenchmark(candidate.efficiency_class)?.efficiencyLeast ||
              0,
          })

    return {
      candidate,
      metrics,
      targetEfficiency:
        getCatalogMotorEfficiency(candidate) ||
        getMotorClassBenchmark(candidate.efficiency_class)?.efficiencyLeast ||
        0,
      capexTargetPerKw:
        getCatalogMotorCapexPerKw(candidate) ||
        getMotorBenchmarkCapexPerKw(candidate.efficiency_class) ||
        0,
      exactRating: Math.abs(candidate.rated_power_kw - ratingKw) < 0.001,
      ratingDifferenceKw: Math.abs(candidate.rated_power_kw - ratingKw),
      sameClassFallback: !!referenceMotor && candidate.efficiency_class === referenceMotor.efficiency_class,
    } satisfies MotorRecommendationCandidate
  })

  const viableCandidates = scoredCandidates.filter(
    (entry) =>
      entry.metrics.annualEnergySavingsKwh > 0 &&
      entry.metrics.annualEnergyCostSavingsInr > 0 &&
      entry.metrics.annualEmissionsSavingsKg > 0 &&
      Number.isFinite(entry.metrics.paybackYears) &&
      Number.isFinite(entry.metrics.marginalAbatementCost)
  )

  return selectDiversifiedRecommendationCandidates(viableCandidates, limit, currentMake)
}

export function findRecommendedTargetMotor(
  motors: MotorCatalogItem[],
  targetClass: string,
  ratingKw: number,
  preferredMake?: string,
  assessment?: MotorAssessmentCatalogState,
  currentMotor?: MotorCatalogItem | null
) {
  return (
    findRecommendedTargetMotors(
      motors,
      targetClass,
      ratingKw,
      preferredMake,
      assessment,
      1,
      currentMotor
    )[0]?.candidate ?? null
  )
}

export function getAvailableTargetClasses(
  motors: MotorCatalogItem[],
  currentMotor: MotorCatalogItem | null,
  ratingKw: number,
  preferredMake?: string
) {
  if (!currentMotor) {
    return []
  }

  const currentClassIndex = getMotorClassIndex(currentMotor.efficiency_class)
  const higherClasses = MOTOR_CLASS_ORDER.filter((efficiencyClass) => {
    if (getMotorClassIndex(efficiencyClass) <= currentClassIndex) {
      return false
    }

    return (
      findRecommendedTargetMotors(
        motors,
        efficiencyClass,
        ratingKw,
        preferredMake,
        undefined,
        1,
        currentMotor
      ).length > 0
    )
  })

  if (higherClasses.length > 0) {
    return higherClasses
  }

  const sameClassAlternatives = findRecommendedTargetMotors(
    motors,
    currentMotor.efficiency_class,
    ratingKw,
    preferredMake,
    undefined,
    1,
    currentMotor
  )

  return sameClassAlternatives.length > 0 ? [currentMotor.efficiency_class] : []
}

export function getRecommendedTargetClass(
  currentClass: string,
  availableTargetClasses: string[]
) {
  const currentClassIndex = getMotorClassIndex(currentClass)

  if (availableTargetClasses.length === 0) {
    return ''
  }

  if (availableTargetClasses.length === 1) {
    return availableTargetClasses[0]
  }

  if (currentClass === 'IE1' && availableTargetClasses.includes('IE3')) {
    return 'IE3'
  }

  if (currentClass === 'IE2' && availableTargetClasses.includes('IE4')) {
    return 'IE4'
  }

  const nextClass = availableTargetClasses.find(
    (efficiencyClass) => getMotorClassIndex(efficiencyClass) > currentClassIndex
  )

  return nextClass ?? availableTargetClasses[0]
}

export function buildMotorRecommendation(
  motor: MotorAssessmentCatalogState,
  catalogMotors: MotorCatalogItem[]
): MotorRecommendationResult | null {
  const currentMotor = motor.selected_catalog_motor
  const currentBenchmark = getMotorClassBenchmark(motor.current_motor_efficiency_class)

  if (!currentBenchmark || !currentMotor || catalogMotors.length === 0) {
    return null
  }

  const ratingKw = normalizeMotorRatingToKw(motor.motor_rating, motor.motor_rating_unit) || currentMotor.rated_power_kw
  let recommendationClass = motor.target_motor_efficiency_class
  let rankedCandidates = recommendationClass
    ? findRecommendedTargetMotors(
        catalogMotors,
        recommendationClass,
        ratingKw,
        motor.motor_make,
        motor,
        3,
        currentMotor
      )
    : []

  let isSameClassFallback = false

  if (rankedCandidates.length === 0) {
    recommendationClass = currentMotor.efficiency_class
    rankedCandidates = findRecommendedTargetMotors(
      catalogMotors,
      recommendationClass,
      ratingKw,
      motor.motor_make,
      motor,
      3,
      currentMotor
    )
    isSameClassFallback = rankedCandidates.length > 0
  }

  if (rankedCandidates.length === 0) {
    return null
  }

  const bestCandidate = rankedCandidates[0]
  const bestMetrics = bestCandidate.metrics

  const calculationBreakdown = [
    {
      label: 'Rated power of current motor class',
      value: formatMetricValue(bestMetrics.ratedPowerCurrentKw),
      unit: 'kW',
    },
    {
      label: 'Input power required for current motor class',
      value: formatMetricValue(bestMetrics.inputPowerCurrentKw),
      unit: 'kW',
    },
    {
      label: 'Annual energy consumption for current motor class',
      value: formatMetricValue(bestMetrics.annualEnergyCurrentKwh),
      unit: 'kWh/year',
    },
    {
      label: 'Input power for recommended motor',
      value: formatMetricValue(bestMetrics.inputPowerTargetKw),
      unit: 'kW',
    },
    {
      label: 'Annual energy consumption for recommended motor',
      value: formatMetricValue(bestMetrics.annualEnergyTargetKwh),
      unit: 'kWh/year',
    },
    {
      label: 'Annual energy savings',
      value: formatMetricValue(bestMetrics.annualEnergySavingsKwh),
      unit: 'kWh/year',
    },
    {
      label: 'Annual GHG emissions savings',
      value: formatMetricValue(bestMetrics.annualEmissionsSavingsKg),
      unit: 'kgCO2e/year',
    },
    {
      label: 'Annual energy cost savings',
      value: formatMetricValue(bestMetrics.annualEnergyCostSavingsInr),
      unit: 'INR/year',
    },
    {
      label: 'Present value of current motor class',
      value: formatMetricValue(bestMetrics.presentValueCurrentPerKw),
      unit: 'INR/kW',
    },
    {
      label: 'Incremental cost for motor upgrade per motor',
      value: formatMetricValue(bestMetrics.incrementalCostPerKw),
      unit: 'INR/kW',
    },
    {
      label: 'Net present value of energy cost savings over target lifetime',
      value: formatMetricValue(bestMetrics.npvEnergyCostSavingsPerKwInr),
      unit: 'INR/kW',
    },
    {
      label: 'Payback period',
      value: Number.isFinite(bestMetrics.paybackYears)
        ? formatMetricValue(bestMetrics.paybackYears, 2)
        : 'N/A',
      unit: 'years',
    },
    {
      label: 'Net present value of emissions reduced over target lifetime',
      value: formatMetricValue(bestMetrics.npvEmissionsReducedPerKwKg),
      unit: 'kgCO2e/kW',
    },
    {
      label: 'Marginal abatement cost',
      value: Number.isFinite(bestMetrics.marginalAbatementCost)
        ? formatMetricValue(bestMetrics.marginalAbatementCost, 4)
        : 'N/A',
      unit: 'INR/kgCO2e',
    },
  ]

  return {
    currentSystem: {
      type: `${motor.current_motor_efficiency_class} Motor`,
      rating: `${motor.motor_rating} ${motor.motor_rating_unit}`,
      make: currentMotor.make,
      model: currentMotor.model,
      annualEnergy: Math.round(bestMetrics.annualEnergyCurrentKwh),
      annualCost: Math.round(bestMetrics.annualCostCurrentInr),
    },
    recommendations: rankedCandidates.map((entry, index) => ({
      id: index + 1,
      name: `${entry.candidate.efficiency_class} Upgrade Option ${index + 1}`,
      make: entry.candidate.make,
      model: entry.candidate.model,
      badge:
        index === 0
          ? 'Lowest MAC'
          : index === 1
            ? 'Strong Alternative'
            : 'Alternative',
      energySavings: Math.round(entry.metrics.annualEnergySavingsKwh),
      costSavings: Math.round(entry.metrics.annualEnergyCostSavingsInr),
      emissionSavings: Math.round(entry.metrics.annualEmissionsSavingsKg),
      upgradeCost: Math.round(entry.metrics.totalIncrementalCostInr),
      paybackYears: Number.isFinite(entry.metrics.paybackYears)
        ? entry.metrics.paybackYears.toFixed(2)
        : 'N/A',
      efficiency: Number((entry.targetEfficiency * 100).toFixed(1)),
      marginalAbatementCost: Number.isFinite(entry.metrics.marginalAbatementCost)
        ? formatMetricValue(entry.metrics.marginalAbatementCost, 4)
        : 'N/A',
      details: `${entry.candidate.rated_power_kw.toLocaleString('en-IN')} kW | ${Number(
        (entry.targetEfficiency * 100).toFixed(1)
      )}% efficiency${
        entry.sameClassFallback
          ? ` | Best available ${entry.candidate.efficiency_class} alternative`
          : ` | Ranked within ${recommendationClass}`
      }`,
      efficiencyClass: entry.candidate.efficiency_class,
      ratedPowerKw: entry.candidate.rated_power_kw,
      currentAnnualEnergy: Math.round(entry.metrics.annualEnergyCurrentKwh),
      recommendedAnnualEnergy: Math.round(entry.metrics.annualEnergyTargetKwh),
      currentAnnualCost: Math.round(entry.metrics.annualCostCurrentInr),
      recommendedAnnualCost: Math.round(entry.metrics.annualCostTargetInr),
      currentAnnualEmissions: Math.round(entry.metrics.annualEmissionsCurrentKg),
      recommendedAnnualEmissions: Math.round(entry.metrics.annualEmissionsTargetKg),
    })),
    summary: {
      totalEnergySavings: Math.round(bestMetrics.annualEnergySavingsKwh),
      totalCostSavings: Math.round(bestMetrics.annualEnergyCostSavingsInr),
      totalEmissionSavings: Number((bestMetrics.annualEmissionsSavingsKg / 1000).toFixed(2)),
      averagePayback: Number.isFinite(bestMetrics.paybackYears)
        ? bestMetrics.paybackYears.toFixed(2)
        : 'N/A',
    },
    calculationBreakdown,
    chartData: {
      energyTrendYears: Array.from({ length: 10 }, (_, index) => `Year ${index + 1}`),
      energyTrendSeries: [
        {
          name: 'Current motor',
          color: '#94A3B8',
          dashed: true,
          data: Array.from({ length: 10 }, (_, index) =>
            Number((bestMetrics.annualEnergyCurrentKwh * (index + 1)).toFixed(2))
          ),
        },
        ...rankedCandidates.map((entry, index) => ({
          name: getLegendLabel(entry.candidate, index),
          color: MOTOR_RECOMMENDATION_COLORS[index] ?? MOTOR_RECOMMENDATION_COLORS.at(-1) ?? '#10B981',
          data: Array.from({ length: 10 }, (_, yearIndex) =>
            Number((entry.metrics.annualEnergyTargetKwh * (yearIndex + 1)).toFixed(2))
          ),
        })),
      ],
      energySplitData: [
        {
          value: Number(bestMetrics.annualEnergySavingsKwh.toFixed(2)),
          name: 'Annual energy saved',
        },
        {
          value: Number(bestMetrics.annualEnergyTargetKwh.toFixed(2)),
          name: 'Annual energy used by best recommendation',
        },
      ],
      bestRecommendationLabel: `${bestCandidate.candidate.make} ${bestCandidate.candidate.model}`,
      highlightMetrics: [
        {
          label: 'Payback period',
          value: Number.isFinite(bestMetrics.paybackYears)
            ? formatMetricValue(bestMetrics.paybackYears, 2)
            : 'N/A',
          unit: 'years',
        },
        {
          label: 'Marginal abatement cost',
          value: Number.isFinite(bestMetrics.marginalAbatementCost)
            ? formatMetricValue(bestMetrics.marginalAbatementCost, 4)
            : 'N/A',
          unit: 'INR/kgCO2e',
        },
        {
          label: 'Incremental upgrade cost',
          value: formatMetricValue(bestMetrics.incrementalCostPerKw),
          unit: 'INR/kW',
        },
        {
          label: 'NPV energy savings',
          value: formatMetricValue(bestMetrics.npvEnergyCostSavingsPerKwInr),
          unit: 'INR/kW',
        },
      ],
    },
    recommendationNote: isSameClassFallback
      ? `No higher-efficiency catalog class is available for this ${currentMotor.efficiency_class} motor, so the shortlist uses better ${currentMotor.efficiency_class} motors.`
      : '',
  }
}
