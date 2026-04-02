import { useEffect, useMemo, useState } from 'react'
import { foodCatalog } from '../../data/foodCatalog'
import { getCyclePhase } from '../../utils/nutritionEngine'
import { calculateFoodFromGrams, getDiabetesGiWarning, getLutealCravingSuggestion } from '../../utils/foodLogic'
import type { CravingType } from '../../utils/cycleSwaps'
import { getPreferredFoodCatalog } from '../../utils/foodPreferences'

type FoodSelectorCalculatorProps = {
  hasDiabetes: boolean
  craving: CravingType
  cycleStartDate: string
  preferredFoods?: string[]
  blockedFoods?: string[]
  lactoseIntolerant?: boolean
}

export default function FoodSelectorCalculator({
  hasDiabetes,
  craving,
  cycleStartDate,
  preferredFoods = [],
  blockedFoods = [],
  lactoseIntolerant = false,
}: FoodSelectorCalculatorProps) {
  const selectableFoods = useMemo(
    () => getPreferredFoodCatalog({ likedFoods: preferredFoods, dislikedFoods: blockedFoods, lactoseIntolerant }),
    [preferredFoods, blockedFoods, lactoseIntolerant],
  )

  const [foodId, setFoodId] = useState(foodCatalog[0].id)
  const [grams, setGrams] = useState(150)

  useEffect(() => {
    if (selectableFoods.length === 0) return
    const stillAvailable = selectableFoods.some((item) => item.id === foodId)
    if (!stillAvailable) {
      setFoodId(selectableFoods[0].id)
    }
  }, [selectableFoods, foodId])

  const selectedFood = selectableFoods.find((item) => item.id === foodId) ?? selectableFoods[0] ?? foodCatalog[0]
  const macros = useMemo(() => calculateFoodFromGrams(selectedFood, grams), [selectedFood, grams])
  const phase = getCyclePhase(new Date(cycleStartDate))
  const giWarning = getDiabetesGiWarning(hasDiabetes, selectedFood)
  const lutealSuggestion = getLutealCravingSuggestion(phase, craving)

  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Food Selector and Medical Guardrails</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Calculates meal macros by grams and applies diabetes and cycle-aware suggestions.</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Food item
          <select
            value={foodId}
            onChange={(event) => setFoodId(event.target.value)}
            className="mt-1 block w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2"
            disabled={selectableFoods.length === 0}
          >
            {selectableFoods.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Grams
          <input
            type="number"
            value={grams}
            onChange={(event) => setGrams(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm sm:grid-cols-5">
        <p><span className="font-semibold">Calories:</span> {macros.calories}</p>
        <p><span className="font-semibold">Protein:</span> {macros.protein}g</p>
        <p><span className="font-semibold">Carbs:</span> {macros.carbs}g</p>
        <p><span className="font-semibold">Fats:</span> {macros.fats}g</p>
        <p><span className="font-semibold">Fiber:</span> {macros.fiber}g</p>
      </div>

      <div className="mt-3 space-y-2 text-sm">
        {selectableFoods.length === 0 && <p className="rounded-lg border border-rose-300 bg-rose-500/10 p-2">No foods left after current preferences. Edit likes/dislikes to continue.</p>}
        <p className="text-[var(--muted)]">Cycle phase: {phase}</p>
        {giWarning && <p className="rounded-lg border border-amber-300 bg-amber-500/10 p-2">{giWarning}</p>}
        {lutealSuggestion && (
          <p className="rounded-lg border border-emerald-300 bg-emerald-500/10 p-2">{lutealSuggestion}</p>
        )}
      </div>
    </section>
  )
}
