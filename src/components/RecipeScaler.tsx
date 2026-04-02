import { useMemo, useState } from 'react'
import { scaleRecipeToMacroTarget } from '../utils/recipeScaler'

export default function RecipeScaler() {
  const [proteinPer100g, setProteinPer100g] = useState(31)
  const [carbsPer100g, setCarbsPer100g] = useState(0)
  const [fatsPer100g, setFatsPer100g] = useState(3.6)
  const [proteinTarget, setProteinTarget] = useState(42)

  const output = useMemo(
    () => scaleRecipeToMacroTarget({ proteinPer100g, carbsPer100g, fatsPer100g }, { proteinTarget }),
    [proteinPer100g, carbsPer100g, fatsPer100g, proteinTarget],
  )

  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Recipe Scaler</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Example: transform 100g chicken into the exact grams needed for target protein.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">Protein /100g
          <input type="number" className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" value={proteinPer100g} onChange={(event) => setProteinPer100g(Number(event.target.value))} />
        </label>
        <label className="text-sm">Carbs /100g
          <input type="number" className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" value={carbsPer100g} onChange={(event) => setCarbsPer100g(Number(event.target.value))} />
        </label>
        <label className="text-sm">Fats /100g
          <input type="number" className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" value={fatsPer100g} onChange={(event) => setFatsPer100g(Number(event.target.value))} />
        </label>
        <label className="text-sm">Protein target
          <input type="number" className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" value={proteinTarget} onChange={(event) => setProteinTarget(Number(event.target.value))} />
        </label>
      </div>

      <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] p-3">
        <p className="text-sm text-[var(--muted)]">Use</p>
        <p className="text-2xl font-bold">{output.grams}g</p>
        <p className="text-sm text-[var(--muted)]">to reach {proteinTarget}g protein ({output.achieved.carbs}g carbs / {output.achieved.fats}g fats)</p>
      </div>
    </section>
  )
}
