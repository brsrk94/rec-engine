export interface DGSetCatalogItem {
  make: string
  model: string
  designation: string | null
  display_name: string | null
  fuel_type: string | null
  engine_model: string | null
  rated_capacity_kva: number | null
  fuel_consumption_lph_full_load: number | null
  fuel_consumption_text: string | null
  cpcb_current_standards: string | null
  catalog_category: string | null
  catalog_subcategory: string | null
  market_region: string | null
  source_dataset: string | null
  source_file: string | null
}

export interface DGSetCatalogPayload {
  makeCounts: Array<{
    make: string
    count: number
  }>
  dgSets: DGSetCatalogItem[]
}

export function getDGSetCatalogKey(
  dgSet: Pick<DGSetCatalogItem, 'make' | 'model' | 'rated_capacity_kva'>
) {
  return [dgSet.make.trim(), dgSet.model.trim(), dgSet.rated_capacity_kva ?? ''].join('::')
}

export function getDGSpecificFuelConsumption(
  dgSet: DGSetCatalogItem | null | undefined,
  powerFactor = 0.95
) {
  if (!dgSet) {
    return null
  }

  if (
    typeof dgSet.fuel_consumption_lph_full_load !== 'number' ||
    !Number.isFinite(dgSet.fuel_consumption_lph_full_load) ||
    dgSet.fuel_consumption_lph_full_load <= 0
  ) {
    return null
  }

  if (
    typeof dgSet.rated_capacity_kva !== 'number' ||
    !Number.isFinite(dgSet.rated_capacity_kva) ||
    dgSet.rated_capacity_kva <= 0 ||
    !Number.isFinite(powerFactor) ||
    powerFactor <= 0
  ) {
    return null
  }

  return dgSet.fuel_consumption_lph_full_load / (dgSet.rated_capacity_kva * powerFactor)
}
