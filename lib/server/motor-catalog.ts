import 'server-only'

import type { MotorCatalogItem, MotorCatalogPayload } from '@/lib/motor-catalog'
import { readEquipmentCatalog } from '@/lib/server/read-equipment-catalog'

let cachedPayload: MotorCatalogPayload | null = null

function toStringOrNull(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}

function toNumberOrNull(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export async function getMotorCatalogPayload() {
  if (cachedPayload) {
    return cachedPayload
  }

  const catalog = await readEquipmentCatalog()

  const motors: MotorCatalogItem[] = catalog
    .filter((item) => item.asset_type === 'motor')
    .map((item) => ({
      make: String(item.make ?? ''),
      model: String(item.model ?? ''),
      designation: toStringOrNull(item.designation),
      display_name: toStringOrNull(item.display_name),
      series: toStringOrNull(item.series),
      efficiency_class: String(item.efficiency_class ?? ''),
      rated_power_kw: Number(item.rated_power_kw ?? 0),
      frame_size: toStringOrNull(item.frame_size),
      poles: toNumberOrNull(item.poles),
      efficiency_50: toNumberOrNull(item.efficiency_50),
      efficiency_75: toNumberOrNull(item.efficiency_75),
      efficiency_100: toNumberOrNull(item.efficiency_100),
      capex_min_inr_per_kw: toNumberOrNull(item.capex_min_inr_per_kw),
      capex_max_inr_per_kw: toNumberOrNull(item.capex_max_inr_per_kw),
      estimated_price_min_inr: toNumberOrNull(item.estimated_price_min_inr),
      estimated_price_max_inr: toNumberOrNull(item.estimated_price_max_inr),
    }))
    .filter((item) => item.make && item.model && item.efficiency_class && Number.isFinite(item.rated_power_kw))
    .sort((left, right) => {
      if (left.make !== right.make) {
        return left.make.localeCompare(right.make)
      }

      if (left.rated_power_kw !== right.rated_power_kw) {
        return left.rated_power_kw - right.rated_power_kw
      }

      return left.model.localeCompare(right.model)
    })

  const makeCounts = Array.from(
    motors.reduce((counts, motor) => {
      counts.set(motor.make, (counts.get(motor.make) ?? 0) + 1)
      return counts
    }, new Map<string, number>())
  )
    .map(([make, count]) => ({ make, count }))
    .sort((left, right) => left.make.localeCompare(right.make))

  cachedPayload = {
    makeCounts,
    motors,
  }

  return cachedPayload
}
