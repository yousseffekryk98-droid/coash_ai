type HormonalAdvice = {
  warning: string
  suggestion: string
  supplements: string[]
}

export const getHormonalAdvice = (libidoScore: number, fatIntake: number, bodyWeightKg: number): HormonalAdvice | null => {
  if (libidoScore <= 2 && fatIntake < 40) {
    return {
      warning: 'Hormonal levels may be dropping due to low fat intake.',
      suggestion: `Increase healthy fats to ~${Math.round(bodyWeightKg * 0.8)}g/day (0.8g per kg).`,
      supplements: ['Zinc', 'Vitamin D3', 'Omega-3', 'Magnesium', 'Ashwagandha'],
    }
  }

  return null
}

export const detectCrashAlert = (
  libidoHistory: number[],
  energyHistory: number[],
  weightDelta14d: number,
): string | null => {
  const lowLibidoStreak = libidoHistory.slice(-3).every((value) => value <= 2)
  const lowEnergyStreak = energyHistory.slice(-3).every((value) => value <= 2)
  const stalledWeight = Math.abs(weightDelta14d) < 0.15

  if (lowLibidoStreak && lowEnergyStreak && stalledWeight) {
    return 'Potential metabolic adaptation detected. Consider refeed and higher fat intake.'
  }

  return null
}

export const getGlucoseAdvice = (pre: number, post: number): string | null => {
  if (post - pre >= 35 || post >= 180) {
    return 'Glucose spike detected. Recommend a 15-minute post-meal walk and lower-GI carb swap.'
  }
  return null
}

export const lowGiPriorityFoods = ['Sweet Potato', 'Basmati Rice', 'Oats', 'Quinoa', 'Legumes']
