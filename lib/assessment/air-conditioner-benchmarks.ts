import type {
  AirConditionerCapacityUnit,
  AirConditionerStarRating,
  AirConditionerType,
} from '@/lib/air-conditioner-catalog'

export const AIR_CONDITIONER_DEFAULTS = {
  operatingHoursYear: 2400,
  lifetimeYears: 15,
  loadFactorPercent: 80,
  electricityTariffInrPerKwh: 8,
  gridEmissionFactorKgPerKwh: 0.716,
  discountRatePercent: 8,
} as const

export const AIR_CONDITIONER_TYPE_OPTIONS: Array<{
  value: AirConditionerType
  label: string
}> = [
  { value: 'split_fixed_speed', label: 'Split - Fixed Speed' },
  { value: 'window', label: 'Window' },
  { value: 'cassette', label: 'Cassette Type' },
  { value: 'standing_tower', label: 'Standing Tower' },
  { value: 'corner_floor_mounted', label: 'Corner/Floor Mounted AC' },
  { value: 'split_inverter', label: 'Split - Inverter' },
]

export const AIR_CONDITIONER_STAR_OPTIONS: Array<{
  value: AirConditionerStarRating
  label: string
}> = [
  { value: '1', label: '1 Star' },
  { value: '2', label: '2 Star' },
  { value: '3', label: '3 Star' },
  { value: '4', label: '4 Star' },
  { value: '5', label: '5 Star' },
]

export const AIR_CONDITIONER_CAPACITY_UNIT_OPTIONS: Array<{
  value: AirConditionerCapacityUnit
  label: string
}> = [
  { value: 'TR', label: 'TR' },
  { value: 'kW', label: 'kW' },
]

const DEFAULT_ISEER_BY_TYPE_AND_STAR: Record<
  AirConditionerType,
  Record<AirConditionerStarRating, number>
> = {
  split_fixed_speed: {
    '1': 3.1,
    '2': 3.3,
    '3': 3.9,
    '4': 4.5,
    '5': 5.2,
  },
  split_inverter: {
    '1': 3.1,
    '2': 3.3,
    '3': 3.9,
    '4': 4.5,
    '5': 5.2,
  },
  window: {
    '1': 2.7,
    '2': 2.8,
    '3': 3.2,
    '4': 3.6,
    '5': 4.1,
  },
  standing_tower: {
    '1': 2.9,
    '2': 3.0,
    '3': 3.6,
    '4': 4.0,
    '5': 4.6,
  },
  cassette: {
    '1': 3.1,
    '2': 3.2,
    '3': 3.6,
    '4': 4.0,
    '5': 4.6,
  },
  corner_floor_mounted: {
    '1': 2.9,
    '2': 3.0,
    '3': 3.6,
    '4': 4.0,
    '5': 4.6,
  },
}

const CAPEX_RANGE_BY_TYPE_AND_STAR: Record<
  AirConditionerType,
  Partial<
    Record<
      AirConditionerStarRating,
      {
        minInr: number
        maxInr: number
      }
    >
  >
> = {
  window: {
    '1': { minInr: 22000, maxInr: 26000 },
    '2': { minInr: 24000, maxInr: 30000 },
    '3': { minInr: 26000, maxInr: 32000 },
    '4': { minInr: 30000, maxInr: 36000 },
    '5': { minInr: 34000, maxInr: 40000 },
  },
  split_fixed_speed: {
    '1': { minInr: 25000, maxInr: 32000 },
    '2': { minInr: 27000, maxInr: 35000 },
    '3': { minInr: 29000, maxInr: 38000 },
    '4': { minInr: 32000, maxInr: 42000 },
    '5': { minInr: 35000, maxInr: 48000 },
  },
  split_inverter: {
    '1': { minInr: 32000, maxInr: 40000 },
    '2': { minInr: 34000, maxInr: 45000 },
    '3': { minInr: 36000, maxInr: 50000 },
    '4': { minInr: 42000, maxInr: 60000 },
    '5': { minInr: 48000, maxInr: 75000 },
  },
  cassette: {
    '3': { minInr: 75000, maxInr: 95000 },
    '4': { minInr: 85000, maxInr: 110000 },
    '5': { minInr: 100000, maxInr: 135000 },
  },
  standing_tower: {
    '2': { minInr: 70000, maxInr: 90000 },
    '3': { minInr: 85000, maxInr: 110000 },
    '4': { minInr: 100000, maxInr: 140000 },
    '5': { minInr: 125000, maxInr: 180000 },
  },
  corner_floor_mounted: {
    '3': { minInr: 75000, maxInr: 75000 },
    '4': { minInr: 90000, maxInr: 90000 },
    '5': { minInr: 115000, maxInr: 115000 },
  },
}

export function normalizeAirConditionerType(
  value: string | null | undefined
): AirConditionerType | null {
  if (!value) {
    return null
  }

  switch (value) {
    case 'split_fixed_speed':
    case 'window':
    case 'cassette':
    case 'standing_tower':
    case 'corner_floor_mounted':
    case 'split_inverter':
      return value
    case 'window_non_inverter':
      return 'window'
    case 'split_non_inverter':
      return 'split_fixed_speed'
    case 'split_inverter_3star':
      return 'split_inverter'
    default:
      return null
  }
}

export function normalizeAirConditionerStarRating(
  value: string | number | null | undefined
): AirConditionerStarRating | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const normalized = String(Math.round(value))
    return normalized >= '1' && normalized <= '5'
      ? (normalized as AirConditionerStarRating)
      : null
  }

  if (typeof value !== 'string') {
    return null
  }

  const match = value.match(/[1-5]/)
  return match ? (match[0] as AirConditionerStarRating) : null
}

export function getAirConditionerTypeLabel(type: string | null | undefined) {
  return (
    AIR_CONDITIONER_TYPE_OPTIONS.find((option) => option.value === type)?.label ??
    'Air Conditioner'
  )
}

export function getAirConditionerStarLabel(starRating: string | number | null | undefined) {
  const normalizedStarRating = normalizeAirConditionerStarRating(starRating)
  return normalizedStarRating ? `${normalizedStarRating} Star` : 'Star Rating N/A'
}

export function getDefaultAirConditionerISEER(
  starRating: string | number | null | undefined,
  type?: string | null
) {
  const normalizedStarRating = normalizeAirConditionerStarRating(starRating) ?? '3'
  const normalizedType = normalizeAirConditionerType(type ?? '') ?? 'split_fixed_speed'
  const typeIseerTable = DEFAULT_ISEER_BY_TYPE_AND_STAR[normalizedType]
  return typeIseerTable?.[normalizedStarRating] ?? DEFAULT_ISEER_BY_TYPE_AND_STAR.split_fixed_speed[normalizedStarRating]
}

function resolveCapexBand(
  type: string | null | undefined,
  starRating: string | number | null | undefined
) {
  const normalizedType = normalizeAirConditionerType(type) ?? 'split_inverter'
  const normalizedStarRating = normalizeAirConditionerStarRating(starRating) ?? '3'
  const capexBands = CAPEX_RANGE_BY_TYPE_AND_STAR[normalizedType]

  if (capexBands[normalizedStarRating]) {
    return capexBands[normalizedStarRating]
  }

  const availableStarRatings = (Object.keys(capexBands) as AirConditionerStarRating[]).sort(
    (left, right) => Number(left) - Number(right)
  )

  if (availableStarRatings.length === 0) {
    return CAPEX_RANGE_BY_TYPE_AND_STAR.split_inverter['3']!
  }

  const requestedStarValue = Number(normalizedStarRating)
  const nearestStarRating = availableStarRatings.reduce((closest, candidate) => {
    const closestGap = Math.abs(Number(closest) - requestedStarValue)
    const candidateGap = Math.abs(Number(candidate) - requestedStarValue)
    return candidateGap < closestGap ? candidate : closest
  }, availableStarRatings[0])

  return capexBands[nearestStarRating] ?? CAPEX_RANGE_BY_TYPE_AND_STAR.split_inverter['3']!
}

export function getDefaultAirConditionerCapexRange(
  type: string | null | undefined,
  starRating: string | number | null | undefined,
  _capacityTon?: number
) {
  const band = resolveCapexBand(type, starRating)
  return { ...band }
}

export function getDefaultAirConditionerCapex(
  type: string | null | undefined,
  starRating: string | number | null | undefined,
  capacityTon?: number
) {
  const range = getDefaultAirConditionerCapexRange(type, starRating, capacityTon)
  return range.minInr
}
