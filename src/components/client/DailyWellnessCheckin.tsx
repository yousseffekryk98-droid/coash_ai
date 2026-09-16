import { useMemo, useState } from 'react'
import { CheckCircle2, Save } from 'lucide-react'
import { getHormonalAdvice, getGlucoseAdvice } from '../../utils/healthOptimizer'
import type { CravingType } from '../../utils/cycleSwaps'
import { supabase } from '../../api/supabaseClient'

type DailyWellnessCheckinProps = {
  userId: string
  bodyWeightKg: number
  onCravingChange: (value: CravingType) => void
  onSaved?: () => void
}

export default function DailyWellnessCheckin({ userId, bodyWeightKg, onCravingChange, onSaved }: DailyWellnessCheckinProps) {
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10))
  const [weight, setWeight] = useState(bodyWeightKg)
  const [calorieTarget, setCalorieTarget] = useState(0)
  const [calorieActual, setCalorieActual] = useState(0)
  const [protein, setProtein] = useState(0)
  const [carbs, setCarbs] = useState(0)
  const [fats, setFats] = useState(55)
  const [fiber, setFiber] = useState(0)
  const [craving, setCraving] = useState<CravingType>('None')
  const [bloating, setBloating] = useState(2)
  const [libido, setLibido] = useState(3)
  const [sleepQuality, setSleepQuality] = useState(7)
  const [stress, setStress] = useState(4)
  const [preGlucose, setPreGlucose] = useState(100)
  const [postGlucose, setPostGlucose] = useState(128)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  const hormonalAdvice = useMemo(
    () => getHormonalAdvice(libido, fats, Math.max(weight, 1)),
    [libido, fats, weight],
  )
  const glucoseAdvice = useMemo(() => getGlucoseAdvice(preGlucose, postGlucose), [preGlucose, postGlucose])

  const selectCraving = (value: CravingType) => {
    setCraving(value)
    onCravingChange(value)
  }

  const save = async () => {
    if (!supabase) {
      setStatus('Supabase is not configured, so this preview cannot save logs.')
      return
    }

    setSaving(true)
    setStatus('')

    const { error } = await supabase.from('daily_logs').upsert(
      {
        user_id: userId,
        log_date: logDate,
        weight: weight || null,
        calories_target: calorieTarget || null,
        calories_actual: calorieActual || null,
        protein_actual: protein || null,
        carbs_actual: carbs || null,
        fats_actual: fats || null,
        fiber_actual: fiber || null,
        sleep_quality: sleepQuality,
        stress_level: stress,
        libido,
        cravings_type: craving,
        bloating,
        pre_workout_glucose: preGlucose || null,
        post_workout_glucose: postGlucose || null,
      },
      { onConflict: 'user_id,log_date' },
    )

    if (error) {
      setStatus(error.message)
    } else {
      setStatus('Check-in saved. Your progress analytics are now updated.')
      onSaved?.()
    }

    setSaving(false)
  }

  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <div className="section-heading">
        <div>
          <h2>Daily wellness check-in</h2>
          <p className="page-subtext">Save nutrition, recovery, body weight, cravings, and glucose signals into your real progress history.</p>
        </div>
        <Save size={19} className="text-[var(--muted)]" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="field">Log date
          <input type="date" value={logDate} onChange={(event) => setLogDate(event.target.value)} />
        </label>
        <label className="field">Body weight (kg)
          <input type="number" step="0.1" value={weight} onChange={(event) => setWeight(Number(event.target.value))} />
        </label>
        <label className="field">Calorie target
          <input type="number" min="0" value={calorieTarget} onChange={(event) => setCalorieTarget(Number(event.target.value))} />
        </label>
        <label className="field">Calories eaten
          <input type="number" min="0" value={calorieActual} onChange={(event) => setCalorieActual(Number(event.target.value))} />
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="field">Protein (g)
          <input type="number" min="0" value={protein} onChange={(event) => setProtein(Number(event.target.value))} />
        </label>
        <label className="field">Carbs (g)
          <input type="number" min="0" value={carbs} onChange={(event) => setCarbs(Number(event.target.value))} />
        </label>
        <label className="field">Fats (g)
          <input type="number" min="0" value={fats} onChange={(event) => setFats(Number(event.target.value))} />
        </label>
        <label className="field">Fiber (g)
          <input type="number" min="0" value={fiber} onChange={(event) => setFiber(Number(event.target.value))} />
        </label>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="text-sm">Sleep quality (1-10)
          <input type="range" min="1" max="10" value={sleepQuality} onChange={(event) => setSleepQuality(Number(event.target.value))} className="mt-2 w-full" />
          <p className="text-xs text-[var(--muted)]">{sleepQuality}/10</p>
        </label>
        <label className="text-sm">Stress (1-10)
          <input type="range" min="1" max="10" value={stress} onChange={(event) => setStress(Number(event.target.value))} className="mt-2 w-full" />
          <p className="text-xs text-[var(--muted)]">{stress}/10</p>
        </label>
        <label className="text-sm">Libido (1-5)
          <input type="range" min="1" max="5" value={libido} onChange={(event) => setLibido(Number(event.target.value))} className="mt-2 w-full" />
          <p className="text-xs text-[var(--muted)]">{libido}/5</p>
        </label>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {(['None', 'Sweet', 'Salty', 'Both'] as CravingType[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => selectCraving(value)}
            className={`rounded-xl border p-3 text-left text-sm font-semibold ${craving === value ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]' : 'border-[var(--line)] bg-[var(--panel-muted)]'}`}
          >
            {value === 'None' ? 'No cravings' : `${value} cravings`}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="field">Bloating (1-10)
          <input type="number" min="1" max="10" value={bloating} onChange={(event) => setBloating(Number(event.target.value))} />
        </label>
        <label className="field">Pre-workout glucose
          <input type="number" min="0" value={preGlucose} onChange={(event) => setPreGlucose(Number(event.target.value))} />
        </label>
        <label className="field">Post-workout glucose
          <input type="number" min="0" value={postGlucose} onChange={(event) => setPostGlucose(Number(event.target.value))} />
        </label>
      </div>

      {(hormonalAdvice || glucoseAdvice) && (
        <div className="mt-4 space-y-2 rounded-xl border border-amber-300/70 bg-amber-500/10 p-3 text-sm">
          {hormonalAdvice && (
            <div>
              <p className="font-semibold">{hormonalAdvice.warning}</p>
              <p>{hormonalAdvice.suggestion}</p>
              <p className="text-xs text-[var(--muted)]">Supplement suggestions: {hormonalAdvice.supplements.join(', ')}</p>
            </div>
          )}
          {glucoseAdvice && <p>{glucoseAdvice}</p>}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" className="button-primary" onClick={save} disabled={saving}>
          <Save size={17} /> {saving ? 'Saving...' : 'Save check-in'}
        </button>
        {status && (
          <p className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
            {!status.toLowerCase().includes('unable') && !status.toLowerCase().includes('error') && <CheckCircle2 size={16} className="text-emerald-600" />}
            {status}
          </p>
        )}
      </div>
    </section>
  )
}
