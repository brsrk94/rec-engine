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

const fuelTypes = [
  { value: 'Diesel', label: 'Diesel' },
  { value: 'Natural Gas', label: 'Natural Gas' },
  { value: 'LPG', label: 'LPG' },
]

interface DGSetFormProps {
  onBack: () => void
}

export function DGSetForm({ onBack }: DGSetFormProps) {
  const router = useRouter()
  const { data, updateDGSet } = useAssessmentStorage()
  const formRef = useRef<HTMLDivElement>(null)
  const dg = data.dg_set

  useEffect(() => {
    const ctx = gsap.context(() => {
      animateAssessmentScreen(formRef.current)
    }, formRef)

    return () => ctx.revert()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push('/assessment/results?type=dg_set')
  }

  const isFormValid = () => {
    return dg.dg_capacity_kva && dg.operating_hours_year
  }

  return (
    <TooltipProvider>
      <div ref={formRef}>
        <div className="mb-8 flex items-start gap-3 sm:items-center sm:gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <AssessmentEquipmentImage equipmentId="dg_set" className="h-10 w-10 sm:h-12 sm:w-12" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight sm:text-2xl">DG Set Assessment</h1>
              <p className="text-muted-foreground">Evaluate diesel generator efficiency</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Current DG Set Details</CardTitle>
                <CardDescription>
                  Information about your diesel generator
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel className="flex items-center gap-1">
                      DG Capacity (kVA) *
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Rated capacity of the generator</p>
                        </TooltipContent>
                      </Tooltip>
                    </FieldLabel>
                    <Input
                      type="number"
                      placeholder="e.g., 500"
                      value={dg.dg_capacity_kva}
                      onChange={(e) => updateDGSet({ dg_capacity_kva: e.target.value })}
                      required
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel className="flex items-center gap-1">
                        Current Loading (%)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Average percentage of rated capacity used</p>
                          </TooltipContent>
                        </Tooltip>
                      </FieldLabel>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={dg.current_loading_percent}
                        onChange={(e) => updateDGSet({ current_loading_percent: e.target.value })}
                      />
                    </Field>

                    <Field>
                      <FieldLabel>DG Age (years)</FieldLabel>
                      <Input
                        type="number"
                        placeholder="e.g., 10"
                        value={dg.years_of_operation}
                        onChange={(e) => updateDGSet({ years_of_operation: e.target.value })}
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel>Fuel Type</FieldLabel>
                    <Select
                      value={dg.fuel_type}
                      onValueChange={(value) => updateDGSet({ fuel_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fuelTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
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
                          <p>Total annual running hours</p>
                        </TooltipContent>
                      </Tooltip>
                    </FieldLabel>
                    <Input
                      type="number"
                      placeholder="e.g., 1500"
                      value={dg.operating_hours_year}
                      onChange={(e) => updateDGSet({ operating_hours_year: e.target.value })}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Fuel Cost (INR/Liter)</FieldLabel>
                    <Input
                      type="number"
                      step="0.1"
                      value={dg.fuel_cost_per_liter}
                      onChange={(e) => updateDGSet({ fuel_cost_per_liter: e.target.value })}
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5 lg:col-span-2">
              <CardContent className="flex items-start gap-4 pt-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">DG Set Efficiency Tips</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Optimal DG loading is between 60-80% of rated capacity. Under-loading leads to wet stacking 
                    and poor fuel efficiency. Consider right-sizing your DG set, implementing load management,
                    or switching to more efficient generator models for significant fuel savings.
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
