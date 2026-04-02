import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Layout from '../components/shared/Layout'
import ProgressRing from '../components/shared/ProgressRing'
import PerformanceCharts from '../components/shared/PerformanceCharts'
import AttendanceCalendar from '../components/AttendanceCalendar'
import MacroCalculator from '../components/MacroCalculator'
import RecipeScaler from '../components/RecipeScaler'
import DailyWellnessCheckin from '../components/client/DailyWellnessCheckin'
import StickyCoachNote from '../components/client/StickyCoachNote'
import SwipeMealActions from '../components/client/SwipeMealActions'
import ShoppingListGenerator from '../components/client/ShoppingListGenerator'
import RecoveryStressModule from '../components/client/RecoveryStressModule'
import GutHealthTracker from '../components/client/GutHealthTracker'
import CompetitionPrepCountdown from '../components/client/CompetitionPrepCountdown'
import HealthDisclaimer from '../components/client/HealthDisclaimer'
import FoodSelectorCalculator from '../components/client/FoodSelectorCalculator'
import BloodworkVault from '../components/client/BloodworkVault'
import SupplementProtocol from '../components/client/SupplementProtocol'
import AIMealSwapper from '../components/client/AIMealSwapper'
import HistoricalComparison from '../components/shared/HistoricalComparison'
import { useAuth } from '../hooks/useAuth'
import { demoDailyLogs, demoGymLogs, demoRecipe, demoWeightTrend, demoWeightTrendLastYear } from '../data/mock'
import type { CravingType } from '../utils/cycleSwaps'
import { getCyclePhase } from '../utils/nutritionEngine'
import { supabase } from '../api/supabaseClient'
import { LACTOSE_INTOLERANT_FLAG } from '../utils/foodPreferences'
import PersonalizedDietPlan from '../components/client/PersonalizedDietPlan'

type DietPreferences = {
  likedFoods: string[]
  blockedFoods: string[]
  lactoseIntolerant: boolean
  mealsPerDay: number
  snacksPerDay: number
}

export default function ClientDashboard() {
  const { profile, signOut } = useAuth()
  const [craving, setCraving] = useState<CravingType>('None')
  const [hasDiabetes, setHasDiabetes] = useState(false)
  const [tab, setTab] = useState<'today' | 'nutrition' | 'health' | 'advanced'>('today')
  const [dietPreferences, setDietPreferences] = useState<DietPreferences>({
    likedFoods: [],
    blockedFoods: [],
    lactoseIntolerant: false,
    mealsPerDay: 4,
    snacksPerDay: 1,
  })

  useEffect(() => {
    if (!profile || !supabase) return
    const client = supabase

    const loadPreferences = async () => {
      const { data } = await client
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

    loadPreferences()
  }, [profile])

  const complianceSeries = useMemo(
    () => demoDailyLogs.map((item) => ({ day: item.date.slice(5), score: Math.round((item.calories_actual / item.calories_target) * 100) })),
    [],
  )

  const strengthSeries = [
    { day: 'Mon', orm: 102 },
    { day: 'Tue', orm: 104 },
    { day: 'Wed', orm: 103 },
    { day: 'Thu', orm: 106 },
    { day: 'Fri', orm: 108 },
  ]
  const phase = getCyclePhase(new Date('2026-03-20'))

  if (!profile) return null

  return (
    <Layout
      profile={profile}
      title="Client Daily Companion"
      subtitle="Bio-adaptive nutrition, wellness logs, and performance tracking."
      onSignOut={signOut}
    >
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-4 grid gap-4 lg:grid-cols-3">
        <ProgressRing value={1620} total={2050} label="Calories" />
        <StickyCoachNote message="Do not forget posing practice today. Keep sodium consistent." />
        <section className="glass-panel card-entrance p-4">
          <h3 className="text-sm font-semibold">Morning status</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">Craving mode: {craving}</p>
          <SwipeMealActions mealName="Meal 2: Chicken Bowl" />
        </section>
      </motion.section>

      <section className="mb-4 tab-strip">
        <button type="button" className={`tab-btn ${tab === 'today' ? 'active' : ''}`} onClick={() => setTab('today')}>Today</button>
        <button type="button" className={`tab-btn ${tab === 'nutrition' ? 'active' : ''}`} onClick={() => setTab('nutrition')}>Nutrition</button>
        <button type="button" className={`tab-btn ${tab === 'health' ? 'active' : ''}`} onClick={() => setTab('health')}>Health</button>
        <button type="button" className={`tab-btn ${tab === 'advanced' ? 'active' : ''}`} onClick={() => setTab('advanced')}>Advanced</button>
      </section>

      {tab === 'today' && (
        <>
          <section className="grid gap-4 xl:grid-cols-2">
            <DailyWellnessCheckin bodyWeightKg={62} onCravingChange={setCraving} />
            <AttendanceCalendar logs={demoGymLogs} />
          </section>
          <section className="mt-4">
            <PerformanceCharts weight={demoWeightTrend} compliance={complianceSeries} strength={strengthSeries} />
          </section>
        </>
      )}

      {tab === 'nutrition' && (
        <>
          <section className="grid gap-4 xl:grid-cols-2">
            <MacroCalculator cycleStartDate="2026-03-20" />
            <RecipeScaler />
          </section>
          <section className="mt-4 grid gap-4 xl:grid-cols-2">
            <ShoppingListGenerator ingredients={demoRecipe} />
            <AIMealSwapper
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
          <section className="mt-4 space-y-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasDiabetes}
                onChange={(event) => setHasDiabetes(event.target.checked)}
              />
              Diabetes mode (prioritize low-GI food guidance)
            </label>
            <FoodSelectorCalculator
              hasDiabetes={hasDiabetes}
              craving={craving}
              cycleStartDate="2026-03-20"
              preferredFoods={dietPreferences.likedFoods}
              blockedFoods={dietPreferences.blockedFoods}
              lactoseIntolerant={dietPreferences.lactoseIntolerant}
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
            <SupplementProtocol phase={phase} />
          </section>
        </>
      )}

      {tab === 'advanced' && (
        <>
          <section className="grid gap-4 xl:grid-cols-2">
            <CompetitionPrepCountdown showDate="2026-06-01" />
            <HistoricalComparison thisYear={demoWeightTrend} lastYear={demoWeightTrendLastYear} />
          </section>
          <section className="mt-4">
            <HealthDisclaimer />
          </section>
        </>
      )}
    </Layout>
  )
}
