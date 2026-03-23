import 'server-only'

import {
  getLEDCatalogKey,
  type LEDCatalogItem,
  type LEDCatalogPayload,
} from '@/lib/led-catalog'
import { readEquipmentCatalog } from '@/lib/server/read-equipment-catalog'

let cachedPayload: LEDCatalogPayload | null = null

function toStringOrNull(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}

function toNumberOrNull(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function isLEDBulb(item: Record<string, unknown>) {
  const assetType = String(item.asset_type ?? '').trim().toLowerCase()
  const lampType = String(item.lamp_type ?? '').trim().toLowerCase()
  const catalogSubcategory = String(item.catalog_subcategory ?? '').trim().toLowerCase()

  return assetType === 'lighting' && lampType === 'led' && catalogSubcategory === 'led bulbs'
}

function mapCatalogBulb(item: Record<string, unknown>): LEDCatalogItem {
  return {
    make: String(item.make ?? ''),
    model: String(item.model ?? ''),
    designation: toStringOrNull(item.designation),
    display_name: toStringOrNull(item.display_name),
    series: toStringOrNull(item.series),
    model_no: toStringOrNull(item.model_no),
    input_power_w: toNumberOrNull(item.input_power_w),
    rated_power_kw: toNumberOrNull(item.rated_power_kw),
    colour_temperature: toStringOrNull(item.colour_temperature),
    color_temperature_k: toNumberOrNull(item.color_temperature_k),
    cri: toStringOrNull(item.cri),
    lumens: toNumberOrNull(item.lumens),
    voltage_text: toStringOrNull(item.voltage_text),
    power_factor: toNumberOrNull(item.power_factor),
    power_factor_text: toStringOrNull(item.power_factor_text),
    lifespan_hours: toNumberOrNull(item.lifespan_hours),
    lifespan_text: toStringOrNull(item.lifespan_text),
    surge_protection_text: toStringOrNull(item.surge_protection_text),
    energy_consumption_text: toStringOrNull(item.energy_consumption_text),
    power_text: toStringOrNull(item.power_text),
    lumens_text: toStringOrNull(item.lumens_text),
    estimated_luminous_efficacy_lm_w: toNumberOrNull(item.estimated_luminous_efficacy_lm_w),
  }
}

function buildMakeCounts(bulbs: LEDCatalogItem[]) {
  return Array.from(
    bulbs.reduce((counts, bulb) => {
      counts.set(bulb.make, (counts.get(bulb.make) ?? 0) + 1)
      return counts
    }, new Map<string, number>())
  )
    .map(([make, count]) => ({ make, count }))
    .sort((left, right) => left.make.localeCompare(right.make))
}

export async function getLEDCatalogPayload() {
  if (cachedPayload) {
    return cachedPayload
  }

  const catalog = await readEquipmentCatalog()

  const bulbs = Array.from(
    catalog
      .filter(isLEDBulb)
      .map(mapCatalogBulb)
      .filter((item) => item.make && item.model)
      .reduce((uniqueBulbs, bulb) => {
        const key = getLEDCatalogKey(bulb)

        if (!uniqueBulbs.has(key)) {
          uniqueBulbs.set(key, bulb)
        }

        return uniqueBulbs
      }, new Map<string, LEDCatalogItem>())
      .values()
  ).sort((left, right) => {
    if (left.make !== right.make) {
      return left.make.localeCompare(right.make)
    }

    const leftPower = left.input_power_w ?? Number.POSITIVE_INFINITY
    const rightPower = right.input_power_w ?? Number.POSITIVE_INFINITY

    if (leftPower !== rightPower) {
      return leftPower - rightPower
    }

    return left.model.localeCompare(right.model)
  })

  cachedPayload = {
    makeCounts: buildMakeCounts(bulbs),
    bulbs,
  }

  return cachedPayload
}
