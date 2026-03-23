import 'server-only'

import {
  getAirConditionerCatalogKey,
  normalizeCatalogAirConditionerType,
  type AirConditionerCatalogItem,
  type AirConditionerCatalogPayload,
} from '@/lib/air-conditioner-catalog'
import { readEquipmentCatalog } from '@/lib/server/read-equipment-catalog'

let cachedPayload: AirConditionerCatalogPayload | null = null

function toStringOrNull(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}

function toNumberOrNull(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function toBoolean(value: unknown) {
  return value === true
}

function mapCatalogAirConditioner(item: Record<string, unknown>): AirConditionerCatalogItem {
  const mappedItem = {
    make: String(item.make ?? ''),
    model: String(item.model ?? ''),
    designation: toStringOrNull(item.designation),
    display_name: toStringOrNull(item.display_name),
    series: toStringOrNull(item.series),
    air_conditioner_type: toStringOrNull(item.air_conditioner_type),
    capacity_ton: toNumberOrNull(item.capacity_ton),
    rated_power_kw: toNumberOrNull(item.rated_power_kw),
    power_consumption_kw: toNumberOrNull(item.power_consumption_kw),
    refrigerant_type: toStringOrNull(item.refrigerant_type),
    cooling_capacity_kw: toNumberOrNull(item.cooling_capacity_kw),
    cooling_capacity_text: toStringOrNull(item.cooling_capacity_text),
    voltage_text: toStringOrNull(item.voltage_text),
    rated_voltage_v: toNumberOrNull(item.rated_voltage_v),
    current_text: toStringOrNull(item.current_text),
    rated_current_a: toNumberOrNull(item.rated_current_a),
    star_rating: toNumberOrNull(item.star_rating),
    star_rating_label: toStringOrNull(item.star_rating_label),
    inverter_type: toStringOrNull(item.inverter_type),
    is_inverter: toBoolean(item.is_inverter),
    estimated_eer: toNumberOrNull(item.estimated_eer),
    catalog_category: toStringOrNull(item.catalog_category),
    catalog_subcategory: toStringOrNull(item.catalog_subcategory),
    market_region: toStringOrNull(item.market_region),
    source_dataset: toStringOrNull(item.source_dataset),
    source_file: toStringOrNull(item.source_file),
    normalized_ac_type: 'split_fixed_speed' as const,
  }

  return {
    ...mappedItem,
    normalized_ac_type: normalizeCatalogAirConditionerType(mappedItem),
  }
}

function buildMakeCounts(airConditioners: AirConditionerCatalogItem[]) {
  return Array.from(
    airConditioners.reduce((counts, airConditioner) => {
      counts.set(airConditioner.make, (counts.get(airConditioner.make) ?? 0) + 1)
      return counts
    }, new Map<string, number>())
  )
    .map(([make, count]) => ({ make, count }))
    .sort((left, right) => left.make.localeCompare(right.make))
}

function buildTypeCounts(airConditioners: AirConditionerCatalogItem[]) {
  return Array.from(
    airConditioners.reduce((counts, airConditioner) => {
      counts.set(
        airConditioner.normalized_ac_type,
        (counts.get(airConditioner.normalized_ac_type) ?? 0) + 1
      )
      return counts
    }, new Map<AirConditionerCatalogItem['normalized_ac_type'], number>())
  )
    .map(([type, count]) => ({ type, count }))
    .sort((left, right) => left.type.localeCompare(right.type))
}

export async function getAirConditionerCatalogPayload() {
  if (cachedPayload) {
    return cachedPayload
  }

  const catalog = await readEquipmentCatalog()

  const airConditioners = Array.from(
    catalog
      .filter((item) => item.asset_type === 'air_conditioner')
      .map(mapCatalogAirConditioner)
      .filter((item) => item.make && item.model)
      .reduce((uniqueAirConditioners, airConditioner) => {
        const key = getAirConditionerCatalogKey(airConditioner)

        if (!uniqueAirConditioners.has(key)) {
          uniqueAirConditioners.set(key, airConditioner)
        }

        return uniqueAirConditioners
      }, new Map<string, AirConditionerCatalogItem>())
      .values()
  ).sort((left, right) => {
    if (left.make !== right.make) {
      return left.make.localeCompare(right.make)
    }

    const leftCapacity = left.capacity_ton ?? Number.POSITIVE_INFINITY
    const rightCapacity = right.capacity_ton ?? Number.POSITIVE_INFINITY

    if (leftCapacity !== rightCapacity) {
      return leftCapacity - rightCapacity
    }

    const leftStar = left.star_rating ?? 0
    const rightStar = right.star_rating ?? 0

    if (leftStar !== rightStar) {
      return rightStar - leftStar
    }

    return left.model.localeCompare(right.model)
  })

  cachedPayload = {
    makeCounts: buildMakeCounts(airConditioners),
    typeCounts: buildTypeCounts(airConditioners),
    airConditioners,
  }

  return cachedPayload
}
