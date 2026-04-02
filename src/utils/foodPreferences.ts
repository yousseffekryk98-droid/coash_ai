import { foodCatalog } from '../data/foodCatalog'
import type { FoodItem } from '../types'

export const LACTOSE_INTOLERANT_FLAG = '__LACTOSE_INTOLERANT__'

export type FoodPreferences = {
  likedFoods?: string[]
  dislikedFoods?: string[]
  lactoseIntolerant?: boolean
}

export const getPreferredFoodCatalog = (preferences: FoodPreferences): FoodItem[] => {
  const likedFoods = new Set(preferences.likedFoods ?? [])
  const dislikedFoods = new Set((preferences.dislikedFoods ?? []).filter((item) => item !== LACTOSE_INTOLERANT_FLAG))
  const lactoseIntolerant = Boolean(preferences.lactoseIntolerant)

  const allowed = foodCatalog.filter((food) => {
    if (lactoseIntolerant && food.containsLactose) return false
    if (dislikedFoods.has(food.name)) return false
    return true
  })

  return allowed.sort((left, right) => {
    const leftLiked = likedFoods.has(left.name)
    const rightLiked = likedFoods.has(right.name)

    if (leftLiked && !rightLiked) return -1
    if (!leftLiked && rightLiked) return 1
    return left.name.localeCompare(right.name)
  })
}
