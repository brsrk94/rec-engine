"use client"

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ChevronRight } from 'lucide-react'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AssessmentEquipmentImage,
  type AssessmentEquipmentId,
} from './equipment-image'

const equipmentOptions = [
  {
    id: 'motor',
    name: 'Industrial Motors',
    description: 'Assess motor efficiency class upgrades (IE1 to IE5)',
  },
  {
    id: 'compressor',
    name: 'Air Compressors',
    description: 'Evaluate rotary screw, VSD, and centrifugal options',
  },
  {
    id: 'bldc_fan',
    name: 'BLDC Ceiling Fans',
    description: 'Compare brushless DC motor fans with conventional fans',
  },
  {
    id: 'air_conditioner',
    name: 'Air Conditioners',
    description: 'Analyze inverter AC and high-efficiency cooling systems',
  },
  {
    id: 'led_retrofit',
    name: 'LED Retrofit',
    description: 'Calculate savings from LED lighting upgrades',
  },
  {
    id: 'dg_set',
    name: 'DG Sets',
    description: 'Optimize diesel generator efficiency',
  },
]

interface EquipmentSelectorProps {
  onSelect: (equipmentId: string) => void
}

export function EquipmentSelector({ onSelect }: EquipmentSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const selectRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

      tl.fromTo(
        headerRef.current,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.68 }
      )
        .fromTo(
          selectRef.current,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.5 },
          '-=0.4'
        )
        .fromTo(
          cardsRef.current?.children || [],
          { opacity: 0, y: 22, scale: 0.985 },
          { opacity: 1, y: 0, scale: 1, duration: 0.48, stagger: 0.08 },
          '-=0.34'
        )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef}>
      <div ref={headerRef} className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Energy Efficiency Assessment
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Select the equipment type you want to assess
        </p>
      </div>

      {/* Dropdown selector for mobile */}
      <div ref={selectRef} className="mb-8 md:hidden">
        <Select onValueChange={onSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose equipment type..." />
          </SelectTrigger>
          <SelectContent>
            {equipmentOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                <div className="flex min-w-0 items-center gap-2">
                  <AssessmentEquipmentImage
                    equipmentId={option.id as AssessmentEquipmentId}
                    className="h-4 w-4 shrink-0 rounded-md border-0 bg-transparent"
                    roundedClassName="rounded-md"
                    sizes="16px"
                  />
                  <span className="truncate">{option.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Card grid for desktop */}
      <div
        ref={cardsRef}
        className="hidden grid-cols-2 gap-4 md:grid lg:grid-cols-3"
      >
        {equipmentOptions.map((option) => (
          <Card
            key={option.id}
            className="group cursor-pointer border-border/70 bg-card transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg"
            onClick={() => onSelect(option.id)}
          >
            <CardHeader className="gap-4 pb-3">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/8 ring-1 ring-primary/10">
                  <AssessmentEquipmentImage
                    equipmentId={option.id as AssessmentEquipmentId}
                    className="h-9 w-9 rounded-lg border-0 bg-transparent"
                    roundedClassName="rounded-lg"
                    imageClassName="transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                    sizes="36px"
                    priority={option.id === 'motor'}
                  />
                </div>
                <CardTitle className="flex min-w-0 flex-1 items-start justify-between gap-3 text-lg leading-snug">
                  <span>{option.name}</span>
                  <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:text-primary" />
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{option.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground md:hidden">
        Choose the equipment from the dropdown above to continue.
      </p>
    </div>
  )
}
