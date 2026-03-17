"use client"

import { motion, useReducedMotion } from 'framer-motion'
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
import {
  fadeUpVariants,
  smoothTransition,
  staggerContainerVariants,
  staggerItemVariants,
} from '@/components/motion/variants'

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
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={prefersReducedMotion ? false : 'hidden'}
      animate="visible"
      variants={staggerContainerVariants}
    >
      <motion.div variants={fadeUpVariants} className="mb-7 text-center sm:mb-8">
        <h1 className="text-[1.7rem] font-bold tracking-tight sm:text-3xl md:text-4xl">
          Energy Efficiency Assessment
        </h1>
        <p className="mt-2.5 text-sm leading-6 text-muted-foreground sm:mt-3 sm:text-lg">
          Select the equipment type you want to assess
        </p>
      </motion.div>

      {/* Dropdown selector for mobile */}
      <motion.div variants={fadeUpVariants} className="mb-8 md:hidden">
        <Select onValueChange={onSelect}>
          <SelectTrigger className="h-12 w-full text-left">
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
      </motion.div>

      {/* Card grid for desktop */}
      <motion.div
        variants={staggerContainerVariants}
        className="hidden grid-cols-2 gap-4 md:grid lg:grid-cols-3"
      >
        {equipmentOptions.map((option) => (
          <motion.div
            key={option.id}
            variants={staggerItemVariants}
            whileHover={prefersReducedMotion ? undefined : { y: -2 }}
            transition={smoothTransition}
          >
            <Card
              className="group cursor-pointer border-border/70 bg-card transition-[transform,border-color,box-shadow] duration-300 ease-out hover:border-primary/35 hover:shadow-lg"
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
          </motion.div>
        ))}
      </motion.div>

      <motion.p variants={fadeUpVariants} className="text-center text-xs leading-5 text-muted-foreground md:hidden">
        Choose the equipment from the dropdown above to continue.
      </motion.p>
    </motion.div>
  )
}
