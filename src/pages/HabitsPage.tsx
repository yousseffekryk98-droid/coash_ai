import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Circle, Plus, Repeat2, Target } from 'lucide-react'
import Layout from '../components/shared/Layout'
import { getCoachClients } from '../api/productApi'
import type { CoachClientRow } from '../api/productApi'
import {
  createHabit,
  getHabitCheckins,
  getHabits,
  setHabitActive,
  upsertHabitCheckin,
} from '../api/engagementApi'
import type { ClientHabit, HabitCheckin } from '../api/engagementApi'
import { useAuth } from '../hooks/useAuth'

const initialDraft = {
  clientId: '',
  title: '',
  description: '',
  cadence: 'daily' as const,
  target: 1,
  startsOn: '',
  endsOn: '',
}

export default function HabitsPage() {
  const { profile, signOut } = useAuth()
  const [todayIso] = useState(() => new Date().toISOString().slice(0, 10))
  const [habits, setHabits] = useState<ClientHabit[]>([])
  const [checkins, setCheckins] = useState<HabitCheckin[]>([])
  const [clients, setClients] = useState<CoachClientRow[]>([])
  const [draft, setDraft] = useState({ ...initialDraft, startsOn: todayIso })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!profile) return
    try {
      if (profile.role === 'coach') {
        const [habitRows, clientRows] = await Promise.all([getHabits(), getCoachClients(profile.id)])
        setHabits(habitRows)
        setClients(clientRows)
        setCheckins([])
      } else {
        const since = new Date(`${todayIso}T12:00:00Z`)
        since.setUTCDate(since.getUTCDate() - 29)
        const [habitRows, checkinRows] = await Promise.all([
          getHabits(profile.id),
          getHabitCheckins(profile.id, since.toISOString().slice(0, 10)),
        ])
        setHabits(habitRows)
        setCheckins(checkinRows)
      }
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load habits.')
    } finally {
      setLoading(false)
    }
  }, [profile, todayIso])

  useEffect(() => {
    void load()
  }, [load])

  const todayCheckins = useMemo(
    () => new Map(checkins.filter((item) => item.checkin_date === todayIso).map((item) => [item.habit_id, item])),
    [checkins, todayIso],
  )

  const activeHabits = habits.filter((habit) => habit.active)
  const completedToday = activeHabits.filter((habit) => (todayCheckins.get(habit.id)?.completed_count ?? 0) >= habit.target_per_period).length

  if (!profile) return null

  const saveHabit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (profile.role !== 'coach' || !draft.clientId || !draft.title.trim()) return
    setSaving(true)
    try {
      await createHabit(profile.id, draft.clientId, {
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        cadence: draft.cadence,
        target_per_period: draft.target,
        starts_on: draft.startsOn || todayIso,
        ends_on: draft.endsOn || null,
      })
      setDraft({ ...initialDraft, startsOn: todayIso })
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to create habit.')
    } finally {
      setSaving(false)
    }
  }

  const toggleToday = async (habit: ClientHabit) => {
    if (profile.role !== 'client') return
    const current = todayCheckins.get(habit.id)?.completed_count ?? 0
    const next = current >= habit.target_per_period ? 0 : habit.target_per_period
    setSaving(true)
    try {
      await upsertHabitCheckin(profile.id, habit.id, todayIso, next)
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update habit.')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (habit: ClientHabit) => {
    if (profile.role !== 'coach') return
    setSaving(true)
    try {
      await setHabitActive(habit.id, !habit.active)
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update habit.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout
      profile={profile}
      title="Habits"
      subtitle={profile.role === 'coach' ? 'Assign repeatable behaviors and track the routines that support the coaching plan.' : 'Build consistency one repeatable action at a time.'}
      onSignOut={signOut}
    >
      {error && <p className="form-status mb-4">{error}</p>}

      <section className="metric-grid mb-4">
        <article className="metric-card"><p className="metric-label">Active habits</p><p className="metric-value">{activeHabits.length}</p><p className="metric-meta">Currently assigned routines</p></article>
        <article className="metric-card"><p className="metric-label">{profile.role === 'client' ? 'Completed today' : 'Clients covered'}</p><p className="metric-value">{profile.role === 'client' ? completedToday : new Set(activeHabits.map((habit) => habit.client_id)).size}</p><p className="metric-meta">{profile.role === 'client' ? 'Daily habits at target' : 'Clients with an active habit'}</p></article>
        <article className="metric-card"><p className="metric-label">Daily</p><p className="metric-value">{activeHabits.filter((habit) => habit.cadence === 'daily').length}</p><p className="metric-meta">High-frequency behaviors</p></article>
        <article className="metric-card"><p className="metric-label">Weekly</p><p className="metric-value">{activeHabits.filter((habit) => habit.cadence === 'weekly').length}</p><p className="metric-meta">Weekly consistency targets</p></article>
      </section>

      <section className={`grid gap-4 ${profile.role === 'coach' ? 'xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]' : ''}`}>
        <article className="glass-panel p-4 md:p-5">
          <div className="section-heading">
            <div><h2>{profile.role === 'coach' ? 'Assigned habits' : 'Your routines'}</h2><p className="page-subtext">Small behaviors should be clear, measurable, and easy to review.</p></div>
            <Repeat2 size={20} className="text-[var(--muted)]" />
          </div>

          {loading ? (
            <div className="empty-state">Loading habits...</div>
          ) : habits.length === 0 ? (
            <div className="empty-state"><div><Target className="mx-auto mb-3" size={26} /><strong>No habits assigned yet</strong><p className="mt-1 text-sm">Assigned routines will appear here.</p></div></div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {habits.map((habit) => {
                const checkin = todayCheckins.get(habit.id)
                const done = (checkin?.completed_count ?? 0) >= habit.target_per_period
                const clientName = clients.find((client) => client.id === habit.client_id)?.username
                return (
                  <article key={habit.id} className={`rounded-2xl border p-4 ${habit.active ? 'border-[var(--line)] bg-[var(--panel-muted)]' : 'border-[var(--line)] bg-[var(--panel-strong)] opacity-60'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{habit.cadence} · target {habit.target_per_period}</p>
                        <h3 className="mt-1 font-bold">{habit.title}</h3>
                        {clientName && <p className="mt-1 text-xs text-[var(--muted)]">@{clientName}</p>}
                      </div>
                      {profile.role === 'client' ? (
                        <button type="button" disabled={saving || !habit.active} onClick={() => toggleToday(habit)} className={`grid h-10 w-10 place-items-center rounded-full border ${done ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600' : 'border-[var(--line)] bg-[var(--panel-strong)]'}`} aria-label={done ? 'Mark habit incomplete' : 'Mark habit complete'}>
                          {done ? <Check size={18} /> : <Circle size={18} />}
                        </button>
                      ) : (
                        <button type="button" disabled={saving} onClick={() => toggleActive(habit)} className="button-secondary">{habit.active ? 'Pause' : 'Resume'}</button>
                      )}
                    </div>
                    {habit.description && <p className="mt-3 text-sm text-[var(--muted)]">{habit.description}</p>}
                    <p className="mt-3 text-xs text-[var(--muted)]">Starts {habit.starts_on}{habit.ends_on ? ` · ends ${habit.ends_on}` : ''}</p>
                  </article>
                )
              })}
            </div>
          )}
        </article>

        {profile.role === 'coach' && (
          <article className="glass-panel h-fit p-4 md:p-5">
            <div className="section-heading"><div><h2>Assign a habit</h2><p className="page-subtext">Give the client one concrete behavior to repeat.</p></div><Plus size={20} className="text-[var(--muted)]" /></div>
            <form onSubmit={saveHabit} className="grid gap-3">
              <label className="field">Client<select value={draft.clientId} onChange={(event) => setDraft((prev) => ({ ...prev, clientId: event.target.value }))}><option value="">Select client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.username}</option>)}</select></label>
              <label className="field">Habit<input value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} placeholder="Walk 8,000 steps" /></label>
              <label className="field">Coaching note<textarea rows={3} value={draft.description} onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))} placeholder="Why this matters and what counts as complete" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="field">Cadence<select value={draft.cadence} onChange={(event) => setDraft((prev) => ({ ...prev, cadence: event.target.value as 'daily' | 'weekly' }))}><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
                <label className="field">Target<input type="number" min={1} max={20} value={draft.target} onChange={(event) => setDraft((prev) => ({ ...prev, target: Number(event.target.value) }))} /></label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="field">Starts<input type="date" value={draft.startsOn} onChange={(event) => setDraft((prev) => ({ ...prev, startsOn: event.target.value }))} /></label>
                <label className="field">Ends<input type="date" value={draft.endsOn} onChange={(event) => setDraft((prev) => ({ ...prev, endsOn: event.target.value }))} /></label>
              </div>
              <button type="submit" className="button-primary" disabled={saving || !draft.clientId || !draft.title.trim()}><Plus size={16} /> Assign habit</button>
            </form>
          </article>
        )}
      </section>
    </Layout>
  )
}
