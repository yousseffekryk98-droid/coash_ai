import type { Ingredient } from '../types'

export type MacroSource = {
  proteinPer100g: number
  carbsPer100g: number
  fatsPer100g: number
}

export type MacroTarget = {
  proteinTarget: number
  carbsTarget?: number
  fatsTarget?: number
}

export const calculateGramsForProteinTarget = (proteinPer100g: number, proteinTarget: number): number => {
  if (proteinPer100g <= 0) return 0
  return Number(((proteinTarget / proteinPer100g) * 100).toFixed(1))
}

export const scaleRecipeToMacroTarget = (source: MacroSource, target: MacroTarget) => {
  const baseGrams = calculateGramsForProteinTarget(source.proteinPer100g, target.proteinTarget)
  const carbs = Number(((source.carbsPer100g / 100) * baseGrams).toFixed(1))
  const fats = Number(((source.fatsPer100g / 100) * baseGrams).toFixed(1))

  return {
    grams: baseGrams,
    achieved: {
      protein: target.proteinTarget,
      carbs,
      fats,
    },
    withinOptionalTargets: {
      carbs:
        typeof target.carbsTarget === 'number'
          ? Math.abs(target.carbsTarget - carbs) <= Math.max(2, target.carbsTarget * 0.05)
          : true,
      fats:
        typeof target.fatsTarget === 'number'
          ? Math.abs(target.fatsTarget - fats) <= Math.max(2, target.fatsTarget * 0.05)
          : true,
    },
  }
}

export const scaleRecipeByProteinTarget = (recipe: Ingredient[], targetProtein: number) => {
  const currentProtein = recipe.reduce((sum, item) => sum + (item.amount * item.proteinPer100g) / 100, 0)
  const scaleFactor = currentProtein > 0 ? targetProtein / currentProtein : 0

  return recipe.map((item) => ({
    ...item,
    newAmount: Math.round(item.amount * scaleFactor),
  }))
}

export const scaleRecipeByCalories = (recipe: Ingredient[], targetCalories: number) => {
  const currentCalories = recipe.reduce((sum, item) => sum + (item.amount * item.caloriesPer100g) / 100, 0)
  const scaleFactor = currentCalories > 0 ? targetCalories / currentCalories : 0

  return recipe.map((item) => ({
    ...item,
    newAmount: Math.round(item.amount * scaleFactor),
  }))
}
