"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCcw } from 'lucide-react'

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
import { useDGSetCatalog } from '@/hooks/use-dg-set-catalog'
import { useAssessmentStorage } from '@/hooks/use-assessment-storage'
import {
  getDGSetCatalogKey,
  getDGSpecificFuelConsumption,
  type DGSetCatalogItem,
} from '@/lib/dg-set-catalog'
import {
  DG_DEFAULTS,
  DG_REPLACEMENT_FUEL_OPTIONS,
} from '@/lib/assessment/dg-set-recommendation'
import { getDGCapexBenchmark, getDefaultDGCapex } from '@/lib/assessment/dg-set-benchmarks'
import { cn } from '@/lib/utils'

interface DGSetFormProps {
  onBack: () => void
}

const mixedCaseSuffixClassName =
  'right-2 text-[9px] normal-case tracking-normal sm:right-3 sm:text-[10px]'

function parsePositiveNumber(value: string) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function formatAutoCalculatedValue(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return ''
  }

  return value.toFixed(3).replace(/\.?0+$/, '')
}

function formatRatedCapacity(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return 'Capacity N/A'
  }

  return `${formatAutoCalculatedValue(value)} kVA`
}

function getDGModelDescription(dgSet: DGSetCatalogItem) {
  const details = [
    formatRatedCapacity(dgSet.rated_capacity_kva),
    dgSet.fuel_consumption_text,
    dgSet.cpcb_current_standards,
  ].filter(Boolean)

  return details.join(' | ')
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

export function DGSetForm({ onBack }: DGSetFormProps) {
  const router = useRouter()
  const { data, updateDGSet } = useAssessmentStorage()
  const {
    catalog,
    errorMessage: catalogError,
    isLoading: isCatalogLoading,
    reload,
  } = useDGSetCatalog()
  const prefersReducedMotion = useReducedMotion()
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const lastAutoSfcRef = useRef('')
  const lastAutoCapexRef = useRef('')
  const dg = data.dg_set

  const selectedCatalogDGSet = useMemo(() => {
    if (!catalog) {
      return null
    }

    if (dg.dg_catalog_key) {
      return catalog.dgSets.find((item) => getDGSetCatalogKey(item) === dg.dg_catalog_key) ?? null
    }

    if (!dg.dg_manufacturer || !dg.dg_model) {
      return null
    }

    return (
      catalog.dgSets.find(
        (item) => item.make === dg.dg_manufacturer && item.model === dg.dg_model
      ) ?? null
    )
  }, [catalog, dg.dg_catalog_key, dg.dg_manufacturer, dg.dg_model])

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
    () => (catalog?.dgSets ?? []).filter((item) => item.make === dg.dg_manufacturer),
    [catalog, dg.dg_manufacturer]
  )

  const modelOptions = useMemo(
    () =>
      modelsForSelectedMake.map((item) => ({
        value: getDGSetCatalogKey(item),
        label: item.model,
        description: getDGModelDescription(item),
        keywords: [
          item.model,
          item.engine_model ?? '',
          formatRatedCapacity(item.rated_capacity_kva),
          item.fuel_consumption_text ?? '',
          item.cpcb_current_standards ?? '',
        ],
      })),
    [modelsForSelectedMake]
  )

  const effectivePowerFactor = parsePositiveNumber(dg.power_factor) || DG_DEFAULTS.powerFactor
  const ratedCapacityKva = parsePositiveNumber(dg.dg_capacity_kva)
  const defaultCapex = useMemo(
    () => getDefaultDGCapex(ratedCapacityKva),
    [ratedCapacityKva]
  )
  const capexBenchmark = useMemo(
    () => getDGCapexBenchmark(ratedCapacityKva),
    [ratedCapacityKva]
  )

  useEffect(() => {
    if (!selectedCatalogDGSet) {
      return
    }

    const nextCatalogKey = getDGSetCatalogKey(selectedCatalogDGSet)
    const nextRatedCapacity = formatAutoCalculatedValue(selectedCatalogDGSet.rated_capacity_kva ?? 0)

    if (
      dg.dg_catalog_key === nextCatalogKey &&
      dg.dg_manufacturer === selectedCatalogDGSet.make &&
      dg.dg_model === selectedCatalogDGSet.model &&
      dg.dg_capacity_kva === nextRatedCapacity
    ) {
      return
    }

    updateDGSet({
      dg_catalog_key: nextCatalogKey,
      dg_manufacturer: selectedCatalogDGSet.make,
      dg_model: selectedCatalogDGSet.model,
      dg_capacity_kva: nextRatedCapacity,
    })
  }, [
    dg.dg_capacity_kva,
    dg.dg_catalog_key,
    dg.dg_manufacturer,
    dg.dg_model,
    selectedCatalogDGSet,
    updateDGSet,
  ])

  useEffect(() => {
    if (!selectedCatalogDGSet) {
      return
    }

    const nextAutoSfc = formatAutoCalculatedValue(
      getDGSpecificFuelConsumption(selectedCatalogDGSet, effectivePowerFactor) ?? 0
    )
    const shouldAutoFill =
      nextAutoSfc &&
      (!dg.specific_fuel_consumption_l_per_kwh ||
        dg.specific_fuel_consumption_l_per_kwh === lastAutoSfcRef.current)

    if (shouldAutoFill && dg.specific_fuel_consumption_l_per_kwh !== nextAutoSfc) {
      updateDGSet({
        specific_fuel_consumption_l_per_kwh: nextAutoSfc,
      })
    }

    lastAutoSfcRef.current = nextAutoSfc
  }, [
    dg.specific_fuel_consumption_l_per_kwh,
    effectivePowerFactor,
    selectedCatalogDGSet,
    updateDGSet,
  ])

  useEffect(() => {
    const nextDefaultCapex = defaultCapex > 0 ? String(defaultCapex) : ''
    const shouldAutoFill =
      nextDefaultCapex &&
      (!dg.dual_fuel_kit_capex_inr || dg.dual_fuel_kit_capex_inr === lastAutoCapexRef.current)

    if (shouldAutoFill && dg.dual_fuel_kit_capex_inr !== nextDefaultCapex) {
      updateDGSet({
        dual_fuel_kit_capex_inr: nextDefaultCapex,
      })
    }

    lastAutoCapexRef.current = nextDefaultCapex
  }, [defaultCapex, dg.dual_fuel_kit_capex_inr, updateDGSet])

  const requiredFields = useMemo(
    () => [
      { label: 'DG manufacturer', value: dg.dg_manufacturer },
      { label: 'DG model', value: dg.dg_model },
      { label: 'Rated capacity', value: dg.dg_capacity_kva },
      {
        label:
          dg.has_annual_diesel_consumption_data === 'yes'
            ? 'Annual diesel consumption'
            : 'Average load on DG',
        value:
          dg.has_annual_diesel_consumption_data === 'yes'
            ? dg.annual_diesel_consumption_l
            : dg.current_loading_percent,
      },
      { label: 'Power factor', value: dg.power_factor },
      { label: 'Operating hours per year', value: dg.operating_hours_year },
      { label: 'Specific fuel consumption', value: dg.specific_fuel_consumption_l_per_kwh },
      { label: 'Replacement fuel', value: dg.fuel_type },
      { label: 'Diesel replacement percentage', value: dg.diesel_replacement_percent },
      { label: 'Diesel rate', value: dg.fuel_cost_per_liter },
      { label: 'Dual fuel kit capex', value: dg.dual_fuel_kit_capex_inr },
      {
        label: 'Annual maintenance cost',
        value: dg.dual_fuel_kit_maintenance_inr_per_year,
      },
      { label: 'Dual fuel kit lifetime', value: dg.dual_fuel_kit_lifetime_years },
    ],
    [dg]
  )

  const missingFieldLabels = useMemo(
    () =>
      requiredFields
        .filter((field) => !String(field.value ?? '').trim())
        .map((field) => field.label),
    [requiredFields]
  )

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (missingFieldLabels.length > 0) {
      setShowValidationErrors(true)
      return
    }

    setShowValidationErrors(false)
    router.push('/assessment/results?type=dg_set')
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
          <AssessmentEquipmentImage equipmentId="dg_set" className="h-10 w-10 sm:h-12 sm:w-12" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight sm:text-2xl">DG Set Assessment</h1>
            <p className="text-muted-foreground">
              Compare DG upgrade options using dual-fuel cost, emissions, payback, and MAC.
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Current DG Set Details</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <FieldGroup className="gap-5 sm:gap-6">
                <Field>
                  <FieldLabel className="text-sm leading-snug">DG Manufacturer</FieldLabel>
                  <SearchableSelect
                    value={dg.dg_manufacturer}
                    onValueChange={(value) =>
                      updateDGSet({
                        dg_catalog_key: '',
                        dg_manufacturer: value,
                        dg_model: '',
                        dg_capacity_kva: '',
                        specific_fuel_consumption_l_per_kwh: '',
                      })
                    }
                    options={makeOptions}
                    placeholder={isCatalogLoading ? 'Loading DG makes...' : 'Choose manufacturer'}
                    searchPlaceholder="Search DG makes..."
                    emptyText="No DG manufacturers found."
                    disabled={isCatalogLoading || makeOptions.length === 0}
                  />
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">DG Model</FieldLabel>
                  <SearchableSelect
                    value={dg.dg_catalog_key}
                    onValueChange={(value) => {
                      const nextSelection =
                        modelsForSelectedMake.find((item) => getDGSetCatalogKey(item) === value) ??
                        null

                      updateDGSet({
                        dg_catalog_key: value,
                        dg_manufacturer: nextSelection?.make ?? dg.dg_manufacturer,
                        dg_model: nextSelection?.model ?? '',
                      })
                    }}
                    options={modelOptions}
                    placeholder={
                      !dg.dg_manufacturer
                        ? 'Select manufacturer first'
                        : isCatalogLoading
                          ? 'Loading DG models...'
                          : 'Choose DG model'
                    }
                    searchPlaceholder="Search DG models..."
                    emptyText="No DG models found."
                    disabled={isCatalogLoading || !dg.dg_manufacturer || modelOptions.length === 0}
                  />
                  <FieldDescription>
                    Selecting a catalog DG auto-fills rated capacity and a default SFC from the
                    full-load fuel consumption data.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">Rated Capacity of DG Set</FieldLabel>
                  <InputWithSuffix
                    type="number"
                    min="0"
                    step="0.01"
                    value={dg.dg_capacity_kva}
                    onChange={(event) => updateDGSet({ dg_capacity_kva: event.target.value })}
                    suffix="kVA"
                    suffixClassName={mixedCaseSuffixClassName}
                  />
                </Field>

                <Field>
                  <FieldLabel className="text-sm leading-snug">
                    Do you have annual diesel consumption data?
                  </FieldLabel>
                  <Select
                    value={dg.has_annual_diesel_consumption_data}
                    onValueChange={(value: 'yes' | 'no') =>
                      updateDGSet({ has_annual_diesel_consumption_data: value })
                    }
                  >
                    <SelectTrigger className="h-10 w-full text-sm sm:h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                {dg.has_annual_diesel_consumption_data === 'yes' ? (
                  <Field>
                    <FieldLabel className="text-sm leading-snug">
                      Annual Diesel Consumption
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.01"
                      value={dg.annual_diesel_consumption_l}
                      onChange={(event) =>
                        updateDGSet({ annual_diesel_consumption_l: event.target.value })
                      }
                      suffix="L/year"
                      suffixClassName={mixedCaseSuffixClassName}
                    />
                  </Field>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field>
                      <FieldLabel className="text-sm leading-snug">Average Load on DG</FieldLabel>
                      <InputWithSuffix
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={dg.current_loading_percent}
                        onChange={(event) =>
                          updateDGSet({ current_loading_percent: event.target.value })
                        }
                        suffix="%"
                      />
                    </Field>

                    <Field>
                      <FieldLabel className="text-sm leading-snug">Power Factor</FieldLabel>
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={dg.power_factor}
                        onChange={(event) => updateDGSet({ power_factor: event.target.value })}
                        placeholder={String(DG_DEFAULTS.powerFactor)}
                      />
                    </Field>
                  </div>
                )}
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operating Inputs</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <FieldGroup className="gap-5 sm:gap-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field>
                    <FieldLabel className="text-sm leading-snug">Operating Hours per Year</FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="1"
                      value={dg.operating_hours_year}
                      onChange={(event) =>
                        updateDGSet({ operating_hours_year: event.target.value })
                      }
                      suffix="hours"
                      suffixClassName={mixedCaseSuffixClassName}
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="text-sm leading-snug">
                      Annual Electricity Generated
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.01"
                      value={dg.annual_electricity_generated_kwh}
                      onChange={(event) =>
                        updateDGSet({ annual_electricity_generated_kwh: event.target.value })
                      }
                      placeholder="Leave blank to auto-calculate"
                      suffix="kWh"
                      suffixClassName={mixedCaseSuffixClassName}
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field>
                    <FieldLabel className="text-sm leading-snug">
                      Specific Fuel Consumption (SFC)
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.001"
                      value={dg.specific_fuel_consumption_l_per_kwh}
                      onChange={(event) =>
                        updateDGSet({
                          specific_fuel_consumption_l_per_kwh: event.target.value,
                        })
                      }
                      suffix="L/kWh"
                      suffixClassName={mixedCaseSuffixClassName}
                    />
                    {selectedCatalogDGSet?.fuel_consumption_text ? (
                      <FieldDescription>
                        Default derived from catalog full-load fuel use:{' '}
                        {selectedCatalogDGSet.fuel_consumption_text} at 100% load.
                      </FieldDescription>
                    ) : null}
                  </Field>

                  <Field>
                    <FieldLabel className="text-sm leading-snug">Diesel Rate</FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.01"
                      value={dg.fuel_cost_per_liter}
                      onChange={(event) =>
                        updateDGSet({ fuel_cost_per_liter: event.target.value })
                      }
                      suffix="INR/L"
                      suffixClassName={mixedCaseSuffixClassName}
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Retrofit Inputs</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <FieldGroup className="gap-5 sm:gap-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field>
                    <FieldLabel className="text-sm leading-snug">
                      Replacement Fuel Type
                    </FieldLabel>
                    <Select
                      value={dg.fuel_type}
                      onValueChange={(value) => updateDGSet({ fuel_type: value })}
                    >
                      <SelectTrigger className="h-10 w-full text-sm sm:h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DG_REPLACEMENT_FUEL_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel className="text-sm leading-snug">
                      Diesel Replaced After Retrofit
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={dg.diesel_replacement_percent}
                      onChange={(event) =>
                        updateDGSet({ diesel_replacement_percent: event.target.value })
                      }
                      suffix="%"
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field>
                    <FieldLabel className="text-sm leading-snug">
                      Dual Fuel Kit Capex
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.01"
                      value={dg.dual_fuel_kit_capex_inr}
                      onChange={(event) =>
                        updateDGSet({ dual_fuel_kit_capex_inr: event.target.value })
                      }
                      suffix="INR"
                      suffixClassName={mixedCaseSuffixClassName}
                    />
                    {capexBenchmark ? (
                      <FieldDescription>
                        Auto-filled capacity benchmark for {capexBenchmark.label}: INR{' '}
                        {capexBenchmark.minCapexInr.toLocaleString('en-IN')} to INR{' '}
                        {capexBenchmark.maxCapexInr.toLocaleString('en-IN')}. You can override it.
                      </FieldDescription>
                    ) : null}
                  </Field>

                  <Field>
                    <FieldLabel className="text-sm leading-snug">
                      Annual Maintenance Cost
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.01"
                      value={dg.dual_fuel_kit_maintenance_inr_per_year}
                      onChange={(event) =>
                        updateDGSet({
                          dual_fuel_kit_maintenance_inr_per_year: event.target.value,
                        })
                      }
                      suffix="INR"
                      suffixClassName={mixedCaseSuffixClassName}
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field>
                    <FieldLabel className="text-sm leading-snug">
                      Lifetime of Dual Fuel Kit
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.1"
                      value={dg.dual_fuel_kit_lifetime_years}
                      onChange={(event) =>
                        updateDGSet({ dual_fuel_kit_lifetime_years: event.target.value })
                      }
                      suffix="years"
                      suffixClassName={mixedCaseSuffixClassName}
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="text-sm leading-snug">Discount Factor</FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.1"
                      value={dg.discount_factor_percent}
                      onChange={(event) =>
                        updateDGSet({ discount_factor_percent: event.target.value })
                      }
                      suffix="%"
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        {showValidationErrors && missingFieldLabels.length > 0 ? (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-900">
            <p className="font-semibold">
              Please fill these fields before generating recommendations:
            </p>
            <p className="mt-1">{missingFieldLabels.join(', ')}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Change Equipment
          </Button>
          <Button type="submit" className="sm:min-w-[220px]">
            Generate Recommendations
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
