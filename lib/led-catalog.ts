export interface LEDCatalogItem {
  make: string
  model: string
  designation: string | null
  display_name: string | null
  series: string | null
  model_no: string | null
  input_power_w: number | null
  rated_power_kw: number | null
  colour_temperature: string | null
  color_temperature_k: number | null
  cri: string | null
  lumens: number | null
  voltage_text: string | null
  power_factor: number | null
  power_factor_text: string | null
  lifespan_hours: number | null
  lifespan_text: string | null
  surge_protection_text: string | null
  energy_consumption_text: string | null
  power_text: string | null
  lumens_text: string | null
  estimated_luminous_efficacy_lm_w: number | null
}

export interface LEDCatalogPayload {
  makeCounts: Array<{
    make: string
    count: number
  }>
  bulbs: LEDCatalogItem[]
}

export interface LEDCapexBand {
  label: string
  minLumens: number
  maxLumens: number | null
  typicalWattLabel: string
  capexMinInr: number
  capexMaxInr: number
  rupeesPerLumenLabel: string
}

export const LED_CAPEX_BANDS: LEDCapexBand[] = [
  {
    label: '0-1,000 lm',
    minLumens: 0,
    maxLumens: 1000,
    typicalWattLabel: '5-10 W',
    capexMinInr: 80,
    capexMaxInr: 250,
    rupeesPerLumenLabel: '0.15-0.30',
  },
  {
    label: '1,000-3,000 lm',
    minLumens: 1000,
    maxLumens: 3000,
    typicalWattLabel: '10-25 W',
    capexMinInr: 250,
    capexMaxInr: 450,
    rupeesPerLumenLabel: '0.12-0.20',
  },
  {
    label: '3,000-6,000 lm',
    minLumens: 3000,
    maxLumens: 6000,
    typicalWattLabel: '25-50 W',
    capexMinInr: 400,
    capexMaxInr: 700,
    rupeesPerLumenLabel: '0.10-0.16',
  },
  {
    label: '6,000-12,000 lm',
    minLumens: 6000,
    maxLumens: 12000,
    typicalWattLabel: '50-100 W',
    capexMinInr: 700,
    capexMaxInr: 1300,
    rupeesPerLumenLabel: '0.09-0.14',
  },
  {
    label: '12,000-20,000 lm',
    minLumens: 12000,
    maxLumens: 20000,
    typicalWattLabel: '100-150 W',
    capexMinInr: 1200,
    capexMaxInr: 1800,
    rupeesPerLumenLabel: '0.08-0.12',
  },
  {
    label: '20,000-30,000 lm',
    minLumens: 20000,
    maxLumens: 30000,
    typicalWattLabel: '150-200 W',
    capexMinInr: 1600,
    capexMaxInr: 2600,
    rupeesPerLumenLabel: '0.07-0.11',
  },
  {
    label: '30,000-50,000 lm',
    minLumens: 30000,
    maxLumens: 50000,
    typicalWattLabel: '250-400 W',
    capexMinInr: 2300,
    capexMaxInr: 4700,
    rupeesPerLumenLabel: '0.07-0.10',
  },
  {
    label: '50,000+ lm',
    minLumens: 50000,
    maxLumens: null,
    typicalWattLabel: '500 W+',
    capexMinInr: 5000,
    capexMaxInr: 8000,
    rupeesPerLumenLabel: '0.08-0.15',
  },
]

export function getLEDCatalogKey(
  bulb: Pick<LEDCatalogItem, 'make' | 'model' | 'input_power_w' | 'model_no'>
) {
  return [
    bulb.make.trim(),
    bulb.model.trim(),
    bulb.input_power_w ?? '',
    bulb.model_no ?? '',
  ].join('::')
}

export function getLEDPowerWatts(bulb: LEDCatalogItem | null | undefined) {
  if (!bulb) {
    return null
  }

  if (typeof bulb.input_power_w === 'number' && Number.isFinite(bulb.input_power_w)) {
    return bulb.input_power_w
  }

  const parsedPower = Number.parseFloat(bulb.power_text ?? '')
  return Number.isFinite(parsedPower) ? parsedPower : null
}

export function getLEDCapexBandForLumens(lumens: number | null | undefined) {
  if (typeof lumens !== 'number' || !Number.isFinite(lumens) || lumens <= 0) {
    return null
  }

  return (
    LED_CAPEX_BANDS.find((band) => {
      const withinLowerBound = lumens >= band.minLumens
      const withinUpperBound = band.maxLumens === null || lumens <= band.maxLumens
      return withinLowerBound && withinUpperBound
    }) ?? null
  )
}

export function getLEDCapexEstimateForLumens(lumens: number | null | undefined) {
  const band = getLEDCapexBandForLumens(lumens)

  if (!band) {
    return null
  }

  return {
    ...band,
    approxCapexInr: Math.round((band.capexMinInr + band.capexMaxInr) / 2),
  }
}
