"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import type { BLDCFanCatalogItem } from '@/lib/bldc-fan-catalog'
import type { LEDCatalogItem } from '@/lib/led-catalog'
import type { MotorCatalogItem } from '@/lib/motor-catalog'

export interface MotorAssessment {
  motor_make: string
  motor_model: string
  motor_rating: string
  motor_rating_unit: 'kW' | 'HP'
  current_motor_efficiency_class: string
  target_motor_efficiency_class: string
  load_factor: string
  operating_hours_year: string
  electricity_tariff: string
  grid_emission_factor: string
  number_of_motors: string
  years_of_operation_current_motor_class: string
  lifetime_of_target_motor_class: string
  capex_of_current_motor_class: string
  capex_of_target_motor_class: string
  selected_catalog_motor: MotorCatalogItem | null
  target_catalog_motor: MotorCatalogItem | null
}

export interface CompressorAssessment {
  compressor_make: string
  compressor_model: string
  compressor_rating: string
  compressor_rating_unit: 'kW' | 'HP'
  current_compressor_type: string
  years_of_operation_current_compressor: string
  target_compressor_type: string
  target_compressor_make: string
  target_compressor_model: string
  target_compressor_catalog_key: string
  target_compressor_rating: string
  target_compressor_rating_unit: 'kW' | 'HP'
  lifetime_of_target_compressor: string
  compressor_load_factor: string
  compressor_operating_hours_year: string
  compressor_electricity_tariff: string
  compressor_grid_emission_factor: string
  compressor_energy_consumption: string
  capex_of_current_compressor: string
  capex_of_target_compressor: string
}

export interface BLDCFanAssessment {
  conventional_fan_catalog_key: string
  conventional_fan_make: string
  conventional_fan_make_model: string
  conventional_fan_power_rating_w: string
  room_size: 'small' | 'medium' | 'large'
  daily_runtime_hours: string
  working_days_per_year: string
  electricity_tariff: string
  grid_emission_factor: string
  bldc_fan_catalog_key: string
  bldc_fan_make: string
  bldc_fan_model: string
  bldc_fan_power_rating_w: string
  bldc_fan_sweep_mm: string
  number_of_fans_to_switch: string
  capex_bldc_fan_inr_per_fan: string
  bldc_installation_cost_inr_per_fan: string
  conventional_installation_cost_inr_per_fan: string
  current_years_of_operation: string
  discount_factor_percent: string
  bldc_lifetime_years: string
  selected_conventional_catalog_fan: BLDCFanCatalogItem | null
  selected_catalog_fan: BLDCFanCatalogItem | null
}

export interface AirConditionerAssessment {
  current_ac_type: string
  tonnage: string
  number_of_units: string
  operating_hours_year: string
  current_eer: string
  electricity_tariff: string
  years_of_operation: string
}

export interface LEDRetrofitAssessment {
  current_lighting_type: string
  number_of_fixtures: string
  wattage_per_fixture: string
  operating_hours_year: string
  electricity_tariff: string
  conventional_bulb_model: string
  conventional_bulb_power_rating_w: string
  daily_runtime_hours: string
  working_days_per_year: string
  led_make: string
  led_model: string
  led_catalog_key: string
  led_power_rating_w: string
  number_of_bulbs_to_switch: string
  led_capex_inr_per_led: string
  led_installation_cost_inr_per_led: string
  conventional_bulb_installation_cost_inr_per_bulb: string
  current_years_of_operation: string
  discount_factor_percent: string
  led_lifetime_years: string
  selected_catalog_led: LEDCatalogItem | null
}

export interface DGSetAssessment {
  dg_capacity_kva: string
  current_loading_percent: string
  operating_hours_year: string
  fuel_type: string
  fuel_cost_per_liter: string
  years_of_operation: string
}

export interface AssessmentData {
  selectedEquipment: string | null
  motor: MotorAssessment
  compressor: CompressorAssessment
  bldc_fan: BLDCFanAssessment
  air_conditioner: AirConditionerAssessment
  led_retrofit: LEDRetrofitAssessment
  dg_set: DGSetAssessment
}

const STORAGE_KEY = 'fitsol_assessment_data'

type PersistJob = {
  type: 'idle' | 'timeout'
  handle: number
}

const initialMotorAssessment: MotorAssessment = {
  motor_make: '',
  motor_model: '',
  motor_rating: '',
  motor_rating_unit: 'kW',
  current_motor_efficiency_class: '',
  target_motor_efficiency_class: '',
  load_factor: '80',
  operating_hours_year: '8000',
  electricity_tariff: '8',
  grid_emission_factor: '0.71',
  number_of_motors: '1',
  years_of_operation_current_motor_class: '5',
  lifetime_of_target_motor_class: '10',
  capex_of_current_motor_class: '',
  capex_of_target_motor_class: '',
  selected_catalog_motor: null,
  target_catalog_motor: null,
}

const initialCompressorAssessment: CompressorAssessment = {
  compressor_make: '',
  compressor_model: '',
  compressor_rating: '',
  compressor_rating_unit: 'kW',
  current_compressor_type: '',
  years_of_operation_current_compressor: '',
  target_compressor_type: '',
  target_compressor_make: '',
  target_compressor_model: '',
  target_compressor_catalog_key: '',
  target_compressor_rating: '',
  target_compressor_rating_unit: 'kW',
  lifetime_of_target_compressor: '10',
  compressor_load_factor: '80',
  compressor_operating_hours_year: '',
  compressor_electricity_tariff: '',
  compressor_grid_emission_factor: '0.71',
  compressor_energy_consumption: '',
  capex_of_current_compressor: '',
  capex_of_target_compressor: '',
}

const initialBLDCFanAssessment: BLDCFanAssessment = {
  conventional_fan_catalog_key: '',
  conventional_fan_make: '',
  conventional_fan_make_model: '',
  conventional_fan_power_rating_w: '75',
  room_size: 'large',
  daily_runtime_hours: '',
  working_days_per_year: '',
  electricity_tariff: '8',
  grid_emission_factor: '0.716',
  bldc_fan_catalog_key: '',
  bldc_fan_make: '',
  bldc_fan_model: '',
  bldc_fan_power_rating_w: '',
  bldc_fan_sweep_mm: '',
  number_of_fans_to_switch: '1',
  capex_bldc_fan_inr_per_fan: '4500',
  bldc_installation_cost_inr_per_fan: '3000',
  conventional_installation_cost_inr_per_fan: '2000',
  current_years_of_operation: '',
  discount_factor_percent: '8',
  bldc_lifetime_years: '10',
  selected_conventional_catalog_fan: null,
  selected_catalog_fan: null,
}

const initialAirConditionerAssessment: AirConditionerAssessment = {
  current_ac_type: '',
  tonnage: '',
  number_of_units: '1',
  operating_hours_year: '',
  current_eer: '',
  electricity_tariff: '8',
  years_of_operation: '',
}

const initialLedRetrofitAssessment: LEDRetrofitAssessment = {
  current_lighting_type: '',
  number_of_fixtures: '',
  wattage_per_fixture: '',
  operating_hours_year: '',
  electricity_tariff: '8',
  conventional_bulb_model: '',
  conventional_bulb_power_rating_w: '',
  daily_runtime_hours: '',
  working_days_per_year: '',
  led_make: '',
  led_model: '',
  led_catalog_key: '',
  led_power_rating_w: '',
  number_of_bulbs_to_switch: '1',
  led_capex_inr_per_led: '',
  led_installation_cost_inr_per_led: '100',
  conventional_bulb_installation_cost_inr_per_bulb: '20',
  current_years_of_operation: '',
  discount_factor_percent: '8',
  led_lifetime_years: '10',
  selected_catalog_led: null,
}

const initialDgSetAssessment: DGSetAssessment = {
  dg_capacity_kva: '',
  current_loading_percent: '70',
  operating_hours_year: '',
  fuel_type: 'Diesel',
  fuel_cost_per_liter: '90',
  years_of_operation: '',
}

const initialAssessmentState: AssessmentData = {
  selectedEquipment: null,
  motor: initialMotorAssessment,
  compressor: initialCompressorAssessment,
  bldc_fan: initialBLDCFanAssessment,
  air_conditioner: initialAirConditionerAssessment,
  led_retrofit: initialLedRetrofitAssessment,
  dg_set: initialDgSetAssessment,
}

function readAssessmentDraft() {
  try {
    const storedDraft = sessionStorage.getItem(STORAGE_KEY)

    if (!storedDraft) {
      return initialAssessmentState
    }

    const parsedDraft = JSON.parse(storedDraft) as Partial<AssessmentData>

    return {
      ...initialAssessmentState,
      ...parsedDraft,
      motor: { ...initialMotorAssessment, ...(parsedDraft.motor ?? {}) },
      compressor: { ...initialCompressorAssessment, ...(parsedDraft.compressor ?? {}) },
      bldc_fan: { ...initialBLDCFanAssessment, ...(parsedDraft.bldc_fan ?? {}) },
      air_conditioner: {
        ...initialAirConditionerAssessment,
        ...(parsedDraft.air_conditioner ?? {}),
      },
      led_retrofit: { ...initialLedRetrofitAssessment, ...(parsedDraft.led_retrofit ?? {}) },
      dg_set: { ...initialDgSetAssessment, ...(parsedDraft.dg_set ?? {}) },
    } as AssessmentData
  } catch (error) {
    console.warn('Fitsol: unable to read assessment draft from session storage.', error)
    return initialAssessmentState
  }
}

function persistAssessmentDraft(nextDraft: AssessmentData) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextDraft))
  } catch (error) {
    console.warn('Fitsol: unable to persist assessment draft.', error)
  }
}

function mergeChangedFields<T extends object>(
  currentBranch: T,
  updates: Partial<T>
) {
  let nextBranch: T | null = null

  for (const key of Object.keys(updates) as Array<keyof T>) {
    const nextValue = updates[key]

    if (Object.is(currentBranch[key], nextValue)) {
      continue
    }

    if (!nextBranch) {
      nextBranch = { ...currentBranch }
    }

    nextBranch[key] = nextValue as T[keyof T]
  }

  return nextBranch ?? currentBranch
}

function scheduleDraftPersist(task: () => void): PersistJob {
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    return {
      type: 'idle',
      handle: window.requestIdleCallback(task, { timeout: 280 }),
    }
  }

  return {
    type: 'timeout',
    handle: window.setTimeout(task, 180),
  }
}

function cancelDraftPersist(job: PersistJob) {
  if (job.type === 'idle' && typeof window.cancelIdleCallback === 'function') {
    window.cancelIdleCallback(job.handle)
    return
  }

  window.clearTimeout(job.handle)
}

export function useAssessmentStorage() {
  const [data, setData] = useState<AssessmentData>(initialAssessmentState)
  const [isLoaded, setIsLoaded] = useState(false)
  const latestDraftRef = useRef<AssessmentData>(initialAssessmentState)
  const pendingPersistJobRef = useRef<PersistJob | null>(null)

  useEffect(() => {
    setData(readAssessmentDraft())
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    latestDraftRef.current = data
  }, [data])

  const flushDraft = useCallback(() => {
    if (!isLoaded) {
      return
    }

    if (pendingPersistJobRef.current) {
      cancelDraftPersist(pendingPersistJobRef.current)
      pendingPersistJobRef.current = null
    }

    persistAssessmentDraft(latestDraftRef.current)
  }, [isLoaded])

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    if (pendingPersistJobRef.current) {
      cancelDraftPersist(pendingPersistJobRef.current)
    }

    pendingPersistJobRef.current = scheduleDraftPersist(() => {
      pendingPersistJobRef.current = null
      persistAssessmentDraft(latestDraftRef.current)
    })

    return () => {
      if (pendingPersistJobRef.current) {
        cancelDraftPersist(pendingPersistJobRef.current)
        pendingPersistJobRef.current = null
      }
    }
  }, [data, isLoaded])

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') {
      return
    }

    const handlePageHide = () => {
      flushDraft()
    }

    window.addEventListener('pagehide', handlePageHide)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [flushDraft, isLoaded])

  const updateSelectedEquipment = useCallback((equipment: string | null) => {
    setData((previousData) => {
      if (previousData.selectedEquipment === equipment) {
        return previousData
      }

      return { ...previousData, selectedEquipment: equipment }
    })
  }, [])

  const updateMotor = useCallback((updates: Partial<MotorAssessment>) => {
    setData((previousData) => {
      const nextMotor = mergeChangedFields(previousData.motor, updates)

      if (nextMotor === previousData.motor) {
        return previousData
      }

      return { ...previousData, motor: nextMotor }
    })
  }, [])

  const updateCompressor = useCallback((updates: Partial<CompressorAssessment>) => {
    setData((previousData) => {
      const nextCompressor = mergeChangedFields(previousData.compressor, updates)

      if (nextCompressor === previousData.compressor) {
        return previousData
      }

      return { ...previousData, compressor: nextCompressor }
    })
  }, [])

  const updateBLDCFan = useCallback((updates: Partial<BLDCFanAssessment>) => {
    setData((previousData) => {
      const nextFan = mergeChangedFields(previousData.bldc_fan, updates)

      if (nextFan === previousData.bldc_fan) {
        return previousData
      }

      return { ...previousData, bldc_fan: nextFan }
    })
  }, [])

  const updateAirConditioner = useCallback((updates: Partial<AirConditionerAssessment>) => {
    setData((previousData) => {
      const nextAirConditioner = mergeChangedFields(previousData.air_conditioner, updates)

      if (nextAirConditioner === previousData.air_conditioner) {
        return previousData
      }

      return { ...previousData, air_conditioner: nextAirConditioner }
    })
  }, [])

  const updateLEDRetrofit = useCallback((updates: Partial<LEDRetrofitAssessment>) => {
    setData((previousData) => {
      const nextLighting = mergeChangedFields(previousData.led_retrofit, updates)

      if (nextLighting === previousData.led_retrofit) {
        return previousData
      }

      return { ...previousData, led_retrofit: nextLighting }
    })
  }, [])

  const updateDGSet = useCallback((updates: Partial<DGSetAssessment>) => {
    setData((previousData) => {
      const nextDgSet = mergeChangedFields(previousData.dg_set, updates)

      if (nextDgSet === previousData.dg_set) {
        return previousData
      }

      return { ...previousData, dg_set: nextDgSet }
    })
  }, [])

  const clearAll = useCallback(() => {
    if (pendingPersistJobRef.current) {
      cancelDraftPersist(pendingPersistJobRef.current)
      pendingPersistJobRef.current = null
    }

    latestDraftRef.current = initialAssessmentState
    setData(initialAssessmentState)
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  return {
    data,
    isLoaded,
    updateSelectedEquipment,
    updateMotor,
    updateCompressor,
    updateBLDCFan,
    updateAirConditioner,
    updateLEDRetrofit,
    updateDGSet,
    clearAll,
  }
}
