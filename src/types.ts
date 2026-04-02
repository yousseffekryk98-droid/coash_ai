export type UserRole = 'coach' | 'client'

export type Profile = {
  id: string
  username: string
  role: UserRole
  gender?: string | null
  avatar_url?: string | null
}

export type UserStats = {
  weightKg: number
  heightCm: number
  age: number
  gender: 'male' | 'female'
  bodyFat?: number
  activityFactor: number
  goalDelta: number
}

export type MacroSplit = {
  protein: number
  carbs: number
  fats: number
}

export type GymLog = {
  date: string
  workout_completed: boolean
  rpe?: number
  notes?: string | null
}

export type MacroTemplate = {
  id: number
  name: string
  protein_pct: number
  carb_pct: number
  fat_pct: number
  is_period_adjusted: boolean
}

export type DailyLog = {
  date: string
  calories_target: number
  calories_actual: number
  protein_target: number
  protein_actual: number
  carbs_target: number
  carbs_actual: number
  fats_target: number
  fats_actual: number
}

export type WeightEntry = {
  date: string
  weight: number
}

export type ClientSummary = {
  clientId: string
  clientName: string
  complianceRate: number
  plateauAlert: boolean
}

export type Ingredient = {
  name: string
  amount: number
  proteinPer100g: number
  carbsPer100g: number
  fatsPer100g: number
  caloriesPer100g: number
}

export type PhotoCheckin = {
  id: string
  user_id: string
  week_start: string
  pose_type: 'front' | 'side' | 'back'
  image_path: string
}

export type GlycemicIndex = 'Low' | 'Medium' | 'High'

export type PeriodSwapType = 'Sweet' | 'Salty' | 'None'

export interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
  isDiabetesFriendly: boolean
  isPeriodSwap: PeriodSwapType
  glycemicIndex: GlycemicIndex
  category: 'Protein' | 'Carb' | 'Fat' | 'Vegetable' | 'Swap'
  healthStatus: 'Elite' | 'Good'
  containsLactose?: boolean
  tags?: string[]
}

export type BiomarkerKey =
  | 'testosterone'
  | 'ast'
  | 'alt'
  | 'creatinine'
  | 'egfr'
  | 'ldl'

export type BiomarkerReading = {
  week: number
  marker: BiomarkerKey
  value: number
  unit: string
  minAthleticRange: number
  maxAthleticRange: number
}

export type SupplementProtocolItem = {
  id: string
  name: string
  timing: string
  phaseTarget: 'Any' | 'Luteal' | 'Menstrual'
  inventoryLevel: 'OK' | 'Low'
}

export type VideoFeedbackItem = {
  id: string
  week: number
  title: string
  durationSec: number
  createdAt: string
}
