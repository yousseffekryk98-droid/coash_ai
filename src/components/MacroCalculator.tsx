import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { UserStats } from '../types'
import { caloriesToMacros, calculateCoachCalories, getCyclePhase } from '../utils/nutrition'

type MacroCalculatorProps = {
  cycleStartDate?: string
}

const initial: UserStats = {
  weightKg: 65,
  heightCm: 168,
  age: 27,
  gender: 'female',
  activityFactor: 1.55,
  goalDelta: 0,
}

export default function MacroCalculator({ cycleStartDate }: MacroCalculatorProps) {
  const [stats, setStats] = useState<UserStats>(initial)

  const result = useMemo(() => {
    const phase = cycleStartDate ? getCyclePhase(new Date(cycleStartDate)) : undefined
    const calories = calculateCoachCalories(stats, phase)
    const macros = caloriesToMacros(calories)
    return { phase, calories, macros }
  }, [stats, cycleStartDate])

  const updateNumber = (key: keyof UserStats) => (event: ChangeEvent<HTMLInputElement>) => {
    setStats((prev) => ({ ...prev, [key]: Number(event.target.value) }))
  }

  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Macro Calculator</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Mifflin-St Jeor + cycle-aware calorie adjustments.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">Weight (kg)
          <input className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" type="number" value={stats.weightKg} onChange={updateNumber('weightKg')} />
        </label>
        <label className="text-sm">Height (cm)
          <input className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" type="number" value={stats.heightCm} onChange={updateNumber('heightCm')} />
        </label>
        <label className="text-sm">Age
          <input className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" type="number" value={stats.age} onChange={updateNumber('age')} />
        </label>
        <label className="text-sm">Activity Factor
          <input className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" type="number" step="0.05" value={stats.activityFactor} onChange={updateNumber('activityFactor')} />
        </label>
        <label className="text-sm">Goal Delta
          <input className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" type="number" value={stats.goalDelta} onChange={updateNumber('goalDelta')} />
        </label>
      </div>

      <div className="mt-4 grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] p-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[var(--muted)]">Phase</p>
          <p className="text-lg font-semibold">{result.phase ?? 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)]">Calories</p>
          <p className="text-lg font-semibold">{result.calories}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)]">Protein</p>
          <p className="text-lg font-semibold">{result.macros.proteinGrams}g</p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)]">Carbs / Fats</p>
          <p className="text-lg font-semibold">{result.macros.carbsGrams}g / {result.macros.fatsGrams}g</p>
        </div>
      </div>
    </section>
  )
}
