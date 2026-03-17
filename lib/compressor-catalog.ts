export interface CompressorCatalogItem {
  make: string
  model: string
  designation: string | null
  series: string | null
  compressor_type: string
  compressor_type_label: string | null
  benchmark_type: string
  benchmark_type_label: string
  rated_power_kw: number
  pressure_bar: number | null
  fad_m3_min: number | null
  motor_rating_kw: number | null
  motor_efficiency: string | null
  catalog_category: string | null
  catalog_subcategory: string | null
}

export interface CompressorCatalogPayload {
  makeCounts: Array<{
    make: string
    count: number
  }>
  compressors: CompressorCatalogItem[]
}

interface CatalogCompressorTypeInput {
  rawType?: string | null
  model?: string | null
  designation?: string | null
  series?: string | null
}

const catalogTypeToBenchmarkType: Record<string, { value: string; label: string }> = {
  rotary_screw: {
    value: 'fixed_speed_rotary',
    label: 'Fixed Speed Rotary Screw',
  },
  rotary_screw_vfd: {
    value: 'vsd_rotary',
    label: 'Variable Speed Drive Rotary Screw',
  },
  piston: {
    value: 'reciprocating',
    label: 'Reciprocating (Piston)',
  },
  reciprocating: {
    value: 'reciprocating',
    label: 'Reciprocating (Piston)',
  },
  high_pressure: {
    value: 'reciprocating',
    label: 'Reciprocating (Piston)',
  },
  booster: {
    value: 'reciprocating',
    label: 'Reciprocating (Piston)',
  },
  oil_free_piston: {
    value: 'reciprocating',
    label: 'Reciprocating (Piston)',
  },
  centrifugal: {
    value: 'centrifugal',
    label: 'Centrifugal Compressor',
  },
  oil_free_scroll: {
    value: 'scroll',
    label: 'Scroll Compressor',
  },
  oil_free_screw: {
    value: 'oil_free_screw',
    label: 'Oil-Free Screw Compressor',
  },
  oil_free: {
    value: 'oil_free_screw',
    label: 'Oil-Free Screw Compressor',
  },
  portable: {
    value: 'fixed_speed_rotary',
    label: 'Fixed Speed Rotary Screw',
  },
  portable_diesel: {
    value: 'fixed_speed_rotary',
    label: 'Fixed Speed Rotary Screw',
  },
  drilling: {
    value: 'fixed_speed_rotary',
    label: 'Fixed Speed Rotary Screw',
  },
  process_gas: {
    value: 'fixed_speed_rotary',
    label: 'Fixed Speed Rotary Screw',
  },
}

function inferRotaryDriveVariant(input: CatalogCompressorTypeInput) {
  const searchText = [input.model, input.designation, input.series]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (/\b(vsd|vfd)\b/.test(searchText)) {
    return {
      value: 'vsd_rotary',
      label: 'Variable Speed Drive Rotary Screw',
    }
  }

  return null
}

export function mapCatalogCompressorType(
  input: CatalogCompressorTypeInput | string | null | undefined
) {
  const normalizedInput =
    typeof input === 'string' || input == null
      ? { rawType: input }
      : input
  const rawType = normalizedInput.rawType

  if (!rawType) {
    return {
      value: 'fixed_speed_rotary',
      label: 'Fixed Speed Rotary Screw',
    }
  }

  if (rawType === 'rotary_screw') {
    const inferredVariant = inferRotaryDriveVariant(normalizedInput)

    if (inferredVariant) {
      return inferredVariant
    }
  }

  return (
    catalogTypeToBenchmarkType[rawType] ?? {
      value: 'fixed_speed_rotary',
      label: 'Fixed Speed Rotary Screw',
    }
  )
}
