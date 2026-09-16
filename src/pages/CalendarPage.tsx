import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarClock, CheckCircle2, Clock3, Plus, Video } from 'lucide-react'
import Layout from '../components/shared/Layout'
import { getCoachClients } from '../api/productApi'
import type { CoachClientRow } from '../api/productApi'
import { createAppointment, getAppointments, updateAppointmentStatus } from '../api/engagementApi'
import type { CoachingAppointment } from '../api/engagementApi'
import { useAuth } from '../hooks/useAuth'

const initialDraft = {
  clientId: '',
  title: 'Coaching session',
  scheduledAt: '',
  duration: 30,
  meetingUrl: '',
  notes: '',
}

export default function CalendarPage() {
  const { profile, signOut } = useAuth()
  const [nowIso] = useState(() => new Date().toISOString())
  const [appointments, setAppointments] = useState<CoachingAppointment[]>([])
  const [clients, setClients] = useState<CoachClientRow[]>([])
  const [draft, setDraft] = useState(initialDraft)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!profile) return
    try {
      const appointmentRows = await getAppointments()
      setAppointments(appointmentRows)
      if (profile.role === 'coach') setClients(await getCoachClients(profile.id))
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load appointments.')
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    void load()
  }, [load])

  const scheduled = appointments.filter((item) => item.status === 'scheduled')
  const upcoming = useMemo(
    () => scheduled.filter((item) => item.scheduled_at >= nowIso),
    [scheduled, nowIso],
  )
  const completed = appointments.filter((item) => item.status === 'completed').length

  if (!profile) return null

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (profile.role !== 'coach' || !draft.clientId || !draft.scheduledAt) return
    setSaving(true)
    try {
      await createAppointment(profile.id, draft.clientId, {
        title: draft.title.trim() || 'Coaching session',
        scheduled_at: new Date(draft.scheduledAt).toISOString(),
        duration_minutes: draft.duration,
        meeting_url: draft.meetingUrl.trim() || null,
        notes: draft.notes.trim() || null,
      })
      setDraft(initialDraft)
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to schedule appointment.')
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (appointmentId: number, status: CoachingAppointment['status']) => {
    if (profile.role !== 'coach') return
    setSaving(true)
    try {
      await updateAppointmentStatus(appointmentId, status)
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update appointment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout
      profile={profile}
      title="Coaching calendar"
      subtitle={profile.role === 'coach' ? 'Schedule reviews and keep coaching touchpoints connected to the client workflow.' : 'See your upcoming coaching sessions and meeting details.'}
      onSignOut={signOut}
    >
      {error && <p className="form-status mb-4">{error}</p>}

      <section className="metric-grid mb-4">
        <article className="metric-card"><p className="metric-label">Upcoming</p><p className="metric-value">{upcoming.length}</p><p className="metric-meta">Scheduled future sessions</p></article>
        <article className="metric-card"><p className="metric-label">Completed</p><p className="metric-value">{completed}</p><p className="metric-meta">Sessions marked complete</p></article>
        <article className="metric-card"><p className="metric-label">Total records</p><p className="metric-value">{appointments.length}</p><p className="metric-meta">Including cancelled history</p></article>
        <article className="metric-card"><p className="metric-label">Default length</p><p className="metric-value text-[1.2rem]">30 min</p><p className="metric-meta">Editable for each session</p></article>
      </section>

      <section className={`grid gap-4 ${profile.role === 'coach' ? 'xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]' : ''}`}>
        <article className="glass-panel p-4 md:p-5">
          <div className="section-heading"><div><h2>Sessions</h2><p className="page-subtext">Upcoming sessions first, with completed and cancelled records retained for context.</p></div><CalendarClock size={20} className="text-[var(--muted)]" /></div>
          {loading ? (
            <div className="empty-state">Loading calendar...</div>
          ) : appointments.length === 0 ? (
            <div className="empty-state">No coaching sessions are scheduled yet.</div>
          ) : (
            <div className="grid gap-3">
              {appointments.map((appointment) => {
                const clientName = clients.find((client) => client.id === appointment.client_id)?.username
                return (
                  <article key={appointment.id} className="rounded-2xl border border-[var(--line)] bg-[var(--panel-muted)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{appointment.title}</h3><span className="rounded-full bg-[var(--panel-strong)] px-2 py-1 text-xs capitalize">{appointment.status}</span></div>
                        {clientName && <p className="mt-1 text-xs text-[var(--muted)]">@{clientName}</p>}
                        <p className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]"><Clock3 size={15} /> {new Date(appointment.scheduled_at).toLocaleString()} · {appointment.duration_minutes} min</p>
                      </div>
                      {appointment.meeting_url && <a className="button-secondary" href={appointment.meeting_url} target="_blank" rel="noreferrer"><Video size={15} /> Join</a>}
                    </div>
                    {appointment.notes && <p className="mt-3 text-sm text-[var(--muted)]">{appointment.notes}</p>}
                    {profile.role === 'coach' && appointment.status === 'scheduled' && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" className="button-primary" disabled={saving} onClick={() => changeStatus(appointment.id, 'completed')}><CheckCircle2 size={15} /> Complete</button>
                        <button type="button" className="button-secondary" disabled={saving} onClick={() => changeStatus(appointment.id, 'cancelled')}>Cancel</button>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </article>

        {profile.role === 'coach' && (
          <article className="glass-panel h-fit p-4 md:p-5">
            <div className="section-heading"><div><h2>Schedule session</h2><p className="page-subtext">Create a coaching touchpoint for an active client.</p></div><Plus size={20} className="text-[var(--muted)]" /></div>
            <form onSubmit={submit} className="grid gap-3">
              <label className="field">Client<select value={draft.clientId} onChange={(event) => setDraft((prev) => ({ ...prev, clientId: event.target.value }))}><option value="">Select client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.username}</option>)}</select></label>
              <label className="field">Title<input value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} /></label>
              <label className="field">Date and time<input type="datetime-local" value={draft.scheduledAt} onChange={(event) => setDraft((prev) => ({ ...prev, scheduledAt: event.target.value }))} /></label>
              <label className="field">Duration (minutes)<input type="number" min={10} max={240} step={5} value={draft.duration} onChange={(event) => setDraft((prev) => ({ ...prev, duration: Number(event.target.value) }))} /></label>
              <label className="field">Meeting URL<input type="url" value={draft.meetingUrl} onChange={(event) => setDraft((prev) => ({ ...prev, meetingUrl: event.target.value }))} placeholder="https://..." /></label>
              <label className="field">Notes<textarea rows={3} value={draft.notes} onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))} /></label>
              <button type="submit" className="button-primary" disabled={saving || !draft.clientId || !draft.scheduledAt}><Plus size={16} /> Schedule</button>
            </form>
          </article>
        )}
      </section>
    </Layout>
  )
}
