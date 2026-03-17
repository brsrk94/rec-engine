"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
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
import { useMotorCatalog } from '@/hooks/use-motor-catalog'
import { cn } from '@/lib/utils'
import {
  findRecommendedTargetMotor,
  getAvailableTargetClasses,
  getCatalogMotorCapexPerKw,
  getMotorBenchmarkCapexPerKw,
  getRecommendedTargetClass,
  normalizeMotorRatingToKw,
} from '@/lib/motor-catalog'
import { fadeUpVariants } from '@/components/motion/variants'
import { AssessmentEquipmentImage } from './equipment-image'

interface MotorFormProps {
  onBack: () => void
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

export function MotorForm({ onBack }: MotorFormProps) {
  const router = useRouter()
  const { data, updateMotor } = useAssessmentStorage()
  const prefersReducedMotion = useReducedMotion()
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const motor = data.motor
  const {
    catalog,
    errorMessage: catalogError,
    isLoading: isCatalogLoading,
    reload: reloadCatalog,
  } = useMotorCatalog()

  const selectedCatalogMotor = useMemo(() => {
    if (!catalog || !motor.motor_make || !motor.motor_model) {
      return null
    }

    return (
      catalog.motors.find(
        (catalogMotor) =>
          catalogMotor.make === motor.motor_make && catalogMotor.model === motor.motor_model
      ) ?? null
    )
  }, [catalog, motor.motor_make, motor.motor_model])

  const ratingKw = useMemo(() => {
    const fallbackRating = selectedCatalogMotor ? String(selectedCatalogMotor.rated_power_kw) : ''
    return normalizeMotorRatingToKw(
      motor.motor_rating || fallbackRating,
      motor.motor_rating_unit
    )
  }, [motor.motor_rating, motor.motor_rating_unit, selectedCatalogMotor])

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
      (catalog?.motors ?? []).filter((catalogMotor) => catalogMotor.make === motor.motor_make),
    [catalog, motor.motor_make]
  )

  const modelOptions = useMemo(
    () =>
      modelsForSelectedMake.map((catalogMotor) => ({
        value: catalogMotor.model,
        label: catalogMotor.model,
        description: `${catalogMotor.efficiency_class} | ${catalogMotor.rated_power_kw} kW${catalogMotor.designation ? ` | ${catalogMotor.designation}` : ''}`,
        keywords: [
          catalogMotor.model,
          catalogMotor.efficiency_class,
          String(catalogMotor.rated_power_kw),
          catalogMotor.designation ?? '',
          catalogMotor.display_name ?? '',
          catalogMotor.series ?? '',
        ],
      })),
    [modelsForSelectedMake]
  )

  const availableTargetClasses = useMemo(() => {
    if (!catalog || !selectedCatalogMotor) {
      return []
    }

    const desiredRatingKw = ratingKw || selectedCatalogMotor.rated_power_kw

    return getAvailableTargetClasses(
      catalog.motors,
      selectedCatalogMotor,
      desiredRatingKw,
      motor.motor_make
    )
  }, [catalog, motor.motor_make, ratingKw, selectedCatalogMotor])

  const targetCatalogMotor = useMemo(() => {
    if (!catalog || !motor.target_motor_efficiency_class) {
      return null
    }

    return findRecommendedTargetMotor(
      catalog.motors,
      motor.target_motor_efficiency_class,
      ratingKw || selectedCatalogMotor?.rated_power_kw || 0,
      motor.motor_make,
      motor,
      selectedCatalogMotor
    )
  }, [catalog, motor, ratingKw, selectedCatalogMotor])

  useEffect(() => {
    if (!selectedCatalogMotor) {
      return
    }

    updateMotor({
      motor_rating: String(selectedCatalogMotor.rated_power_kw),
      motor_rating_unit: 'kW',
      current_motor_efficiency_class: selectedCatalogMotor.efficiency_class,
      capex_of_current_motor_class: String(
        getCatalogMotorCapexPerKw(selectedCatalogMotor) ??
          getMotorBenchmarkCapexPerKw(selectedCatalogMotor.efficiency_class) ??
          ''
      ),
      selected_catalog_motor: selectedCatalogMotor,
    })
  }, [selectedCatalogMotor, updateMotor])

  useEffect(() => {
    if (!selectedCatalogMotor) {
      return
    }

    if (availableTargetClasses.length === 0) {
      if (
        motor.target_motor_efficiency_class ||
        motor.capex_of_target_motor_class ||
        motor.target_catalog_motor
      ) {
        updateMotor({
          target_motor_efficiency_class: '',
          capex_of_target_motor_class: '',
          target_catalog_motor: null,
        })
      }
      return
    }

    if (!availableTargetClasses.includes(motor.target_motor_efficiency_class)) {
      updateMotor({
        target_motor_efficiency_class: getRecommendedTargetClass(
          selectedCatalogMotor.efficiency_class,
          availableTargetClasses
        ),
      })
    }
  }, [
    availableTargetClasses,
    motor.capex_of_target_motor_class,
    motor.target_catalog_motor,
    motor.target_motor_efficiency_class,
    selectedCatalogMotor,
    updateMotor,
  ])

  useEffect(() => {
    if (!motor.target_motor_efficiency_class || !targetCatalogMotor) {
      if (motor.target_catalog_motor) {
        updateMotor({ target_catalog_motor: null })
      }
      return
    }

    updateMotor({
      capex_of_target_motor_class: String(
        getCatalogMotorCapexPerKw(targetCatalogMotor) ??
          getMotorBenchmarkCapexPerKw(motor.target_motor_efficiency_class) ??
          ''
      ),
      target_catalog_motor: targetCatalogMotor,
    })
  }, [motor.target_catalog_motor, motor.target_motor_efficiency_class, targetCatalogMotor, updateMotor])

  const handleMakeChange = (value: string) => {
    updateMotor({
      motor_make: value,
      motor_model: '',
      motor_rating: '',
      motor_rating_unit: 'kW',
      current_motor_efficiency_class: '',
      target_motor_efficiency_class: '',
      capex_of_current_motor_class: '',
      capex_of_target_motor_class: '',
      selected_catalog_motor: null,
      target_catalog_motor: null,
    })
  }

  const handleModelChange = (value: string) => {
    updateMotor({
      motor_model: value,
      target_motor_efficiency_class: '',
      capex_of_target_motor_class: '',
      target_catalog_motor: null,
    })
  }

  const requiredFields = useMemo(
    () => [
      { label: 'Equipment Make', value: motor.motor_make },
      { label: 'Equipment Model', value: motor.motor_model },
      { label: 'Equipment Rating', value: motor.motor_rating },
      { label: 'Current Equipment Efficiency Class', value: motor.current_motor_efficiency_class },
      { label: 'Target Equipment Efficiency Class', value: motor.target_motor_efficiency_class },
      {
        label: 'Number of Years of Operation of Current Equipment Class',
        value: motor.years_of_operation_current_motor_class,
      },
      { label: 'Capex of Current Equipment Class', value: motor.capex_of_current_motor_class },
      { label: 'Lifetime of Target Equipment Class', value: motor.lifetime_of_target_motor_class },
      { label: 'Capex of Target Equipment Class', value: motor.capex_of_target_motor_class },
      { label: 'Load Factor', value: motor.load_factor },
      { label: 'Operating Hours/Year', value: motor.operating_hours_year },
      { label: 'Number of Equipment Units', value: motor.number_of_motors },
      { label: 'Electricity Tariff', value: motor.electricity_tariff },
      { label: 'Grid Emission Factor', value: motor.grid_emission_factor },
    ],
    [motor]
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
    router.push('/assessment/results?type=motor')
  }

  const isSameClassFallbackOnly =
    !!selectedCatalogMotor &&
    availableTargetClasses.length === 1 &&
    availableTargetClasses[0] === selectedCatalogMotor.efficiency_class

  return (
      <motion.div
        className="w-full"
        initial={prefersReducedMotion ? false : 'hidden'}
        animate="visible"
        variants={fadeUpVariants}
      >
        <div className="mb-5 flex items-start gap-3 sm:mb-8 sm:items-center sm:gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex min-w-0 items-center gap-2.5 pr-1 sm:gap-3">
            <AssessmentEquipmentImage equipmentId="motor" className="h-10 w-10 sm:h-12 sm:w-12" priority />
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight sm:text-2xl">Motor Assessment</h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            <Card className="gap-4 overflow-hidden py-4 sm:gap-6 sm:py-6">
              <CardHeader className="grid-rows-[auto] gap-0 px-4 sm:px-6">
                <CardTitle>Current Equipment</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <FieldGroup className="gap-5 sm:gap-6">
                  <Field>
                    <FieldLabel className="text-sm leading-snug">Equipment Make</FieldLabel>
                    <SearchableSelect
                      value={motor.motor_make}
                      onValueChange={handleMakeChange}
                      options={makeOptions}
                      placeholder={isCatalogLoading ? 'Loading makes...' : 'Select equipment make'}
                      searchPlaceholder="Search motor makes..."
                      emptyText="No motor make found."
                      disabled={isCatalogLoading || !!catalogError}
                      className="h-10 text-sm sm:h-9"
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="text-sm leading-snug">Equipment Model</FieldLabel>
                    <SearchableSelect
                      value={motor.motor_model}
                      onValueChange={handleModelChange}
                      options={modelOptions}
                      placeholder={
                        motor.motor_make ? 'Select equipment model' : 'Choose make first'
                      }
                      searchPlaceholder="Search motor models..."
                      emptyText="No motor model found."
                      disabled={!motor.motor_make || isCatalogLoading || !!catalogError}
                      className="h-10 text-sm sm:h-9"
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="text-sm leading-snug">Equipment Rating</FieldLabel>
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem]">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={motor.motor_rating}
                        onChange={(event) => updateMotor({ motor_rating: event.target.value })}
                        placeholder="Enter rating"
                        className="h-10 text-sm sm:h-9"
                      />
                      <Select
                        value={motor.motor_rating_unit}
                        onValueChange={(value: 'kW' | 'HP') =>
                          updateMotor({ motor_rating_unit: value })
                        }
                      >
                        <SelectTrigger className="h-10 w-full sm:h-9 sm:w-28">
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
                    <FieldLabel className="text-sm leading-snug">Current Equipment Efficiency Class</FieldLabel>
                    <InputWithSuffix
                      value={motor.current_motor_efficiency_class}
                      readOnly
                      placeholder="Auto-filled from model"
                      suffix="AUTO"
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="text-sm leading-snug">Number of Years of Operation of Current Equipment Class</FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      value={motor.years_of_operation_current_motor_class}
                      onChange={(event) =>
                        updateMotor({
                          years_of_operation_current_motor_class: event.target.value,
                        })
                      }
                      suffix="YR"
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="text-sm leading-snug">Capex of Current Equipment Class</FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.01"
                      value={motor.capex_of_current_motor_class}
                      onChange={(event) =>
                        updateMotor({ capex_of_current_motor_class: event.target.value })
                      }
                      suffix="INR/kW"
                      suffixClassName="right-2 text-[9px] normal-case tracking-normal sm:right-3 sm:text-[10px]"
                    />
                  </Field>

                  {catalogError ? (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-destructive">{catalogError}</p>
                      <Button type="button" variant="outline" size="sm" onClick={reloadCatalog}>
                        Retry Catalog
                      </Button>
                    </div>
                  ) : null}
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
                    <FieldLabel className="text-sm leading-snug">Target Equipment Efficiency Class</FieldLabel>
                    <Select
                      value={motor.target_motor_efficiency_class}
                      onValueChange={(value) =>
                        updateMotor({
                          target_motor_efficiency_class: value,
                          target_catalog_motor: null,
                        })
                      }
                      disabled={!selectedCatalogMotor || availableTargetClasses.length === 0}
                    >
                      <SelectTrigger className="h-10 w-full text-sm sm:h-9">
                        <SelectValue
                          placeholder={
                            selectedCatalogMotor
                              ? 'Select target class'
                              : 'Choose model first'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTargetClasses.map((efficiencyClass) => (
                          <SelectItem key={efficiencyClass} value={efficiencyClass}>
                            {efficiencyClass}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCatalogMotor && availableTargetClasses.length === 0 ? (
                      <p className="text-sm text-destructive">No better class available</p>
                    ) : isSameClassFallbackOnly ? (
                      <p className="text-sm text-muted-foreground">
                        Better {selectedCatalogMotor?.efficiency_class} options only
                      </p>
                    ) : null}
                  </Field>

                  <Field>
                    <FieldLabel className="text-sm leading-snug">Lifetime of Target Equipment Class</FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      value={motor.lifetime_of_target_motor_class}
                      onChange={(event) =>
                        updateMotor({ lifetime_of_target_motor_class: event.target.value })
                      }
                      suffix="YR"
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="text-sm leading-snug">Capex of Target Equipment Class</FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.01"
                      value={motor.capex_of_target_motor_class}
                      onChange={(event) =>
                        updateMotor({ capex_of_target_motor_class: event.target.value })
                      }
                      suffix="INR/kW"
                      suffixClassName="right-2 text-[9px] normal-case tracking-normal sm:right-3 sm:text-[10px]"
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card className="gap-4 overflow-hidden py-4 lg:col-span-2 sm:gap-6 sm:py-6">
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
                        value={motor.load_factor}
                        onChange={(event) => updateMotor({ load_factor: event.target.value })}
                        suffix="%"
                      />
                    </Field>

                    <Field>
                      <FieldLabel className="text-sm leading-snug">Operating Hours/Year</FieldLabel>
                      <InputWithSuffix
                        type="number"
                        min="0"
                        value={motor.operating_hours_year}
                        onChange={(event) => updateMotor({ operating_hours_year: event.target.value })}
                        suffix="hr/year"
                        suffixClassName="right-2 text-[9px] normal-case tracking-normal sm:right-3 sm:text-[10px]"
                      />
                    </Field>

                    <Field>
                      <FieldLabel className="text-sm leading-snug">Number of Equipment Units</FieldLabel>
                      <InputWithSuffix
                        type="number"
                        min="1"
                        value={motor.number_of_motors}
                        onChange={(event) => updateMotor({ number_of_motors: event.target.value })}
                        suffix="NOS"
                      />
                    </Field>

                    <Field>
                      <FieldLabel className="text-sm leading-snug">Electricity Tariff</FieldLabel>
                      <InputWithSuffix
                        type="number"
                        min="0"
                        step="0.01"
                        value={motor.electricity_tariff}
                        onChange={(event) => updateMotor({ electricity_tariff: event.target.value })}
                        suffix="INR/kWh"
                        suffixClassName="right-2 text-[9px] normal-case tracking-normal sm:right-3 sm:text-[10px]"
                      />
                    </Field>

                    <Field>
                      <FieldLabel className="text-sm leading-snug">Grid Emission Factor</FieldLabel>
                      <InputWithSuffix
                        type="number"
                        min="0"
                        step="0.01"
                        value={motor.grid_emission_factor}
                        onChange={(event) => updateMotor({ grid_emission_factor: event.target.value })}
                        suffix="kgCO2e/kWh"
                        suffixClassName="right-2 text-[9px] normal-case tracking-normal sm:right-3 sm:text-[10px]"
                        inputClassName="pr-28 sm:pr-32"
                      />
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>
          </div>

          {showValidationErrors && missingFieldLabels.length > 0 ? (
            <div className="neo-panel mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-900">
              <p className="font-semibold">Please fill these fields before generating recommendations:</p>
              <p className="mt-1">{missingFieldLabels.join(', ')}</p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:mt-8 sm:flex-row sm:justify-between sm:gap-4">
            <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Change Equipment
            </Button>
            <Button
              type="submit"
              className="w-full bg-[#065F46] text-white hover:bg-[#054f3a] sm:min-w-[220px] sm:w-auto"
            >
              Generate Recommendations
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </motion.div>
  )
}
