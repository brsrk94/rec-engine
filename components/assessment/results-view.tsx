"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { gsap } from 'gsap'
import { 
  ArrowLeft, 
  TrendingDown,
  DollarSign,
  Leaf,
  Clock,
  CheckCircle2,
  ArrowRight,
  Download,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAssessmentStorage } from '@/hooks/use-assessment-storage'
import type { MotorCatalogPayload, MotorRecommendationResult } from '@/lib/motor-catalog'
import { buildMotorRecommendation } from '@/lib/motor-catalog'
import {
  AssessmentEquipmentImage,
  ASSESSMENT_EQUIPMENT_ASSETS,
  type AssessmentEquipmentId,
} from './equipment-image'

const equipmentConfig = {
  motor: {
    title: 'Motor',
  },
  compressor: {
    title: 'Compressor',
  },
  bldc_fan: {
    title: 'BLDC Fan',
  },
  air_conditioner: {
    title: 'Air Conditioner',
  },
  led_retrofit: {
    title: 'LED Retrofit',
  },
  dg_set: {
    title: 'DG Set',
  },
}

function hasMotorEfficiencyClass(rec: unknown): rec is { efficiencyClass: string } {
  return typeof rec === 'object' && rec !== null && 'efficiencyClass' in rec
}

function hasMotorComparisonFields(
  rec: unknown
): rec is {
  currentAnnualEnergy: number
  recommendedAnnualEnergy: number
  energySavings: number
  currentAnnualCost: number
  recommendedAnnualCost: number
  costSavings: number
  currentAnnualEmissions: number
  recommendedAnnualEmissions: number
  emissionSavings: number
} {
  return (
    typeof rec === 'object' &&
    rec !== null &&
    'currentAnnualEnergy' in rec &&
    'recommendedAnnualEnergy' in rec &&
    'energySavings' in rec &&
    'currentAnnualCost' in rec &&
    'recommendedAnnualCost' in rec &&
    'costSavings' in rec &&
    'currentAnnualEmissions' in rec &&
    'recommendedAnnualEmissions' in rec &&
    'emissionSavings' in rec
  )
}

function generateRecommendations(type: string, data: ReturnType<typeof useAssessmentStorage>['data']) {
  // Compressor recommendations
  if (type === 'compressor') {
    const comp = data.compressor
    const ratingKw = comp.compressor_rating_unit === 'HP' 
      ? parseFloat(comp.compressor_rating) * 0.746 
      : parseFloat(comp.compressor_rating)
    const hours = parseFloat(comp.compressor_operating_hours_year) || 6000
    const loadFactor = (parseFloat(comp.compressor_load_factor) || 80) / 100
    const tariff = parseFloat(comp.compressor_electricity_tariff) || 7
    const emissionFactor = parseFloat(comp.compressor_grid_emission_factor) || 0.71

    const efficiencyMap: Record<string, number> = {
      'reciprocating': 0.70, 'fixed_speed_rotary': 0.75, 'vsd_rotary': 0.85,
      'centrifugal': 0.85, 'scroll': 0.75, 'oil_free_screw': 0.70
    }
    
    const currentEff = efficiencyMap[comp.current_compressor_type] || 0.70
    const targetEff = 0.85 // VSD

    const currentEnergy = (ratingKw / currentEff) * loadFactor * hours
    const targetEnergy = (ratingKw / targetEff) * loadFactor * hours
    
    const energySavings = currentEnergy - targetEnergy
    const costSavings = energySavings * tariff
    const emissionSavings = energySavings * emissionFactor
    
    const upgradeCost = 21000 * ratingKw // VSD compressor cost
    const payback = costSavings > 0 ? upgradeCost / costSavings : 0

    return {
      currentSystem: {
        type: comp.current_compressor_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not specified',
        rating: `${comp.compressor_rating} ${comp.compressor_rating_unit}`,
        make: comp.compressor_make || 'Not specified',
        model: comp.compressor_model || 'Not specified',
        annualEnergy: Math.round(currentEnergy),
        annualCost: Math.round(currentEnergy * tariff),
      },
      recommendations: [
        {
          id: 1,
          name: 'Variable Speed Drive (Rotary Screw)',
          make: 'Atlas Copco / ELGi',
          model: 'GA VSD+ Series',
          badge: 'Energy Efficient',
          energySavings: Math.round(energySavings),
          costSavings: Math.round(costSavings),
          emissionSavings: Math.round(emissionSavings),
          upgradeCost: Math.round(upgradeCost),
          paybackYears: payback.toFixed(1),
          efficiency: Math.round(targetEff * 100),
        }
      ],
      summary: {
        totalEnergySavings: Math.round(energySavings),
        totalCostSavings: Math.round(costSavings),
        totalEmissionSavings: Math.round(emissionSavings / 1000),
        averagePayback: payback.toFixed(1),
      }
    }
  }

  // BLDC Fan recommendations
  if (type === 'bldc_fan') {
    const fan = data.bldc_fan
    const currentWattage = parseFloat(fan.current_wattage) || 75
    const numFans = parseInt(fan.number_of_fans) || 1
    const hours = parseFloat(fan.operating_hours_year) || 3000
    const tariff = parseFloat(fan.electricity_tariff) || 8
    
    const bldcWattage = 28 // BLDC fan typical wattage
    
    const currentEnergy = (currentWattage * numFans * hours) / 1000
    const targetEnergy = (bldcWattage * numFans * hours) / 1000
    
    const energySavings = currentEnergy - targetEnergy
    const costSavings = energySavings * tariff
    const emissionSavings = energySavings * 0.71
    
    const upgradeCost = 2500 * numFans // BLDC fan cost
    const payback = costSavings > 0 ? upgradeCost / costSavings : 0

    return {
      currentSystem: {
        type: 'Conventional AC Fan',
        rating: `${currentWattage}W x ${numFans} units`,
        make: 'Various',
        model: 'Standard Ceiling Fan',
        annualEnergy: Math.round(currentEnergy),
        annualCost: Math.round(currentEnergy * tariff),
      },
      recommendations: [
        {
          id: 1,
          name: 'BLDC Ceiling Fan',
          make: 'Atomberg / Orient',
          model: 'Energy Efficient BLDC',
          badge: '65% Savings',
          energySavings: Math.round(energySavings),
          costSavings: Math.round(costSavings),
          emissionSavings: Math.round(emissionSavings),
          upgradeCost: Math.round(upgradeCost),
          paybackYears: payback.toFixed(1),
          efficiency: 90,
        }
      ],
      summary: {
        totalEnergySavings: Math.round(energySavings),
        totalCostSavings: Math.round(costSavings),
        totalEmissionSavings: Math.round(emissionSavings / 1000),
        averagePayback: payback.toFixed(1),
      }
    }
  }

  // Default recommendations for other equipment types
  return {
    currentSystem: {
      type: 'Current Equipment',
      rating: 'As specified',
      make: 'Various',
      model: 'Not specified',
      annualEnergy: 50000,
      annualCost: 400000,
    },
    recommendations: [
      {
        id: 1,
        name: 'High Efficiency Upgrade',
        make: 'Fitsol Recommended',
        model: 'Premium Series',
        badge: 'Recommended',
        energySavings: 15000,
        costSavings: 120000,
        emissionSavings: 10650,
        upgradeCost: 300000,
        paybackYears: '2.5',
        efficiency: 92,
      }
    ],
    summary: {
      totalEnergySavings: 15000,
      totalCostSavings: 120000,
      totalEmissionSavings: 10.65,
      averagePayback: '2.5',
    }
  }
}

export function ResultsView() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data, isLoaded, clearAll } = useAssessmentStorage()
  const containerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const [motorCatalog, setMotorCatalog] = useState<MotorCatalogPayload | null>(null)
  const [motorCatalogError, setMotorCatalogError] = useState<string | null>(null)
  const [isMotorCatalogLoading, setIsMotorCatalogLoading] = useState(false)

  const type = searchParams.get('type') || 'motor'
  const config = equipmentConfig[type as keyof typeof equipmentConfig] || equipmentConfig.motor

  useEffect(() => {
    if (!isLoaded || type !== 'motor') {
      setIsMotorCatalogLoading(false)
      setMotorCatalogError(null)
      setMotorCatalog(null)
      return
    }

    let isMounted = true

    async function loadCatalog() {
      try {
        setIsMotorCatalogLoading(true)
        setMotorCatalogError(null)

        const response = await fetch('/api/catalog/motors')

        if (!response.ok) {
          throw new Error('Unable to load the motor catalog for recommendations.')
        }

        const payload = (await response.json()) as MotorCatalogPayload

        if (isMounted) {
          setMotorCatalog(payload)
        }
      } catch (error) {
        if (isMounted) {
          setMotorCatalogError(
            error instanceof Error
              ? error.message
              : 'Unable to load the motor catalog for recommendations.'
          )
        }
      } finally {
        if (isMounted) {
          setIsMotorCatalogLoading(false)
        }
      }
    }

    loadCatalog()

    return () => {
      isMounted = false
    }
  }, [isLoaded, type])

  const results = useMemo(() => {
    if (!isLoaded) return null
    if (type === 'motor') {
      if (!motorCatalog) {
        return null
      }

      return buildMotorRecommendation(data.motor, motorCatalog.motors)
    }

    return generateRecommendations(type, data)
  }, [type, data, isLoaded, motorCatalog])

  useEffect(() => {
    if (!isLoaded || !results) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6 }
      )
        .fromTo(
          summaryRef.current?.children || [],
          { opacity: 0, y: 20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1 },
          '-=0.3'
        )
        .fromTo(
          cardsRef.current?.children || [],
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.15 },
          '-=0.2'
        )
    }, containerRef)

    return () => ctx.revert()
  }, [isLoaded, results])

  if (type === 'motor' && motorCatalogError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Unable to load motor recommendations</CardTitle>
            <CardDescription>{motorCatalogError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.push('/assessment?type=motor')}>
              Back to Motor Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isLoaded || (type === 'motor' && isMotorCatalogLoading) || !results) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Analyzing your equipment data...</span>
        </div>
      </div>
    )
  }

  const motorResults = type === 'motor' ? (results as MotorRecommendationResult) : null

  const formatPositiveValue = (value: number) => Math.max(0, value).toLocaleString('en-IN')

  const handleStartNew = () => {
    clearAll()
    router.push('/assessment')
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 pt-[11px] text-white md:px-6">
        <div className="mx-auto flex h-[58px] max-w-7xl items-center justify-between rounded-[12px] border border-white/10 bg-[#065F46] px-4 shadow-sm md:h-[66px] md:px-6">
          <Link href="/" className="rounded-[8px] bg-white px-3 py-[6px] shadow-sm">
            <Image
              src="/fitsol.svg"
              alt="Fitsol"
              width={84}
              height={32}
              priority
              className="h-auto w-[53px] md:w-[84px]"
            />
          </Link>

          <div className="flex items-center gap-2">
            <Link href={`/assessment?type=${type}`}>
              <Button variant="ghost" size="sm" className="h-8 gap-2 px-2.5 text-white hover:bg-white/10 hover:text-white sm:h-[29px] sm:px-3">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Edit Inputs</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        {/* Results Header */}
        <div ref={headerRef} className="mb-8">
          <div className="flex items-start gap-2.5 sm:items-center sm:gap-3">
            <AssessmentEquipmentImage
              equipmentId={(type in ASSESSMENT_EQUIPMENT_ASSETS ? type : 'motor') as AssessmentEquipmentId}
              className="h-10 w-10 rounded-xl sm:h-14 sm:w-14"
              roundedClassName="rounded-xl"
              sizes="(min-width: 640px) 56px, 40px"
              priority
            />
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight sm:text-2xl md:text-3xl">
                {config.title} Assessment Results
              </h1>
              <p className="text-muted-foreground">
                Based on your equipment specifications
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div ref={summaryRef} className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Energy Savings</p>
                <p className="text-2xl font-bold">{results.summary.totalEnergySavings.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 text-green-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cost Savings</p>
                <p className="text-2xl font-bold">INR {results.summary.totalCostSavings.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">
                <Leaf className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CO2 Reduction</p>
                <p className="text-2xl font-bold">{results.summary.totalEmissionSavings}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payback Period</p>
                <p className="text-2xl font-bold">{results.summary.averagePayback}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <div ref={cardsRef} className="space-y-6">

          {/* Current System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Current System
              </CardTitle>
              <CardDescription>Your existing equipment configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{results.currentSystem.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="font-medium">{results.currentSystem.rating}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Make</p>
                  <p className="font-medium">{results.currentSystem.make}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{results.currentSystem.model}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Annual Energy</p>
                  <p className="font-medium">{results.currentSystem.annualEnergy.toLocaleString()} kWh</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Annual Cost</p>
                  <p className="font-medium">INR {results.currentSystem.annualCost.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Upgrades */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Recommended Upgrades</h2>
            <div className="space-y-4">
              {results.recommendations.map((rec) => (
                <Card key={rec.id} className="overflow-hidden border-primary/30">
                  <div className="flex flex-col lg:flex-row">
                    <div className="flex-1 p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <Badge className="bg-primary text-primary-foreground">
                              {rec.badge}
                            </Badge>
                            {type === 'motor' && hasMotorEfficiencyClass(rec) ? (
                              <Badge variant="outline">{rec.efficiencyClass}</Badge>
                            ) : null}
                          </div>
                          <h3 className="text-xl font-semibold">{rec.name}</h3>
                          <p className="text-muted-foreground">
                            {rec.make} - {rec.model}
                          </p>
                          {rec.details ? (
                            <p className="mt-1 text-sm text-muted-foreground">{rec.details}</p>
                          ) : null}
                        </div>
                        <CheckCircle2 className="h-8 w-8 text-primary" />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg bg-secondary/50 p-3">
                          <p className="text-sm text-muted-foreground">Energy Savings</p>
                          <p className="text-lg font-semibold text-primary">
                            {formatPositiveValue(rec.energySavings)} kWh/yr
                          </p>
                        </div>
                        <div className="rounded-lg bg-secondary/50 p-3">
                          <p className="text-sm text-muted-foreground">Cost Savings</p>
                          <p className="text-lg font-semibold text-green-600">
                            INR {formatPositiveValue(rec.costSavings)}/yr
                          </p>
                        </div>
                        <div className="rounded-lg bg-secondary/50 p-3">
                          <p className="text-sm text-muted-foreground">CO2 Reduction</p>
                          <p className="text-lg font-semibold text-emerald-600">
                            {formatPositiveValue(rec.emissionSavings)} kg/yr
                          </p>
                        </div>
                        {type === 'motor' ? (
                          <div className="rounded-lg bg-secondary/50 p-3">
                            <p className="text-sm text-muted-foreground">Marginal Abatement Cost</p>
                            <p className="text-lg font-semibold text-emerald-700">
                              {rec.marginalAbatementCost ?? 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">INR/kgCO2e</p>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-secondary/50 p-3">
                            <p className="text-sm text-muted-foreground">Efficiency</p>
                            <div className="flex items-center gap-2">
                              <Progress value={Math.min(rec.efficiency, 100)} className="h-2 flex-1" />
                              <span className="text-sm font-medium">{rec.efficiency}%</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {type === 'motor' && motorResults && hasMotorComparisonFields(rec) ? (
                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                          <div className="rounded-xl border border-border/80 bg-background p-4">
                            <p className="text-sm font-medium text-foreground">Annual Energy</p>
                            <div className="mt-3 space-y-2 text-sm">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Current</span>
                                <span className="font-medium">
                                  {formatPositiveValue(rec.currentAnnualEnergy)} kWh
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Recommended</span>
                                <span className="font-medium">
                                  {formatPositiveValue(rec.recommendedAnnualEnergy)} kWh
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
                                <span>Savings</span>
                                <span className="font-semibold">
                                  {formatPositiveValue(rec.energySavings)} kWh
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-border/80 bg-background p-4">
                            <p className="text-sm font-medium text-foreground">Annual Cost</p>
                            <div className="mt-3 space-y-2 text-sm">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Current</span>
                                <span className="font-medium">
                                  INR {formatPositiveValue(rec.currentAnnualCost)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Recommended</span>
                                <span className="font-medium">
                                  INR {formatPositiveValue(rec.recommendedAnnualCost)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
                                <span>Savings</span>
                                <span className="font-semibold">
                                  INR {formatPositiveValue(rec.costSavings)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-border/80 bg-background p-4">
                            <p className="text-sm font-medium text-foreground">Annual Emissions</p>
                            <div className="mt-3 space-y-2 text-sm">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Current</span>
                                <span className="font-medium">
                                  {formatPositiveValue(rec.currentAnnualEmissions)} kgCO2e
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Recommended</span>
                                <span className="font-medium">
                                  {formatPositiveValue(rec.recommendedAnnualEmissions)} kgCO2e
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
                                <span>Reduction</span>
                                <span className="font-semibold">
                                  {formatPositiveValue(rec.emissionSavings)} kgCO2e
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col justify-center gap-4 border-t bg-secondary/30 p-6 lg:w-64 lg:border-l lg:border-t-0">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Estimated Investment</p>
                        <p className="text-2xl font-bold">INR {rec.upgradeCost.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Payback Period</p>
                        <p className="text-xl font-semibold text-primary">{rec.paybackYears} years</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={handleStartNew} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Start New Assessment
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Download Report
              </Button>
              <Link href="/assessment">
                <Button className="gap-2">
                  Assess More Equipment
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
