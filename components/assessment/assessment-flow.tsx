"use client"

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { useAssessmentStorage } from '@/hooks/use-assessment-storage'
import { AssessmentHeader } from './assessment-header'
import { EquipmentSelector } from './equipment-selector'
import { MotorForm } from './motor-form'
import { CompressorForm } from './compressor-form'
import { BLDCFanForm } from './bldc-fan-form'
import { AirConditionerForm } from './air-conditioner-form'
import { LEDRetrofitForm } from './led-retrofit-form'
import { DGSetForm } from './dg-set-form'

export function AssessmentFlow() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data, isLoaded, updateSelectedEquipment, clearAll } = useAssessmentStorage()
  const [currentStep, setCurrentStep] = useState<'select' | 'form'>('select')
  const panelRef = useRef<HTMLDivElement>(null)

  // Handle URL parameter for equipment type
  useEffect(() => {
    const typeParam = searchParams.get('type')
    if (typeParam && isLoaded) {
      const validTypes = ['motor', 'compressor', 'bldc_fan', 'air_conditioner', 'led_retrofit', 'dg_set']
      if (validTypes.includes(typeParam)) {
        updateSelectedEquipment(typeParam)
        setCurrentStep('form')
      }
    }
  }, [searchParams, isLoaded, updateSelectedEquipment])

  useEffect(() => {
    if (isLoaded && !searchParams.get('type')) {
      clearAll()
      setCurrentStep('select')
    }
  }, [clearAll, isLoaded, searchParams])

  useEffect(() => {
    if (!panelRef.current) {
      return
    }

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      gsap.set(panelRef.current, { clearProps: 'all', opacity: 1 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.42, ease: 'power2.out' }
      )
    }, panelRef)

    return () => ctx.revert()
  }, [currentStep, data.selectedEquipment])

  const handleEquipmentSelect = (equipmentId: string) => {
    updateSelectedEquipment(equipmentId)
    setCurrentStep('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Update URL without refresh
    router.push(`/assessment?type=${equipmentId}`, { scroll: false })
  }

  const handleBack = () => {
    setCurrentStep('select')
    updateSelectedEquipment(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    router.push('/assessment', { scroll: false })
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Loading your data...</span>
        </div>
      </div>
    )
  }

  const renderForm = () => {
    switch (data.selectedEquipment) {
      case 'motor':
        return <MotorForm onBack={handleBack} />
      case 'compressor':
        return <CompressorForm onBack={handleBack} />
      case 'bldc_fan':
        return <BLDCFanForm onBack={handleBack} />
      case 'air_conditioner':
        return <AirConditionerForm onBack={handleBack} />
      case 'led_retrofit':
        return <LEDRetrofitForm onBack={handleBack} />
      case 'dg_set':
        return <DGSetForm onBack={handleBack} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AssessmentHeader />
      
      <main className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-8 md:px-6 md:py-12">
        <div
          ref={panelRef}
          key={`${currentStep}-${data.selectedEquipment ?? 'none'}`}
          className="will-change-transform"
        >
          {currentStep === 'select' ? (
            <EquipmentSelector onSelect={handleEquipmentSelect} />
          ) : (
            renderForm()
          )}
        </div>
      </main>
    </div>
  )
}
