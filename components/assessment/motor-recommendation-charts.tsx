'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

import type { MotorRecommendationCard, MotorRecommendationResult } from '@/lib/motor-catalog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
)

interface MotorRecommendationChartsProps {
  currentSystem: MotorRecommendationResult['currentSystem']
  recommendations: MotorRecommendationCard[]
}

interface MotorChartRow {
  motorLabel: string
  currentEnergy: number
  recommendedEnergy: number
  energySavings: number
  currentEmissions: number
  recommendedEmissions: number
  emissionSavings: number
}

interface ChartLegendEntry {
  label: string
  fill: string
  border: string
}

interface ChartAnchorPoint {
  x: number
  y: number
}

const SOFT_CHART_PALETTE = [
  {
    recommendedFill: 'rgba(244, 184, 205, 0.9)',
    recommendedBorder: '#DD8DB2',
  },
  {
    recommendedFill: 'rgba(173, 216, 255, 0.92)',
    recommendedBorder: '#60A5FA',
  },
  {
    recommendedFill: 'rgba(187, 247, 208, 0.94)',
    recommendedBorder: '#4ADE80',
  },
] as const

const CURRENT_MOTOR_FILL = 'rgba(71, 85, 105, 0.9)'
const CURRENT_MOTOR_BORDER = '#334155'

function formatNumber(value: number) {
  return value.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function wrapMotorLabel(label: string, maxLineLength = 16) {
  const words = label.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word

    if (nextLine.length <= maxLineLength) {
      currentLine = nextLine
      continue
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    currentLine = word
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.slice(0, 3)
}

function buildChartRows(recommendations: MotorRecommendationCard[]): MotorChartRow[] {
  return recommendations.map((recommendation) => {
    const motorLabel = `${recommendation.make} ${recommendation.model}`.trim()

    return {
      motorLabel,
      currentEnergy: recommendation.currentAnnualEnergy,
      recommendedEnergy: recommendation.recommendedAnnualEnergy,
      energySavings: recommendation.energySavings,
      currentEmissions: recommendation.currentAnnualEmissions,
      recommendedEmissions: recommendation.recommendedAnnualEmissions,
      emissionSavings: recommendation.emissionSavings,
    }
  })
}

function buildAxisLabel(label: string, useCompactLayout: boolean) {
  return wrapMotorLabel(label, useCompactLayout ? 12 : 16).slice(0, useCompactLayout ? 2 : 3)
}

function useCompactChartLayout() {
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)')
    const syncViewport = () => setIsCompact(mediaQuery.matches)

    syncViewport()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncViewport)
      return () => mediaQuery.removeEventListener('change', syncViewport)
    }

    mediaQuery.addListener(syncViewport)
    return () => mediaQuery.removeListener(syncViewport)
  }, [])

  return isCompact
}

function ChartLegend({ items }: { items: ChartLegendEntry[] }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-border/70 pb-3 sm:gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-slate-600 sm:text-xs"
        >
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full border"
            style={{ backgroundColor: item.fill, borderColor: item.border }}
          />
          <span className="truncate">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export function MotorRecommendationCharts({
  currentSystem,
  recommendations,
}: MotorRecommendationChartsProps) {
  const useCompactLayout = useCompactChartLayout()
  const chartsRef = useRef<HTMLDivElement>(null)
  const energyPlotRef = useRef<HTMLDivElement>(null)
  const emissionPlotRef = useRef<HTMLDivElement>(null)
  const energyChartRef = useRef<ChartJS<'bar'> | null>(null)
  const emissionChartRef = useRef<ChartJS<'bar'> | null>(null)
  const [activeEnergyIndex, setActiveEnergyIndex] = useState<number | null>(null)
  const [activeEmissionIndex, setActiveEmissionIndex] = useState<number | null>(null)
  const chartRows = useMemo(() => buildChartRows(recommendations), [recommendations])
  const chartPalette = useMemo(
    () =>
      chartRows.map(
        (_, index) => SOFT_CHART_PALETTE[index % SOFT_CHART_PALETTE.length]
      ),
    [chartRows]
  )
  const legendEntries = useMemo<ChartLegendEntry[]>(
    () => [
      {
        label: 'Current Motor',
        fill: CURRENT_MOTOR_FILL,
        border: CURRENT_MOTOR_BORDER,
      },
      ...chartRows.map((row, index) => ({
        label: row.motorLabel,
        fill: chartPalette[index]?.recommendedFill ?? SOFT_CHART_PALETTE[0].recommendedFill,
        border: chartPalette[index]?.recommendedBorder ?? SOFT_CHART_PALETTE[0].recommendedBorder,
      })),
    ],
    [chartPalette, chartRows]
  )

  const energyData = useMemo<ChartData<'bar'>>(
    () => ({
      labels: chartRows.map((row) => buildAxisLabel(row.motorLabel, useCompactLayout)),
      datasets: [
        {
          label: 'Current Motor',
          data: chartRows.map((row) => row.currentEnergy),
          backgroundColor: CURRENT_MOTOR_FILL,
          borderColor: CURRENT_MOTOR_BORDER,
          borderWidth: 1,
          borderRadius: 0,
          categoryPercentage: 0.72,
          barPercentage: 1,
          maxBarThickness: 28,
        },
        {
          label: 'Recommended Motor',
          data: chartRows.map((row) => row.recommendedEnergy),
          backgroundColor: chartPalette.map((palette) => palette.recommendedFill),
          borderColor: chartPalette.map((palette) => palette.recommendedBorder),
          borderWidth: 1,
          borderRadius: 0,
          categoryPercentage: 0.72,
          barPercentage: 1,
          maxBarThickness: 28,
        },
      ],
    }),
    [chartPalette, chartRows, useCompactLayout]
  )

  const energyOptions = useMemo<ChartOptions<'bar'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      events: ['click', 'touchstart'],
      layout: {
        padding: {
          bottom: useCompactLayout ? 4 : 0,
        },
      },
      animation: {
        duration: 900,
        easing: 'easeOutQuart',
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          titleColor: '#F8FAFC',
          bodyColor: '#E2E8F0',
          padding: 12,
          displayColors: true,
          callbacks: {
            title: (items) => {
              const row = chartRows[items[0]?.dataIndex ?? 0]
              return row?.motorLabel ?? ''
            },
            afterBody: (items) => {
              const row = chartRows[items[0]?.dataIndex ?? 0]
              return row ? [`Savings: ${formatNumber(row.energySavings)} kWh/year`] : []
            },
            label: (context) => {
              const label =
                context.dataset.label === 'Current Motor'
                  ? 'Current Motor'
                  : 'Recommended Motor'

              return `${label}: ${formatNumber(Number(context.raw))} kWh/year`
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: {
            color: '#64748B',
            font: {
              family: 'Manrope Variable, sans-serif',
              size: useCompactLayout ? 9 : 11,
              weight: 600,
            },
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            padding: useCompactLayout ? 6 : 8,
          },
        },
        y: {
          beginAtZero: true,
          border: {
            display: false,
          },
          grid: {
            color: '#E2E8F0',
            drawTicks: false,
          },
          ticks: {
            color: '#64748B',
            padding: 10,
            callback: (value) => formatNumber(Number(value)),
            font: {
              family: 'Manrope Variable, sans-serif',
              size: useCompactLayout ? 10 : 11,
            },
          },
          title: {
            display: true,
            text: 'kWh/year',
            color: '#64748B',
            font: {
              family: 'Manrope Variable, sans-serif',
              size: useCompactLayout ? 11 : 12,
              weight: 600,
            },
          },
        },
      },
    }),
    [chartRows, useCompactLayout]
  )

  const emissionData = useMemo<ChartData<'bar'>>(
    () => ({
      labels: chartRows.map((row) => buildAxisLabel(row.motorLabel, useCompactLayout)),
      datasets: [
        {
          label: 'Current Motor',
          data: chartRows.map((row) => row.currentEmissions),
          backgroundColor: CURRENT_MOTOR_FILL,
          borderColor: CURRENT_MOTOR_BORDER,
          borderWidth: 1,
          borderRadius: 0,
          categoryPercentage: 0.72,
          barPercentage: 1,
          maxBarThickness: 28,
        },
        {
          label: 'Recommended Motor',
          data: chartRows.map((row) => row.recommendedEmissions),
          backgroundColor: chartPalette.map((palette) => palette.recommendedFill),
          borderColor: chartPalette.map((palette) => palette.recommendedBorder),
          borderWidth: 1,
          borderRadius: 0,
          categoryPercentage: 0.72,
          barPercentage: 1,
          maxBarThickness: 28,
        },
      ],
    }),
    [chartPalette, chartRows, useCompactLayout]
  )

  const emissionOptions = useMemo<ChartOptions<'bar'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      events: ['click', 'touchstart'],
      layout: {
        padding: {
          bottom: useCompactLayout ? 4 : 0,
        },
      },
      animation: {
        duration: 900,
        easing: 'easeOutQuart',
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          titleColor: '#F8FAFC',
          bodyColor: '#E2E8F0',
          padding: 12,
          callbacks: {
            title: (items) => {
              const row = chartRows[items[0]?.dataIndex ?? 0]
              return row?.motorLabel ?? ''
            },
            afterBody: (items) => {
              const row = chartRows[items[0]?.dataIndex ?? 0]
              return row ? [`Reduction: ${formatNumber(row.emissionSavings)} kgCO2e/year`] : []
            },
            label: (context) => {
              const label =
                context.dataset.label === 'Current Motor'
                  ? 'Current Motor'
                  : 'Recommended Motor'

              return `${label}: ${formatNumber(Number(context.raw))} kgCO2e/year`
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: {
            color: '#64748B',
            font: {
              family: 'Manrope Variable, sans-serif',
              size: useCompactLayout ? 9 : 11,
              weight: 600,
            },
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            padding: useCompactLayout ? 6 : 8,
          },
        },
        y: {
          beginAtZero: true,
          border: {
            display: false,
          },
          grid: {
            color: '#E2E8F0',
            drawTicks: false,
          },
          ticks: {
            color: '#64748B',
            padding: 10,
            callback: (value) => formatNumber(Number(value)),
            font: {
              family: 'Manrope Variable, sans-serif',
              size: useCompactLayout ? 10 : 11,
            },
          },
          title: {
            display: true,
            text: 'kgCO2e/year',
            color: '#64748B',
            font: {
              family: 'Manrope Variable, sans-serif',
              size: useCompactLayout ? 11 : 12,
              weight: 600,
            },
          },
        },
      },
    }),
    [chartRows, useCompactLayout]
  )

  useEffect(() => {
    const chart = energyChartRef.current

    if (!chart) {
      return
    }

    if (activeEnergyIndex === null) {
      chart.setActiveElements([])

      if (chart.tooltip) {
        chart.tooltip.setActiveElements([], { x: 0, y: 0 })
      }

      chart.update()
      return
    }

    if (!chartRows[activeEnergyIndex]) {
      return
    }

    const activeBar =
      chart.getDatasetMeta(1).data[activeEnergyIndex] ??
      chart.getDatasetMeta(0).data[activeEnergyIndex]

    if (!activeBar) {
      return
    }

    const anchorPoint = {
      x: (activeBar as unknown as ChartAnchorPoint).x,
      y: (activeBar as unknown as ChartAnchorPoint).y,
    }

    if (typeof anchorPoint.x !== 'number' || typeof anchorPoint.y !== 'number' || !chart.tooltip) {
      return
    }

    chart.setActiveElements([
      { datasetIndex: 0, index: activeEnergyIndex },
      { datasetIndex: 1, index: activeEnergyIndex },
    ])
    chart.tooltip.setActiveElements(
      [
        { datasetIndex: 0, index: activeEnergyIndex },
        { datasetIndex: 1, index: activeEnergyIndex },
      ],
      anchorPoint
    )
    chart.update()
  }, [activeEnergyIndex, chartRows])

  useEffect(() => {
    const chart = emissionChartRef.current

    if (!chart) {
      return
    }

    if (activeEmissionIndex === null) {
      chart.setActiveElements([])

      if (chart.tooltip) {
        chart.tooltip.setActiveElements([], { x: 0, y: 0 })
      }

      chart.update()
      return
    }

    if (!chartRows[activeEmissionIndex]) {
      return
    }

    const activeBar =
      chart.getDatasetMeta(1).data[activeEmissionIndex] ??
      chart.getDatasetMeta(0).data[activeEmissionIndex]

    if (!activeBar) {
      return
    }

    const anchorPoint = {
      x: (activeBar as unknown as ChartAnchorPoint).x,
      y: (activeBar as unknown as ChartAnchorPoint).y,
    }

    if (typeof anchorPoint.x !== 'number' || typeof anchorPoint.y !== 'number' || !chart.tooltip) {
      return
    }

    chart.setActiveElements([
      { datasetIndex: 0, index: activeEmissionIndex },
      { datasetIndex: 1, index: activeEmissionIndex },
    ])
    chart.tooltip.setActiveElements(
      [
        { datasetIndex: 0, index: activeEmissionIndex },
        { datasetIndex: 1, index: activeEmissionIndex },
      ],
      anchorPoint
    )
    chart.update()
  }, [activeEmissionIndex, chartRows])

  useEffect(() => {
    if (activeEnergyIndex === null && activeEmissionIndex === null) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null

      if (!target) {
        return
      }

      if (!chartsRef.current?.contains(target)) {
        setActiveEnergyIndex(null)
        setActiveEmissionIndex(null)
        return
      }

      if (!energyPlotRef.current?.contains(target)) {
        setActiveEnergyIndex(null)
      }

      if (!emissionPlotRef.current?.contains(target)) {
        setActiveEmissionIndex(null)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [activeEmissionIndex, activeEnergyIndex])

  const pinTooltipAtClickedGroup = (
    chart: ChartJS<'bar'>,
    activeIndex: number | null,
    callback: (index: number | null) => void,
    event: unknown
  ) => {
    const activeBars = chart.getElementsAtEventForMode(
      event as Event,
      'index',
      { intersect: false },
      false
    )

    if (!activeBars.length) {
      callback(null)
      return
    }

    const clickedIndex = activeBars[0].index
    callback(activeIndex === clickedIndex ? null : clickedIndex)
  }

  return (
    <div ref={chartsRef} className="grid gap-6 xl:grid-cols-2">
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Energy Consumption Comparison Graph</CardTitle>
          <CardDescription>
            Before vs after motor upgrade for {currentSystem.make} {currentSystem.model}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChartLegend items={legendEntries} />
          <div ref={energyPlotRef} className="h-[320px] sm:h-[360px]">
            <Bar
              ref={energyChartRef}
              data={energyData}
              options={energyOptions}
              onClick={(event) => {
                const chart = energyChartRef.current

                if (!chart) {
                  return
                }

                pinTooltipAtClickedGroup(
                  chart,
                  activeEnergyIndex,
                  setActiveEnergyIndex,
                  event.nativeEvent
                )
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>CO2 Emission Reduction Graph</CardTitle>
          <CardDescription>
            Current motor emissions versus the recommended motor options from the catalog.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChartLegend items={legendEntries} />
          <div ref={emissionPlotRef} className="h-[320px] sm:h-[360px]">
            <Bar
              ref={emissionChartRef}
              data={emissionData}
              options={emissionOptions}
              onClick={(event) => {
                const chart = emissionChartRef.current

                if (!chart) {
                  return
                }

                pinTooltipAtClickedGroup(
                  chart,
                  activeEmissionIndex,
                  setActiveEmissionIndex,
                  event.nativeEvent
                )
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
