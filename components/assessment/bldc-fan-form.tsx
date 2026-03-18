"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAssessmentStorage } from '@/hooks/use-assessment-storage'
import { useBLDCFanCatalog } from '@/hooks/use-bldc-fan-catalog'
import {
  BLDC_FAN_ROOM_SIZE_OPTIONS,
  getBLDCFanRoomSizeConfig,
} from '@/lib/assessment/bldc-fan-recommendation'
import { getBLDCFanCatalogKey, getBLDCFanPowerWatts } from '@/lib/bldc-fan-catalog'
import { formatIndianNumber } from '@/lib/formatting'
import { cn } from '@/lib/utils'
import { fadeUpVariants } from '@/components/motion/variants'
import { AssessmentEquipmentImage } from './equipment-image'

interface BLDCFanFormProps {
  onBack: () => void
}

const mixedCaseSuffixClassName =
  'right-2 text-[9px] normal-case tracking-normal sm:right-3 sm:text-[10px]'
const fullWidthSelectTriggerClassName = 'h-10 w-full sm:h-9'

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

function FieldHint({
  children,
  className,
}: React.ComponentProps<'p'>) {
  return (
    <p className={cn('min-h-5 text-xs text-muted-foreground', className)}>
      {children ?? <span className="invisible">placeholder</span>}
    </p>
  )
}

export function BLDCFanForm({ onBack }: BLDCFanFormProps) {
  const router = useRouter()
  const { data, updateBLDCFan } = useAssessmentStorage()
  const prefersReducedMotion = useReducedMotion()
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const fan = data.bldc_fan
  const {
    catalog,
    errorMessage: catalogError,
    isLoading: isCatalogLoading,
    reload: reloadCatalog,
  } = useBLDCFanCatalog()

  const selectedCatalogFan = useMemo(() => {
    if (!catalog || !fan.bldc_fan_catalog_key) {
      return fan.selected_catalog_fan
    }

    return (
      catalog.fans.find(
        (catalogFan) => getBLDCFanCatalogKey(catalogFan) === fan.bldc_fan_catalog_key
      ) ?? fan.selected_catalog_fan
    )
  }, [catalog, fan.bldc_fan_catalog_key, fan.selected_catalog_fan])

  const selectedConventionalCatalogFan = useMemo(() => {
    if (!catalog || !fan.conventional_fan_catalog_key) {
      return fan.selected_conventional_catalog_fan
    }

    return (
      catalog.conventionalFans.find(
        (catalogFan) => getBLDCFanCatalogKey(catalogFan) === fan.conventional_fan_catalog_key
      ) ?? fan.selected_conventional_catalog_fan
    )
  }, [catalog, fan.conventional_fan_catalog_key, fan.selected_conventional_catalog_fan])

  useEffect(() => {
    if (!selectedConventionalCatalogFan) {
      return
    }

    const selectedKey = getBLDCFanCatalogKey(selectedConventionalCatalogFan)
    const storedKey = fan.selected_conventional_catalog_fan
      ? getBLDCFanCatalogKey(fan.selected_conventional_catalog_fan)
      : ''
    const nextPower = String(getBLDCFanPowerWatts(selectedConventionalCatalogFan) ?? '')

    if (
      fan.conventional_fan_catalog_key === selectedKey &&
      storedKey === selectedKey &&
      fan.conventional_fan_make === selectedConventionalCatalogFan.make &&
      fan.conventional_fan_make_model === selectedConventionalCatalogFan.model &&
      fan.conventional_fan_power_rating_w === nextPower
    ) {
      return
    }

    updateBLDCFan({
      conventional_fan_catalog_key: selectedKey,
      conventional_fan_make: selectedConventionalCatalogFan.make,
      conventional_fan_make_model: selectedConventionalCatalogFan.model,
      conventional_fan_power_rating_w: nextPower,
      selected_conventional_catalog_fan: selectedConventionalCatalogFan,
    })
  }, [
    fan.conventional_fan_catalog_key,
    fan.conventional_fan_make,
    fan.conventional_fan_make_model,
    fan.conventional_fan_power_rating_w,
    fan.selected_conventional_catalog_fan,
    selectedConventionalCatalogFan,
    updateBLDCFan,
  ])

  useEffect(() => {
    if (!selectedCatalogFan) {
      return
    }

    const selectedKey = getBLDCFanCatalogKey(selectedCatalogFan)
    const storedKey = fan.selected_catalog_fan ? getBLDCFanCatalogKey(fan.selected_catalog_fan) : ''
    const nextPower = String(getBLDCFanPowerWatts(selectedCatalogFan) ?? '')
    const nextSweep = selectedCatalogFan.sweep_mm ? String(selectedCatalogFan.sweep_mm) : ''

    if (
      fan.bldc_fan_catalog_key === selectedKey &&
      storedKey === selectedKey &&
      fan.bldc_fan_make === selectedCatalogFan.make &&
      fan.bldc_fan_model === selectedCatalogFan.model &&
      fan.bldc_fan_power_rating_w === nextPower &&
      fan.bldc_fan_sweep_mm === nextSweep
    ) {
      return
    }

    updateBLDCFan({
      bldc_fan_catalog_key: selectedKey,
      bldc_fan_make: selectedCatalogFan.make,
      bldc_fan_model: selectedCatalogFan.model,
      bldc_fan_power_rating_w: nextPower,
      bldc_fan_sweep_mm: nextSweep,
      selected_catalog_fan: selectedCatalogFan,
    })
  }, [
    fan.bldc_fan_catalog_key,
    fan.bldc_fan_make,
    fan.bldc_fan_model,
    fan.bldc_fan_power_rating_w,
    fan.bldc_fan_sweep_mm,
    fan.selected_catalog_fan,
    selectedCatalogFan,
    updateBLDCFan,
  ])

  const makeOptions = useMemo(
    () => (catalog?.makeCounts ?? []).map(({ make }) => make),
    [catalog]
  )

  const conventionalMakeOptions = useMemo(
    () => (catalog?.conventionalMakeCounts ?? []).map(({ make }) => make),
    [catalog]
  )

  const modelsForSelectedMake = useMemo(
    () =>
      (catalog?.fans ?? []).filter((catalogFan) => catalogFan.make === fan.bldc_fan_make),
    [catalog, fan.bldc_fan_make]
  )

  const conventionalModelsForSelectedMake = useMemo(
    () =>
      (catalog?.conventionalFans ?? []).filter(
        (catalogFan) => catalogFan.make === fan.conventional_fan_make
      ),
    [catalog, fan.conventional_fan_make]
  )

  const selectedRoomSize = useMemo(
    () => getBLDCFanRoomSizeConfig(fan.room_size),
    [fan.room_size]
  )

  const requiredFields = useMemo(
    () => [
      { label: 'Conventional fan model', value: fan.conventional_fan_catalog_key },
      { label: 'Conventional fan power rating', value: fan.conventional_fan_power_rating_w },
      { label: 'Daily runtime', value: fan.daily_runtime_hours },
      { label: 'Working days in a year', value: fan.working_days_per_year },
      { label: 'BLDC fan model', value: fan.bldc_fan_catalog_key },
      { label: 'Number of fans to switch', value: fan.number_of_fans_to_switch },
      { label: 'BLDC fan capex per fan', value: fan.capex_bldc_fan_inr_per_fan },
      { label: 'BLDC installation cost per fan', value: fan.bldc_installation_cost_inr_per_fan },
      {
        label: 'Conventional fan installation cost per fan',
        value: fan.conventional_installation_cost_inr_per_fan,
      },
      { label: 'Current years of operation', value: fan.current_years_of_operation },
      { label: 'Discount factor', value: fan.discount_factor_percent },
      { label: 'BLDC fan lifetime', value: fan.bldc_lifetime_years },
    ],
    [fan]
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
    router.push('/assessment/results?type=bldc_fan')
  }

  const handleCatalogSelection = (value: string) => {
    const selectedFan =
      catalog?.fans.find((catalogFan) => getBLDCFanCatalogKey(catalogFan) === value) ?? null

    updateBLDCFan({
      bldc_fan_catalog_key: value,
      bldc_fan_make: selectedFan?.make ?? '',
      bldc_fan_model: selectedFan?.model ?? '',
      bldc_fan_power_rating_w: String(getBLDCFanPowerWatts(selectedFan) ?? ''),
      bldc_fan_sweep_mm: selectedFan?.sweep_mm ? String(selectedFan.sweep_mm) : '',
      selected_catalog_fan: selectedFan,
    })
  }

  const handleConventionalCatalogSelection = (value: string) => {
    const selectedFan =
      catalog?.conventionalFans.find((catalogFan) => getBLDCFanCatalogKey(catalogFan) === value) ??
      null

    updateBLDCFan({
      conventional_fan_catalog_key: value,
      conventional_fan_make: selectedFan?.make ?? '',
      conventional_fan_make_model: selectedFan?.model ?? '',
      conventional_fan_power_rating_w: String(getBLDCFanPowerWatts(selectedFan) ?? ''),
      selected_conventional_catalog_fan: selectedFan,
    })
  }

  const handleConventionalMakeChange = (value: string) => {
    if (value === fan.conventional_fan_make) {
      return
    }

    updateBLDCFan({
      conventional_fan_make: value,
      conventional_fan_make_model: '',
      conventional_fan_catalog_key: '',
      conventional_fan_power_rating_w: '',
      selected_conventional_catalog_fan: null,
    })
  }

  const handleMakeChange = (value: string) => {
    if (value === fan.bldc_fan_make) {
      return
    }

    updateBLDCFan({
      bldc_fan_make: value,
      bldc_fan_model: '',
      bldc_fan_catalog_key: '',
      bldc_fan_power_rating_w: '',
      bldc_fan_sweep_mm: '',
      selected_catalog_fan: null,
    })
  }

  return (
    <motion.div
      className="w-full"
      initial={prefersReducedMotion ? false : 'hidden'}
      animate="visible"
      variants={fadeUpVariants}
    >
      <div className="mb-8 flex items-start gap-3 sm:items-center sm:gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <AssessmentEquipmentImage equipmentId="bldc_fan" className="h-10 w-10 sm:h-12 sm:w-12" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight sm:text-2xl">BLDC Fan Assessment</h1>
            <p className="text-muted-foreground">Capture baseline, catalog selection, and savings assumptions</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Current Fan Details</CardTitle>
              <CardDescription>
                Conventional induction motor fan inputs for your baseline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field className="justify-start gap-2">
                    <FieldLabel className="text-sm leading-snug">
                      Conventional fan make
                    </FieldLabel>
                    <Select
                      value={fan.conventional_fan_make}
                      onValueChange={handleConventionalMakeChange}
                      disabled={isCatalogLoading || !catalog}
                    >
                      <SelectTrigger className={fullWidthSelectTriggerClassName}>
                        <SelectValue
                          placeholder={
                            isCatalogLoading
                              ? 'Loading conventional makes...'
                              : 'Select conventional make'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {conventionalMakeOptions.map((make) => (
                          <SelectItem key={make} value={make}>
                            {make}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldHint />
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className="text-sm leading-snug">
                      Conventional fan model
                    </FieldLabel>
                    <Select
                      value={fan.conventional_fan_catalog_key}
                      onValueChange={handleConventionalCatalogSelection}
                      disabled={isCatalogLoading || !catalog || !fan.conventional_fan_make}
                    >
                      <SelectTrigger className={fullWidthSelectTriggerClassName}>
                        <SelectValue
                          placeholder={
                            !fan.conventional_fan_make
                              ? 'Select make first'
                              : isCatalogLoading
                                ? 'Loading conventional models...'
                                : 'Select conventional model'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {conventionalModelsForSelectedMake.map((catalogFan) => {
                          const inputPower = getBLDCFanPowerWatts(catalogFan)

                          return (
                            <SelectItem
                              key={getBLDCFanCatalogKey(catalogFan)}
                              value={getBLDCFanCatalogKey(catalogFan)}
                            >
                              {catalogFan.model}
                              {inputPower ? ` | ${inputPower} W` : ''}
                              {catalogFan.sweep_mm ? ` | ${catalogFan.sweep_mm} mm` : ''}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FieldHint className="mt-1">
                      {selectedConventionalCatalogFan ? (
                        <>
                          Auto-filled from catalog: {selectedConventionalCatalogFan.make}{' '}
                          {selectedConventionalCatalogFan.model}
                          {selectedConventionalCatalogFan.air_delivery_cmm
                            ? ` | ${selectedConventionalCatalogFan.air_delivery_cmm} CMM`
                            : ''}
                          {selectedConventionalCatalogFan.rated_speed_rpm
                            ? ` | ${selectedConventionalCatalogFan.rated_speed_rpm} RPM`
                            : ''}
                        </>
                      ) : null}
                    </FieldHint>
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className="text-sm leading-snug">
                      Conventional fan power rating
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.1"
                      value={fan.conventional_fan_power_rating_w}
                      suffix="W"
                      readOnly
                      disabled
                    />
                    <FieldHint />
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className="text-sm leading-snug">Room size</FieldLabel>
                    <Select
                      value={fan.room_size}
                      onValueChange={(value: 'small' | 'medium' | 'large') =>
                        updateBLDCFan({ room_size: value })
                      }
                    >
                      <SelectTrigger className={fullWidthSelectTriggerClassName}>
                        <SelectValue placeholder="Select room size" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLDC_FAN_ROOM_SIZE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label} ({option.areaLabel})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldHint className="mt-1">
                      Default assumption is a 16 x 16 ft room, mapped to <strong>Large</strong>.
                    </FieldHint>
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>Usage Inputs</CardTitle>
              <CardDescription>
                Runtime, tariff, emissions factor, and quantity assumptions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field className="justify-start gap-2">
                    <FieldLabel className="text-sm leading-snug">Daily runtime</FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.1"
                      value={fan.daily_runtime_hours}
                      onChange={(event) =>
                        updateBLDCFan({ daily_runtime_hours: event.target.value })
                      }
                      suffix="hours/day"
                      suffixClassName={mixedCaseSuffixClassName}
                    />
                    <FieldHint />
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className="text-sm leading-snug">Working days in a year</FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="1"
                      value={fan.working_days_per_year}
                      onChange={(event) =>
                        updateBLDCFan({ working_days_per_year: event.target.value })
                      }
                      suffix="days"
                      suffixClassName={mixedCaseSuffixClassName}
                    />
                    <FieldHint />
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className="text-sm leading-snug">Electricity tariff</FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.01"
                      value={fan.electricity_tariff}
                      onChange={(event) =>
                        updateBLDCFan({ electricity_tariff: event.target.value })
                      }
                      suffix="INR/kWh"
                      suffixClassName={mixedCaseSuffixClassName}
                    />
                    <FieldHint />
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className="text-sm leading-snug">Grid EF</FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.001"
                      value={fan.grid_emission_factor}
                      onChange={(event) =>
                        updateBLDCFan({ grid_emission_factor: event.target.value })
                      }
                      suffix="kgCO2e/kWh"
                      suffixClassName={mixedCaseSuffixClassName}
                      inputClassName="pr-28 sm:pr-32"
                    />
                    <FieldHint />
                  </Field>

                  <Field className="justify-start gap-2 md:col-span-2">
                    <FieldLabel className="text-sm leading-snug">
                      Number of conventional fans to switch
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="1"
                      step="1"
                      value={fan.number_of_fans_to_switch}
                      onChange={(event) =>
                        updateBLDCFan({ number_of_fans_to_switch: event.target.value })
                      }
                      suffix="fans"
                      suffixClassName={mixedCaseSuffixClassName}
                    />
                    <FieldHint className="mt-1">
                      Suggested for {selectedRoomSize.label.toLowerCase()} rooms: about{' '}
                      {selectedRoomSize.approxFans} BLDC fan(s).
                    </FieldHint>
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>BLDC Fan Selection</CardTitle>
              <CardDescription>
                Pick BLDC fan make and model from `equipment_catalog.json` to auto-fill BLDC wattage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field className="justify-start gap-2">
                    <FieldLabel className="text-sm leading-snug">BLDC fan make</FieldLabel>
                    <Select
                      value={fan.bldc_fan_make}
                      onValueChange={handleMakeChange}
                      disabled={isCatalogLoading || !catalog}
                    >
                      <SelectTrigger className={fullWidthSelectTriggerClassName}>
                        <SelectValue
                          placeholder={isCatalogLoading ? 'Loading BLDC makes...' : 'Select BLDC make'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {makeOptions.map((make) => (
                          <SelectItem key={make} value={make}>
                            {make}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldHint />
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className="text-sm leading-snug">BLDC fan model</FieldLabel>
                    <Select
                      value={fan.bldc_fan_catalog_key}
                      onValueChange={handleCatalogSelection}
                      disabled={isCatalogLoading || !catalog || !fan.bldc_fan_make}
                    >
                      <SelectTrigger className={fullWidthSelectTriggerClassName}>
                        <SelectValue
                          placeholder={
                            !fan.bldc_fan_make
                              ? 'Select make first'
                              : isCatalogLoading
                                ? 'Loading BLDC models...'
                                : 'Select BLDC model'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {modelsForSelectedMake.map((catalogFan) => {
                          const inputPower = getBLDCFanPowerWatts(catalogFan)

                          return (
                            <SelectItem
                              key={getBLDCFanCatalogKey(catalogFan)}
                              value={getBLDCFanCatalogKey(catalogFan)}
                            >
                              {catalogFan.model}
                              {inputPower ? ` | ${inputPower} W` : ''}
                              {catalogFan.sweep_mm ? ` | ${catalogFan.sweep_mm} mm` : ''}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FieldHint className="mt-1">
                      {selectedCatalogFan ? (
                        <>
                        Auto-filled from catalog: {selectedCatalogFan.make} {selectedCatalogFan.model}
                        {selectedCatalogFan.air_delivery_cmm
                          ? ` | ${selectedCatalogFan.air_delivery_cmm} CMM`
                          : ''}
                        {selectedCatalogFan.rated_speed_rpm
                          ? ` | ${selectedCatalogFan.rated_speed_rpm} RPM`
                          : ''}
                        </>
                      ) : null}
                    </FieldHint>
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className="text-sm leading-snug">BLDC fan power rating</FieldLabel>
                    <InputWithSuffix
                      type="number"
                      value={fan.bldc_fan_power_rating_w}
                      suffix="W"
                      readOnly
                      disabled
                    />
                    <FieldHint />
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className="text-sm leading-snug">Sweep size</FieldLabel>
                    <InputWithSuffix
                      type="number"
                      value={fan.bldc_fan_sweep_mm}
                      suffix="mm"
                      readOnly
                      disabled
                    />
                    <FieldHint />
                  </Field>

                  <Field className="justify-start gap-2 md:col-span-2">
                    <FieldLabel className="text-sm leading-snug">
                      Capex for BLDC fan
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="1"
                      value={fan.capex_bldc_fan_inr_per_fan}
                      onChange={(event) =>
                        updateBLDCFan({ capex_bldc_fan_inr_per_fan: event.target.value })
                      }
                      suffix="INR/fan"
                      suffixClassName={mixedCaseSuffixClassName}
                    />
                    <FieldHint className="mt-1">
                      Table guidance for {selectedRoomSize.label.toLowerCase()} rooms: INR{' '}
                      {formatIndianNumber(selectedRoomSize.capexMinInr)}-
                      {formatIndianNumber(selectedRoomSize.capexMaxInr)} total for about{' '}
                      {selectedRoomSize.approxFans} fan(s).
                    </FieldHint>
                  </Field>
                </div>

                {catalogError ? (
                  <div className="neo-panel rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <p className="font-semibold">BLDC catalog unavailable</p>
                    <p className="mt-1">{catalogError}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={reloadCatalog}
                      className="mt-3"
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Retry Catalog Load
                    </Button>
                  </div>
                ) : null}
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>Financial Assumptions</CardTitle>
              <CardDescription>
                Inputs for payback, present value, NPV, and marginal abatement cost.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field className="justify-start gap-2">
                    <FieldLabel className="text-sm leading-snug">
                      BLDC installation cost
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="1"
                      value={fan.bldc_installation_cost_inr_per_fan}
                      onChange={(event) =>
                        updateBLDCFan({
                          bldc_installation_cost_inr_per_fan: event.target.value,
                        })
                      }
                      suffix="INR/fan"
                      suffixClassName={mixedCaseSuffixClassName}
                    />
                    <FieldHint />
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className="text-sm leading-snug">
                      Conventional fan installation cost
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="1"
                      value={fan.conventional_installation_cost_inr_per_fan}
                      onChange={(event) =>
                        updateBLDCFan({
                          conventional_installation_cost_inr_per_fan: event.target.value,
                        })
                      }
                      suffix="INR/fan"
                      suffixClassName={mixedCaseSuffixClassName}
                    />
                    <FieldHint />
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className="text-sm leading-snug">
                      Current years of operation
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.1"
                      value={fan.current_years_of_operation}
                      onChange={(event) =>
                        updateBLDCFan({ current_years_of_operation: event.target.value })
                      }
                      suffix="years"
                      suffixClassName={mixedCaseSuffixClassName}
                    />
                    <FieldHint />
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className="text-sm leading-snug">Discount factor</FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.1"
                      value={fan.discount_factor_percent}
                      onChange={(event) =>
                        updateBLDCFan({ discount_factor_percent: event.target.value })
                      }
                      suffix="%"
                      suffixClassName={mixedCaseSuffixClassName}
                    />
                    <FieldHint />
                  </Field>

                  <Field className="justify-start gap-2 md:col-span-2">
                    <FieldLabel className="text-sm leading-snug">
                      Typical BLDC fan lifetime
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="1"
                      value={fan.bldc_lifetime_years}
                      onChange={(event) =>
                        updateBLDCFan({ bldc_lifetime_years: event.target.value })
                      }
                      suffix="years"
                      suffixClassName={mixedCaseSuffixClassName}
                    />
                    <FieldHint />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

        </div>

        {showValidationErrors && missingFieldLabels.length > 0 ? (
          <div className="neo-panel rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-900">
            <p className="font-semibold">Please fill these fields before generating recommendations:</p>
            <p className="mt-1">{missingFieldLabels.join(', ')}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Change Equipment
          </Button>
          <Button
            type="submit"
            className="w-full gap-2 bg-[#065F46] text-white hover:bg-[#054f3a] sm:w-auto"
            disabled={isCatalogLoading}
          >
            Generate Recommendations
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
