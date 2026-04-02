import { useMemo } from 'react'
import type { UserStats } from '../types'
import {
  applyCycleAdjustments,
  caloriesToMacroGrams,
  getCyclePhase,
  getRuleOfThreeHints,
  calculateTdee,
} from '../utils/nutritionEngine'

export function useNutrition(user: UserStats, cycleStartDate?: string) {
  return useMemo(() => {
    const base = calculateTdee(user, user.bodyFat ? 'Katch' : 'Mifflin') + user.goalDelta

    if (!cycleStartDate) {
      return {
        phase: null,
        adjustedCalories: base,
        strategy: 'Standard plan without cycle adjustments.',
        macros: caloriesToMacroGrams(base, { protein: 0.3, carbs: 0.4, fats: 0.3 }),
        hints: [] as string[],
      }
    }

    const start = new Date(cycleStartDate)
    const phase = getCyclePhase(start)
    const adjustment = applyCycleAdjustments(base, phase)

    return {
      phase,
      adjustedCalories: adjustment.calories,
      strategy: adjustment.strategy,
      macros: caloriesToMacroGrams(adjustment.calories, adjustment.split),
      hints: getRuleOfThreeHints(start),
    }
  }, [user, cycleStartDate])
}
