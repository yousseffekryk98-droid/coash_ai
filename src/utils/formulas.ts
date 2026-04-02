import type { UserStats } from '../types'

export const calculateCoachStats = (
  weight: number,
  bf: number,
  activity: number,
  formula: 'Mifflin' | 'Katch',
  context?: Pick<UserStats, 'heightCm' | 'age' | 'gender'>,
) => {
  let bmr = 0

  if (formula === 'Katch' && bf > 0) {
    const leanMass = weight * (1 - bf / 100)
    bmr = 370 + 21.6 * leanMass
  } else {
    const height = context?.heightCm ?? 175
    const age = context?.age ?? 20
    const male = (context?.gender ?? 'male') === 'male'
    bmr = 10 * weight + 6.25 * height - 5 * age + (male ? 5 : -161)
  }

  return Math.round(bmr * activity)
}
