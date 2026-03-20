"use client"

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLEDCatalog } from '@/hooks/use-led-catalog'
import { useAssessmentStorage } from '@/hooks/use-assessment-storage'
import {
  getLEDCapexEstimateForLumens,
  getLEDCatalogKey,
  getLEDPowerWatts,
} from '@/lib/led-catalog'
import { cn } from '@/lib/utils'
import { fadeUpVariants } from '@/components/motion/variants'
import { AssessmentEquipmentImage } from './equipment-image'

interface LEDRetrofitFormProps {
  onBack: () => void
}

const suffixClassName =
  'right-3 text-[10px] normal-case tracking-normal sm:text-[11px]'
const fullWidthSelectTriggerClassName =
  'h-11 w-full rounded-2xl border-border/70 bg-white text-left shadow-none'
const sectionHeaderClassName = 'gap-1 pb-0'
const sectionTitleClassName = 'text-lg font-semibold tracking-tight text-foreground'
const fieldLabelClassName = 'min-h-10 text-sm leading-snug'

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
          'h-11 rounded-2xl border-border/70 bg-white pr-20 text-sm shadow-none',
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

const sectionCardClassName =
  'form-card-static h-full rounded-3xl border border-border/70 bg-white/95 gap-4 py-5'

function FieldHint({
  children,
  className,
}: React.ComponentProps<'p'>) {
  return (
    <p className={cn('min-h-5 text-xs leading-5 text-muted-foreground', className)}>
      {children ?? <span className="invisible">placeholder</span>}
    </p>
  )
}

export function LEDRetrofitForm({ onBack }: LEDRetrofitFormProps) {
  const router = useRouter()
  const { data, updateLEDRetrofit } = useAssessmentStorage()
  const prefersReducedMotion = useReducedMotion()
  const led = data.led_retrofit
  const {
    catalog,
    errorMessage: catalogError,
    isLoading: isCatalogLoading,
    reload: reloadCatalog,
  } = useLEDCatalog()

  const selectedCatalogLED = useMemo(() => {
    if (!catalog || !led.led_catalog_key) {
      return led.selected_catalog_led
    }

    return (
      catalog.bulbs.find((catalogLED) => getLEDCatalogKey(catalogLED) === led.led_catalog_key) ??
      led.selected_catalog_led
    )
  }, [catalog, led.led_catalog_key, led.selected_catalog_led])

  const ledMakes = useMemo(
    () => (catalog?.makeCounts ?? []).map(({ make }) => make),
    [catalog]
  )

  const modelsForSelectedMake = useMemo(
    () => (catalog?.bulbs ?? []).filter((catalogLED) => catalogLED.make === led.led_make),
    [catalog, led.led_make]
  )
  const selectedLedCapexEstimate = useMemo(
    () => getLEDCapexEstimateForLumens(selectedCatalogLED?.lumens),
    [selectedCatalogLED]
  )

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    router.push('/assessment/results?type=led_retrofit')
  }

  const isFormValid = () => {
    return Boolean(
      led.conventional_bulb_model &&
      led.conventional_bulb_power_rating_w &&
      led.daily_runtime_hours &&
      led.working_days_per_year &&
      led.electricity_tariff &&
      led.led_make &&
      led.led_model &&
      led.led_power_rating_w &&
      led.number_of_bulbs_to_switch &&
      led.led_capex_inr_per_led &&
      led.led_installation_cost_inr_per_led &&
      led.conventional_bulb_installation_cost_inr_per_bulb &&
      led.current_years_of_operation &&
      led.discount_factor_percent &&
      led.led_lifetime_years
    )
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? false : 'hidden'}
      animate="visible"
      variants={fadeUpVariants}
    >
      <div className="mb-8 flex items-start gap-3 sm:items-center sm:gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="h-11 w-11 rounded-2xl border-border/70 bg-white shadow-none"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <AssessmentEquipmentImage equipmentId="led_retrofit" className="h-11 w-11 sm:h-12 sm:w-12" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight sm:text-2xl">LED Retrofit Assessment</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-5 xl:grid-cols-2">
          <Card className={sectionCardClassName}>
            <CardHeader className={sectionHeaderClassName}>
              <CardTitle className={sectionTitleClassName}>
                Current Bulb Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <FieldGroup className="gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field className="justify-start gap-2">
                    <FieldLabel className={fieldLabelClassName}>
                      Conventional incandescent bulb model
                    </FieldLabel>
                    <Input
                      value={led.conventional_bulb_model}
                      onChange={(event) =>
                        updateLEDRetrofit({ conventional_bulb_model: event.target.value })
                      }
                      placeholder="Enter make and model"
                    />
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className={fieldLabelClassName}>
                      Power rating of conventional incandescent bulb
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.1"
                      value={led.conventional_bulb_power_rating_w}
                      onChange={(event) =>
                        updateLEDRetrofit({
                          conventional_bulb_power_rating_w: event.target.value,
                          wattage_per_fixture: event.target.value,
                        })
                      }
                      suffix="W"
                    />
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className={fieldLabelClassName}>
                      Current years of operation
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.1"
                      value={led.current_years_of_operation}
                      onChange={(event) =>
                        updateLEDRetrofit({ current_years_of_operation: event.target.value })
                      }
                      suffix="years"
                      suffixClassName={suffixClassName}
                    />
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className={fieldLabelClassName}>
                      Conventional bulb installation cost
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="1"
                      value={led.conventional_bulb_installation_cost_inr_per_bulb}
                      onChange={(event) =>
                        updateLEDRetrofit({
                          conventional_bulb_installation_cost_inr_per_bulb: event.target.value,
                        })
                      }
                      suffix="INR/bulb"
                      suffixClassName={suffixClassName}
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className={sectionCardClassName}>
            <CardHeader className={sectionHeaderClassName}>
              <CardTitle className={sectionTitleClassName}>
                Usage Inputs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <FieldGroup className="gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field className="justify-start gap-2">
                    <FieldLabel className={fieldLabelClassName}>Daily runtime</FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.1"
                      value={led.daily_runtime_hours}
                      onChange={(event) =>
                        updateLEDRetrofit({ daily_runtime_hours: event.target.value })
                      }
                      suffix="hours/day"
                      suffixClassName={suffixClassName}
                    />
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className={fieldLabelClassName}>
                      Number of working days in year
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="1"
                      value={led.working_days_per_year}
                      onChange={(event) =>
                        updateLEDRetrofit({
                          working_days_per_year: event.target.value,
                          operating_hours_year:
                            led.daily_runtime_hours && event.target.value
                              ? String(
                                  Number(led.daily_runtime_hours || 0) *
                                    Number(event.target.value || 0)
                                )
                              : led.operating_hours_year,
                        })
                      }
                      suffix="days"
                      suffixClassName={suffixClassName}
                    />
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className={fieldLabelClassName}>
                      Electricity tariff
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.01"
                      value={led.electricity_tariff}
                      onChange={(event) =>
                        updateLEDRetrofit({ electricity_tariff: event.target.value })
                      }
                      suffix="INR/kWh"
                      suffixClassName={suffixClassName}
                    />
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className={fieldLabelClassName}>
                      Number of bulbs to switch
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="1"
                      step="1"
                      value={led.number_of_bulbs_to_switch}
                      onChange={(event) =>
                        updateLEDRetrofit({
                          number_of_bulbs_to_switch: event.target.value,
                          number_of_fixtures: event.target.value,
                        })
                      }
                      suffix="bulbs"
                      suffixClassName={suffixClassName}
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className={sectionCardClassName}>
            <CardHeader className={sectionHeaderClassName}>
              <CardTitle className={sectionTitleClassName}>
                LED Replacement Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <FieldGroup className="gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field className="justify-start gap-2">
                    <FieldLabel className={fieldLabelClassName}>LED model</FieldLabel>
                    <Select
                      value={led.led_make}
                      onValueChange={(value) =>
                        updateLEDRetrofit({
                          led_make: value,
                          led_model: '',
                          led_catalog_key: '',
                          led_power_rating_w: '',
                          selected_catalog_led: null,
                        })
                      }
                      disabled={isCatalogLoading || !catalog}
                    >
                      <SelectTrigger className={fullWidthSelectTriggerClassName}>
                        <SelectValue
                          placeholder={isCatalogLoading ? 'Loading LED makes...' : 'Choose make'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {ledMakes.map((make) => (
                          <SelectItem key={make} value={make}>
                            {make}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldHint>
                      {selectedCatalogLED ? `Selected make: ${selectedCatalogLED.make}` : null}
                    </FieldHint>
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className={fieldLabelClassName}>
                      LED model
                    </FieldLabel>
                    <Select
                      value={led.led_catalog_key}
                      onValueChange={(value) => {
                        const selectedLED =
                          catalog?.bulbs.find((catalogLED) => getLEDCatalogKey(catalogLED) === value) ??
                          null
                        const capexEstimate = getLEDCapexEstimateForLumens(selectedLED?.lumens)

                        updateLEDRetrofit({
                          led_catalog_key: value,
                          led_model: selectedLED?.model ?? '',
                          led_power_rating_w: selectedLED
                            ? String(getLEDPowerWatts(selectedLED) ?? '')
                            : '',
                          led_capex_inr_per_led: capexEstimate
                            ? String(capexEstimate.approxCapexInr)
                            : led.led_capex_inr_per_led,
                          selected_catalog_led: selectedLED,
                        })
                      }}
                      disabled={isCatalogLoading || !catalog || !led.led_make}
                    >
                      <SelectTrigger className={fullWidthSelectTriggerClassName}>
                        <SelectValue
                          placeholder={
                            led.led_make ? 'Choose model' : 'Select make first'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {modelsForSelectedMake.map((catalogLED) => {
                          const inputPower = getLEDPowerWatts(catalogLED)

                          return (
                            <SelectItem
                              key={getLEDCatalogKey(catalogLED)}
                              value={getLEDCatalogKey(catalogLED)}
                            >
                              {catalogLED.model}
                              {inputPower ? ` | ${inputPower} W` : ''}
                              {catalogLED.lumens ? ` | ${catalogLED.lumens} lm` : ''}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FieldHint>
                      {selectedCatalogLED
                        ? `Auto-filled from catalog: ${selectedCatalogLED.make} ${selectedCatalogLED.model}`
                        : null}
                    </FieldHint>
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className={fieldLabelClassName}>
                      Power rating of LED
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.1"
                      value={led.led_power_rating_w}
                      onChange={(event) =>
                        updateLEDRetrofit({ led_power_rating_w: event.target.value })
                      }
                      suffix="W"
                    />
                    <FieldHint>
                      {selectedCatalogLED?.power_text
                        ? `Catalog wattage: ${selectedCatalogLED.power_text}`
                        : null}
                    </FieldHint>
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className={fieldLabelClassName}>
                      Capital cost for LED
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="1"
                      value={led.led_capex_inr_per_led}
                      onChange={(event) =>
                        updateLEDRetrofit({ led_capex_inr_per_led: event.target.value })
                      }
                      suffix="INR/LED"
                      suffixClassName={suffixClassName}
                    />
                    <FieldHint>
                      {selectedLedCapexEstimate
                        ? `Auto-filled from ${selectedLedCapexEstimate.label} band: INR ${selectedLedCapexEstimate.capexMinInr}-${selectedLedCapexEstimate.capexMaxInr} per fixture (using INR ${selectedLedCapexEstimate.approxCapexInr}).`
                        : null}
                    </FieldHint>
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className={fieldLabelClassName}>
                      LED installation cost
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="1"
                      value={led.led_installation_cost_inr_per_led}
                      onChange={(event) =>
                        updateLEDRetrofit({
                          led_installation_cost_inr_per_led: event.target.value,
                        })
                      }
                      suffix="INR/LED"
                      suffixClassName={suffixClassName}
                    />
                    <FieldHint />
                  </Field>
                </div>

                {catalogError ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
                    <p className="font-medium">LED catalog unavailable</p>
                    <p className="mt-1">{catalogError}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={reloadCatalog}
                      className="mt-2 h-auto px-0 text-amber-900 hover:bg-transparent"
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Retry catalog load
                    </Button>
                  </div>
                ) : null}
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className={sectionCardClassName}>
            <CardHeader className={sectionHeaderClassName}>
              <CardTitle className={sectionTitleClassName}>
                Financial Assumptions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <FieldGroup className="gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field className="justify-start gap-2">
                    <FieldLabel className={fieldLabelClassName}>Discount factor</FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="0.1"
                      value={led.discount_factor_percent}
                      onChange={(event) =>
                        updateLEDRetrofit({ discount_factor_percent: event.target.value })
                      }
                      suffix="%"
                      suffixClassName={suffixClassName}
                    />
                  </Field>

                  <Field className="justify-start gap-2">
                    <FieldLabel className={fieldLabelClassName}>
                      Typical lifetime of LED
                    </FieldLabel>
                    <InputWithSuffix
                      type="number"
                      min="0"
                      step="1"
                      value={led.led_lifetime_years}
                      onChange={(event) =>
                        updateLEDRetrofit({ led_lifetime_years: event.target.value })
                      }
                      suffix="years"
                      suffixClassName={suffixClassName}
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 border-t border-border/70 pt-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="w-full rounded-2xl border-border/70 bg-white shadow-none sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Change Equipment
          </Button>
          <Button
            type="submit"
            disabled={!isFormValid()}
            className="neo-cta w-full rounded-2xl text-sm font-medium tracking-[-0.01em] sm:w-auto"
          >
            Generate Recommendations
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
