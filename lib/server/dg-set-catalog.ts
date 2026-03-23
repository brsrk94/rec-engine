import 'server-only'

import {
  getDGSetCatalogKey,
  type DGSetCatalogItem,
  type DGSetCatalogPayload,
} from '@/lib/dg-set-catalog'
import { readEquipmentCatalog } from '@/lib/server/read-equipment-catalog'

let cachedPayload: DGSetCatalogPayload | null = null

function toStringOrNull(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}

function toNumberOrNull(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function mapCatalogDGSet(item: Record<string, unknown>): DGSetCatalogItem {
  return {
    make: String(item.make ?? ''),
    model: String(item.model ?? ''),
    designation: toStringOrNull(item.designation),
    display_name: toStringOrNull(item.display_name),
    fuel_type: toStringOrNull(item.fuel_type),
    engine_model: toStringOrNull(item.engine_model),
    rated_capacity_kva: toNumberOrNull(item.rated_capacity_kva),
    fuel_consumption_lph_full_load: toNumberOrNull(item.fuel_consumption_lph_full_load),
    fuel_consumption_text: toStringOrNull(item.fuel_consumption_text),
    cpcb_current_standards: toStringOrNull(item.cpcb_current_standards),
    catalog_category: toStringOrNull(item.catalog_category),
    catalog_subcategory: toStringOrNull(item.catalog_subcategory),
    market_region: toStringOrNull(item.market_region),
    source_dataset: toStringOrNull(item.source_dataset),
    source_file: toStringOrNull(item.source_file),
  }
}

function buildMakeCounts(dgSets: DGSetCatalogItem[]) {
  return Array.from(
    dgSets.reduce((counts, dgSet) => {
      counts.set(dgSet.make, (counts.get(dgSet.make) ?? 0) + 1)
      return counts
    }, new Map<string, number>())
  )
    .map(([make, count]) => ({ make, count }))
    .sort((left, right) => left.make.localeCompare(right.make))
}

export async function getDGSetCatalogPayload() {
  if (cachedPayload) {
    return cachedPayload
  }

  const catalog = await readEquipmentCatalog()

  const dgSets = Array.from(
    catalog
      .filter((item) => item.asset_type === 'dg_set')
      .map(mapCatalogDGSet)
      .filter(
        (item) =>
          item.make &&
          item.model &&
          item.fuel_type?.trim().toLowerCase() === 'diesel' &&
          typeof item.rated_capacity_kva === 'number' &&
          item.rated_capacity_kva > 0
      )
      .reduce((uniqueItems, dgSet) => {
        const key = getDGSetCatalogKey(dgSet)

        if (!uniqueItems.has(key)) {
          uniqueItems.set(key, dgSet)
        }

        return uniqueItems
      }, new Map<string, DGSetCatalogItem>())
      .values()
  ).sort((left, right) => {
    if (left.make !== right.make) {
      return left.make.localeCompare(right.make)
    }

    const leftCapacity = left.rated_capacity_kva ?? Number.POSITIVE_INFINITY
    const rightCapacity = right.rated_capacity_kva ?? Number.POSITIVE_INFINITY

    if (leftCapacity !== rightCapacity) {
      return leftCapacity - rightCapacity
    }

    return left.model.localeCompare(right.model)
  })

  cachedPayload = {
    makeCounts: buildMakeCounts(dgSets),
    dgSets,
  }

  return cachedPayload
}
