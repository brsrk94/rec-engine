'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { EChartsOption } from 'echarts'

import type { MotorRecommendationResult } from '@/lib/motor-catalog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
})

interface MotorRecommendationChartsProps {
  chartData: MotorRecommendationResult['chartData']
}

function formatNumber(value: number) {
  return value.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export function MotorRecommendationCharts({
  chartData,
}: MotorRecommendationChartsProps) {
  const energyTrendOption = useMemo<EChartsOption>(
    () => ({
      animationDuration: 700,
      animationEasing: 'cubicOut',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        borderWidth: 0,
        textStyle: {
          color: '#F8FAFC',
        },
        valueFormatter: (value) => `${formatNumber(Number(value))} kWh`,
      },
      legend: {
        type: 'scroll',
        top: 0,
        left: 'center',
        icon: 'roundRect',
        itemWidth: 18,
        itemHeight: 10,
        textStyle: {
          color: '#475569',
        },
      },
      grid: {
        left: 20,
        right: 18,
        top: 58,
        bottom: 16,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: chartData.energyTrendYears,
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: {
          color: '#64748B',
        },
      },
      yAxis: {
        type: 'value',
        name: 'kWh',
        nameTextStyle: {
          color: '#64748B',
          padding: [0, 0, 0, 8],
        },
        splitLine: {
          lineStyle: {
            color: '#E2E8F0',
            type: 'dashed',
          },
        },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#64748B',
          formatter: (value: number) => formatNumber(value),
        },
      },
      series: chartData.energyTrendSeries.map((series) => ({
        name: series.name,
        type: 'line',
        smooth: true,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 7,
        data: series.data,
        lineStyle: {
          width: 3,
          color: series.color,
          type: series.dashed ? 'dashed' : 'solid',
        },
        itemStyle: {
          color: series.color,
        },
        emphasis: {
          focus: 'series',
        },
      })),
    }),
    [chartData]
  )

  const energySplitOption = useMemo<EChartsOption>(
    () => ({
      animationDuration: 700,
      color: ['#10B981', '#D1FAE5'],
      title: {
        text: 'Best Option',
        subtext: chartData.bestRecommendationLabel,
        left: 'center',
        top: '44%',
        textStyle: {
          fontSize: 13,
          fontWeight: 700,
          color: '#0F172A',
        },
        subtextStyle: {
          fontSize: 11,
          color: '#64748B',
          width: 180,
          overflow: 'truncate',
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: { name: string; value: number; percent: number }) =>
          `${params.name}<br/>${formatNumber(params.value)} kWh (${params.percent}%)`,
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        itemWidth: 14,
        itemHeight: 14,
        textStyle: {
          color: '#475569',
        },
      },
      series: [
        {
          name: 'Energy split',
          type: 'pie',
          radius: ['48%', '72%'],
          center: ['66%', '52%'],
          avoidLabelOverlap: true,
          label: {
            show: false,
          },
          labelLine: {
            show: false,
          },
          data: chartData.energySplitData,
          emphasis: {
            itemStyle: {
              shadowBlur: 14,
              shadowOffsetX: 0,
              shadowColor: 'rgba(15, 23, 42, 0.18)',
            },
          },
        },
      ],
    }),
    [chartData]
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Current vs Recommended Motors</CardTitle>
          <CardDescription>
            10-year cumulative energy use for the current motor and the top 3 catalog recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReactECharts option={energyTrendOption} style={{ height: 360, width: '100%' }} />
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Energy Savings Split</CardTitle>
          <CardDescription>
            Annual energy saved versus the annual energy still used by the strongest recommendation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReactECharts option={energySplitOption} style={{ height: 360, width: '100%' }} />
        </CardContent>
      </Card>

      <Card className="border-border/80 lg:col-span-2">
        <CardHeader>
          <CardTitle>Best Recommendation Metrics</CardTitle>
          <CardDescription>
            The lead option is summarized here using the payback and MAC values used for ranking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {chartData.highlightMetrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-border/80 bg-muted/25 p-4">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="mt-2 text-xl font-semibold">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.unit}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
