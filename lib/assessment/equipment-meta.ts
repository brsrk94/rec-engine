export const assessmentEquipmentMeta = {
  motor: {
    title: 'Motor',
  },
  compressor: {
    title: 'Compressor',
  },
  bldc_fan: {
    title: 'BLDC Fan',
  },
  air_conditioner: {
    title: 'Air Conditioner',
  },
  led_retrofit: {
    title: 'LED Retrofit',
  },
  dg_set: {
    title: 'DG Set',
  },
} as const

export type AssessmentEquipmentKey = keyof typeof assessmentEquipmentMeta
