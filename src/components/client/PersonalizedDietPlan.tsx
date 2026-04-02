import { useMemo, useState } from 'react'
import { getPreferredFoodCatalog } from '../../utils/foodPreferences'

type PersonalizedDietPlanProps = {
  preferredFoods: string[]
  blockedFoods: string[]
  lactoseIntolerant: boolean
  hasDiabetes: boolean
  mealsPerDay: number
  snacksPerDay: number
}

type PlanSlot = {
  slot: number
  type: 'Meal' | 'Snack'
  picks: string[]
}

export default function PersonalizedDietPlan({
  preferredFoods,
  blockedFoods,
  lactoseIntolerant,
  hasDiabetes,
  mealsPerDay,
  snacksPerDay,
}: PersonalizedDietPlanProps) {
  const [dailyCalories, setDailyCalories] = useState(2050)

  const availableFoods = useMemo(() => {
    const pool = getPreferredFoodCatalog({
      likedFoods: preferredFoods,
      dislikedFoods: blockedFoods,
      lactoseIntolerant,
    })

    if (!hasDiabetes) return pool
    return pool.filter((item) => item.glycemicIndex !== 'High')
  }, [preferredFoods, blockedFoods, lactoseIntolerant, hasDiabetes])

  const grouped = useMemo(() => {
    return {
      proteins: availableFoods.filter((item) => item.category === 'Protein'),
      carbs: availableFoods.filter((item) => item.category === 'Carb'),
      fats: availableFoods.filter((item) => item.category === 'Fat'),
      vegetables: availableFoods.filter((item) => item.category === 'Vegetable'),
      swaps: availableFoods.filter((item) => item.category === 'Swap'),
    }
  }, [availableFoods])

  const totalSlots = mealsPerDay + snacksPerDay

  const targets = useMemo(() => {
    const protein = Math.round((dailyCalories * 0.3) / 4)
    const carbs = Math.round((dailyCalories * 0.4) / 4)
    const fats = Math.round((dailyCalories * 0.3) / 9)

    return {
      calories: dailyCalories,
      protein,
      carbs,
      fats,
      perSlotCalories: totalSlots > 0 ? Math.round(dailyCalories / totalSlots) : 0,
      perSlotProtein: totalSlots > 0 ? Math.round(protein / totalSlots) : 0,
      perSlotCarbs: totalSlots > 0 ? Math.round(carbs / totalSlots) : 0,
      perSlotFats: totalSlots > 0 ? Math.round(fats / totalSlots) : 0,
    }
  }, [dailyCalories, totalSlots])

  const plan = useMemo(() => {
    const slots: PlanSlot[] = []

    if (totalSlots <= 0) return slots

    for (let i = 0; i < totalSlots; i += 1) {
      const isSnack = i >= mealsPerDay
      if (isSnack) {
        const snackBase = grouped.swaps.length > 0 ? grouped.swaps : grouped.fats
        const snackFood = snackBase.length > 0 ? snackBase[i % snackBase.length].name : 'No snack option'
        slots.push({
          slot: i + 1,
          type: 'Snack',
          picks: [snackFood],
        })
        continue
      }

      const protein = grouped.proteins.length > 0 ? grouped.proteins[i % grouped.proteins.length].name : 'No protein option'
      const carb = grouped.carbs.length > 0 ? grouped.carbs[i % grouped.carbs.length].name : 'No carb option'
      const fat = grouped.fats.length > 0 ? grouped.fats[i % grouped.fats.length].name : 'No fat option'
      const veg = grouped.vegetables.length > 0 ? grouped.vegetables[i % grouped.vegetables.length].name : null

      slots.push({
        slot: i + 1,
        type: 'Meal',
        picks: [protein, carb, fat, veg].filter(Boolean) as string[],
      })
    }

    return slots
  }, [grouped, mealsPerDay, totalSlots])

  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Personalized Diet Plan</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Auto-built from your selected likes/dislikes, lactose mode, diabetes mode, and meal structure.</p>
        </div>
        <label className="text-sm">
          Daily calories
          <input
            type="number"
            min={1200}
            max={5000}
            value={dailyCalories}
            onChange={(event) => setDailyCalories(Number(event.target.value))}
            className="mt-1 block w-36 rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm sm:grid-cols-4">
        <p><span className="font-semibold">Calories:</span> {targets.calories}</p>
        <p><span className="font-semibold">Protein:</span> {targets.protein}g</p>
        <p><span className="font-semibold">Carbs:</span> {targets.carbs}g</p>
        <p><span className="font-semibold">Fats:</span> {targets.fats}g</p>
      </div>

      {availableFoods.length === 0 && (
        <p className="mt-3 rounded-lg border border-rose-300 bg-rose-500/10 p-3 text-sm">
          No foods available after applying client choices. Update likes/dislikes or medical toggles.
        </p>
      )}

      {availableFoods.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {plan.map((slot) => (
            <article key={`${slot.type}-${slot.slot}`} className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm">
              <p className="font-semibold">{slot.type} {slot.slot}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Target: {targets.perSlotCalories} kcal | P {targets.perSlotProtein}g | C {targets.perSlotCarbs}g | F {targets.perSlotFats}g
              </p>
              <ul className="mt-2 list-disc pl-5 text-xs">
                {slot.picks.map((pick) => (
                  <li key={pick}>{pick}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
