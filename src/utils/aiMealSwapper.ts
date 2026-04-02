import { foodCatalog } from '../data/foodCatalog'
import type { FoodItem } from '../types'

type MacroTarget = {
  protein: number
  carbs: number
  fats: number
}

type SuggestedMeal = {
  title: string
  why: string
  estimatedMacros: MacroTarget
}

const restaurantTemplates: SuggestedMeal[] = [
  {
    title: '150g grilled steak + side salad (no fries)',
    why: 'High protein, moderate fats, cleaner carb control.',
    estimatedMacros: { protein: 36, carbs: 8, fats: 14 },
  },
  {
    title: 'Chicken shawarma plate (double chicken, half rice)',
    why: 'Keeps protein high while limiting rapid-carb overflow.',
    estimatedMacros: { protein: 45, carbs: 35, fats: 12 },
  },
  {
    title: 'Salmon with potatoes and vegetables',
    why: 'Balanced and easier on blood sugar than fast-food combos.',
    estimatedMacros: { protein: 34, carbs: 28, fats: 16 },
  },
]

const macroDistance = (a: MacroTarget, b: MacroTarget) => {
  return Math.abs(a.protein - b.protein) + Math.abs(a.carbs - b.carbs) + Math.abs(a.fats - b.fats)
}

export const getRestaurantSafeBet = (remaining: MacroTarget) => {
  return [...restaurantTemplates].sort(
    (left, right) => macroDistance(remaining, left.estimatedMacros) - macroDistance(remaining, right.estimatedMacros),
  )[0]
}

export const getFridgeModePlan = (ingredientIds: string[], remaining: MacroTarget, sourceCatalog: FoodItem[] = foodCatalog) => {
  const selected = sourceCatalog.filter((item) => ingredientIds.includes(item.id))
  if (selected.length === 0) return []

  const proteinWeight = selected.reduce((sum, food) => sum + food.protein, 0) || 1
  const carbsWeight = selected.reduce((sum, food) => sum + food.carbs, 0) || 1
  const fatsWeight = selected.reduce((sum, food) => sum + food.fats, 0) || 1

  return selected.map((food) => {
    const gramsFromProtein = food.protein > 0 ? (remaining.protein * (food.protein / proteinWeight) * 100) / food.protein : 0
    const gramsFromCarbs = food.carbs > 0 ? (remaining.carbs * (food.carbs / carbsWeight) * 100) / food.carbs : 0
    const gramsFromFats = food.fats > 0 ? (remaining.fats * (food.fats / fatsWeight) * 100) / food.fats : 0

    const raw = [gramsFromProtein, gramsFromCarbs, gramsFromFats].filter((value) => Number.isFinite(value) && value > 0)
    const grams = raw.length > 0 ? Math.round(raw.reduce((sum, value) => sum + value, 0) / raw.length) : 0

    return {
      foodName: food.name,
      grams,
    }
  })
}
