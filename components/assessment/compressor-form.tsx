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

const compressorMakes = [
  'Atlas Copco', 'Ingersoll Rand', 'ELGi', 'Kirloskar', 'Kaeser', 'Chicago Pneumatic', 'Other'
]

const compressorTypes = [
  { value: 'reciprocating', label: 'Reciprocating (Piston)' },
  { value: 'fixed_speed_rotary', label: 'Fixed Speed (Rotary Screw)' },
  { value: 'vsd_rotary', label: 'Variable Speed Drive (Rotary Screw)' },
  { value: 'centrifugal', label: 'Centrifugal' },
  { value: 'scroll', label: 'Scroll Compressor' },
  { value: 'oil_free_screw', label: 'Oil-free Screw Compressor' },
]

const upgradeRecommendations: Record<string, string> = {
  'reciprocating': 'vsd_rotary',
  'fixed_speed_rotary': 'vsd_rotary',
  'scroll': 'oil_free_screw',
  'centrifugal': 'centrifugal',
  'vsd_rotary': 'vsd_rotary',
  'oil_free_screw': 'oil_free_screw',
}

interface CompressorFormProps {
  onBack: () => void
}

export function CompressorForm({ onBack }: CompressorFormProps) {
  const router = useRouter()
  const { data, updateCompressor } = useAssessmentStorage()
  const formRef = useRef<HTMLDivElement>(null)
  const compressor = data.compressor

  useEffect(() => {
    const ctx = gsap.context(() => {
      animateAssessmentScreen(formRef.current)
    }, formRef)

    return () => ctx.revert()
  }, [])

  // Auto-suggest target type based on current type
  useEffect(() => {
    if (compressor.current_compressor_type && !compressor.target_compressor_type) {
      const recommended = upgradeRecommendations[compressor.current_compressor_type]
      if (recommended) {
        updateCompressor({ target_compressor_type: recommended })
      }
    }
  }, [compressor.current_compressor_type, compressor.target_compressor_type, updateCompressor])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push('/assessment/results?type=compressor')
  }

  const isFormValid = () => {
    return (
      compressor.compressor_rating &&
      compressor.current_compressor_type
    )
  }

  return (
    <TooltipProvider>
      <div ref={formRef}>
        {/* Header */}
        <div className="mb-8 flex items-start gap-3 sm:items-center sm:gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <AssessmentEquipmentImage equipmentId="compressor" className="h-10 w-10 sm:h-12 sm:w-12" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight sm:text-2xl">Compressor Assessment</h1>
              <p className="text-muted-foreground">Enter your current compressor details</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Current Equipment */}
            <Card>
              <CardHeader>
                <CardTitle>Current Compressor Details</CardTitle>
                <CardDescription>
                  Information about your existing compressor installation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Compressor Make</FieldLabel>
                      <Select
                        value={compressor.compressor_make}
                        onValueChange={(value) => updateCompressor({ compressor_make: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select make" />
                        </SelectTrigger>
                        <SelectContent>
                          {compressorMakes.map((make) => (
                            <SelectItem key={make} value={make}>
                              {make}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel>Compressor Model</FieldLabel>
                      <Input
                        placeholder="e.g., GA37"
                        value={compressor.compressor_model}
                        onChange={(e) => updateCompressor({ compressor_model: e.target.value })}
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel className="flex items-center gap-1">
                      Current Compressor Type *
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The technology type of your current compressor</p>
                        </TooltipContent>
                      </Tooltip>
                    </FieldLabel>
                    <Select
                      value={compressor.current_compressor_type}
                      onValueChange={(value) => updateCompressor({ current_compressor_type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {compressorTypes.map((type) => (
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
                        Rated Capacity *
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Motor power rating of the compressor</p>
                          </TooltipContent>
                        </Tooltip>
                      </FieldLabel>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="e.g., 37"
                          value={compressor.compressor_rating}
                          onChange={(e) => updateCompressor({ compressor_rating: e.target.value })}
                          className="flex-1"
                          required
                        />
                        <Select
                          value={compressor.compressor_rating_unit}
                          onValueChange={(value: 'kW' | 'HP') => updateCompressor({ compressor_rating_unit: value })}
                        >
                          <SelectTrigger className="w-24">
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
                      <FieldLabel>Compressor Age (years)</FieldLabel>
                      <Input
                        type="number"
                        placeholder="e.g., 8"
                        value={compressor.years_of_operation_current_compressor}
                        onChange={(e) => updateCompressor({ years_of_operation_current_compressor: e.target.value })}
                      />
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>

            {/* Operating Parameters */}
            <Card>
              <CardHeader>
                <CardTitle>Operating Parameters</CardTitle>
                <CardDescription>
                  How your compressor is used in your facility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel className="flex items-center gap-1">
                      Operating Hours per Year
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
                      placeholder="e.g., 6000"
                      value={compressor.compressor_operating_hours_year}
                      onChange={(e) => updateCompressor({ compressor_operating_hours_year: e.target.value })}
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="flex items-center gap-1">
                      Load Factor (%)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Average loading of compressor capacity</p>
                        </TooltipContent>
                      </Tooltip>
                    </FieldLabel>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={compressor.compressor_load_factor}
                      onChange={(e) => updateCompressor({ compressor_load_factor: e.target.value })}
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Electricity Tariff (INR/kWh)</FieldLabel>
                      <Input
                        type="number"
                        step="0.1"
                        value={compressor.compressor_electricity_tariff}
                        onChange={(e) => updateCompressor({ compressor_electricity_tariff: e.target.value })}
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Grid Emission Factor (kgCO2/kWh)</FieldLabel>
                      <Input
                        type="number"
                        step="0.01"
                        value={compressor.compressor_grid_emission_factor}
                        onChange={(e) => updateCompressor({ compressor_grid_emission_factor: e.target.value })}
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel>Energy Saving Priority</FieldLabel>
                    <Select
                      value={compressor.compressor_energy_saving_priority}
                      onValueChange={(value: 'Yes' | 'No') => updateCompressor({ compressor_energy_saving_priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes - Prioritize energy efficiency</SelectItem>
                        <SelectItem value="No">No - Balance cost and efficiency</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            {/* Target Upgrade */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Target Upgrade</CardTitle>
                <CardDescription>
                  Specify your upgrade preferences (optional - we will recommend the best option)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field>
                      <FieldLabel>Target Compressor Type</FieldLabel>
                      <Select
                        value={compressor.target_compressor_type}
                        onValueChange={(value) => updateCompressor({ target_compressor_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Auto-recommended" />
                        </SelectTrigger>
                        <SelectContent>
                          {compressorTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel>Target Capacity</FieldLabel>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="e.g., 90"
                          value={compressor.target_compressor_rating}
                          onChange={(e) => updateCompressor({ target_compressor_rating: e.target.value })}
                          className="flex-1"
                        />
                        <Select
                          value={compressor.target_compressor_rating_unit}
                          onValueChange={(value: 'kW' | 'HP') => updateCompressor({ target_compressor_rating_unit: value })}
                        >
                          <SelectTrigger className="w-24">
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
                      <FieldLabel>Target Lifetime (years)</FieldLabel>
                      <Input
                        type="number"
                        value={compressor.lifetime_of_target_compressor}
                        onChange={(e) => updateCompressor({ lifetime_of_target_compressor: e.target.value })}
                      />
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
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
