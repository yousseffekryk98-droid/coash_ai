import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarCheck2, Flame, Target, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import Layout from '../components/shared/Layout'
import ProgressRing from '../components/shared/ProgressRing'
import AttendanceCalendar from '../components/AttendanceCalendar'
import MacroCalculator from '../components/MacroCalculator'
import RecipeScaler from '../components/RecipeScaler'
import DailyWellnessCheckin from '../components/client/DailyWellnessCheckin'
import StickyCoachNote from '../components/client/StickyCoachNote'
import FoodSelectorCalculator from '../components/client/FoodSelectorCalculator'
import RecoveryStressModule from '../components/client/RecoveryStressModule'
import GutHealthTracker from '../components/client/GutHealthTracker'
import HealthDisclaimer from '../components/client/HealthDisclaimer'
import BloodworkVault from '../components/client/BloodworkVault'
import SupplementProtocol from '../components/client/SupplementProtocol'
import AIMealSwapper from '../components/client/AIMealSwapper'
import PersonalizedDietPlan from '../components/client/PersonalizedDietPlan'
import { useAuth } from '../hooks/useAuth'
import type { CravingType } from '../utils/cycleSwaps'
import { getCyclePhase } from '../utils/nutritionEngine'
import { supabase } from '../api/supabaseClient'
import { getClientOverview } from '../api/productApi'
import type { ClientOverview } from '../api/productApi'
import { LACTOSE_INTOLERANT_FLAG } from '../utils/foodPreferences'

type DietPreferences = {
  likedFoods: string[]
  blockedFoods: string[]
  lactoseIntolerant: boolean
  mealsPerDay: number
  snacksPerDay: number
}

const emptyOverview: ClientOverview = {
  logs: [],
  gymLogs: [],
  weightTrend: [],
  bodyWeightKg: null,
  cycleStartDate: null,
  hasDiabetes: false,
  coachNote: null,
}

export default function ClientDashboard() {
  const { profile, signOut } = useAuth()
  const [craving, setCraving] = useState<CravingType>('None')
  const [hasDiabetes, setHasDiabetes] = useState(false)
  const [tab, setTab] = useState<'today' | 'nutrition' | 'health' | 'advanced'>('today')
  const [overview, setOverview] = useState<ClientOverview>(emptyOverview)
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [overviewError, setOverviewError] = useState('')
  const [dietPreferences, setDietPreferences] = useState<DietPreferences>({
    likedFoods: [],
    blockedFoods: [],
    lactoseIntolerant: false,
    mealsPerDay: 4,
    snacksPerDay: 1,
  })

  const loadOverview = useCallback(async () => {
    if (!profile) return
    setLoadingOverview(true)
    try {
      const data = await getClientOverview(profile.id)
      setOverview(data)
      setHasDiabetes(data.hasDiabetes)
      setOverviewError('')
    } catch (reason) {
      setOverviewError(reason instanceof Error ? reason.message : 'Unable to load your dashboard data.')
    } finally {
      setLoadingOverview(false)
    }
  }, [profile])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  useEffect(() => {
    if (!profile || !supabase) return

    const loadPreferences = async () => {
      const { data } = await supabase
        .from('client_diet_preferences')
        .select('liked_foods, disliked_foods, meals_per_day, snacks_per_day')
        .eq('user_id', profile.id)
        .maybeSingle()

      const likedFoods = (data?.liked_foods ?? []) as string[]
      const dislikedFoodsRaw = (data?.disliked_foods ?? []) as string[]
      const lactoseIntolerant = dislikedFoodsRaw.includes(LACTOSE_INTOLERANT_FLAG)
      const blockedFoods = dislikedFoodsRaw.filter((item) => item !== LACTOSE_INTOLERANT_FLAG)
      const mealsPerDay = Number(data?.meals_per_day ?? 4)
      const snacksPerDay = Number(data?.snacks_per_day ?? 1)

      setDietPreferences({ likedFoods, blockedFoods, lactoseIntolerant, mealsPerDay, snacksPerDay })
    }

    void loadPreferences()
  }, [profile])

  const latestLog = overview.logs.at(-1)
  const bodyWeight = overview.bodyWeightKg ?? 70
  const calorieTarget = Number(latestLog?.calories_target ?? 0)
  const calorieActual = Number(latestLog?.calories_actual ?? 0)
  const completedWorkouts = overview.gymLogs.filter((log) => log.workout_completed).length
  const recentGymLogs = overview.gymLogs.slice(-28)
  const workoutRate = recentGymLogs.length ? Math.round((recentGymLogs.filter((log) => log.workout_completed).length / recentGymLogs.length) * 100) : 0

  const recentCompliance = useMemo(() => {
    const logs = overview.logs.slice(-7).filter((log) => Number(log.calories_target ?? 0) > 0)
    if (!logs.length) return 0
    const score = logs.reduce((sum, log) => {
      const target = Number(log.calories_target)
      const actual = Number(log.calories_actual ?? 0)
      return sum + Math.max(0, Math.min(100, (actual / target) * 100))
    }, 0)
    return Math.round(score / logs.length)
  }, [overview.logs])

  const phase = overview.cycleStartDate ? getCyclePhase(new Date(`${overview.cycleStartDate}T12:00:00`)) : null

  if (!profile) return null

  return (
    <Layout
      profile={profile}
      title="Today"
      subtitle="Log what actually happened today, see your coaching priorities, and keep the plan moving."
      onSignOut={signOut}
    >
      {overviewError && <p className="form-status mb-4">{overviewError}</p>}

      <section className="metric-grid mb-4">
        <article className="metric-card">
          <div className="flex items-center justify-between"><p className="metric-label">Body weight</p><TrendingUp size={17} className="text-[var(--muted)]" /></div>
          <p className="metric-value">{overview.bodyWeightKg ? `${overview.bodyWeightKg.toFixed(1)} kg` : '—'}</p>
          <p className="metric-meta">Most recent saved measurement</p>
        </article>
        <article className="metric-card">
          <div className="flex items-center justify-between"><p className="metric-label">7-day nutrition</p><Flame size={17} className="text-[var(--muted)]" /></div>
          <p className="metric-value">{recentCompliance}%</p>
          <p className="metric-meta">Calories logged against your targets</p>
        </article>
        <article className="metric-card">
          <div className="flex items-center justify-between"><p className="metric-label">Workout completion</p><CalendarCheck2 size={17} className="text-[var(--muted)]" /></div>
          <p className="metric-value">{workoutRate}%</p>
          <p className="metric-meta">{completedWorkouts} completed workouts saved</p>
        </article>
        <article className="metric-card">
          <div className="flex items-center justify-between"><p className="metric-label">Active phase</p><Target size={17} className="text-[var(--muted)]" /></div>
          <p className="metric-value text-[1.25rem]">{phase ?? 'Standard'}</p>
          <p className="metric-meta">Based on your saved cycle profile when applicable</p>
        </article>
      </section>

      <section className="mb-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_minmax(260px,0.7fr)]">
        {calorieTarget > 0 ? (
          <ProgressRing value={calorieActual} total={calorieTarget} label="Calories today" />
        ) : (
          <article className="glass-panel flex min-h-[210px] items-center justify-center p-4 text-center">
            <div>
              <p className="font-semibold">No calorie target logged today</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Save today’s check-in to start tracking adherence.</p>
            </div>
          </article>
        )}
        <StickyCoachNote message={overview.coachNote ?? 'No visible coach note yet. Your coach can pin guidance here from the client roster.'} />
        <article className="glass-panel p-4">
          <p className="text-sm font-semibold">Quick actions</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Your deeper trends and targets now have dedicated workspaces.</p>
          <div className="mt-4 grid gap-2">
            <Link to="/progress" className="button-secondary justify-between">Open progress <ArrowRight size={16} /></Link>
            <Link to="/goals" className="button-secondary justify-between">Update goals <ArrowRight size={16} /></Link>
          </div>
        </article>
      </section>

      <section className="mb-4 tab-strip">
        <button type="button" className={`tab-btn ${tab === 'today' ? 'active' : ''}`} onClick={() => setTab('today')}>Today</button>
        <button type="button" className={`tab-btn ${tab === 'nutrition' ? 'active' : ''}`} onClick={() => setTab('nutrition')}>Nutrition</button>
        <button type="button" className={`tab-btn ${tab === 'health' ? 'active' : ''}`} onClick={() => setTab('health')}>Health</button>
        <button type="button" className={`tab-btn ${tab === 'advanced' ? 'active' : ''}`} onClick={() => setTab('advanced')}>Advanced</button>
      </section>

      {tab === 'today' && (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <DailyWellnessCheckin
            userId={profile.id}
            bodyWeightKg={bodyWeight}
            onCravingChange={setCraving}
            onSaved={loadOverview}
          />
          <AttendanceCalendar logs={overview.gymLogs} />
        </section>
      )}

      {tab === 'nutrition' && (
        <>
          <section className="grid gap-4 xl:grid-cols-2">
            {overview.cycleStartDate ? (
              <MacroCalculator cycleStartDate={overview.cycleStartDate} />
            ) : (
              <article className="glass-panel p-4 md:p-5">
                <h2 className="text-lg font-bold">Macro calculator</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">No cycle start date is saved for this account. The adaptive cycle calculator stays disabled rather than inventing a date.</p>
              </article>
            )}
            <RecipeScaler />
          </section>
          <section className="mt-4 grid gap-4 xl:grid-cols-2">
            <AIMealSwapper
              preferredFoods={dietPreferences.likedFoods}
              blockedFoods={dietPreferences.blockedFoods}
              lactoseIntolerant={dietPreferences.lactoseIntolerant}
            />
            <FoodSelectorCalculator
              hasDiabetes={hasDiabetes}
              craving={craving}
              cycleStartDate={overview.cycleStartDate ?? new Date().toISOString().slice(0, 10)}
              preferredFoods={dietPreferences.likedFoods}
              blockedFoods={dietPreferences.blockedFoods}
              lactoseIntolerant={dietPreferences.lactoseIntolerant}
            />
          </section>
          <section className="mt-4">
            <PersonalizedDietPlan
              preferredFoods={dietPreferences.likedFoods}
              blockedFoods={dietPreferences.blockedFoods}
              lactoseIntolerant={dietPreferences.lactoseIntolerant}
              hasDiabetes={hasDiabetes}
              mealsPerDay={dietPreferences.mealsPerDay}
              snacksPerDay={dietPreferences.snacksPerDay}
            />
          </section>
        </>
      )}

      {tab === 'health' && (
        <>
          <section className="grid gap-4 xl:grid-cols-2">
            <RecoveryStressModule />
            <GutHealthTracker />
          </section>
          <section className="mt-4 grid gap-4 xl:grid-cols-2">
            <BloodworkVault />
            {phase ? (
              <SupplementProtocol phase={phase} />
            ) : (
              <article className="glass-panel p-4 md:p-5">
                <h2 className="text-lg font-bold">Supplement protocol</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">Add cycle data during onboarding before using phase-specific supplement guidance.</p>
              </article>
            )}
          </section>
        </>
      )}

      {tab === 'advanced' && (
        <section className="grid gap-4 xl:grid-cols-2">
          <article className="glass-panel p-4 md:p-5">
            <h2 className="text-lg font-bold">Progress and goal workspaces</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Long-term analytics and targets are separated from the daily screen so today stays focused.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/progress" className="button-primary">View progress</Link>
              <Link to="/goals" className="button-secondary">Manage goals</Link>
            </div>
          </article>
          <HealthDisclaimer />
        </section>
      )}

      {loadingOverview && <p className="mt-4 text-xs text-[var(--muted)]">Refreshing dashboard data...</p>}
    </Layout>
  )
}
