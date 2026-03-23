import 'server-only'

import equipmentCatalogSource from '@/data/equipment_catalog.json'

let cachedCatalog: Array<Record<string, unknown>> | null = null

function normalizeEquipmentCatalog(
  value: unknown
): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value as Array<Record<string, unknown>>
  }

  if (
    value &&
    typeof value === 'object' &&
    'default' in value &&
    Array.isArray((value as { default?: unknown }).default)
  ) {
    return (value as { default: Array<Record<string, unknown>> }).default
  }

  throw new Error('Unable to load equipment catalog data.')
}

export async function readEquipmentCatalog() {
  if (cachedCatalog) {
    return cachedCatalog
  }

  cachedCatalog = normalizeEquipmentCatalog(equipmentCatalogSource as unknown)
  return cachedCatalog
}
