import { useMemo, useState } from 'react'
import { getHormonalAdvice, getGlucoseAdvice } from '../../utils/healthOptimizer'
import type { CravingType } from '../../utils/cycleSwaps'

type DailyWellnessCheckinProps = {
  bodyWeightKg: number
  onCravingChange: (value: CravingType) => void
}

export default function DailyWellnessCheckin({ bodyWeightKg, onCravingChange }: DailyWellnessCheckinProps) {
  const [cycleDate, setCycleDate] = useState(new Date().toISOString().slice(0, 10))
  const [craving, setCraving] = useState<CravingType>('None')
  const [bloating, setBloating] = useState(2)
  const [libido, setLibido] = useState(3)
  const [sleepQuality, setSleepQuality] = useState(3)
  const [stress, setStress] = useState(2)
  const [fatIntake, setFatIntake] = useState(55)
  const [preGlucose, setPreGlucose] = useState(100)
  const [postGlucose, setPostGlucose] = useState(128)

  const hormonalAdvice = useMemo(
    () => getHormonalAdvice(libido, fatIntake, bodyWeightKg),
    [libido, fatIntake, bodyWeightKg],
  )
  const glucoseAdvice = useMemo(() => getGlucoseAdvice(preGlucose, postGlucose), [preGlucose, postGlucose])

  const selectCraving = (value: CravingType) => {
    setCraving(value)
    onCravingChange(value)
  }

  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Daily Wellness</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Discreet check-in for cycle status, cravings, hormonal signals, and glucose tracking.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <label className="text-sm">
          Cycle date
          <input type="date" value={cycleDate} onChange={(event) => setCycleDate(event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" />
        </label>

        <label className="text-sm">
          Bloating (1-5)
          <input type="range" min="1" max="5" value={bloating} onChange={(event) => setBloating(Number(event.target.value))} className="mt-2 w-full" />
          <p className="text-xs text-[var(--muted)]">{bloating}/5</p>
        </label>

        <label className="text-sm">
          Libido (1-5)
          <input type="range" min="1" max="5" value={libido} onChange={(event) => setLibido(Number(event.target.value))} className="mt-2 w-full" />
          <p className="text-xs text-[var(--muted)]">{libido}/5</p>
        </label>

        <label className="text-sm">
          Sleep quality (1-5)
          <input type="range" min="1" max="5" value={sleepQuality} onChange={(event) => setSleepQuality(Number(event.target.value))} className="mt-2 w-full" />
          <p className="text-xs text-[var(--muted)]">{sleepQuality}/5</p>
        </label>

        <label className="text-sm">
          Stress (1-5)
          <input type="range" min="1" max="5" value={stress} onChange={(event) => setStress(Number(event.target.value))} className="mt-2 w-full" />
          <p className="text-xs text-[var(--muted)]">{stress}/5</p>
        </label>

        <label className="text-sm">
          Fat intake (g)
          <input type="number" value={fatIntake} onChange={(event) => setFatIntake(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" />
        </label>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => selectCraving('Sweet')} className={`rounded-xl border p-3 text-left ${craving === 'Sweet' ? 'border-pink-400 bg-pink-500/15' : 'border-[var(--line)]'}`}>
          🍫 Sweet Cravings
        </button>
        <button type="button" onClick={() => selectCraving('Salty')} className={`rounded-xl border p-3 text-left ${craving === 'Salty' ? 'border-cyan-400 bg-cyan-500/15' : 'border-[var(--line)]'}`}>
          🥨 Salty Cravings
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Pre-workout glucose
          <input type="number" value={preGlucose} onChange={(event) => setPreGlucose(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" />
        </label>
        <label className="text-sm">
          Post-workout glucose
          <input type="number" value={postGlucose} onChange={(event) => setPostGlucose(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" />
        </label>
      </div>

      {(hormonalAdvice || glucoseAdvice) && (
        <div className="mt-4 space-y-2 rounded-xl border border-amber-300 bg-amber-500/10 p-3 text-sm">
          {hormonalAdvice && (
            <div>
              <p className="font-semibold">{hormonalAdvice.warning}</p>
              <p>{hormonalAdvice.suggestion}</p>
              <p className="text-xs text-[var(--muted)]">Supplements: {hormonalAdvice.supplements.join(', ')}</p>
            </div>
          )}
          {glucoseAdvice && <p>{glucoseAdvice}</p>}
        </div>
      )}
    </section>
  )
}
