export interface DGCapexBenchmark {
  label: string
  minKva: number
  maxKva: number
  minCapexInr: number
  maxCapexInr: number
}

export const DG_CAPEX_BENCHMARKS: DGCapexBenchmark[] = [
  {
    label: '5 - 10 kVA',
    minKva: 5,
    maxKva: 10,
    minCapexInr: 40_000,
    maxCapexInr: 300_000,
  },
  {
    label: '15 - 25 kVA',
    minKva: 15,
    maxKva: 25,
    minCapexInr: 200_000,
    maxCapexInr: 400_000,
  },
  {
    label: '30 - 62.5 kVA',
    minKva: 30,
    maxKva: 62.5,
    minCapexInr: 300_000,
    maxCapexInr: 600_000,
  },
  {
    label: '75 - 125 kVA',
    minKva: 75,
    maxKva: 125,
    minCapexInr: 600_000,
    maxCapexInr: 1_200_000,
  },
  {
    label: '160 - 250 kVA',
    minKva: 160,
    maxKva: 250,
    minCapexInr: 1_200_000,
    maxCapexInr: 2_500_000,
  },
  {
    label: '320 - 500 kVA',
    minKva: 320,
    maxKva: 500,
    minCapexInr: 2_500_000,
    maxCapexInr: 5_000_000,
  },
  {
    label: '625 - 750 kVA',
    minKva: 625,
    maxKva: 750,
    minCapexInr: 4_500_000,
    maxCapexInr: 7_000_000,
  },
  {
    label: '1000 kVA',
    minKva: 1000,
    maxKva: 1000,
    minCapexInr: 5_000_000,
    maxCapexInr: 10_000_000,
  },
  {
    label: '1250 - 2000 kVA',
    minKva: 1250,
    maxKva: 2000,
    minCapexInr: 8_000_000,
    maxCapexInr: 12_000_000,
  },
]

export function getDGCapexBenchmark(ratedCapacityKva: number | null | undefined) {
  if (
    typeof ratedCapacityKva !== 'number' ||
    !Number.isFinite(ratedCapacityKva) ||
    ratedCapacityKva <= 0
  ) {
    return null
  }

  return (
    DG_CAPEX_BENCHMARKS.find(
      (benchmark) =>
        ratedCapacityKva >= benchmark.minKva && ratedCapacityKva <= benchmark.maxKva
    ) ?? null
  )
}

export function getDefaultDGCapex(ratedCapacityKva: number | null | undefined) {
  const benchmark = getDGCapexBenchmark(ratedCapacityKva)

  if (!benchmark) {
    return 0
  }

  return Math.round((benchmark.minCapexInr + benchmark.maxCapexInr) / 2)
}
