import type { DailyLog, GymLog, Ingredient, PhotoCheckin, Profile, WeightEntry } from '../types'

export const demoCoach: Profile = {
  id: 'demo-coach-id',
  username: 'Coach Youssef',
  role: 'coach',
}

export const demoClient: Profile = {
  id: 'demo-client-id',
  username: 'Sarah',
  role: 'client',
  gender: 'female',
}

export const demoGymLogs: GymLog[] = [
  { date: '2026-04-01', workout_completed: true, rpe: 8, notes: 'Good tempo on squats.' },
  { date: '2026-04-02', workout_completed: true, rpe: 10, notes: 'High fatigue reported.' },
  { date: '2026-04-03', workout_completed: true, rpe: 10, notes: 'Second max effort day.' },
  { date: '2026-04-04', workout_completed: true, rpe: 10, notes: 'Third RPE 10, deload suggested.' },
  { date: '2026-04-05', workout_completed: false, rpe: 4, notes: 'Active recovery day.' },
  { date: '2026-04-06', workout_completed: true, rpe: 7, notes: 'New PR on hip thrusts.' },
  { date: '2026-04-07', workout_completed: true, rpe: 8, notes: 'Stable output.' },
]

export const demoDailyLogs: DailyLog[] = [
  {
    date: '2026-04-01',
    calories_target: 2050,
    calories_actual: 2008,
    protein_target: 145,
    protein_actual: 143,
    carbs_target: 220,
    carbs_actual: 216,
    fats_target: 63,
    fats_actual: 64,
  },
  {
    date: '2026-04-02',
    calories_target: 2050,
    calories_actual: 2097,
    protein_target: 145,
    protein_actual: 139,
    carbs_target: 220,
    carbs_actual: 228,
    fats_target: 63,
    fats_actual: 65,
  },
  {
    date: '2026-04-03',
    calories_target: 2050,
    calories_actual: 2014,
    protein_target: 145,
    protein_actual: 147,
    carbs_target: 220,
    carbs_actual: 211,
    fats_target: 63,
    fats_actual: 62,
  },
  {
    date: '2026-04-04',
    calories_target: 2050,
    calories_actual: 2122,
    protein_target: 145,
    protein_actual: 142,
    carbs_target: 220,
    carbs_actual: 234,
    fats_target: 63,
    fats_actual: 66,
  },
  {
    date: '2026-04-05',
    calories_target: 2050,
    calories_actual: 1987,
    protein_target: 145,
    protein_actual: 146,
    carbs_target: 220,
    carbs_actual: 205,
    fats_target: 63,
    fats_actual: 61,
  },
  {
    date: '2026-04-06',
    calories_target: 2050,
    calories_actual: 2039,
    protein_target: 145,
    protein_actual: 145,
    carbs_target: 220,
    carbs_actual: 220,
    fats_target: 63,
    fats_actual: 63,
  },
  {
    date: '2026-04-07',
    calories_target: 2050,
    calories_actual: 2018,
    protein_target: 145,
    protein_actual: 144,
    carbs_target: 220,
    carbs_actual: 214,
    fats_target: 63,
    fats_actual: 64,
  },
]

export const demoWeightTrend: WeightEntry[] = [
  { date: 'Mar 18', weight: 62.1 },
  { date: 'Mar 21', weight: 62.0 },
  { date: 'Mar 24', weight: 62.0 },
  { date: 'Mar 27', weight: 62.1 },
  { date: 'Mar 30', weight: 62.0 },
  { date: 'Apr 02', weight: 62.2 },
  { date: 'Apr 05', weight: 62.1 },
]

export const demoWeightTrendLastYear: WeightEntry[] = [
  { date: 'Mar 18', weight: 64.4 },
  { date: 'Mar 21', weight: 64.0 },
  { date: 'Mar 24', weight: 63.7 },
  { date: 'Mar 27', weight: 63.5 },
  { date: 'Mar 30', weight: 63.2 },
  { date: 'Apr 02', weight: 62.9 },
  { date: 'Apr 05', weight: 62.7 },
]

export const demoCheckins: PhotoCheckin[] = [
  { id: 'p1', user_id: demoClient.id, week_start: '2026-03-10', pose_type: 'front', image_path: 'demo/front-w1.jpg' },
  { id: 'p2', user_id: demoClient.id, week_start: '2026-03-17', pose_type: 'front', image_path: 'demo/front-w2.jpg' },
  { id: 'p3', user_id: demoClient.id, week_start: '2026-03-24', pose_type: 'front', image_path: 'demo/front-w3.jpg' },
  { id: 'p4', user_id: demoClient.id, week_start: '2026-03-31', pose_type: 'front', image_path: 'demo/front-w4.jpg' },
]

export const demoRecipe: Ingredient[] = [
  {
    name: 'Chicken Breast',
    amount: 180,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatsPer100g: 3.6,
    caloriesPer100g: 165,
  },
  {
    name: 'Rice',
    amount: 150,
    proteinPer100g: 2.7,
    carbsPer100g: 28,
    fatsPer100g: 0.3,
    caloriesPer100g: 130,
  },
]
