import 'server-only'

import { readFile } from 'node:fs/promises'
import path from 'node:path'

import {
  getBLDCFanCatalogKey,
  type BLDCFanCatalogItem,
  type BLDCFanCatalogPayload,
} from '@/lib/bldc-fan-catalog'

let cachedPayload: BLDCFanCatalogPayload | null = null

function toStringOrNull(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}

function toNumberOrNull(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function isBLDCCeilingFan(item: Record<string, unknown>) {
  const assetType = String(item.asset_type ?? '').trim().toLowerCase()
  const motorType = String(item.motor_type ?? '').trim().toLowerCase()
  const catalogSubcategory = String(item.catalog_subcategory ?? '').trim().toLowerCase()

  return (
    assetType === 'fan' &&
    motorType === 'bldc' &&
    catalogSubcategory === 'bldc ceiling fans'
  )
}

function isConventionalCeilingFan(item: Record<string, unknown>) {
  const assetType = String(item.asset_type ?? '').trim().toLowerCase()
  const motorType = String(item.motor_type ?? '').trim().toLowerCase()
  const catalogSubcategory = String(item.catalog_subcategory ?? '').trim().toLowerCase()

  return (
    assetType === 'fan' &&
    motorType === 'ac induction' &&
    catalogSubcategory === 'conventional ceiling fans'
  )
}

function mapCatalogFan(item: Record<string, unknown>): BLDCFanCatalogItem {
  return {
    make: String(item.make ?? ''),
    model: String(item.model ?? ''),
    designation: toStringOrNull(item.designation),
    display_name: toStringOrNull(item.display_name),
    series: toStringOrNull(item.series),
    input_power_w: toNumberOrNull(item.input_power_w),
    rated_power_kw: toNumberOrNull(item.rated_power_kw),
    air_delivery_cmm: toNumberOrNull(item.air_delivery_cmm),
    rated_speed_rpm: toNumberOrNull(item.rated_speed_rpm),
    sweep_mm: toNumberOrNull(item.sweep_mm),
    power_text: toStringOrNull(item.power_text),
    air_delivery_text: toStringOrNull(item.air_delivery_text),
    rpm_text: toStringOrNull(item.rpm_text),
    sweep_text: toStringOrNull(item.sweep_text),
    estimated_total_efficiency: toNumberOrNull(item.estimated_total_efficiency),
    rated_output_power_w: toNumberOrNull(item.rated_output_power_w),
  }
}

function buildCatalogFanList(
  catalog: Array<Record<string, unknown>>,
  predicate: (item: Record<string, unknown>) => boolean
) {
  return Array.from(
    catalog
      .filter(predicate)
      .map(mapCatalogFan)
      .filter((item) => item.make && item.model)
      .reduce((uniqueFans, fan) => {
        const key = getBLDCFanCatalogKey(fan)

        if (!uniqueFans.has(key)) {
          uniqueFans.set(key, fan)
        }

        return uniqueFans
      }, new Map<string, BLDCFanCatalogItem>())
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

    if (left.model !== right.model) {
      return left.model.localeCompare(right.model)
    }

    return (left.sweep_mm ?? 0) - (right.sweep_mm ?? 0)
  })
}

function buildMakeCounts(fans: BLDCFanCatalogItem[]) {
  return Array.from(
    fans.reduce((counts, fan) => {
      counts.set(fan.make, (counts.get(fan.make) ?? 0) + 1)
      return counts
    }, new Map<string, number>())
  )
    .map(([make, count]) => ({ make, count }))
    .sort((left, right) => left.make.localeCompare(right.make))
}

export async function getBLDCFanCatalogPayload() {
  if (cachedPayload) {
    return cachedPayload
  }

  const filePath = path.resolve(process.cwd(), 'data', 'equipment_catalog.json')
  const rawCatalog = await readFile(filePath, 'utf8')
  const catalog = JSON.parse(rawCatalog) as Array<Record<string, unknown>>

  const fans = buildCatalogFanList(catalog, isBLDCCeilingFan)
  const conventionalFans = buildCatalogFanList(catalog, isConventionalCeilingFan)
  const makeCounts = buildMakeCounts(fans)
  const conventionalMakeCounts = buildMakeCounts(conventionalFans)

  cachedPayload = {
    makeCounts,
    conventionalMakeCounts,
    fans,
    conventionalFans,
  }

  return cachedPayload
}
