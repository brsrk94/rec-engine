'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type Plugin,
} from 'chart.js'
import { ArrowRight } from 'lucide-react'
import { Bar } from 'react-chartjs-2'

import type {
  AssessmentCurrentSystemSnapshot,
  AssessmentRecommendationCardSnapshot,
} from '@/components/assessment/results/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatIndianNumber } from '@/lib/formatting'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface DGSetRecommendationChartsProps {
  currentSystem: AssessmentCurrentSystemSnapshot
  recommendations: AssessmentRecommendationCardSnapshot[]
}

const DG_BAR_COLORS = [
  'rgba(103, 104, 125, 0.94)',
  'rgba(5, 160, 112, 0.94)',
  'rgba(5, 10, 153, 0.92)',
  'rgba(234, 179, 8, 0.94)',
]

const DG_BORDER_COLORS = ['#67687D', '#05A070', '#050A99', '#EAB308']
const WATERFALL_BAR_COLORS = ['rgba(103, 104, 125, 0.94)', 'rgba(5, 160, 112, 0.94)', 'rgba(5, 10, 153, 0.92)']
const WATERFALL_BORDER_COLORS = ['#67687D', '#05A070', '#050A99']

function formatNumber(value: number) {
  return formatIndianNumber(value, { maximumFractionDigits: 0 })
}

function formatCurrency(value: number) {
  return `INR ${formatNumber(value)}`
}

function wrapAxisLabel(label: string, maxLineLength = 16) {
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

function createValueLabelPlugin(
  id: string,
  formatter: (rawValue: unknown, dataIndex: number) => string
): Plugin<'bar'> {
  return {
    id,
    afterDatasetsDraw(chart) {
      const dataset = chart.data.datasets[0]
      const meta = chart.getDatasetMeta(0)
      const { ctx } = chart

      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillStyle = '#0F172A'
      ctx.font = '600 11px "Manrope Variable", "Manrope", sans-serif'

      meta.data.forEach((barElement, index) => {
        const rawValue = dataset.data[index]
        const label = formatter(rawValue, index)

        if (!label) {
          return
        }

        const properties = barElement.getProps(['x', 'y', 'base'], true) as {
          x: number
          y: number
          base: number
        }
        const labelY = Math.min(properties.y, properties.base) - 8

        ctx.fillText(label, properties.x, labelY)
      })

      ctx.restore()
    },
  }
}

const waterfallConnectorPlugin: Plugin<'bar'> = {
  id: 'dg-waterfall-connectors',
  afterDatasetsDraw(chart) {
    const meta = chart.getDatasetMeta(0)
    const bars = meta.data

    if (bars.length < 3) {
      return
    }

    const { ctx } = chart

    ctx.save()
    ctx.setLineDash([5, 4])
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)'
    ctx.lineWidth = 1.5

    const currentCostBar = bars[0].getProps(['x', 'y', 'width'], true) as {
      x: number
      y: number
      width: number
    }
    const savingsBar = bars[1].getProps(['x', 'y', 'base', 'width'], true) as {
      x: number
      y: number
      base: number
      width: number
    }

    ctx.beginPath()
    ctx.moveTo(currentCostBar.x + currentCostBar.width / 2, currentCostBar.y)
    ctx.lineTo(savingsBar.x - savingsBar.width / 2, savingsBar.base)
    ctx.stroke()

    const retrofittedCostBar = bars[2].getProps(['x', 'y', 'width'], true) as {
      x: number
      y: number
      width: number
    }

    ctx.beginPath()
    ctx.moveTo(savingsBar.x + savingsBar.width / 2, savingsBar.y)
    ctx.lineTo(retrofittedCostBar.x - retrofittedCostBar.width / 2, retrofittedCostBar.y)
    ctx.stroke()

    ctx.restore()
  },
}

function LegendDot({ fill, border }: { fill: string; border: string }) {
  return (
    <span
      aria-hidden="true"
      className="h-7 w-7 shrink-0 rounded-full border-[3px] shadow-[0_2px_10px_rgba(15,23,42,0.08)]"
      style={{ backgroundColor: fill, borderColor: border }}
    />
  )
}

function DGSetChartsLegend() {
  return (
    <div className="neo-panel rounded-2xl bg-card px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <LegendDot fill={DG_BAR_COLORS[0]} border={DG_BORDER_COLORS[0]} />
          <ArrowRight className="h-4 w-4 shrink-0 text-[#67687D]" />
          <span className="text-sm font-semibold text-[#67687D] sm:text-base">
            current DG system
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {DG_BAR_COLORS.slice(1, 4).map((fill, index) => (
              <LegendDot
                key={`dg-recommended-legend-${index}`}
                fill={fill}
                border={DG_BORDER_COLORS[index + 1]}
              />
            ))}
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#05A070]" />
          <span className="text-sm font-semibold text-[#05A070] sm:text-base">
            recommended fuel retrofit
          </span>
        </div>
      </div>
    </div>
  )
}

export function DGSetRecommendationCharts({
  currentSystem,
  recommendations,
}: DGSetRecommendationChartsProps) {
  const [useCompactAxisLabels, setUseCompactAxisLabels] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)')

    const updateFromMediaQuery = () => {
      setUseCompactAxisLabels(mediaQuery.matches)
    }

    updateFromMediaQuery()
    mediaQuery.addEventListener('change', updateFromMediaQuery)

    return () => {
      mediaQuery.removeEventListener('change', updateFromMediaQuery)
    }
  }, [])

  const leadRecommendation = recommendations[0] ?? null

  const energyRows = useMemo(
    () => [
      {
        displayName: `${currentSystem.make} ${currentSystem.model}`.trim(),
        compactLabel: currentSystem.make?.trim() || 'Current',
        annualEnergy: currentSystem.annualEnergy,
      },
      ...recommendations.slice(0, 3).map((recommendation) => ({
        displayName: recommendation.name || 'Retrofit',
        compactLabel: 'Retrofit',
        annualEnergy: recommendation.recommendedAnnualEnergy ?? 0,
      })),
    ],
    [currentSystem.annualEnergy, currentSystem.make, currentSystem.model, recommendations]
  )

  const currentAnnualCost = leadRecommendation?.currentAnnualCost ?? currentSystem.annualCost
  const retrofittedAnnualCost =
    leadRecommendation?.recommendedAnnualCost ??
    Math.max(0, currentAnnualCost - (leadRecommendation?.costSavings ?? 0))

  const energyChartData = useMemo<ChartData<'bar'>>(
    () => ({
      labels: energyRows.map((row) =>
        wrapAxisLabel(
          useCompactAxisLabels ? row.compactLabel : row.displayName,
          useCompactAxisLabels ? 10 : 18
        )
      ),
      datasets: [
        {
          label: 'Annual Energy',
          data: energyRows.map((row) => row.annualEnergy),
          backgroundColor: energyRows.map(
            (_, index) => DG_BAR_COLORS[index] ?? DG_BAR_COLORS.at(-1)
          ),
          borderColor: energyRows.map(
            (_, index) => DG_BORDER_COLORS[index] ?? DG_BORDER_COLORS.at(-1)
          ),
          borderWidth: 1,
          borderRadius: 0,
          categoryPercentage: 0.78,
          barPercentage: 0.92,
          maxBarThickness: 72,
        },
      ],
    }),
    [energyRows, useCompactAxisLabels]
  )

  const energyChartOptions = useMemo<ChartOptions<'bar'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: 'easeOutQuart',
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
            title: (items) => energyRows[items[0]?.dataIndex ?? 0]?.displayName ?? '',
            label: (context) => `${formatNumber(Number(context.raw))} kWh/year`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: '#64748B',
            font: {
              family: 'Manrope Variable, sans-serif',
              size: 10,
              weight: 600,
            },
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
          },
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: {
            color: '#E2E8F0',
            drawTicks: false,
          },
          ticks: {
            color: '#64748B',
            callback: (value) => formatNumber(Number(value)),
            font: {
              family: 'Manrope Variable, sans-serif',
              size: 11,
            },
          },
          title: {
            display: true,
            text: 'Annual Energy (kWh)',
            color: '#64748B',
            font: {
              family: 'Manrope Variable, sans-serif',
              size: 12,
              weight: 600,
            },
          },
        },
      },
    }),
    [energyRows]
  )

  const energyValueLabelsPlugin = useMemo(
    () =>
      createValueLabelPlugin('dg-energy-labels', (rawValue) => `${formatNumber(Number(rawValue))}`),
    []
  )

  const waterfallChartData = useMemo<ChartData<'bar'>>(
    () => ({
      labels: ['Current Cost', 'Savings', 'Retrofitted Cost'],
      datasets: [
        {
          label: 'Annual Cost',
          data: [
            [0, currentAnnualCost],
            [retrofittedAnnualCost, currentAnnualCost],
            [0, retrofittedAnnualCost],
          ],
          backgroundColor: WATERFALL_BAR_COLORS,
          borderColor: WATERFALL_BORDER_COLORS,
          borderWidth: 1,
          borderRadius: 0,
          categoryPercentage: 0.78,
          barPercentage: 0.92,
          maxBarThickness: 72,
        },
      ],
    }),
    [currentAnnualCost, retrofittedAnnualCost]
  )

  const waterfallChartOptions = useMemo<ChartOptions<'bar'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 900,
        easing: 'easeOutQuart',
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          titleColor: '#F8FAFC',
          bodyColor: '#E2E8F0',
          padding: 12,
          callbacks: {
            label: (context) => {
              const rawValue = context.raw

              if (!Array.isArray(rawValue)) {
                return formatCurrency(Number(rawValue))
              }

              const startValue = Number(rawValue[0])
              const endValue = Number(rawValue[1])
              const totalValue = Math.abs(endValue - startValue)

              if (context.dataIndex === 1) {
                return `Savings: INR ${formatNumber(totalValue)}`
              }

              return `${context.dataIndex === 0 ? 'Current Cost' : 'Retrofitted Cost'}: INR ${formatNumber(
                Math.max(startValue, endValue)
              )}`
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: '#64748B',
            font: {
              family: 'Manrope Variable, sans-serif',
              size: 11,
              weight: 600,
            },
          },
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: {
            color: '#E2E8F0',
            drawTicks: false,
          },
          ticks: {
            color: '#64748B',
            callback: (value) => formatNumber(Number(value)),
            font: {
              family: 'Manrope Variable, sans-serif',
              size: 11,
            },
          },
          title: {
            display: true,
            text: 'Cost (INR/year)',
            color: '#64748B',
            font: {
              family: 'Manrope Variable, sans-serif',
              size: 12,
              weight: 600,
            },
          },
        },
      },
    }),
    []
  )

  const waterfallValueLabelsPlugin = useMemo(
    () =>
      createValueLabelPlugin('dg-waterfall-labels', (rawValue) => {
        if (!Array.isArray(rawValue)) {
          return formatCurrency(Number(rawValue))
        }

        const totalValue = Math.abs(Number(rawValue[1]) - Number(rawValue[0]))
        return `INR ${formatNumber(totalValue)}`
      }),
    []
  )

  return (
    <div className="space-y-4">
      <DGSetChartsLegend />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>Energy Consumption Comparison Graph</CardTitle>
            <CardDescription>
              Current DG system versus the recommended fuel retrofit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="neo-chart-stage h-[320px] rounded-[22px] p-3 sm:h-[360px] sm:p-4">
              <Bar
                data={energyChartData}
                options={energyChartOptions}
                plugins={[energyValueLabelsPlugin]}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>Annual DG Fuel Cost Savings</CardTitle>
            <CardDescription>
              Waterfall view for the current versus retrofitted DG fuel cost.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="neo-chart-stage h-[320px] rounded-[22px] p-3 sm:h-[360px] sm:p-4">
              <Bar
                data={waterfallChartData}
                options={waterfallChartOptions}
                plugins={[waterfallValueLabelsPlugin, waterfallConnectorPlugin]}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
