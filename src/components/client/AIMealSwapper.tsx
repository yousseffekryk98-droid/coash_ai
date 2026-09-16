import { useMemo, useState } from 'react'
import { getFridgeModePlan, getRestaurantSafeBet } from '../../utils/aiMealSwapper'
import { getPreferredFoodCatalog } from '../../utils/foodPreferences'

type AIMealSwapperProps = {
  preferredFoods?: string[]
  blockedFoods?: string[]
  lactoseIntolerant?: boolean
}

export default function AIMealSwapper({ preferredFoods = [], blockedFoods = [], lactoseIntolerant = false }: AIMealSwapperProps) {
  const [protein, setProtein] = useState(40)
  const [carbs, setCarbs] = useState(35)
  const [fats, setFats] = useState(14)
  const [restaurantPrompt, setRestaurantPrompt] = useState("I'm at a restaurant")
  const [picked, setPicked] = useState<string[]>([])

  const availableFoods = useMemo(
    () => getPreferredFoodCatalog({ likedFoods: preferredFoods, dislikedFoods: blockedFoods, lactoseIntolerant }),
    [preferredFoods, blockedFoods, lactoseIntolerant],
  )
  const availableIds = new Set(availableFoods.map((item) => item.id))
  const validPicked = picked.filter((id) => availableIds.has(id)).slice(0, 3)
  const remaining = { protein, carbs, fats }
  const safeBet = getRestaurantSafeBet(remaining)
  const fridgePlan = getFridgeModePlan(validPicked, remaining, availableFoods)

  const toggleIngredient = (id: string) => {
    setPicked((previous) => {
      const current = previous.filter((item) => availableIds.has(item)).slice(0, 3)
      return current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(0, 3)
    })
  }

  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">AI-Assisted Meal Swapper</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Restaurant mode and fridge mode to preserve adherence under real-life constraints.</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-sm">Protein left
          <input type="number" value={protein} onChange={(event) => setProtein(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" />
        </label>
        <label className="text-sm">Carbs left
          <input type="number" value={carbs} onChange={(event) => setCarbs(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" />
        </label>
        <label className="text-sm">Fats left
          <input type="number" value={fats} onChange={(event) => setFats(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" />
        </label>
      </div>

      <div className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm">
        <label className="block">
          Restaurant prompt
          <input value={restaurantPrompt} onChange={(event) => setRestaurantPrompt(event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-transparent p-2" />
        </label>
        <p className="mt-2 text-xs text-[var(--muted)]">Best safe bet for remaining macros:</p>
        <p className="font-semibold">{safeBet.title}</p>
        <p className="text-xs text-[var(--muted)]">{safeBet.why}</p>
      </div>

      <div className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm">
        <p className="font-semibold">Fridge Mode (pick up to 3 items)</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {availableFoods.slice(0, 12).map((item) => (
            <label key={item.id} className="inline-flex items-center gap-2 text-xs">
              <input type="checkbox" checked={validPicked.includes(item.id)} onChange={() => toggleIngredient(item.id)} />
              {item.name}
            </label>
          ))}
        </div>
        <div className="mt-2 space-y-1 text-xs">
          {availableFoods.length === 0 && <p className="text-[var(--muted)]">No foods are available from current preferences. Update likes/dislikes in onboarding.</p>}
          {availableFoods.length > 0 && fridgePlan.length === 0 && <p className="text-[var(--muted)]">Select ingredients to generate exact grams.</p>}
          {fridgePlan.map((item) => (
            <p key={item.foodName}>{item.foodName}: {item.grams}g</p>
          ))}
        </div>
      </div>
    </section>
  )
}
