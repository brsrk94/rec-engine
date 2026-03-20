'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type Plugin,
  type ChartData,
  type ChartOptions,
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

interface CompressorRecommendationChartsProps {
  currentSystem: AssessmentCurrentSystemSnapshot
  recommendations: AssessmentRecommendationCardSnapshot[]
}

const COMPRESSOR_BAR_COLORS = [
  'rgba(103, 104, 125, 0.94)',
  'rgba(5, 160, 112, 0.94)',
  'rgba(5, 10, 153, 0.92)',
  'rgba(234, 179, 8, 0.92)',
]

const COMPRESSOR_BORDER_COLORS = ['#67687D', '#05A070', '#050A99', '#EAB308']
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
  id: 'waterfall-connectors',
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

    const recommendedCostBar = bars[2].getProps(['x', 'y', 'width'], true) as {
      x: number
      y: number
      width: number
    }

    ctx.beginPath()
    ctx.moveTo(savingsBar.x + savingsBar.width / 2, savingsBar.y)
    ctx.lineTo(recommendedCostBar.x - recommendedCostBar.width / 2, recommendedCostBar.y)
    ctx.stroke()

    ctx.restore()
  },
}

function CompressorLegendDot({ fill, border }: { fill: string; border: string }) {
  return (
    <span
      aria-hidden="true"
      className="h-7 w-7 shrink-0 rounded-full border-[3px] shadow-[0_2px_10px_rgba(15,23,42,0.08)]"
      style={{ backgroundColor: fill, borderColor: border }}
    />
  )
}

function CompressorChartsLegend() {
  return (
    <div className="neo-panel rounded-2xl bg-card px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <CompressorLegendDot
            fill={COMPRESSOR_BAR_COLORS[0]}
            border={COMPRESSOR_BORDER_COLORS[0]}
          />
          <ArrowRight className="h-4 w-4 shrink-0 text-[#67687D]" />
          <span className="text-sm font-semibold text-[#67687D] sm:text-base">
            current compressor
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {COMPRESSOR_BAR_COLORS.slice(1, 4).map((fill, index) => (
              <CompressorLegendDot
                key={`compressor-recommended-legend-${index}`}
                fill={fill}
                border={COMPRESSOR_BORDER_COLORS[index + 1]}
              />
            ))}
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#05A070]" />
          <span className="text-sm font-semibold text-[#05A070] sm:text-base">
            recommended compressors
          </span>
        </div>
      </div>
    </div>
  )
}

export function CompressorRecommendationCharts({
  currentSystem,
  recommendations,
}: CompressorRecommendationChartsProps) {
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

  const energyRows = useMemo(
    () => [
      {
        displayName: `${currentSystem.make} ${currentSystem.model}`.trim(),
        compactLabel: currentSystem.make?.trim() || currentSystem.model?.trim() || 'Current',
        annualEnergy: currentSystem.annualEnergy,
      },
      ...recommendations.slice(0, 3).map((recommendation) => ({
        displayName: `${recommendation.make} ${recommendation.model}`.trim(),
        compactLabel: recommendation.make?.trim() || recommendation.model?.trim() || 'Recommended',
        annualEnergy: recommendation.recommendedAnnualEnergy ?? 0,
      })),
    ],
    [currentSystem.annualEnergy, currentSystem.make, currentSystem.model, recommendations]
  )

  const leadRecommendation = recommendations[0] ?? null
  const currentAnnualCost = leadRecommendation?.currentAnnualCost ?? currentSystem.annualCost
  const newAnnualCost =
    leadRecommendation?.recommendedAnnualCost ??
    Math.max(0, currentAnnualCost - (leadRecommendation?.costSavings ?? 0))
  const energySavingsCost = Math.max(0, leadRecommendation?.costSavings ?? 0)

  const energyChartData = useMemo<ChartData<'bar'>>(
    () => ({
      labels: energyRows.map((row) =>
        wrapAxisLabel(useCompactAxisLabels ? row.compactLabel : row.displayName, useCompactAxisLabels ? 10 : 18)
      ),
      datasets: [
        {
          label: 'Annual Energy',
          data: energyRows.map((row) => row.annualEnergy),
          backgroundColor: energyRows.map(
            (_, index) => COMPRESSOR_BAR_COLORS[index] ?? COMPRESSOR_BAR_COLORS.at(-1)
          ),
          borderColor: energyRows.map(
            (_, index) => COMPRESSOR_BORDER_COLORS[index] ?? COMPRESSOR_BORDER_COLORS.at(-1)
          ),
          borderWidth: 1,
          borderRadius: 0,
          categoryPercentage: 0.98,
          barPercentage: 0.99,
          maxBarThickness: 68,
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
          border: {
            display: false,
          },
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
    () => createValueLabelPlugin('compressor-energy-labels', (rawValue) => `${formatNumber(Number(rawValue))}`),
    []
  )

  const waterfallChartData = useMemo<ChartData<'bar'>>(
    () => ({
      labels: ['Current Cost', 'Savings', 'Recommended Cost'],
      datasets: [
        {
          label: 'Annual Cost',
          data: [
            [0, currentAnnualCost],
            [newAnnualCost, currentAnnualCost],
            [0, newAnnualCost],
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
    [currentAnnualCost, energySavingsCost, newAnnualCost]
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
        legend: {
          display: false,
        },
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

              return `${context.dataIndex === 0 ? 'Current Cost' : 'Recommended Cost'}: INR ${formatNumber(
                Math.max(startValue, endValue)
              )}`
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
              size: 11,
              weight: 600,
            },
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
      createValueLabelPlugin('compressor-waterfall-labels', (rawValue, index) => {
        if (!Array.isArray(rawValue)) {
          return formatCurrency(Number(rawValue))
        }

        const totalValue = Math.abs(Number(rawValue[1]) - Number(rawValue[0]))

        if (index === 1) {
          return `INR ${formatNumber(totalValue)}`
        }

        return `INR ${formatNumber(totalValue)}`
      }),
    []
  )

  return (
    <div className="space-y-4">
      <CompressorChartsLegend />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Energy Consumption Comparison Graph</CardTitle>
            <CardDescription>
              Current compressor versus the recommended compressor options.
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
            <CardTitle>Annual Compressor Energy Cost Savings</CardTitle>
            <CardDescription>
              Waterfall view for the strongest recommended compressor option.
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
