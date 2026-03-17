// Local 3D model URLs served from the threed-models folder
export const MODEL_URLS = {
  motor: '/api/models/electric_motor/scene.gltf',
  compressor: '/api/models/air_compressor/scene.gltf',
  bldc_fan: '/api/models/ceiling_fan/scene.gltf',
  air_conditioner: '/api/models/air_conditioner/scene.gltf',
} as const

export const HERO_MODEL_CONFIGS = {
  motor: {
    url: MODEL_URLS.motor,
    fitSize: 2.7,
    position: [0, -0.35, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
  compressor: {
    url: MODEL_URLS.compressor,
    fitSize: 2.7,
    position: [0, -0.35, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
  bldc_fan: {
    url: MODEL_URLS.bldc_fan,
    fitSize: 2.7,
    position: [0, -0.35, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
  air_conditioner: {
    url: MODEL_URLS.air_conditioner,
    fitSize: 2.7,
    position: [0, -0.35, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
} as const

export const HERO_MODEL_SEQUENCE = Object.keys(HERO_MODEL_CONFIGS) as Array<keyof typeof HERO_MODEL_CONFIGS>

export type HeroModelId = keyof typeof HERO_MODEL_CONFIGS

// Equipment types for the assessment
export const EQUIPMENT_TYPES = [
  { id: 'motor', name: 'Industrial Motors', description: 'IE1 to IE5 efficiency class upgrades', icon: 'Zap' },
  { id: 'compressor', name: 'Air Compressors', description: 'Rotary screw, VSD, and centrifugal options', icon: 'Wind' },
  { id: 'bldc_fan', name: 'BLDC Ceiling Fans', description: 'Energy-efficient brushless DC motor fans', icon: 'Fan' },
  { id: 'air_conditioner', name: 'Air Conditioners', description: 'Inverter and high-efficiency cooling systems', icon: 'Snowflake' },
  { id: 'led_retrofit', name: 'LED Retrofit', description: 'Replace conventional lighting with LEDs', icon: 'Lightbulb' },
  { id: 'dg_set', name: 'DG Sets', description: 'Diesel generator efficiency upgrades', icon: 'Power' },
] as const

export type EquipmentType = typeof EQUIPMENT_TYPES[number]['id']
