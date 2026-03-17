'use client'

import Image from 'next/image'

import { cn } from '@/lib/utils'

export const ASSESSMENT_EQUIPMENT_ASSETS = {
  motor: {
    title: 'Motor',
    imageSrc: '/motors.jpg',
    imageAlt: 'Industrial motors',
  },
  compressor: {
    title: 'Compressor',
    imageSrc: '/compressors.jpg',
    imageAlt: 'Air compressors',
  },
  bldc_fan: {
    title: 'BLDC Fan',
    imageSrc: '/fans.jpg',
    imageAlt: 'Ceiling fans',
  },
  air_conditioner: {
    title: 'Air Conditioner',
    imageSrc: '/ac.webp',
    imageAlt: 'Air conditioner equipment',
  },
  led_retrofit: {
    title: 'LED Retrofit',
    imageSrc: '/led-retrofit.jpg',
    imageAlt: 'LED retrofit lighting',
  },
  dg_set: {
    title: 'DG Set',
    imageSrc: '/digital-generators.jpg',
    imageAlt: 'Diesel generators',
  },
} as const

export type AssessmentEquipmentId = keyof typeof ASSESSMENT_EQUIPMENT_ASSETS

interface AssessmentEquipmentImageProps {
  equipmentId: AssessmentEquipmentId
  className?: string
  imageClassName?: string
  roundedClassName?: string
  priority?: boolean
  sizes?: string
}

export function AssessmentEquipmentImage({
  equipmentId,
  className,
  imageClassName,
  roundedClassName = 'rounded-lg',
  priority = false,
  sizes = '(min-width: 1024px) 160px, (min-width: 768px) 120px, 80px',
}: AssessmentEquipmentImageProps) {
  const asset = ASSESSMENT_EQUIPMENT_ASSETS[equipmentId]

  return (
    <div
      className={cn(
        'relative aspect-square shrink-0 overflow-hidden border border-border/70 bg-muted/40',
        roundedClassName,
        className
      )}
    >
      <Image
        src={asset.imageSrc}
        alt={asset.imageAlt}
        fill
        sizes={sizes}
        priority={priority}
        quality={100}
        className={cn('object-cover object-center', imageClassName)}
      />
    </div>
  )
}
