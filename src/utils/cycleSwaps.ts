export type CravingType = 'Salty' | 'Sweet' | 'Both' | 'None'

export type MealSwap = {
  from: string
  to: string
  reason: string
}

export const healthyFixes: Record<CravingType, { substitute: string; nutrients: string }> = {
  Sweet: {
    substitute: 'Greek Yogurt + Stevia + Dark Chocolate',
    nutrients: 'High Protein + Magnesium',
  },
  Salty: {
    substitute: 'Air-popped Popcorn + Sea Salt + Nutritional Yeast',
    nutrients: 'High Fiber + B-Vitamins',
  },
  Both: {
    substitute: 'Chocolate Whey + Almond Butter',
    nutrients: 'Healthy Fats + Dopamine support',
  },
  None: {
    substitute: 'No substitution required',
    nutrients: 'Keep baseline meal template',
  },
}

export const getPeriodFriendlySwap = (cravingType: CravingType): MealSwap[] => {
  if (cravingType === 'Sweet') {
    return [
      {
        from: 'Rice and Chicken',
        to: 'Protein Oats with Dark Chocolate and Berries',
        reason: 'Luteal sweet-craving support with fiber and magnesium',
      },
    ]
  }

  if (cravingType === 'Salty') {
    return [
      {
        from: 'Sweet Potato',
        to: 'Salted Rice Cakes with Avocado and Turkey Breast',
        reason: 'Higher satiety and sodium balance during luteal phase',
      },
    ]
  }

  if (cravingType === 'Both') {
    return [
      {
        from: 'Standard snack block',
        to: 'Greek Yogurt Bowl + Salted Popcorn side',
        reason: 'Covers sweet and salty cravings while maintaining macros',
      },
    ]
  }

  return []
}
