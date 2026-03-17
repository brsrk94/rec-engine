'use client'

import { useMemo } from 'react'
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
  'rgba(71, 85, 105, 0.9)',
  'rgba(244, 184, 205, 0.9)',
  'rgba(173, 216, 255, 0.92)',
  'rgba(187, 247, 208, 0.94)',
]

const COMPRESSOR_BORDER_COLORS = ['#334155', '#DD8DB2', '#60A5FA', '#4ADE80']
const WATERFALL_BAR_COLORS = ['rgba(71, 85, 105, 0.9)', 'rgba(187, 247, 208, 0.96)', 'rgba(173, 216, 255, 0.92)']
const WATERFALL_BORDER_COLORS = ['#334155', '#16A34A', '#60A5FA']

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
    <div className="rounded-2xl border border-border/70 bg-card px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <CompressorLegendDot
            fill={COMPRESSOR_BAR_COLORS[0]}
            border={COMPRESSOR_BORDER_COLORS[0]}
          />
          <ArrowRight className="h-4 w-4 shrink-0 text-[#1666C5]" />
          <span className="text-sm font-semibold text-[#1666C5] sm:text-base">
            current compressor
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {COMPRESSOR_BAR_COLORS.slice(1, 4).map((fill, index) => (
              <CompressorLegendDot
                key={COMPRESSOR_BORDER_COLORS[index + 1]}
                fill={fill}
                border={COMPRESSOR_BORDER_COLORS[index + 1]}
              />
            ))}
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#1666C5]" />
          <span className="text-sm font-semibold text-[#1666C5] sm:text-base">
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
  const energyRows = useMemo(
    () => [
      {
        displayName: `${currentSystem.make} ${currentSystem.model}`.trim(),
        annualEnergy: currentSystem.annualEnergy,
      },
      ...recommendations.slice(0, 3).map((recommendation) => ({
        displayName: `${recommendation.make} ${recommendation.model}`.trim(),
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
      labels: energyRows.map((row) => wrapAxisLabel(row.displayName, 18)),
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
    [energyRows]
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
      labels: ['Current Cost', 'Savings', 'New Cost'],
      datasets: [
        {
          label: 'Annual Cost',
          data: [
            [0, currentAnnualCost],
            [0, energySavingsCost],
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

              if (Array.isArray(rawValue)) {
                const startValue = Number(rawValue[0])
                const endValue = Number(rawValue[1])
                const totalValue = Math.abs(endValue - startValue)

                if (context.dataIndex === 1) {
                  return `Savings: INR ${formatNumber(totalValue)}`
                }

                return `${context.dataIndex === 0 ? 'Current Cost' : 'New Cost'}: INR ${formatNumber(
                  Math.max(startValue, endValue)
                )}`
              }

              return formatCurrency(Number(rawValue))
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

        const savingsValue = Math.abs(Number(rawValue[1]) - Number(rawValue[0]))

        if (index === 1) {
          return `INR ${formatNumber(savingsValue)}`
        }

        return `INR ${formatNumber(savingsValue)}`
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
            <div className="h-[320px] sm:h-[360px]">
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
            <CardTitle>Annual Compressor Cost Savings</CardTitle>
            <CardDescription>
              Waterfall view for the strongest recommended compressor option.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] sm:h-[360px]">
              <Bar
                data={waterfallChartData}
                options={waterfallChartOptions}
                plugins={[waterfallValueLabelsPlugin]}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
