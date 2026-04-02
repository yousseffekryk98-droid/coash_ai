import { useMemo, useState } from 'react'

export default function GutHealthTracker() {
  const [bloating, setBloating] = useState(6)
  const [day2, setDay2] = useState(8)
  const [day3, setDay3] = useState(8)
  const [fiberGrams, setFiberGrams] = useState(18)
  const calories = 2100

  const warnings = useMemo(() => {
    const list: string[] = []
    const highBloatStreak = [bloating, day2, day3].every((value) => value >= 7)
    if (highBloatStreak) {
      list.push('Bloating >7 for 3 days. Review potential food sensitivities (dairy/gluten/sweeteners).')
    }

    const minFiber = (calories / 1000) * 10
    if (fiberGrams < minFiber) {
      list.push(`Fiber below target. Aim for at least ${Math.round(minFiber)}g/day.`)
    }

    return list
  }, [bloating, day2, day3, fiberGrams, calories])

  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Gut Health Tracker</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Digestion markers to support absorption and blood sugar stability.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Bloating day 1 (1-10)
          <input type="number" min="1" max="10" value={bloating} onChange={(event) => setBloating(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" />
        </label>
        <label className="text-sm">Bloating day 2
          <input type="number" min="1" max="10" value={day2} onChange={(event) => setDay2(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" />
        </label>
        <label className="text-sm">Bloating day 3
          <input type="number" min="1" max="10" value={day3} onChange={(event) => setDay3(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" />
        </label>
        <label className="text-sm">Fiber grams
          <input type="number" value={fiberGrams} onChange={(event) => setFiberGrams(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" />
        </label>
      </div>

      {warnings.length > 0 && (
        <div className="mt-3 space-y-2 rounded-lg border border-amber-300 bg-amber-500/10 p-3 text-sm">
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}
    </section>
  )
}
