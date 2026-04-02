import type { MacroSplit, UserStats } from '../types'

export type CyclePhase = 'Follicular' | 'Ovulation' | 'Luteal' | 'Menstrual'

type FormulaMode = 'Mifflin' | 'Katch'

const KCAL_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fats: 9,
} as const

export const getCycleDay = (startDate: Date, cycleLength = 28): number => {
  const daysElapsed = Math.floor((Date.now() - startDate.getTime()) / (1000 * 3600 * 24))
  return (((daysElapsed % cycleLength) + cycleLength) % cycleLength) + 1
}

export const getCyclePhase = (startDate: Date, cycleLength = 28): CyclePhase => {
  const day = getCycleDay(startDate, cycleLength)
  if (day <= 5) return 'Menstrual'
  if (day <= 13) return 'Follicular'
  if (day === 14) return 'Ovulation'
  return 'Luteal'
}

export const getRuleOfThreeHints = (startDate: Date, cycleLength = 28): string[] => {
  const day = getCycleDay(startDate, cycleLength)
  if (day >= cycleLength - 2 || day <= 2) {
    return [
      'Increase magnesium-rich foods for 3 days pre-period.',
      'Prioritize hydration and anti-inflammatory meals.',
    ]
  }

  if (day <= 5) {
    return [
      'Use active recovery and lower intensity sessions.',
      'Add iron-rich proteins and omega-3 sources.',
    ]
  }

  if (day <= 13) {
    return ['Return to high intensity and PR attempts.']
  }

  return ['Use high-fiber foods and monitor cravings during luteal phase.']
}

export const calculateBmr = (user: UserStats, mode: FormulaMode = 'Mifflin'): number => {
  if (mode === 'Katch' && typeof user.bodyFat === 'number' && user.bodyFat > 0) {
    const leanMass = user.weightKg * (1 - user.bodyFat / 100)
    return 370 + 21.6 * leanMass
  }

  return user.gender === 'male'
    ? 10 * user.weightKg + 6.25 * user.heightCm - 5 * user.age + 5
    : 10 * user.weightKg + 6.25 * user.heightCm - 5 * user.age - 161
}

export const calculateTdee = (user: UserStats, mode: FormulaMode = 'Mifflin'): number => {
  return Math.round(calculateBmr(user, mode) * user.activityFactor)
}

export const applyCycleAdjustments = (
  baseCalories: number,
  phase: CyclePhase,
  lutealBump = 250,
): { calories: number; split: MacroSplit; strategy: string } => {
  if (phase === 'Follicular') {
    return {
      calories: baseCalories,
      split: { protein: 0.3, carbs: 0.45, fats: 0.25 },
      strategy: 'High carb and lower fat for heavy lifts.',
    }
  }

  if (phase === 'Ovulation') {
    return {
      calories: baseCalories + 80,
      split: { protein: 0.32, carbs: 0.43, fats: 0.25 },
      strategy: 'Peak strength window, maximize training quality.',
    }
  }

  if (phase === 'Luteal') {
    return {
      calories: baseCalories + lutealBump,
      split: { protein: 0.3, carbs: 0.35, fats: 0.35 },
      strategy: 'Apply calorie bump and increase fats/fiber.',
    }
  }

  return {
    calories: baseCalories - 100,
    split: { protein: 0.32, carbs: 0.33, fats: 0.35 },
    strategy: 'Deload week with anti-inflammatory focus.',
  }
}

export const caloriesToMacroGrams = (calories: number, split: MacroSplit) => {
  return {
    protein: Math.round((calories * split.protein) / KCAL_PER_GRAM.protein),
    carbs: Math.round((calories * split.carbs) / KCAL_PER_GRAM.carbs),
    fats: Math.round((calories * split.fats) / KCAL_PER_GRAM.fats),
  }
}
