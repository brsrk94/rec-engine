"use client"

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { ArrowLeft, ArrowRight, Lightbulb, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAssessmentStorage } from '@/hooks/use-assessment-storage'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { animateAssessmentScreen } from './animations'
import { AssessmentEquipmentImage } from './equipment-image'

const lightingTypes = [
  { value: 'incandescent', label: 'Incandescent (60-100W)' },
  { value: 'cfl', label: 'CFL (15-25W)' },
  { value: 'tube_t12', label: 'Fluorescent Tube T12 (40W)' },
  { value: 'tube_t8', label: 'Fluorescent Tube T8 (36W)' },
  { value: 'tube_t5', label: 'Fluorescent Tube T5 (28W)' },
  { value: 'halogen', label: 'Halogen (35-50W)' },
  { value: 'metal_halide', label: 'Metal Halide (250-400W)' },
  { value: 'high_pressure_sodium', label: 'High Pressure Sodium (150-250W)' },
]

interface LEDRetrofitFormProps {
  onBack: () => void
}

export function LEDRetrofitForm({ onBack }: LEDRetrofitFormProps) {
  const router = useRouter()
  const { data, updateLEDRetrofit } = useAssessmentStorage()
  const formRef = useRef<HTMLDivElement>(null)
  const led = data.led_retrofit

  useEffect(() => {
    const ctx = gsap.context(() => {
      animateAssessmentScreen(formRef.current)
    }, formRef)

    return () => ctx.revert()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push('/assessment/results?type=led_retrofit')
  }

  const isFormValid = () => {
    return led.current_lighting_type && led.number_of_fixtures && led.operating_hours_year
  }

  return (
    <TooltipProvider>
      <div ref={formRef}>
        <div className="mb-8 flex items-start gap-3 sm:items-center sm:gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <AssessmentEquipmentImage equipmentId="led_retrofit" className="h-10 w-10 sm:h-12 sm:w-12" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight sm:text-2xl">LED Retrofit Assessment</h1>
              <p className="text-muted-foreground">Evaluate lighting upgrade potential</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Current Lighting Details</CardTitle>
                <CardDescription>
                  Information about your existing lighting fixtures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel className="flex items-center gap-1">
                      Current Lighting Type *
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Type of your current lighting fixtures</p>
                        </TooltipContent>
                      </Tooltip>
                    </FieldLabel>
                    <Select
                      value={led.current_lighting_type}
                      onValueChange={(value) => updateLEDRetrofit({ current_lighting_type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select lighting type" />
                      </SelectTrigger>
                      <SelectContent>
                        {lightingTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel className="flex items-center gap-1">
                        Number of Fixtures *
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Total count of fixtures to retrofit</p>
                          </TooltipContent>
                        </Tooltip>
                      </FieldLabel>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g., 100"
                        value={led.number_of_fixtures}
                        onChange={(e) => updateLEDRetrofit({ number_of_fixtures: e.target.value })}
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Wattage per Fixture</FieldLabel>
                      <Input
                        type="number"
                        placeholder="e.g., 40"
                        value={led.wattage_per_fixture}
                        onChange={(e) => updateLEDRetrofit({ wattage_per_fixture: e.target.value })}
                      />
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operating Parameters</CardTitle>
                <CardDescription>
                  Usage patterns and cost parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel className="flex items-center gap-1">
                      Operating Hours per Year *
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Average annual operating hours</p>
                        </TooltipContent>
                      </Tooltip>
                    </FieldLabel>
                    <Input
                      type="number"
                      placeholder="e.g., 3000"
                      value={led.operating_hours_year}
                      onChange={(e) => updateLEDRetrofit({ operating_hours_year: e.target.value })}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Electricity Tariff (INR/kWh)</FieldLabel>
                    <Input
                      type="number"
                      step="0.1"
                      value={led.electricity_tariff}
                      onChange={(e) => updateLEDRetrofit({ electricity_tariff: e.target.value })}
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5 lg:col-span-2">
              <CardContent className="flex items-start gap-4 pt-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">LED Retrofit Benefits</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    LED lighting can reduce energy consumption by 50-80% compared to conventional lighting.
                    LEDs also have 25x longer lifespan than incandescent bulbs, require minimal maintenance,
                    and provide better light quality with instant-on capability.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Change Equipment
            </Button>
            <Button type="submit" disabled={!isFormValid()} className="sm:min-w-[200px]">
              Get Recommendations
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </TooltipProvider>
  )
}
