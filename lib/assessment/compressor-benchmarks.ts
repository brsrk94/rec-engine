export const COMPRESSOR_DISCOUNT_RATE = 0.08

export const COMPRESSOR_TYPE_OPTIONS = [
  { value: 'reciprocating', label: 'Reciprocating (Piston)' },
  { value: 'fixed_speed_rotary', label: 'Fixed Speed Rotary Screw' },
  { value: 'vsd_rotary', label: 'Variable Speed Drive Rotary Screw' },
  { value: 'centrifugal', label: 'Centrifugal Compressor' },
  { value: 'scroll', label: 'Scroll Compressor' },
  { value: 'oil_free_screw', label: 'Oil-Free Screw Compressor' },
] as const

export type CompressorTypeId = (typeof COMPRESSOR_TYPE_OPTIONS)[number]['value']

interface CompressorBenchmark {
  label: string
  leastEfficiency: number
  maxEfficiency: number
  leastCapexPerKw: number
  maxCapexPerKw: number
  typicalLifetime: string
}

export const COMPRESSOR_BENCHMARKS: Record<CompressorTypeId, CompressorBenchmark> = {
  reciprocating: {
    label: 'Reciprocating (Piston)',
    leastEfficiency: 0.7,
    maxEfficiency: 0.85,
    leastCapexPerKw: 8000,
    maxCapexPerKw: 14000,
    typicalLifetime: '10-15 years',
  },
  fixed_speed_rotary: {
    label: 'Fixed Speed Rotary Screw',
    leastEfficiency: 0.65,
    maxEfficiency: 0.75,
    leastCapexPerKw: 12000,
    maxCapexPerKw: 20000,
    typicalLifetime: '10-15 years',
  },
  vsd_rotary: {
    label: 'Variable Speed Drive Rotary Screw',
    leastEfficiency: 0.7,
    maxEfficiency: 0.8,
    leastCapexPerKw: 16000,
    maxCapexPerKw: 26000,
    typicalLifetime: '8-12 years',
  },
  centrifugal: {
    label: 'Centrifugal Compressor',
    leastEfficiency: 0.75,
    maxEfficiency: 0.85,
    leastCapexPerKw: 25000,
    maxCapexPerKw: 45000,
    typicalLifetime: '10-15 years',
  },
  scroll: {
    label: 'Scroll Compressor',
    leastEfficiency: 0.7,
    maxEfficiency: 0.8,
    leastCapexPerKw: 14000,
    maxCapexPerKw: 22000,
    typicalLifetime: '8-10 years',
  },
  oil_free_screw: {
    label: 'Oil-Free Screw Compressor',
    leastEfficiency: 0.7,
    maxEfficiency: 0.8,
    leastCapexPerKw: 25000,
    maxCapexPerKw: 55000,
    typicalLifetime: '10-15 years',
  },
}

export function normalizeCompressorRatingToKw(
  rating: string | number,
  unit: 'kW' | 'HP'
) {
  const numericRating = typeof rating === 'number' ? rating : parseFloat(rating)

  if (!Number.isFinite(numericRating) || numericRating <= 0) {
    return 0
  }

  return unit === 'HP' ? numericRating * 0.746 : numericRating
}

export function getCompressorTypeLabel(type: string) {
  if (!type || !(type in COMPRESSOR_BENCHMARKS)) {
    return 'Not specified'
  }

  return COMPRESSOR_BENCHMARKS[type as CompressorTypeId].label
}

export function getCompressorLeastEfficiency(type: string) {
  if (!type || !(type in COMPRESSOR_BENCHMARKS)) {
    return 0
  }

  return COMPRESSOR_BENCHMARKS[type as CompressorTypeId].leastEfficiency
}

export function getCompressorTargetEfficiency(type: string) {
  if (!type || !(type in COMPRESSOR_BENCHMARKS)) {
    return 0
  }

  return COMPRESSOR_BENCHMARKS[type as CompressorTypeId].maxEfficiency
}

export function getCompressorLeastCapexPerKw(type: string) {
  if (!type || !(type in COMPRESSOR_BENCHMARKS)) {
    return 0
  }

  return COMPRESSOR_BENCHMARKS[type as CompressorTypeId].leastCapexPerKw
}

export function getDefaultCompressorCapex(
  type: string,
  rating: string | number,
  unit: 'kW' | 'HP'
) {
  const ratingKw = normalizeCompressorRatingToKw(rating, unit)
  const benchmarkCapexPerKw = getCompressorLeastCapexPerKw(type)

  if (!ratingKw || !benchmarkCapexPerKw) {
    return 0
  }

  return ratingKw * benchmarkCapexPerKw
}

export function getSuggestedTargetCompressorType(currentType: string) {
  const preferredTargets: Partial<Record<CompressorTypeId, CompressorTypeId>> = {
    reciprocating: 'vsd_rotary',
    fixed_speed_rotary: 'vsd_rotary',
    scroll: 'oil_free_screw',
    centrifugal: 'centrifugal',
    vsd_rotary: 'vsd_rotary',
    oil_free_screw: 'oil_free_screw',
  }

  if (!currentType || !(currentType in COMPRESSOR_BENCHMARKS)) {
    return ''
  }

  return preferredTargets[currentType as CompressorTypeId] ?? currentType
}
