import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../api/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { foodCatalog } from '../data/foodCatalog'
import { LACTOSE_INTOLERANT_FLAG } from '../utils/foodPreferences'

type FormState = {
  fullName: string
  email: string
  password: string
  role: 'coach' | 'client'
  gender: string
  age: number
  weightKg: number
  heightCm: number
  goal: string
  hasDiabetes: boolean
  lactoseIntolerant: boolean
  insulinSensitivity: 'Low' | 'Medium' | 'High'
  cycleStartDate: string
  cycleLengthDays: number
  periodLengthDays: number
  activityLevel: 'Inactive' | 'Lightly Active' | 'Active' | 'Very Active'
  mealsPerDay: number
  snacksPerDay: number
  likedFoods: string[]
  dislikedFoods: string[]
  medicalNotes: string
}

const initialState: FormState = {
  fullName: '',
  email: '',
  password: '',
  role: 'client',
  gender: 'female',
  age: 25,
  weightKg: 65,
  heightCm: 168,
  goal: 'Fat Loss',
  hasDiabetes: false,
  lactoseIntolerant: false,
  insulinSensitivity: 'Medium',
  cycleStartDate: '',
  cycleLengthDays: 28,
  periodLengthDays: 5,
  activityLevel: 'Active',
  mealsPerDay: 4,
  snacksPerDay: 1,
  likedFoods: [],
  dislikedFoods: [],
  medicalNotes: '',
}

const activityLevels: Record<FormState['activityLevel'], number> = {
  Inactive: 1.2,
  'Lightly Active': 1.375,
  Active: 1.55,
  'Very Active': 1.725,
}

export default function SignUpPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(initialState)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [foodSearch, setFoodSearch] = useState('')
  const [foodCategory, setFoodCategory] = useState<'All' | 'Protein' | 'Carb' | 'Fat' | 'Vegetable' | 'Swap'>('All')
  const isFemale = form.gender === 'female'

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const canSubmit = useMemo(() => {
    const hasCore = form.fullName.trim().length > 1 && form.email.includes('@') && form.password.length >= 8
    if (!hasCore) return false

    if (isFemale) {
      return (
        form.cycleStartDate.length > 0
        && form.cycleLengthDays >= 21
        && form.cycleLengthDays <= 40
        && form.periodLengthDays >= 1
        && form.periodLengthDays <= 10
      )
    }

    if (form.mealsPerDay < 3 || form.mealsPerDay > 6) return false
    if (form.snacksPerDay < 1 || form.snacksPerDay > 2) return false
    return true
  }, [form, isFemale])

  const activityFactor = activityLevels[form.activityLevel]
  const bmr = useMemo(() => {
    return form.gender === 'male'
      ? Math.round(10 * form.weightKg + 6.25 * form.heightCm - 5 * form.age + 5)
      : Math.round(10 * form.weightKg + 6.25 * form.heightCm - 5 * form.age - 161)
  }, [form.gender, form.weightKg, form.heightCm, form.age])

  const estimatedTdee = Math.round(bmr * activityFactor)

  const visibleFoods = useMemo(() => {
    return foodCatalog.filter((food) => {
      const byCategory = foodCategory === 'All' ? true : food.category === foodCategory
      const bySearch = food.name.toLowerCase().includes(foodSearch.toLowerCase())
      const byLactose = form.lactoseIntolerant ? !food.containsLactose : true
      return byCategory && bySearch && byLactose
    })
  }, [foodCategory, foodSearch, form.lactoseIntolerant])

  const toggleFood = (list: 'likedFoods' | 'dislikedFoods', name: string) => {
    setForm((prev) => {
      const current = prev[list]
      const has = current.includes(name)
      const next = has ? current.filter((item) => item !== name) : [...current, name]

      const oppositeList = list === 'likedFoods' ? 'dislikedFoods' : 'likedFoods'
      const oppositeNext = prev[oppositeList].filter((item) => item !== name)

      return {
        ...prev,
        [list]: next,
        [oppositeList]: oppositeNext,
      }
    })
  }

  const toggleLactoseIntolerant = (checked: boolean) => {
    setForm((prev) => {
      if (!checked) {
        return {
          ...prev,
          lactoseIntolerant: false,
          dislikedFoods: prev.dislikedFoods.filter((item) => item !== LACTOSE_INTOLERANT_FLAG),
        }
      }

      const lactoseFoods = foodCatalog.filter((food) => food.containsLactose).map((food) => food.name)
      return {
        ...prev,
        lactoseIntolerant: true,
        dislikedFoods: Array.from(new Set([...prev.dislikedFoods, ...lactoseFoods, LACTOSE_INTOLERANT_FLAG])),
        likedFoods: prev.likedFoods.filter((food) => !lactoseFoods.includes(food)),
      }
    })
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) {
      setStatus('Please fill all required fields and use a stronger password.')
      return
    }

    if (!supabase) {
      setStatus('Supabase not configured. Use demo buttons on Login for now.')
      return
    }

    try {
      setSaving(true)
      setStatus('Creating account...')

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            role: form.role,
          },
        },
      })

      if (error) {
        setStatus(error.message)
        return
      }

      const userId = data.user?.id
      if (!userId) {
        setStatus('Account created. Please verify your email and log in.')
        return
      }

      await supabase.from('profiles').upsert({
        id: userId,
        username: form.fullName,
        role: form.role,
        gender: form.gender,
        has_diabetes: form.hasDiabetes,
        insulin_sensitivity: form.insulinSensitivity,
        medical_notes: form.medicalNotes || null,
      })

      await supabase.from('client_metrics').upsert({
        user_id: userId,
        weight: form.weightKg,
        height: form.heightCm,
      })

      await supabase.from('client_diet_preferences').upsert({
        user_id: userId,
        activity_level: form.activityLevel,
        activity_factor: activityFactor,
        meals_per_day: form.mealsPerDay,
        snacks_per_day: form.snacksPerDay,
        liked_foods: form.likedFoods,
        disliked_foods: form.lactoseIntolerant
          ? Array.from(new Set([...form.dislikedFoods, LACTOSE_INTOLERANT_FLAG]))
          : form.dislikedFoods.filter((item) => item !== LACTOSE_INTOLERANT_FLAG),
      })

      if (isFemale && form.cycleStartDate) {
        await supabase.from('period_data').upsert({
          user_id: userId,
          last_start_date: form.cycleStartDate,
          avg_cycle_length: form.cycleLengthDays,
          period_length_days: form.periodLengthDays,
          luteal_calorie_bump: 250,
        })
      }

      setStatus('Account created successfully. Please confirm your email, then sign in.')
      navigate('/login')
    } finally {
      setSaving(false)
    }
  }

  if (profile) {
    return <Navigate to={profile.role === 'coach' ? '/admin' : '/dashboard'} replace />
  }

  return (
    <main className="auth-shell">
      <section className="auth-card card-entrance">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">FuelForge Onboarding</p>
            <h1 className="mt-1 text-2xl font-bold">Create Your Account</h1>
            <p className="page-subtext">Complete your profile so the app can personalize nutrition and health logic.</p>
          </div>
          <Link to="/login" className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-2 text-sm font-semibold">
            Back to Login
          </Link>
        </div>

        <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
          <label className="field">Full Name *
            <input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} />
          </label>
          <label className="field">Email *
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </label>
          <label className="field">Password *
            <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} />
          </label>
          <label className="field">Role
            <select value={form.role} onChange={(e) => update('role', e.target.value as 'coach' | 'client')}>
              <option value="client">Client</option>
              <option value="coach">Coach</option>
            </select>
          </label>
          <label className="field">Gender
            <select value={form.gender} onChange={(e) => update('gender', e.target.value)}>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
          <label className="field">Age
            <input type="number" value={form.age} onChange={(e) => update('age', Number(e.target.value))} />
          </label>
          <label className="field">Weight (kg)
            <input type="number" value={form.weightKg} onChange={(e) => update('weightKg', Number(e.target.value))} />
          </label>
          <label className="field">Height (cm)
            <input type="number" value={form.heightCm} onChange={(e) => update('heightCm', Number(e.target.value))} />
          </label>
          <label className="field">Goal
            <select value={form.goal} onChange={(e) => update('goal', e.target.value)}>
              <option>Fat Loss</option>
              <option>Lean Bulk</option>
              <option>Maintenance</option>
              <option>Competition Prep</option>
            </select>
          </label>
          <label className="field">Activity Level
            <select value={form.activityLevel} onChange={(e) => update('activityLevel', e.target.value as FormState['activityLevel'])}>
              <option>Inactive</option>
              <option>Lightly Active</option>
              <option>Active</option>
              <option>Very Active</option>
            </select>
          </label>
          <label className="field">Insulin Sensitivity
            <select value={form.insulinSensitivity} onChange={(e) => update('insulinSensitivity', e.target.value as 'Low' | 'Medium' | 'High')}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </label>
          {isFemale && (
            <>
              <label className="field">Cycle Start Date *
                <input type="date" value={form.cycleStartDate} onChange={(e) => update('cycleStartDate', e.target.value)} />
              </label>
              <label className="field">Cycle Length (days)
                <input type="number" min={21} max={40} value={form.cycleLengthDays} onChange={(e) => update('cycleLengthDays', Number(e.target.value))} />
              </label>
              <label className="field">Period Days
                <input type="number" min={1} max={10} value={form.periodLengthDays} onChange={(e) => update('periodLengthDays', Number(e.target.value))} />
              </label>
            </>
          )}

          <label className="field md:col-span-2 inline-flex items-center gap-2">
            <input type="checkbox" checked={form.hasDiabetes} onChange={(e) => update('hasDiabetes', e.target.checked)} />
            Diabetes or insulin resistance mode
          </label>

          <label className="field md:col-span-2 inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.lactoseIntolerant}
              onChange={(e) => toggleLactoseIntolerant(e.target.checked)}
            />
            Lactose intolerant (auto-dislike foods like cheese, milk, yogurt, whey)
          </label>

          <section className="md:col-span-2 rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm">
            <p className="font-semibold">BMR and Energy Preview</p>
            <p className="mt-1 text-xs text-[var(--muted)]">BMR is calculated automatically from your current profile data.</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <p className="rounded border border-[var(--line)] p-2">BMR: <strong>{bmr}</strong> kcal</p>
              <p className="rounded border border-[var(--line)] p-2">Activity: <strong>{activityFactor}</strong></p>
              <p className="rounded border border-[var(--line)] p-2">Estimated TDEE: <strong>{estimatedTdee}</strong> kcal</p>
            </div>
          </section>

          <section className="md:col-span-2 rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm">
            <p className="font-semibold">Diet Plan Structure</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Choose total meals per day (3 to 6) and snacks (1 or 2).</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className="field">Meals per day
                <input type="number" min={3} max={6} value={form.mealsPerDay} onChange={(e) => update('mealsPerDay', Number(e.target.value))} />
              </label>
              <label className="field">Snacks per day
                <input type="number" min={1} max={2} value={form.snacksPerDay} onChange={(e) => update('snacksPerDay', Number(e.target.value))} />
              </label>
            </div>
          </section>

          <section className="md:col-span-2 rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm">
            <p className="font-semibold">Foods You Like and Dislike</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Pick from many varieties to include or avoid in your diet plan.</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="field">Search food
                <input value={foodSearch} onChange={(e) => setFoodSearch(e.target.value)} placeholder="Example: cheese, rice, salmon" />
              </label>
              <label className="field">Category
                <select value={foodCategory} onChange={(e) => setFoodCategory(e.target.value as typeof foodCategory)}>
                  <option>All</option>
                  <option>Protein</option>
                  <option>Carb</option>
                  <option>Fat</option>
                  <option>Vegetable</option>
                  <option>Swap</option>
                </select>
              </label>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {visibleFoods.map((food) => {
                const liked = form.likedFoods.includes(food.name)
                const disliked = form.dislikedFoods.includes(food.name)
                return (
                  <div key={food.id} className="rounded border border-[var(--line)] p-2">
                    <p className="text-xs font-semibold">{food.name}</p>
                    {food.containsLactose && <p className="text-[10px] text-amber-600">Contains lactose</p>}
                    <div className="mt-1 flex gap-1">
                      <button
                        type="button"
                        onClick={() => toggleFood('likedFoods', food.name)}
                        className={`rounded px-2 py-1 text-xs ${liked ? 'bg-emerald-500/20' : 'bg-slate-500/15'}`}
                      >
                        Like
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFood('dislikedFoods', food.name)}
                        className={`rounded px-2 py-1 text-xs ${disliked ? 'bg-rose-500/20' : 'bg-slate-500/15'}`}
                      >
                        Dislike
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <label className="field md:col-span-2">Medical Notes (optional)
            <textarea rows={3} value={form.medicalNotes} onChange={(e) => update('medicalNotes', e.target.value)} />
          </label>

          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-[var(--muted)]">{status}</span>
            <button disabled={!canSubmit || saving} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
