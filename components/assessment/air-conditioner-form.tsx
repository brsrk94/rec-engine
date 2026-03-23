"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, RefreshCcw } from 'lucide-react'

import { AssessmentEquipmentImage } from '@/components/assessment/equipment-image'
import { fadeUpVariants } from '@/components/motion/variants'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAirConditionerCatalog } from '@/hooks/use-air-conditioner-catalog'
import { useAssessmentStorage } from '@/hooks/use-assessment-storage'
import {
  convertCapacityToTon,
  getAirConditionerCatalogKey,
  type AirConditionerCatalogItem,
} from '@/lib/air-conditioner-catalog'
import {
  AIR_CONDITIONER_CAPACITY_UNIT_OPTIONS,
  AIR_CONDITIONER_STAR_OPTIONS,
  AIR_CONDITIONER_TYPE_OPTIONS,
  getAirConditionerStarLabel,
  getAirConditionerTypeLabel,
  getDefaultAirConditionerCapex,
} from '@/lib/assessment/air-conditioner-benchmarks'
import { cn } from '@/lib/utils'

function parsePositiveNumber(value: string) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function formatAutoCalculatedValue(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return ''
  }

  return value.toFixed(2).replace(/\.?0+$/, '')
}

function getCatalogCapacitySummary(airConditioner: AirConditionerCatalogItem) {
  if (typeof airConditioner.capacity_ton === 'number' && airConditioner.capacity_ton > 0) {
    return `${formatAutoCalculatedValue(airConditioner.capacity_ton)} TR`
  }

  if (
    typeof airConditioner.cooling_capacity_kw === 'number' &&
    airConditioner.cooling_capacity_kw > 0
  ) {
    return `${formatAutoCalculatedValue(airConditioner.cooling_capacity_kw)} kW`
  }

  return 'Capacity N/A'
}

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
      <Input {...props} className={cn('h-10 pr-20 text-sm sm:h-9', inputClassName)} />
      <span
        className={cn(
          'pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground',
          suffixClassName
        )}
      >
        {suffix}
      </span>
    </div>
  )
}

interface AirConditionerFormProps {
  onBack: () => void
}

export function AirConditionerForm({ onBack }: AirConditionerFormProps) {
  const router = useRouter()
  const { data, updateAirConditioner } = useAssessmentStorage()
  const {
    catalog,
    errorMessage: catalogError,
    isLoading: isCatalogLoading,
    reload,
  } = useAirConditionerCatalog()
  const prefersReducedMotion = useReducedMotion()
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const lastAutoCurrentCapexRef = useRef('')
  const lastAutoTargetCapexRef = useRef('')
  const ac = data.air_conditioner

  const selectedCatalogAirConditioner = useMemo(() => {
    if (!catalog) {
      return null
    }

    if (ac.current_ac_catalog_key) {
      return (
        catalog.airConditioners.find(
          (airConditioner) =>
            getAirConditionerCatalogKey(airConditioner) === ac.current_ac_catalog_key
        ) ?? null
      )
    }

    if (!ac.current_ac_make || !ac.current_ac_model) {
      return null
    }

    return (
      catalog.airConditioners.find(
        (airConditioner) =>
          airConditioner.make === ac.current_ac_make &&
          airConditioner.model === ac.current_ac_model
      ) ?? null
    )
  }, [ac.current_ac_catalog_key, ac.current_ac_make, ac.current_ac_model, catalog])

  const currentMakeOptions = useMemo(
    () =>
      (catalog?.makeCounts ?? []).map(({ make }) => ({
        value: make,
        label: make,
        keywords: [make],
      })),
    [catalog]
  )

  const currentModelsForSelectedMake = useMemo(
    () =>
      (catalog?.airConditioners ?? []).filter(
        (airConditioner) => airConditioner.make === ac.current_ac_make
      ),
    [ac.current_ac_make, catalog]
  )

  const currentModelOptions = useMemo(
    () =>
      currentModelsForSelectedMake.map((airConditioner) => ({
        value: getAirConditionerCatalogKey(airConditioner),
        label: airConditioner.model,
        description: `${getAirConditionerTypeLabel(airConditioner.normalized_ac_type)} | ${getCatalogCapacitySummary(
          airConditioner
        )} | ${getAirConditionerStarLabel(airConditioner.star_rating)}`,
        keywords: [
          airConditioner.model,
          airConditioner.series ?? '',
          airConditioner.designation ?? '',
          getAirConditionerTypeLabel(airConditioner.normalized_ac_type),
          getAirConditionerStarLabel(airConditioner.star_rating),
          getCatalogCapacitySummary(airConditioner),
        ],
      })),
    [currentModelsForSelectedMake]
  )

  const currentCapacityTon = useMemo(
    () =>
      convertCapacityToTon(
        parsePositiveNumber(ac.current_cooling_capacity),
        ac.current_cooling_capacity_unit
      ),
    [ac.current_cooling_capacity, ac.current_cooling_capacity_unit]
  )

  const targetCapacityTon = useMemo(
    () =>
      convertCapacityToTon(
        parsePositiveNumber(ac.target_ac_capacity),
        ac.target_ac_capacity_unit
      ),
    [ac.target_ac_capacity, ac.target_ac_capacity_unit]
  )

  const defaultCurrentCapex = useMemo(
    () =>
      ac.current_ac_type && ac.current_ac_star_rating
        ? getDefaultAirConditionerCapex(
            ac.current_ac_type,
            ac.current_ac_star_rating,
            currentCapacityTon
          )
        : 0,
    [ac.current_ac_star_rating, ac.current_ac_type, currentCapacityTon]
  )

  const defaultTargetCapex = useMemo(
    () =>
      ac.target_ac_type && ac.target_ac_star_rating
        ? getDefaultAirConditionerCapex(
            ac.target_ac_type,
            ac.target_ac_star_rating,
            targetCapacityTon || currentCapacityTon
          )
        : 0,
    [ac.target_ac_star_rating, ac.target_ac_type, currentCapacityTon, targetCapacityTon]
  )

  const effectiveCurrentCapex = ac.capex_of_current_ac || (defaultCurrentCapex > 0 ? String(defaultCurrentCapex) : '')
  const effectiveTargetCapex = ac.capex_of_target_ac || (defaultTargetCapex > 0 ? String(defaultTargetCapex) : '')

  useEffect(() => {
    if (!selectedCatalogAirConditioner) {
      return
    }

    const nextCatalogKey = getAirConditionerCatalogKey(selectedCatalogAirConditioner)
    const nextCapacityUnit =
      typeof selectedCatalogAirConditioner.capacity_ton === 'number' &&
      selectedCatalogAirConditioner.capacity_ton > 0
        ? 'TR'
        : 'kW'
    const nextCapacityValue =
      nextCapacityUnit === 'TR'
        ? formatAutoCalculatedValue(selectedCatalogAirConditioner.capacity_ton ?? 0)
        : formatAutoCalculatedValue(selectedCatalogAirConditioner.cooling_capacity_kw ?? 0)
    const nextStarRating =
      typeof selectedCatalogAirConditioner.star_rating === 'number' &&
      selectedCatalogAirConditioner.star_rating > 0
        ? String(Math.round(selectedCatalogAirConditioner.star_rating))
        : ac.current_ac_star_rating

    if (
      ac.current_ac_catalog_key === nextCatalogKey &&
      ac.current_ac_make === selectedCatalogAirConditioner.make &&
      ac.current_ac_model === selectedCatalogAirConditioner.model &&
      ac.current_cooling_capacity === nextCapacityValue &&
      ac.current_cooling_capacity_unit === nextCapacityUnit &&
      ac.current_ac_type === selectedCatalogAirConditioner.normalized_ac_type &&
      ac.current_ac_star_rating === nextStarRating
    ) {
      return
    }

    updateAirConditioner({
      current_ac_catalog_key: nextCatalogKey,
      current_ac_make: selectedCatalogAirConditioner.make,
      current_ac_model: selectedCatalogAirConditioner.model,
      current_cooling_capacity: nextCapacityValue,
      current_cooling_capacity_unit: nextCapacityUnit,
      current_ac_type: selectedCatalogAirConditioner.normalized_ac_type,
      current_ac_star_rating: nextStarRating,
    })
  }, [
    ac.current_ac_catalog_key,
    ac.current_ac_make,
    ac.current_ac_model,
    ac.current_ac_star_rating,
    ac.current_ac_type,
    ac.current_cooling_capacity,
    ac.current_cooling_capacity_unit,
    selectedCatalogAirConditioner,
    updateAirConditioner,
  ])

  useEffect(() => {
    if (!ac.target_ac_capacity && ac.current_cooling_capacity) {
      updateAirConditioner({
        target_ac_capacity: ac.current_cooling_capacity,
        target_ac_capacity_unit: ac.current_cooling_capacity_unit,
      })
    }
  }, [
    ac.current_cooling_capacity,
    ac.current_cooling_capacity_unit,
    ac.target_ac_capacity,
    updateAirConditioner,
  ])

  useEffect(() => {
    const nextDefaultCapex =
      defaultCurrentCapex > 0 ? String(defaultCurrentCapex) : ''
    const shouldAutoFill =
      nextDefaultCapex &&
      (!ac.capex_of_current_ac || ac.capex_of_current_ac === lastAutoCurrentCapexRef.current)

    if (shouldAutoFill && ac.capex_of_current_ac !== nextDefaultCapex) {
      updateAirConditioner({
        capex_of_current_ac: nextDefaultCapex,
      })
    }
    lastAutoCurrentCapexRef.current = nextDefaultCapex
  }, [ac.capex_of_current_ac, defaultCurrentCapex, updateAirConditioner])

  useEffect(() => {
    const nextDefaultCapex =
      defaultTargetCapex > 0 ? String(defaultTargetCapex) : ''
    const shouldAutoFill =
      nextDefaultCapex &&
      (!ac.capex_of_target_ac || ac.capex_of_target_ac === lastAutoTargetCapexRef.current)

    if (shouldAutoFill && ac.capex_of_target_ac !== nextDefaultCapex) {
      updateAirConditioner({
        capex_of_target_ac: nextDefaultCapex,
      })
    }
    lastAutoTargetCapexRef.current = nextDefaultCapex
  }, [ac.capex_of_target_ac, defaultTargetCapex, updateAirConditioner])

  const requiredFields = useMemo(
    () => [
      { label: 'Current AC make', value: ac.current_ac_make },
      { label: 'Current AC model', value: ac.current_ac_model },
      { label: 'Current cooling capacity', value: ac.current_cooling_capacity },
      { label: 'Current AC type', value: ac.current_ac_type },
      { label: 'Current AC age', value: ac.current_ac_age_years },
      { label: 'Current AC star rating', value: ac.current_ac_star_rating },
      { label: 'Operating hours/year', value: ac.operating_hours_year },
      { label: 'Target AC type', value: ac.target_ac_type },
      { label: 'Target AC capacity', value: ac.target_ac_capacity },
      { label: 'Target AC star rating', value: ac.target_ac_star_rating },
      { label: 'Electricity tariff', value: ac.electricity_tariff },
      { label: 'Capex of current AC', value: effectiveCurrentCapex },
      { label: 'Capex of target AC', value: effectiveTargetCapex },
    ],
    [ac, effectiveCurrentCapex, effectiveTargetCapex]
  )

  const missingFieldLabels = useMemo(
    () =>
      requiredFields
        .filter((field) => !String(field.value ?? '').trim())
        .map((field) => field.label),
    [requiredFields]
  )

  const isFormValid = missingFieldLabels.length === 0

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!isFormValid) {
      setShowValidationErrors(true)
      return
    }

    setShowValidationErrors(false)
    router.push('/assessment/results?type=air_conditioner')
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? false : 'hidden'}
      animate="visible"
      variants={fadeUpVariants}
    >
      <div className="mb-8 flex items-start gap-3 sm:items-center sm:gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <AssessmentEquipmentImage
            equipmentId="air_conditioner"
            className="h-10 w-10 sm:h-12 sm:w-12"
          />
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight sm:text-2xl">
              Air Conditioner Assessment
            </h1>
            <p className="text-muted-foreground">
              Build a marginal abatement cost based AC upgrade recommendation.
            </p>
          </div>
        </div>
      </div>

      {catalogError ? (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
          <p>{catalogError}</p>
          <Button type="button" variant="outline" onClick={reload} className="w-full sm:w-auto">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Equipment</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <FieldGroup className="gap-5 sm:gap-6">
                <Field>
                  <FieldLabel className="text-sm leading-snug">Product Make</FieldLabel>
                  <SearchableSelect
                    value={ac.current_ac_make}
                    onValueChange={(value) =>
                      updateAirConditioner({
                        current_ac_catalog_key: '',
                        current_ac_make: value,
                        current_ac_model: '',
                        current_cooling_capacity: '',
                        current_cooling_capacity_unit: 'TR',
                        current_ac_type: '',
                        current_ac_star_rating: '',
                        capex_of_current_ac: '',
                      })
                    }
                    options={currentMakeOptions}
                    placeholder={
                      isCatalogLoading ? 'Loading AC makes...' : 'Choose product make'
                    }
                    searchPlaceholder="Search AC makes..."
                    emptyText="No AC makes found."
                    disabled={isCatalogLoading || currentMakeOptions.length === 0}
                  />
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">Product Model</FieldLabel>
                  <SearchableSelect
                    value={ac.current_ac_catalog_key}
                    onValueChange={(value) => {
                      const nextSelection =
                        currentModelsForSelectedMake.find(
                          (airConditioner) =>
                            getAirConditionerCatalogKey(airConditioner) === value
                        ) ?? null

                      updateAirConditioner({
                        current_ac_catalog_key: value,
                        current_ac_make: nextSelection?.make ?? ac.current_ac_make,
                        current_ac_model: nextSelection?.model ?? '',
                      })
                    }}
                    options={currentModelOptions}
                    placeholder={
                      !ac.current_ac_make
                        ? 'Select make first'
                        : isCatalogLoading
                          ? 'Loading AC models...'
                          : 'Choose product model'
                    }
                    searchPlaceholder="Search AC models..."
                    emptyText="No AC models found."
                    disabled={
                      isCatalogLoading ||
                      !ac.current_ac_make ||
                      currentModelOptions.length === 0
                    }
                  />
                  <FieldDescription>
                    Choosing a catalog model auto-fills cooling capacity, AC type, and star rating.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">Cooling Capacity</FieldLabel>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_104px]">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={ac.current_cooling_capacity}
                      onChange={(event) =>
                        updateAirConditioner({ current_cooling_capacity: event.target.value })
                      }
                      placeholder="Enter capacity"
                    />
                    <Select
                      value={ac.current_cooling_capacity_unit}
                      onValueChange={(value: 'TR' | 'kW') =>
                        updateAirConditioner({ current_cooling_capacity_unit: value })
                      }
                    >
                      <SelectTrigger className="h-10 w-full text-sm sm:h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AIR_CONDITIONER_CAPACITY_UNIT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">Current AC Type</FieldLabel>
                  <Select
                    value={ac.current_ac_type}
                    onValueChange={(value) => updateAirConditioner({ current_ac_type: value })}
                  >
                    <SelectTrigger className="h-10 w-full text-sm sm:h-9">
                      <SelectValue placeholder="Select AC type" />
                    </SelectTrigger>
                    <SelectContent>
                      {AIR_CONDITIONER_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field>
                    <FieldLabel className="text-sm leading-snug">Age of Current AC</FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.1"
                      value={ac.current_ac_age_years}
                      onChange={(event) =>
                        updateAirConditioner({ current_ac_age_years: event.target.value })
                      }
                      suffix="years"
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="text-sm leading-snug">Current Star Rating</FieldLabel>
                    <Select
                      value={ac.current_ac_star_rating}
                      onValueChange={(value) =>
                        updateAirConditioner({ current_ac_star_rating: value })
                      }
                    >
                      <SelectTrigger className="h-10 w-full text-sm sm:h-9">
                        <SelectValue placeholder="Select star rating" />
                      </SelectTrigger>
                      <SelectContent>
                        {AIR_CONDITIONER_STAR_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field>
                  <FieldLabel className="text-sm leading-snug">
                    Capex of Current Air Conditioner
                  </FieldLabel>
                  <InputWithSuffix
                    type="number"
                    min="0"
                    step="0.01"
                    value={ac.capex_of_current_ac}
                    onChange={(event) =>
                      updateAirConditioner({ capex_of_current_ac: event.target.value })
                    }
                    suffix="INR"
                  />
                  {defaultCurrentCapex > 0 ? (
                    <FieldDescription>
                      Auto-filled minimum benchmark capex: INR{' '}
                      {defaultCurrentCapex.toLocaleString('en-IN')}. You can override it.
                    </FieldDescription>
                  ) : null}
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Target Equipment</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <FieldGroup className="gap-5 sm:gap-6">
                <Field>
                  <FieldLabel className="text-sm leading-snug">Target AC Type</FieldLabel>
                  <Select
                    value={ac.target_ac_type}
                    onValueChange={(value) => updateAirConditioner({ target_ac_type: value })}
                  >
                    <SelectTrigger className="h-10 w-full text-sm sm:h-9">
                      <SelectValue placeholder="Select target type" />
                    </SelectTrigger>
                    <SelectContent>
                      {AIR_CONDITIONER_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">Rated Capacity - Target AC</FieldLabel>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_104px]">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={ac.target_ac_capacity}
                      onChange={(event) =>
                        updateAirConditioner({ target_ac_capacity: event.target.value })
                      }
                      placeholder="Enter target capacity"
                    />
                    <Select
                      value={ac.target_ac_capacity_unit}
                      onValueChange={(value: 'TR' | 'kW') =>
                        updateAirConditioner({ target_ac_capacity_unit: value })
                      }
                    >
                      <SelectTrigger className="h-10 w-full text-sm sm:h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AIR_CONDITIONER_CAPACITY_UNIT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field>
                    <FieldLabel className="text-sm leading-snug">Target Star Rating</FieldLabel>
                    <Select
                      value={ac.target_ac_star_rating}
                      onValueChange={(value) =>
                        updateAirConditioner({ target_ac_star_rating: value })
                      }
                    >
                      <SelectTrigger className="h-10 w-full text-sm sm:h-9">
                        <SelectValue placeholder="Select target star rating" />
                      </SelectTrigger>
                      <SelectContent>
                        {AIR_CONDITIONER_STAR_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel className="text-sm leading-snug">Lifetime of Target AC</FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.1"
                      value={ac.lifetime_of_target_ac}
                      onChange={(event) =>
                        updateAirConditioner({ lifetime_of_target_ac: event.target.value })
                      }
                      suffix="years"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel className="text-sm leading-snug">
                    Capex of Target Air Conditioner
                  </FieldLabel>
                  <InputWithSuffix
                    type="number"
                    min="0"
                    step="0.01"
                    value={ac.capex_of_target_ac}
                    onChange={(event) =>
                      updateAirConditioner({ capex_of_target_ac: event.target.value })
                    }
                    suffix="INR"
                  />
                  {defaultTargetCapex > 0 ? (
                    <FieldDescription>
                      Auto-filled minimum benchmark capex: INR{' '}
                      {defaultTargetCapex.toLocaleString('en-IN')}. You can override it.
                    </FieldDescription>
                  ) : null}
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Operating Inputs</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <FieldGroup className="gap-5 sm:gap-6">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Field>
                  <FieldLabel className="text-sm leading-snug">Operating Hours/Year</FieldLabel>
                  <InputWithSuffix
                    type="number"
                    min="0"
                    step="1"
                    value={ac.operating_hours_year}
                    onChange={(event) =>
                      updateAirConditioner({ operating_hours_year: event.target.value })
                    }
                    suffix="hours"
                  />
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">Load Factor</FieldLabel>
                  <InputWithSuffix
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={ac.load_factor}
                    onChange={(event) => updateAirConditioner({ load_factor: event.target.value })}
                    suffix="%"
                  />
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">Electricity Tariff</FieldLabel>
                  <InputWithSuffix
                    type="number"
                    min="0"
                    step="0.01"
                    value={ac.electricity_tariff}
                    onChange={(event) =>
                      updateAirConditioner({ electricity_tariff: event.target.value })
                    }
                    suffix="INR/kWh"
                  />
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">Grid Emission Factor</FieldLabel>
                  <InputWithSuffix
                    type="number"
                    min="0"
                    step="0.001"
                    value={ac.grid_emission_factor}
                    onChange={(event) =>
                      updateAirConditioner({ grid_emission_factor: event.target.value })
                    }
                    suffix="kgCO2/kWh"
                  />
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        {showValidationErrors && missingFieldLabels.length > 0 ? (
          <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-900">
            <p className="font-semibold">
              Please fill these fields before generating recommendations:
            </p>
            <p className="mt-1">{missingFieldLabels.join(', ')}</p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Change Equipment
          </Button>
          <Button type="submit" className="sm:min-w-[220px]">
            Generate Recommendations
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
