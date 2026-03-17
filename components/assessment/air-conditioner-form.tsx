"use client"

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
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

const acTypes = [
  { value: 'window_non_inverter', label: 'Window AC (Non-Inverter)' },
  { value: 'split_non_inverter', label: 'Split AC (Non-Inverter)' },
  { value: 'split_inverter_3star', label: 'Split AC (Inverter 3-Star)' },
  { value: 'cassette', label: 'Cassette AC' },
  { value: 'ductable', label: 'Ductable AC' },
  { value: 'central_chiller', label: 'Central/Chiller System' },
]

interface AirConditionerFormProps {
  onBack: () => void
}

export function AirConditionerForm({ onBack }: AirConditionerFormProps) {
  const router = useRouter()
  const { data, updateAirConditioner } = useAssessmentStorage()
  const formRef = useRef<HTMLDivElement>(null)
  const ac = data.air_conditioner

  useEffect(() => {
    const ctx = gsap.context(() => {
      animateAssessmentScreen(formRef.current)
    }, formRef)

    return () => ctx.revert()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push('/assessment/results?type=air_conditioner')
  }

  const isFormValid = () => {
    return ac.current_ac_type && ac.tonnage && ac.operating_hours_year
  }

  return (
    <TooltipProvider>
      <div ref={formRef}>
        <div className="mb-8 flex items-start gap-3 sm:items-center sm:gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <AssessmentEquipmentImage equipmentId="air_conditioner" className="h-10 w-10 sm:h-12 sm:w-12" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight sm:text-2xl">Air Conditioner Assessment</h1>
              <p className="text-muted-foreground">Evaluate AC upgrade opportunities</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Current AC Details</CardTitle>
                <CardDescription>
                  Information about your existing air conditioning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel className="flex items-center gap-1">
                      Current AC Type *
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Type of your current AC system</p>
                        </TooltipContent>
                      </Tooltip>
                    </FieldLabel>
                    <Select
                      value={ac.current_ac_type}
                      onValueChange={(value) => updateAirConditioner({ current_ac_type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select AC type" />
                      </SelectTrigger>
                      <SelectContent>
                        {acTypes.map((type) => (
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
                        Tonnage (TR) *
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cooling capacity in Tons of Refrigeration</p>
                          </TooltipContent>
                        </Tooltip>
                      </FieldLabel>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="e.g., 1.5"
                        value={ac.tonnage}
                        onChange={(e) => updateAirConditioner({ tonnage: e.target.value })}
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Number of Units</FieldLabel>
                      <Input
                        type="number"
                        min="1"
                        value={ac.number_of_units}
                        onChange={(e) => updateAirConditioner({ number_of_units: e.target.value })}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Current EER</FieldLabel>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 3.0"
                        value={ac.current_eer}
                        onChange={(e) => updateAirConditioner({ current_eer: e.target.value })}
                      />
                    </Field>

                    <Field>
                      <FieldLabel>AC Age (years)</FieldLabel>
                      <Input
                        type="number"
                        placeholder="e.g., 5"
                        value={ac.years_of_operation}
                        onChange={(e) => updateAirConditioner({ years_of_operation: e.target.value })}
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
                      placeholder="e.g., 2500"
                      value={ac.operating_hours_year}
                      onChange={(e) => updateAirConditioner({ operating_hours_year: e.target.value })}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Electricity Tariff (INR/kWh)</FieldLabel>
                    <Input
                      type="number"
                      step="0.1"
                      value={ac.electricity_tariff}
                      onChange={(e) => updateAirConditioner({ electricity_tariff: e.target.value })}
                    />
                  </Field>
                </FieldGroup>
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
