import type { MacroSplit, UserStats } from '../types'

export type CyclePhase = 'Follicular' | 'Ovulation' | 'Luteal'

const KCAL_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fats: 9,
} as const

export const getCyclePhase = (startDate: Date): CyclePhase => {
  const daysElapsed = Math.floor((Date.now() - startDate.getTime()) / (1000 * 3600 * 24))
  const cycleDay = ((daysElapsed % 28) + 28) % 28

  if (cycleDay <= 13) return 'Follicular'
  if (cycleDay === 14) return 'Ovulation'
  return 'Luteal'
}

export const calculateBaseTDEE = (user: UserStats): number => {
  const bmr =
    user.gender === 'male'
      ? 10 * user.weightKg + 6.25 * user.heightCm - 5 * user.age + 5
      : 10 * user.weightKg + 6.25 * user.heightCm - 5 * user.age - 161

  return Math.round(bmr * user.activityFactor)
}

export const calculateCoachCalories = (user: UserStats, phase?: CyclePhase): number => {
  let calories = calculateBaseTDEE(user) + user.goalDelta
  if (phase === 'Luteal') calories += 250
  return Math.round(calories)
}

export const caloriesToMacros = (
  calories: number,
  split: MacroSplit = { protein: 0.3, carbs: 0.4, fats: 0.3 },
): { proteinGrams: number; carbsGrams: number; fatsGrams: number } => {
  return {
    proteinGrams: Math.round((calories * split.protein) / KCAL_PER_GRAM.protein),
    carbsGrams: Math.round((calories * split.carbs) / KCAL_PER_GRAM.carbs),
    fatsGrams: Math.round((calories * split.fats) / KCAL_PER_GRAM.fats),
  }
}
