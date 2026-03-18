export interface BLDCFanCatalogItem {
  make: string
  model: string
  designation: string | null
  display_name: string | null
  series: string | null
  input_power_w: number | null
  rated_power_kw: number | null
  air_delivery_cmm: number | null
  rated_speed_rpm: number | null
  sweep_mm: number | null
  power_text: string | null
  air_delivery_text: string | null
  rpm_text: string | null
  sweep_text: string | null
  estimated_total_efficiency: number | null
  rated_output_power_w: number | null
}

export interface BLDCFanCatalogPayload {
  makeCounts: Array<{
    make: string
    count: number
  }>
  conventionalMakeCounts: Array<{
    make: string
    count: number
  }>
  fans: BLDCFanCatalogItem[]
  conventionalFans: BLDCFanCatalogItem[]
}

export function getBLDCFanCatalogKey(fan: Pick<BLDCFanCatalogItem, 'make' | 'model' | 'sweep_mm' | 'input_power_w'>) {
  return [
    fan.make.trim(),
    fan.model.trim(),
    fan.sweep_mm ?? '',
    fan.input_power_w ?? '',
  ].join('::')
}

export function getBLDCFanPowerWatts(fan: BLDCFanCatalogItem | null | undefined) {
  if (!fan) {
    return null
  }

  if (typeof fan.input_power_w === 'number' && Number.isFinite(fan.input_power_w)) {
    return fan.input_power_w
  }

  const parsedPower = Number.parseFloat(fan.power_text ?? '')
  return Number.isFinite(parsedPower) ? parsedPower : null
}
