export const AIR_CONDITIONER_TYPE_VALUES = [
  'split_fixed_speed',
  'window',
  'cassette',
  'standing_tower',
  'corner_floor_mounted',
  'split_inverter',
] as const

export type AirConditionerType = (typeof AIR_CONDITIONER_TYPE_VALUES)[number]
export type AirConditionerCapacityUnit = 'TR' | 'kW'
export type AirConditionerStarRating = '1' | '2' | '3' | '4' | '5'

export interface AirConditionerCatalogItem {
  make: string
  model: string
  designation: string | null
  display_name: string | null
  series: string | null
  air_conditioner_type: string | null
  normalized_ac_type: AirConditionerType
  capacity_ton: number | null
  rated_power_kw: number | null
  power_consumption_kw: number | null
  refrigerant_type: string | null
  cooling_capacity_kw: number | null
  cooling_capacity_text: string | null
  voltage_text: string | null
  rated_voltage_v: number | null
  current_text: string | null
  rated_current_a: number | null
  star_rating: number | null
  star_rating_label: string | null
  inverter_type: string | null
  is_inverter: boolean
  estimated_eer: number | null
  catalog_category: string | null
  catalog_subcategory: string | null
  market_region: string | null
  source_dataset: string | null
  source_file: string | null
}

export interface AirConditionerCatalogPayload {
  makeCounts: Array<{
    make: string
    count: number
  }>
  typeCounts: Array<{
    type: AirConditionerType
    count: number
  }>
  airConditioners: AirConditionerCatalogItem[]
}

export function convertCapacityToKw(
  capacityValue: number | null | undefined,
  unit: AirConditionerCapacityUnit
) {
  if (typeof capacityValue !== 'number' || !Number.isFinite(capacityValue) || capacityValue <= 0) {
    return 0
  }

  return unit === 'TR' ? capacityValue * 3.517 : capacityValue
}

export function convertCapacityToTon(
  capacityValue: number | null | undefined,
  unit: AirConditionerCapacityUnit
) {
  if (typeof capacityValue !== 'number' || !Number.isFinite(capacityValue) || capacityValue <= 0) {
    return 0
  }

  return unit === 'kW' ? capacityValue / 3.517 : capacityValue
}

export function getAirConditionerCatalogKey(
  airConditioner: Pick<
    AirConditionerCatalogItem,
    'make' | 'model' | 'capacity_ton' | 'star_rating' | 'normalized_ac_type'
  >
) {
  return [
    airConditioner.make.trim(),
    airConditioner.model.trim(),
    airConditioner.capacity_ton ?? '',
    airConditioner.star_rating ?? '',
    airConditioner.normalized_ac_type,
  ].join('::')
}

export function normalizeCatalogAirConditionerType(
  airConditioner: Pick<
    AirConditionerCatalogItem,
    'air_conditioner_type' | 'catalog_subcategory' | 'inverter_type' | 'is_inverter'
  >
): AirConditionerType {
  const combinedText = [
    airConditioner.air_conditioner_type,
    airConditioner.catalog_subcategory,
    airConditioner.inverter_type,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()
    .toLowerCase()

  if (combinedText.includes('window')) {
    return 'window'
  }

  if (combinedText.includes('cassette') || combinedText.includes('casette')) {
    return 'cassette'
  }

  if (combinedText.includes('standing') || combinedText.includes('tower')) {
    return 'standing_tower'
  }

  if (combinedText.includes('corner') || combinedText.includes('floor')) {
    return 'corner_floor_mounted'
  }

  if (
    combinedText.includes('non-inverter') ||
    combinedText.includes('fixed speed') ||
    combinedText.includes('fixed-speed') ||
    airConditioner.is_inverter === false
  ) {
    return 'split_fixed_speed'
  }

  if (combinedText.includes('inverter') || airConditioner.is_inverter) {
    return 'split_inverter'
  }

  return 'split_fixed_speed'
}
