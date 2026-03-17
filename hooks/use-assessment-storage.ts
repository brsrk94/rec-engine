"use client"

import { useState, useEffect, useCallback } from 'react'
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
  compressor_energy_saving_priority: 'Yes' | 'No'
  target_compressor_type: string
  target_compressor_rating: string
  target_compressor_rating_unit: 'kW' | 'HP'
  lifetime_of_target_compressor: string
  compressor_load_factor: string
  compressor_operating_hours_year: string
  compressor_electricity_tariff: string
  compressor_grid_emission_factor: string
}

export interface BLDCFanAssessment {
  current_fan_type: string
  number_of_fans: string
  operating_hours_year: string
  electricity_tariff: string
  current_wattage: string
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

const defaultMotorAssessment: MotorAssessment = {
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

const defaultCompressorAssessment: CompressorAssessment = {
  compressor_make: '',
  compressor_model: '',
  compressor_rating: '',
  compressor_rating_unit: 'kW',
  current_compressor_type: '',
  years_of_operation_current_compressor: '',
  compressor_energy_saving_priority: 'Yes',
  target_compressor_type: '',
  target_compressor_rating: '90',
  target_compressor_rating_unit: 'kW',
  lifetime_of_target_compressor: '10',
  compressor_load_factor: '80',
  compressor_operating_hours_year: '',
  compressor_electricity_tariff: '7',
  compressor_grid_emission_factor: '0.71',
}

const defaultBLDCFanAssessment: BLDCFanAssessment = {
  current_fan_type: '',
  number_of_fans: '1',
  operating_hours_year: '',
  electricity_tariff: '8',
  current_wattage: '75',
}

const defaultAirConditionerAssessment: AirConditionerAssessment = {
  current_ac_type: '',
  tonnage: '',
  number_of_units: '1',
  operating_hours_year: '',
  current_eer: '',
  electricity_tariff: '8',
  years_of_operation: '',
}

const defaultLEDRetrofitAssessment: LEDRetrofitAssessment = {
  current_lighting_type: '',
  number_of_fixtures: '',
  wattage_per_fixture: '',
  operating_hours_year: '',
  electricity_tariff: '8',
}

const defaultDGSetAssessment: DGSetAssessment = {
  dg_capacity_kva: '',
  current_loading_percent: '70',
  operating_hours_year: '',
  fuel_type: 'Diesel',
  fuel_cost_per_liter: '90',
  years_of_operation: '',
}

const defaultAssessmentData: AssessmentData = {
  selectedEquipment: null,
  motor: defaultMotorAssessment,
  compressor: defaultCompressorAssessment,
  bldc_fan: defaultBLDCFanAssessment,
  air_conditioner: defaultAirConditionerAssessment,
  led_retrofit: defaultLEDRetrofitAssessment,
  dg_set: defaultDGSetAssessment,
}

export function useAssessmentStorage() {
  const [data, setData] = useState<AssessmentData>(defaultAssessmentData)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setData({ ...defaultAssessmentData, ...parsed })
      }
    } catch {
      console.error('Failed to load assessment data from storage')
    }
    setIsLoaded(true)
  }, [])

  // Save to sessionStorage whenever data changes
  useEffect(() => {
    if (isLoaded) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch {
        console.error('Failed to save assessment data to storage')
      }
    }
  }, [data, isLoaded])

  const updateSelectedEquipment = useCallback((equipment: string | null) => {
    setData(prev => ({ ...prev, selectedEquipment: equipment }))
  }, [])

  const updateMotor = useCallback((updates: Partial<MotorAssessment>) => {
    setData(prev => ({ ...prev, motor: { ...prev.motor, ...updates } }))
  }, [])

  const updateCompressor = useCallback((updates: Partial<CompressorAssessment>) => {
    setData(prev => ({ ...prev, compressor: { ...prev.compressor, ...updates } }))
  }, [])

  const updateBLDCFan = useCallback((updates: Partial<BLDCFanAssessment>) => {
    setData(prev => ({ ...prev, bldc_fan: { ...prev.bldc_fan, ...updates } }))
  }, [])

  const updateAirConditioner = useCallback((updates: Partial<AirConditionerAssessment>) => {
    setData(prev => ({ ...prev, air_conditioner: { ...prev.air_conditioner, ...updates } }))
  }, [])

  const updateLEDRetrofit = useCallback((updates: Partial<LEDRetrofitAssessment>) => {
    setData(prev => ({ ...prev, led_retrofit: { ...prev.led_retrofit, ...updates } }))
  }, [])

  const updateDGSet = useCallback((updates: Partial<DGSetAssessment>) => {
    setData(prev => ({ ...prev, dg_set: { ...prev.dg_set, ...updates } }))
  }, [])

  const clearAll = useCallback(() => {
    setData(defaultAssessmentData)
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
