export interface AssessmentCurrentSystemSnapshot {
  type: string
  rating: string
  make: string
  model: string
  annualEnergy: number
  annualCost: number
}

export interface AssessmentRecommendationCardSnapshot {
  id: number
  name: string
  make: string
  model: string
  badge: string
  energySavings: number
  costSavings: number
  emissionSavings: number
  upgradeCost: number
  paybackYears: string
  efficiency: number
  details?: string
  marginalAbatementCost?: string
  currentAnnualEnergy?: number
  recommendedAnnualEnergy?: number
  currentAnnualCost?: number
  recommendedAnnualCost?: number
}

export interface MotorComparisonSnapshot {
  currentAnnualEnergy: number
  recommendedAnnualEnergy: number
  energySavings: number
  currentAnnualCost: number
  recommendedAnnualCost: number
  costSavings: number
  currentAnnualEmissions: number
  recommendedAnnualEmissions: number
  emissionSavings: number
  efficiencyClass?: string
}

export interface AssessmentRecommendationSummary {
  totalEnergySavings: number
  totalCostSavings: number
  totalEmissionSavings: number
  averagePayback: string
}
