'use client'

import { useMemo } from 'react'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

import type { MotorRecommendationCard, MotorRecommendationResult } from '@/lib/motor-catalog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

interface MotorRecommendationChartsProps {
  currentSystem: MotorRecommendationResult['currentSystem']
  recommendations: MotorRecommendationCard[]
}

interface MotorChartRow {
  motorLabel: string
  axisLabel: string[]
  currentEnergy: number
  recommendedEnergy: number
  energySavings: number
  currentEmissions: number
  recommendedEmissions: number
  emissionSavings: number
}

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
      axisLabel: wrapMotorLabel(motorLabel),
      currentEnergy: recommendation.currentAnnualEnergy,
      recommendedEnergy: recommendation.recommendedAnnualEnergy,
      energySavings: recommendation.energySavings,
      currentEmissions: recommendation.currentAnnualEmissions,
      recommendedEmissions: recommendation.recommendedAnnualEmissions,
      emissionSavings: recommendation.emissionSavings,
    }
  })
}

export function MotorRecommendationCharts({
  currentSystem,
  recommendations,
}: MotorRecommendationChartsProps) {
  const chartRows = useMemo(() => buildChartRows(recommendations), [recommendations])

  const energyData = useMemo<ChartData<'bar'>>(
    () => ({
      labels: chartRows.map((row) => row.axisLabel),
      datasets: [
        {
          label: 'Current Motor',
          data: chartRows.map((row) => row.currentEnergy),
          backgroundColor: 'rgba(148, 163, 184, 0.9)',
          borderColor: '#94A3B8',
          borderWidth: 1,
          borderRadius: 12,
          borderSkipped: false,
          maxBarThickness: 28,
        },
        {
          label: 'Recommended Motor',
          data: chartRows.map((row) => row.recommendedEnergy),
          backgroundColor: 'rgba(6, 95, 70, 0.9)',
          borderColor: '#065F46',
          borderWidth: 1,
          borderRadius: 12,
          borderSkipped: false,
          maxBarThickness: 28,
        },
      ],
    }),
    [chartRows]
  )

  const energyOptions = useMemo<ChartOptions<'bar'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
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
          position: 'top',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            color: '#475569',
            padding: 18,
            font: {
              family: 'Manrope Variable, sans-serif',
              size: 12,
              weight: '600',
            },
          },
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
            label: (context) =>
              `${context.dataset.label}: ${formatNumber(Number(context.raw))} kWh/year`,
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
              weight: '600',
            },
            maxRotation: 0,
            minRotation: 0,
            padding: 8,
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
              size: 11,
            },
          },
          title: {
            display: true,
            text: 'kWh/year',
            color: '#64748B',
            font: {
              family: 'Manrope Variable, sans-serif',
              size: 12,
              weight: '600',
            },
          },
        },
      },
    }),
    [chartRows]
  )

  const emissionData = useMemo<ChartData<'line'>>(
    () => ({
      labels: chartRows.map((row) => row.axisLabel),
      datasets: [
        {
          label: 'Current Motor',
          data: chartRows.map((row) => row.currentEmissions),
          borderColor: '#94A3B8',
          backgroundColor: 'rgba(148, 163, 184, 0.14)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBackgroundColor: '#94A3B8',
          pointBorderWidth: 0,
          borderWidth: 3,
        },
        {
          label: 'Recommended Motor',
          data: chartRows.map((row) => row.recommendedEmissions),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.18)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBackgroundColor: '#10B981',
          pointBorderWidth: 0,
          borderWidth: 3,
        },
      ],
    }),
    [chartRows]
  )

  const emissionOptions = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
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
          position: 'top',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            color: '#475569',
            padding: 18,
            font: {
              family: 'Manrope Variable, sans-serif',
              size: 12,
              weight: '600',
            },
          },
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
            label: (context) =>
              `${context.dataset.label}: ${formatNumber(Number(context.raw))} kgCO2e/year`,
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
              weight: '600',
            },
            maxRotation: 0,
            minRotation: 0,
            padding: 8,
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
              size: 11,
            },
          },
          title: {
            display: true,
            text: 'kgCO2e/year',
            color: '#64748B',
            font: {
              family: 'Manrope Variable, sans-serif',
              size: 12,
              weight: '600',
            },
          },
        },
      },
    }),
    [chartRows]
  )

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Energy Consumption Comparison Graph</CardTitle>
          <CardDescription>
            Before vs after motor upgrade for {currentSystem.make} {currentSystem.model}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[360px]">
            <Bar data={energyData} options={energyOptions} />
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
        <CardContent>
          <div className="h-[360px]">
            <Line data={emissionData} options={emissionOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
