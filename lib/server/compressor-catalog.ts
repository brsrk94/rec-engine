import 'server-only'

import { readFile } from 'node:fs/promises'
import path from 'node:path'

import {
  mapCatalogCompressorType,
  type CompressorCatalogItem,
  type CompressorCatalogPayload,
} from '@/lib/compressor-catalog'

let cachedPayload: CompressorCatalogPayload | null = null

function toStringOrNull(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}

function toNumberOrNull(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export async function getCompressorCatalogPayload() {
  if (cachedPayload) {
    return cachedPayload
  }

  const filePath = path.resolve(process.cwd(), 'data', 'equipment_catalog.json')
  const rawCatalog = await readFile(filePath, 'utf8')
  const catalog = JSON.parse(rawCatalog) as Array<Record<string, unknown>>

  const compressors: CompressorCatalogItem[] = Array.from(
    catalog
    .filter((item) => item.asset_type === 'compressor')
    .map((item) => {
      const mappedType = mapCatalogCompressorType({
        rawType: toStringOrNull(item.compressor_type),
        model: toStringOrNull(item.model),
        designation: toStringOrNull(item.designation),
        series: toStringOrNull(item.series),
      })

      return {
        make: String(item.make ?? ''),
        model: String(item.model ?? ''),
        designation: toStringOrNull(item.designation),
        series: toStringOrNull(item.series),
        compressor_type: String(item.compressor_type ?? ''),
        compressor_type_label: toStringOrNull(item.compressor_type_label),
        benchmark_type: mappedType.value,
        benchmark_type_label: mappedType.label,
        rated_power_kw: Number(item.rated_power_kw ?? 0),
        pressure_bar: toNumberOrNull(item.pressure_bar),
        fad_m3_min: toNumberOrNull(item.fad_m3_min),
        motor_rating_kw: toNumberOrNull(item.motor_rating_kw),
        motor_efficiency: toStringOrNull(item.motor_efficiency),
        catalog_category: toStringOrNull(item.catalog_category),
        catalog_subcategory: toStringOrNull(item.catalog_subcategory),
      }
    })
    .filter((item) => item.make && item.model && Number.isFinite(item.rated_power_kw))
    .reduce((uniqueCompressors, compressor) => {
      const catalogKey = [
        compressor.make,
        compressor.model,
        compressor.benchmark_type,
        compressor.rated_power_kw.toFixed(4),
        compressor.pressure_bar?.toFixed(4) ?? '',
        compressor.series ?? '',
      ].join('::')

      if (!uniqueCompressors.has(catalogKey)) {
        uniqueCompressors.set(catalogKey, compressor)
      }

      return uniqueCompressors
    }, new Map<string, CompressorCatalogItem>())
    .values()
  )
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
    compressors.reduce((counts, compressor) => {
      counts.set(compressor.make, (counts.get(compressor.make) ?? 0) + 1)
      return counts
    }, new Map<string, number>())
  )
    .map(([make, count]) => ({ make, count }))
    .sort((left, right) => left.make.localeCompare(right.make))

  cachedPayload = {
    makeCounts,
    compressors,
  }

  return cachedPayload
}
