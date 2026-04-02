import type { FoodItem } from '../types'
import type { CravingType } from './cycleSwaps'

export const calculateFoodFromGrams = (food: FoodItem, grams: number) => {
  const ratio = Math.max(grams, 0) / 100
  return {
    calories: Number((food.calories * ratio).toFixed(1)),
    protein: Number((food.protein * ratio).toFixed(1)),
    carbs: Number((food.carbs * ratio).toFixed(1)),
    fats: Number((food.fats * ratio).toFixed(1)),
    fiber: Number((food.fiber * ratio).toFixed(1)),
  }
}

export const getDiabetesGiWarning = (hasDiabetes: boolean, food: FoodItem): string | null => {
  if (hasDiabetes && food.glycemicIndex === 'High') {
    return 'High GI food selected. Prefer lower GI options for better blood sugar stability.'
  }
  return null
}

export const getLutealCravingSuggestion = (
  phase: 'Follicular' | 'Ovulation' | 'Luteal' | 'Menstrual',
  craving: CravingType,
): string | null => {
  if (phase !== 'Luteal') return null

  if (craving === 'Sweet') {
    return 'Suggested swap: Protein Oats with Dark Chocolate and Berries.'
  }
  if (craving === 'Salty') {
    return 'Suggested swap: Salted Rice Cakes with Avocado and Turkey Breast.'
  }
  if (craving === 'Both') {
    return 'Suggested swap: Greek Yogurt bowl plus sea-salt popcorn side.'
  }

  return null
}
