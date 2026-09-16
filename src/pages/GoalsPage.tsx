import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Plus, Target } from 'lucide-react'
import Layout from '../components/shared/Layout'
import { createClientGoal, getClientGoals, updateGoalProgress } from '../api/productApi'
import type { ClientGoal } from '../api/productApi'
import { useAuth } from '../hooks/useAuth'

const emptyDraft = {
  title: '',
  category: 'Body composition',
  targetValue: '',
  currentValue: '',
  unit: 'kg',
  targetDate: '',
}

const referenceDate = new Date()
const referenceMonth = referenceDate.getMonth()
const referenceYear = referenceDate.getFullYear()

export default function GoalsPage() {
  const { profile, signOut } = useAuth()
  const [goals, setGoals] = useState<ClientGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [progressDrafts, setProgressDrafts] = useState<Record<number, string>>({})

  const refreshGoals = async () => {
    if (!profile) return
    setLoading(true)
    try {
      setGoals(await getClientGoals(profile.id))
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load goals. Apply the product overhaul migration first.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!profile) return
    let active = true

    getClientGoals(profile.id)
      .then((data) => {
        if (!active) return
        setGoals(data)
        setError('')
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load goals. Apply the product overhaul migration first.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [profile])

  const activeGoals = useMemo(() => goals.filter((goal) => goal.status === 'active'), [goals])
  const completedGoals = useMemo(() => goals.filter((goal) => goal.status === 'completed'), [goals])
  const dueThisMonth = activeGoals.filter((goal) => {
    if (!goal.target_date) return false
    const targetDate = new Date(`${goal.target_date}T12:00:00`)
    return targetDate.getMonth() === referenceMonth && targetDate.getFullYear() === referenceYear
  }).length

  if (!profile) return null

  const createGoal = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft.title.trim()) return

    setSaving(true)
    setError('')
    try {
      await createClientGoal(profile.id, {
        title: draft.title.trim(),
        category: draft.category,
        target_value: draft.targetValue === '' ? null : Number(draft.targetValue),
        current_value: draft.currentValue === '' ? null : Number(draft.currentValue),
        unit: draft.unit.trim() || null,
        target_date: draft.targetDate || null,
      })
      setDraft(emptyDraft)
      await refreshGoals()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to create goal.')
    } finally {
      setSaving(false)
    }
  }

  const saveProgress = async (goal: ClientGoal, complete = false) => {
    const raw = progressDrafts[goal.id] ?? String(goal.current_value ?? 0)
    const value = Number(raw)
    if (Number.isNaN(value)) return

    try {
      await updateGoalProgress(goal.id, value, complete ? 'completed' : undefined)
      await refreshGoals()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update goal.')
    }
  }

  return (
    <Layout
      profile={profile}
      title="Goals"
      subtitle="Turn coaching outcomes into visible, measurable targets and update them as your plan progresses."
      onSignOut={signOut}
    >
      <section className="metric-grid mb-4">
        <article className="metric-card">
          <p className="metric-label">Active goals</p>
          <p className="metric-value">{activeGoals.length}</p>
          <p className="metric-meta">Current targets in progress</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Completed</p>
          <p className="metric-value">{completedGoals.length}</p>
          <p className="metric-meta">Goals you have finished</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Due this month</p>
          <p className="metric-value">{dueThisMonth}</p>
          <p className="metric-meta">Targets with a deadline this month</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Tracking mode</p>
          <p className="metric-value text-[1.15rem]">Live</p>
          <p className="metric-meta">Saved to your Supabase account</p>
        </article>
      </section>

      {error && <p className="form-status mb-4">{error}</p>}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <article className="glass-panel p-4 md:p-5">
          <div className="section-heading">
            <div>
              <h2>Goal tracker</h2>
              <p className="page-subtext">Update current values as you progress. Complete a goal when the target is reached.</p>
            </div>
            <Target size={20} className="text-[var(--muted)]" />
          </div>

          {loading ? (
            <div className="empty-state">Loading goals...</div>
          ) : goals.length === 0 ? (
            <div className="empty-state">
              <div>
                <Target className="mx-auto mb-3" size={26} />
                <strong>No goals yet</strong>
                <p className="mt-1 text-sm">Create your first measurable target using the form beside this panel.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {goals.map((goal) => {
                const current = Number(goal.current_value ?? 0)
                const target = Number(goal.target_value ?? 0)
                const percent = target > 0 ? Math.min(100, Math.max(0, Math.round((current / target) * 100))) : 0
                return (
                  <article key={goal.id} className="rounded-2xl border border-[var(--line)] bg-[var(--panel-muted)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{goal.category}</p>
                        <h3 className="mt-1 font-bold">{goal.title}</h3>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {goal.target_date ? `Target date: ${goal.target_date}` : 'No deadline'}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${goal.status === 'completed' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-[var(--brand-soft)] text-[var(--brand)]'}`}>
                        {goal.status}
                      </span>
                    </div>

                    {target > 0 && (
                      <div className="mt-4">
                        <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
                          <span>{current} {goal.unit ?? ''}</span>
                          <span>{target} {goal.unit ?? ''}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--line)]">
                          <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    )}

                    {goal.status !== 'completed' && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <input
                          type="number"
                          step="any"
                          value={progressDrafts[goal.id] ?? String(goal.current_value ?? '')}
                          onChange={(event) => setProgressDrafts((prev) => ({ ...prev, [goal.id]: event.target.value }))}
                          className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-2 text-sm"
                          placeholder="Current value"
                        />
                        <button type="button" className="button-secondary" onClick={() => saveProgress(goal)}>Update</button>
                        <button type="button" className="button-primary" onClick={() => saveProgress(goal, true)}>
                          <CheckCircle2 size={16} /> Complete
                        </button>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </article>

        <article className="glass-panel h-fit p-4 md:p-5">
          <div className="section-heading">
            <div>
              <h2>New goal</h2>
              <p className="page-subtext">Keep goals specific enough that progress can be measured.</p>
            </div>
            <Plus size={20} className="text-[var(--muted)]" />
          </div>

          <form onSubmit={createGoal} className="grid gap-3">
            <label className="field">Goal title
              <input value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} placeholder="Reach 75 kg" />
            </label>
            <label className="field">Category
              <select value={draft.category} onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}>
                <option>Body composition</option>
                <option>Strength</option>
                <option>Nutrition</option>
                <option>Recovery</option>
                <option>Habit</option>
                <option>Competition prep</option>
                <option>General</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="field">Current value
                <input type="number" step="any" value={draft.currentValue} onChange={(event) => setDraft((prev) => ({ ...prev, currentValue: event.target.value }))} />
              </label>
              <label className="field">Target value
                <input type="number" step="any" value={draft.targetValue} onChange={(event) => setDraft((prev) => ({ ...prev, targetValue: event.target.value }))} />
              </label>
            </div>
            <label className="field">Unit
              <input value={draft.unit} onChange={(event) => setDraft((prev) => ({ ...prev, unit: event.target.value }))} placeholder="kg, %, reps, days..." />
            </label>
            <label className="field">Target date
              <input type="date" value={draft.targetDate} onChange={(event) => setDraft((prev) => ({ ...prev, targetDate: event.target.value }))} />
            </label>
            <button type="submit" className="button-primary mt-1" disabled={saving || !draft.title.trim()}>
              <Plus size={17} /> {saving ? 'Creating...' : 'Create goal'}
            </button>
          </form>
        </article>
      </section>
    </Layout>
  )
}
