import { useEffect, useMemo, useState } from 'react'
import { Activity, Dumbbell, Scale, TrendingUp } from 'lucide-react'
import Layout from '../components/shared/Layout'
import PerformanceCharts from '../components/shared/PerformanceCharts'
import { getClientOverview } from '../api/productApi'
import type { ClientOverview } from '../api/productApi'
import { supabase } from '../api/supabaseClient'
import { useAuth } from '../hooks/useAuth'

const emptyOverview: ClientOverview = {
  logs: [],
  gymLogs: [],
  weightTrend: [],
  bodyWeightKg: null,
  cycleStartDate: null,
  hasDiabetes: false,
  coachNote: null,
}

type StrengthPoint = { day: string; orm: number }

export default function ProgressPage() {
  const { profile, signOut } = useAuth()
  const [overview, setOverview] = useState<ClientOverview>(emptyOverview)
  const [strength, setStrength] = useState<StrengthPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile) return

    const load = async () => {
      setLoading(true)
      try {
        const clientOverview = await getClientOverview(profile.id)
        setOverview(clientOverview)

        if (supabase) {
          const { data, error: workoutError } = await supabase
            .from('workout_logs')
            .select('workout_date,reps,weight_used')
            .eq('user_id', profile.id)
            .not('reps', 'is', null)
            .not('weight_used', 'is', null)
            .order('workout_date', { ascending: true })
            .limit(60)

          if (workoutError) throw workoutError

          const points = (data ?? []).map((row) => {
            const reps = Number(row.reps ?? 1)
            const weight = Number(row.weight_used ?? 0)
            const orm = reps > 0 && reps < 37 ? weight / (1.0278 - 0.0278 * reps) : weight
            return { day: String(row.workout_date), orm: Math.round(orm * 10) / 10 }
          })
          setStrength(points)
        }
        setError('')
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Unable to load progress data.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [profile])

  const compliance = useMemo(() => overview.logs.map((log) => {
    const target = Number(log.calories_target ?? 0)
    const actual = Number(log.calories_actual ?? 0)
    const score = target > 0 ? Math.max(0, Math.min(100, Math.round((actual / target) * 100))) : 0
    return { day: log.log_date.slice(5), score }
  }), [overview.logs])

  const recentLogs = overview.logs.slice(-7)
  const averageCompliance = recentLogs.length
    ? Math.round(recentLogs.reduce((sum, log) => {
        const target = Number(log.calories_target ?? 0)
        if (!target) return sum
        const actual = Number(log.calories_actual ?? 0)
        return sum + Math.max(0, Math.min(100, (actual / target) * 100))
      }, 0) / recentLogs.length)
    : 0

  const recentGym = overview.gymLogs.slice(-28)
  const workoutRate = recentGym.length
    ? Math.round((recentGym.filter((log) => log.workout_completed).length / recentGym.length) * 100)
    : 0

  const sleepValues = recentLogs.map((log) => Number(log.sleep_quality ?? 0)).filter((value) => value > 0)
  const averageSleep = sleepValues.length ? (sleepValues.reduce((sum, value) => sum + value, 0) / sleepValues.length).toFixed(1) : '—'

  if (!profile) return null

  return (
    <Layout
      profile={profile}
      title="Progress"
      subtitle="See your real logged trends across body weight, nutrition adherence, training strength, and recovery."
      onSignOut={signOut}
    >
      {error && <p className="form-status mb-4">{error}</p>}

      <section className="metric-grid mb-4">
        <article className="metric-card">
          <div className="flex items-center justify-between"><p className="metric-label">Latest weight</p><Scale size={17} className="text-[var(--muted)]" /></div>
          <p className="metric-value">{overview.bodyWeightKg ? `${overview.bodyWeightKg.toFixed(1)}` : '—'}</p>
          <p className="metric-meta">kg from your most recent saved measurement</p>
        </article>
        <article className="metric-card">
          <div className="flex items-center justify-between"><p className="metric-label">7-day compliance</p><TrendingUp size={17} className="text-[var(--muted)]" /></div>
          <p className="metric-value">{averageCompliance}%</p>
          <p className="metric-meta">Calories logged vs assigned target</p>
        </article>
        <article className="metric-card">
          <div className="flex items-center justify-between"><p className="metric-label">Workout completion</p><Dumbbell size={17} className="text-[var(--muted)]" /></div>
          <p className="metric-value">{workoutRate}%</p>
          <p className="metric-meta">Completed gym logs in the recent window</p>
        </article>
        <article className="metric-card">
          <div className="flex items-center justify-between"><p className="metric-label">Sleep quality</p><Activity size={17} className="text-[var(--muted)]" /></div>
          <p className="metric-value">{averageSleep}</p>
          <p className="metric-meta">Average of recent wellness check-ins</p>
        </article>
      </section>

      {loading ? (
        <div className="empty-state">Loading progress...</div>
      ) : overview.logs.length === 0 && strength.length === 0 ? (
        <div className="empty-state">
          <div>
            <Activity className="mx-auto mb-3" size={26} />
            <strong>No progress data yet</strong>
            <p className="mt-1 text-sm">Submit your daily wellness check-in and workout logs to start building real trends.</p>
          </div>
        </div>
      ) : (
        <PerformanceCharts weight={overview.weightTrend} compliance={compliance} strength={strength} />
      )}
    </Layout>
  )
}
