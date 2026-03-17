"use client"

import { useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAssessmentStorage } from '@/hooks/use-assessment-storage'
import { useCompressorCatalog } from '@/hooks/use-compressor-catalog'
import {
  COMPRESSOR_TYPE_OPTIONS,
  getDefaultCompressorCapex,
  getSuggestedTargetCompressorType,
  normalizeCompressorRatingToKw,
} from '@/lib/assessment/compressor-benchmarks'
import type { CompressorCatalogItem } from '@/lib/compressor-catalog'
import { cn } from '@/lib/utils'
import { fadeUpVariants } from '@/components/motion/variants'
import { AssessmentEquipmentImage } from './equipment-image'

interface CompressorFormProps {
  onBack: () => void
}

const mixedCaseSuffixClassName =
  'right-2 text-[9px] normal-case tracking-normal sm:right-3 sm:text-[10px]'

function InputWithSuffix({
  suffix,
  className,
  suffixClassName,
  inputClassName,
  ...props
}: React.ComponentProps<typeof Input> & {
  suffix: string
  suffixClassName?: string
  inputClassName?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Input
        {...props}
        className={cn(
          'h-10 pr-20 text-sm sm:h-9',
          suffix.length > 6 && 'pr-24 sm:pr-28',
          inputClassName
        )}
      />
      <span
        className={cn(
          'pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] font-medium uppercase tracking-[0.03em] text-muted-foreground sm:text-[11px]',
          suffixClassName
        )}
      >
        {suffix}
      </span>
    </div>
  )
}

function formatAutoCalculatedValue(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return ''
  }

  return value.toFixed(2).replace(/\.?0+$/, '')
}

export function CompressorForm({ onBack }: CompressorFormProps) {
  const router = useRouter()
  const { data, updateCompressor } = useAssessmentStorage()
  const { catalog, errorMessage: catalogError, isLoading: isCatalogLoading, reload } =
    useCompressorCatalog()
  const prefersReducedMotion = useReducedMotion()
  const previousAutoCurrentCapex = useRef('')
  const previousAutoTargetCapex = useRef('')
  const previousAutoEnergyConsumption = useRef('')
  const previousMirroredTargetRating = useRef('')
  const previousMirroredTargetUnit = useRef<'kW' | 'HP'>('kW')
  const compressor = data.compressor

  const selectedCatalogCompressor = useMemo(() => {
    if (!catalog || !compressor.compressor_make || !compressor.compressor_model) {
      return null
    }

    return (
      catalog.compressors.find(
        (catalogCompressor) =>
          catalogCompressor.make === compressor.compressor_make &&
          catalogCompressor.model === compressor.compressor_model
      ) ?? null
    )
  }, [catalog, compressor.compressor_make, compressor.compressor_model])

  const makeOptions = useMemo(
    () =>
      (catalog?.makeCounts ?? []).map(({ make }) => ({
        value: make,
        label: make,
        keywords: [make],
      })),
    [catalog]
  )

  const modelsForSelectedMake = useMemo(
    () =>
      Array.from(
        (catalog?.compressors ?? [])
          .filter((catalogCompressor) => catalogCompressor.make === compressor.compressor_make)
          .reduce((uniqueModels, catalogCompressor) => {
            if (!uniqueModels.has(catalogCompressor.model)) {
              uniqueModels.set(catalogCompressor.model, catalogCompressor)
            }

            return uniqueModels
          }, new Map<string, CompressorCatalogItem>())
          .values()
      ),
    [catalog, compressor.compressor_make]
  )

  const modelOptions = useMemo(
    () =>
      modelsForSelectedMake.map((catalogCompressor) => ({
        value: catalogCompressor.model,
        label: catalogCompressor.model,
        description: `${catalogCompressor.benchmark_type_label} | ${catalogCompressor.rated_power_kw} kW${catalogCompressor.series ? ` | ${catalogCompressor.series}` : ''}`,
        keywords: [
          catalogCompressor.model,
          catalogCompressor.benchmark_type_label,
          catalogCompressor.compressor_type_label ?? '',
          catalogCompressor.series ?? '',
          String(catalogCompressor.rated_power_kw),
        ],
      })),
    [modelsForSelectedMake]
  )

  const defaultCurrentCapex = useMemo(
    () =>
      getDefaultCompressorCapex(
        compressor.current_compressor_type,
        compressor.compressor_rating,
        compressor.compressor_rating_unit
      ),
    [
      compressor.current_compressor_type,
      compressor.compressor_rating,
      compressor.compressor_rating_unit,
    ]
  )

  const defaultTargetCapex = useMemo(
    () =>
      getDefaultCompressorCapex(
        compressor.target_compressor_type,
        compressor.target_compressor_rating || compressor.compressor_rating,
        compressor.target_compressor_rating_unit || compressor.compressor_rating_unit
      ),
    [
      compressor.compressor_rating,
      compressor.compressor_rating_unit,
      compressor.target_compressor_rating,
      compressor.target_compressor_rating_unit,
      compressor.target_compressor_type,
    ]
  )

  const autoCalculatedEnergyConsumption = useMemo(() => {
    const currentRatingKw = normalizeCompressorRatingToKw(
      compressor.compressor_rating,
      compressor.compressor_rating_unit
    )
    const operatingHours = Number.parseFloat(compressor.compressor_operating_hours_year)

    if (!Number.isFinite(currentRatingKw) || currentRatingKw <= 0) {
      return ''
    }

    if (!Number.isFinite(operatingHours) || operatingHours <= 0) {
      return ''
    }

    return formatAutoCalculatedValue(currentRatingKw * operatingHours)
  }, [
    compressor.compressor_operating_hours_year,
    compressor.compressor_rating,
    compressor.compressor_rating_unit,
  ])

  useEffect(() => {
    if (!selectedCatalogCompressor) {
      return
    }

    updateCompressor({
      compressor_rating: String(selectedCatalogCompressor.rated_power_kw),
      compressor_rating_unit: 'kW',
      current_compressor_type: selectedCatalogCompressor.benchmark_type,
      capex_of_current_compressor: String(
        getDefaultCompressorCapex(
          selectedCatalogCompressor.benchmark_type,
          selectedCatalogCompressor.rated_power_kw,
          'kW'
        ) || ''
      ),
    })
  }, [selectedCatalogCompressor, updateCompressor])

  useEffect(() => {
    if (compressor.current_compressor_type && !compressor.target_compressor_type) {
      const suggestedTarget = getSuggestedTargetCompressorType(compressor.current_compressor_type)

      if (suggestedTarget) {
        updateCompressor({ target_compressor_type: suggestedTarget })
      }
    }
  }, [compressor.current_compressor_type, compressor.target_compressor_type, updateCompressor])

  useEffect(() => {
    if (!compressor.compressor_rating) {
      return
    }

    const canMirrorTargetRating =
      !compressor.target_compressor_rating ||
      compressor.target_compressor_rating === previousMirroredTargetRating.current

    if (canMirrorTargetRating) {
      previousMirroredTargetRating.current = compressor.compressor_rating
      updateCompressor({ target_compressor_rating: compressor.compressor_rating })
    }
  }, [compressor.compressor_rating, compressor.target_compressor_rating, updateCompressor])

  useEffect(() => {
    const canMirrorTargetUnit =
      !compressor.target_compressor_rating ||
      compressor.target_compressor_rating === previousMirroredTargetRating.current ||
      compressor.target_compressor_rating_unit === previousMirroredTargetUnit.current

    if (canMirrorTargetUnit) {
      previousMirroredTargetUnit.current = compressor.compressor_rating_unit
      updateCompressor({ target_compressor_rating_unit: compressor.compressor_rating_unit })
    }
  }, [
    compressor.compressor_rating,
    compressor.compressor_rating_unit,
    compressor.target_compressor_rating,
    compressor.target_compressor_rating_unit,
    updateCompressor,
  ])

  useEffect(() => {
    const nextAutoCapex = defaultCurrentCapex > 0 ? defaultCurrentCapex.toFixed(0) : ''

    if (!nextAutoCapex) {
      return
    }

    const canRefreshAutoCapex =
      !compressor.capex_of_current_compressor ||
      compressor.capex_of_current_compressor === previousAutoCurrentCapex.current

    previousAutoCurrentCapex.current = nextAutoCapex

    if (canRefreshAutoCapex) {
      updateCompressor({ capex_of_current_compressor: nextAutoCapex })
    }
  }, [compressor.capex_of_current_compressor, defaultCurrentCapex, updateCompressor])

  useEffect(() => {
    const nextAutoCapex = defaultTargetCapex > 0 ? defaultTargetCapex.toFixed(0) : ''

    if (!nextAutoCapex) {
      return
    }

    const canRefreshAutoCapex =
      !compressor.capex_of_target_compressor ||
      compressor.capex_of_target_compressor === previousAutoTargetCapex.current

    previousAutoTargetCapex.current = nextAutoCapex

    if (canRefreshAutoCapex) {
      updateCompressor({ capex_of_target_compressor: nextAutoCapex })
    }
  }, [compressor.capex_of_target_compressor, defaultTargetCapex, updateCompressor])

  useEffect(() => {
    if (!autoCalculatedEnergyConsumption) {
      return
    }

    const canRefreshAutoEnergyConsumption =
      !compressor.compressor_energy_consumption ||
      compressor.compressor_energy_consumption === previousAutoEnergyConsumption.current

    previousAutoEnergyConsumption.current = autoCalculatedEnergyConsumption

    if (canRefreshAutoEnergyConsumption) {
      updateCompressor({
        compressor_energy_consumption: autoCalculatedEnergyConsumption,
      })
    }
  }, [
    autoCalculatedEnergyConsumption,
    compressor.compressor_energy_consumption,
    updateCompressor,
  ])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    router.push('/assessment/results?type=compressor')
  }

  const handleMakeChange = (value: string) => {
    updateCompressor({
      compressor_make: value,
      compressor_model: '',
      compressor_rating: '',
      compressor_rating_unit: 'kW',
      current_compressor_type: '',
      capex_of_current_compressor: '',
      target_compressor_type: '',
      target_compressor_rating: '',
      target_compressor_rating_unit: 'kW',
      capex_of_target_compressor: '',
    })
  }

  const handleModelChange = (value: string) => {
    updateCompressor({
      compressor_model: value,
    })
  }

  const isFormValid =
    compressor.compressor_make &&
    compressor.compressor_model &&
    compressor.compressor_rating &&
    compressor.current_compressor_type &&
    compressor.target_compressor_type &&
    compressor.compressor_operating_hours_year &&
    compressor.compressor_electricity_tariff

  return (
    <motion.div
      initial={prefersReducedMotion ? false : 'hidden'}
      animate="visible"
      variants={fadeUpVariants}
    >
      <div className="mb-6 flex items-start gap-3 sm:mb-8 sm:items-center sm:gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <AssessmentEquipmentImage
            equipmentId="compressor"
            className="h-10 w-10 shrink-0 sm:h-12 sm:w-12"
          />
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight sm:text-2xl">
              Compressor Assessment
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="gap-4 overflow-hidden py-4 sm:gap-6 sm:py-6">
            <CardHeader className="grid-rows-[auto] gap-0 px-4 sm:px-6">
              <CardTitle>Current Equipment</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <FieldGroup className="gap-5 sm:gap-6">
                <Field>
                  <FieldLabel className="text-sm leading-snug">Equipment Make</FieldLabel>
                  <SearchableSelect
                    value={compressor.compressor_make}
                    onValueChange={handleMakeChange}
                    options={makeOptions}
                    placeholder={isCatalogLoading ? 'Loading makes...' : 'Choose make'}
                    searchPlaceholder="Search make"
                    emptyText="No makes found"
                    disabled={isCatalogLoading || makeOptions.length === 0}
                    className="h-10 text-sm sm:h-9"
                  />
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">Equipment Model</FieldLabel>
                  <SearchableSelect
                    value={compressor.compressor_model}
                    onValueChange={handleModelChange}
                    options={modelOptions}
                    placeholder={
                      compressor.compressor_make ? 'Choose model' : 'Choose make first'
                    }
                    searchPlaceholder="Search model"
                    emptyText="No models found"
                    disabled={!compressor.compressor_make || modelOptions.length === 0}
                    className="h-10 text-sm sm:h-9"
                  />
                </Field>

                {catalogError ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-destructive">{catalogError}</p>
                    <Button type="button" variant="outline" size="sm" onClick={reload}>
                      Retry Catalog
                    </Button>
                  </div>
                ) : null}

                <Field>
                  <FieldLabel className="text-sm leading-snug">Current Compressor Type</FieldLabel>
                  <Select
                    value={compressor.current_compressor_type}
                    onValueChange={(value) =>
                      updateCompressor({
                        current_compressor_type: value,
                      })
                    }
                  >
                    <SelectTrigger className="h-10 w-full text-sm sm:h-9">
                      <SelectValue placeholder="Select compressor type" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPRESSOR_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">Current Rated Capacity</FieldLabel>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_104px]">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={compressor.compressor_rating}
                      onChange={(event) =>
                        updateCompressor({ compressor_rating: event.target.value })
                      }
                      placeholder="Enter capacity"
                      className="h-10 text-sm sm:h-9"
                    />
                    <Select
                      value={compressor.compressor_rating_unit}
                      onValueChange={(value: 'kW' | 'HP') =>
                        updateCompressor({ compressor_rating_unit: value })
                      }
                    >
                      <SelectTrigger className="h-10 w-full text-sm sm:h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kW">kW</SelectItem>
                        <SelectItem value="HP">HP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">Age of Current Compressor</FieldLabel>
                  <InputWithSuffix
                    type="number"
                    min="0"
                    value={compressor.years_of_operation_current_compressor}
                    onChange={(event) =>
                      updateCompressor({
                        years_of_operation_current_compressor: event.target.value,
                      })
                    }
                    suffix="yr"
                    suffixClassName={mixedCaseSuffixClassName}
                  />
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">
                    Capex of Current Compressor Type
                  </FieldLabel>
                  <InputWithSuffix
                    type="number"
                    min="0"
                    step="0.01"
                    value={compressor.capex_of_current_compressor}
                    onChange={(event) =>
                      updateCompressor({ capex_of_current_compressor: event.target.value })
                    }
                    suffix="INR"
                    suffixClassName={mixedCaseSuffixClassName}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className="gap-4 overflow-hidden py-4 sm:gap-6 sm:py-6">
            <CardHeader className="grid-rows-[auto] gap-0 px-4 sm:px-6">
              <CardTitle>Target Equipment</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <FieldGroup className="gap-5 sm:gap-6">
                <Field>
                  <FieldLabel className="text-sm leading-snug">Target Compressor Type</FieldLabel>
                  <Select
                    value={compressor.target_compressor_type}
                    onValueChange={(value) =>
                      updateCompressor({ target_compressor_type: value })
                    }
                  >
                    <SelectTrigger className="h-10 w-full text-sm sm:h-9">
                      <SelectValue placeholder="Select target type" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPRESSOR_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">
                    Rated Capacity - Target Compressor
                  </FieldLabel>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_104px]">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={compressor.target_compressor_rating}
                      onChange={(event) =>
                        updateCompressor({ target_compressor_rating: event.target.value })
                      }
                      placeholder="Enter capacity"
                      className="h-10 text-sm sm:h-9"
                    />
                    <Select
                      value={compressor.target_compressor_rating_unit}
                      onValueChange={(value: 'kW' | 'HP') =>
                        updateCompressor({ target_compressor_rating_unit: value })
                      }
                    >
                      <SelectTrigger className="h-10 w-full text-sm sm:h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kW">kW</SelectItem>
                        <SelectItem value="HP">HP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">
                    Lifetime of Target Compressor
                  </FieldLabel>
                  <InputWithSuffix
                    type="number"
                    min="0"
                    value={compressor.lifetime_of_target_compressor}
                    onChange={(event) =>
                      updateCompressor({ lifetime_of_target_compressor: event.target.value })
                    }
                    suffix="yr"
                    suffixClassName={mixedCaseSuffixClassName}
                  />
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">
                    Capex of Target Compressor Type
                  </FieldLabel>
                  <InputWithSuffix
                    type="number"
                    min="0"
                    step="0.01"
                    value={compressor.capex_of_target_compressor}
                    onChange={(event) =>
                      updateCompressor({ capex_of_target_compressor: event.target.value })
                    }
                    suffix="INR"
                    suffixClassName={mixedCaseSuffixClassName}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        <Card className="gap-4 overflow-hidden py-4 sm:gap-6 sm:py-6">
          <CardHeader className="grid-rows-[auto] gap-0 px-4 sm:px-6">
            <CardTitle>Operating Inputs</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <FieldGroup className="gap-5 sm:gap-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Field>
                  <FieldLabel className="text-sm leading-snug">Load Factor</FieldLabel>
                  <InputWithSuffix
                    type="number"
                    min="0"
                    max="100"
                    value={compressor.compressor_load_factor}
                    onChange={(event) =>
                      updateCompressor({ compressor_load_factor: event.target.value })
                    }
                    suffix="%"
                  />
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">Operating Hours/Year</FieldLabel>
                  <InputWithSuffix
                    type="number"
                    min="0"
                    value={compressor.compressor_operating_hours_year}
                    onChange={(event) =>
                      updateCompressor({ compressor_operating_hours_year: event.target.value })
                    }
                    suffix="hr/year"
                    suffixClassName={mixedCaseSuffixClassName}
                  />
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">Electricity Tariff</FieldLabel>
                  <InputWithSuffix
                    type="number"
                    min="0"
                    step="0.01"
                    value={compressor.compressor_electricity_tariff}
                    onChange={(event) =>
                      updateCompressor({ compressor_electricity_tariff: event.target.value })
                    }
                    suffix="INR/kWh"
                    suffixClassName={mixedCaseSuffixClassName}
                  />
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">Grid Emission Factor</FieldLabel>
                  <InputWithSuffix
                    type="number"
                    min="0"
                    step="0.01"
                    value={compressor.compressor_grid_emission_factor}
                    onChange={(event) =>
                      updateCompressor({ compressor_grid_emission_factor: event.target.value })
                    }
                    suffix="kgCO2/kWh"
                    suffixClassName={mixedCaseSuffixClassName}
                  />
                </Field>

                <Field className="sm:col-span-2 xl:col-span-2">
                  <FieldLabel className="text-sm leading-snug">Energy Consumption</FieldLabel>
                  <InputWithSuffix
                    type="number"
                    min="0"
                    step="0.01"
                    value={compressor.compressor_energy_consumption}
                    onChange={(event) =>
                      updateCompressor({ compressor_energy_consumption: event.target.value })
                    }
                    suffix="kWh/year"
                    suffixClassName={mixedCaseSuffixClassName}
                  />
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Change Equipment
          </Button>
          <Button type="submit" disabled={!isFormValid} className="w-full gap-2 sm:w-auto">
            Generate Recommendations
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
