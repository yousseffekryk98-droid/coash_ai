import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, MessageSquarePlus, Search, Users } from 'lucide-react'
import Layout from '../components/shared/Layout'
import { addCoachClientNote, getCoachClients } from '../api/productApi'
import type { CoachClientRow } from '../api/productApi'
import { useAuth } from '../hooks/useAuth'

export default function CoachClientsPage() {
  const { profile, signOut } = useAuth()
  const [clients, setClients] = useState<CoachClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [note, setNote] = useState('')
  const [visibleToClient, setVisibleToClient] = useState(true)
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    if (!profile) return

    setLoading(true)
    getCoachClients(profile.id)
      .then(setClients)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load clients.'))
      .finally(() => setLoading(false))
  }, [profile])

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return clients
    return clients.filter((client) => client.username.toLowerCase().includes(term))
  }, [clients, search])

  const riskCount = clients.filter((client) => client.riskReasons.length > 0).length
  const checkedInThisWeek = clients.filter((client) => {
    if (!client.lastCheckin) return false
    const elapsed = Date.now() - new Date(`${client.lastCheckin}T12:00:00`).getTime()
    return elapsed <= 7 * 24 * 60 * 60 * 1000
  }).length

  if (!profile) return null

  const saveNote = async () => {
    if (!selectedClientId || !note.trim()) return
    setSavingNote(true)
    setError('')
    try {
      await addCoachClientNote(profile.id, selectedClientId, note.trim(), visibleToClient)
      setNote('')
      setSelectedClientId('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save note.')
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <Layout
      profile={profile}
      title="Clients"
      subtitle="Review adherence, recent check-ins, risk signals, and coaching notes without jumping between spreadsheets."
      onSignOut={signOut}
    >
      <section className="metric-grid mb-4">
        <article className="metric-card">
          <p className="metric-label">Active clients</p>
          <p className="metric-value">{clients.length}</p>
          <p className="metric-meta">Linked through active coaching relationships</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Checked in this week</p>
          <p className="metric-value">{checkedInThisWeek}</p>
          <p className="metric-meta">Clients with a log in the last 7 days</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Needs attention</p>
          <p className="metric-value">{riskCount}</p>
          <p className="metric-meta">Low recovery, libido, or glucose flags</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Average compliance</p>
          <p className="metric-value">
            {clients.length ? Math.round((clients.reduce((sum, client) => sum + client.complianceRate, 0) / clients.length) * 100) : 0}%
          </p>
          <p className="metric-meta">Calories within 10% of assigned target</p>
        </article>
      </section>

      {error && <p className="form-status mb-4">{error}</p>}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.7fr)]">
        <article className="glass-panel p-4 md:p-5">
          <div className="section-heading">
            <div>
              <h2>Client roster</h2>
              <p className="page-subtext">Search, scan current status, then add a coaching note from the panel beside the roster.</p>
            </div>
          </div>

          <label className="input-with-icon mb-4 block">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search clients..."
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-2.5 pl-10 text-sm"
            />
          </label>

          {loading ? (
            <div className="empty-state"><span>Loading client data...</span></div>
          ) : filteredClients.length === 0 ? (
            <div className="empty-state">
              <div>
                <Users className="mx-auto mb-3" size={24} />
                <strong>No active clients found</strong>
                <p className="mt-1 text-sm">Create or activate a coaching relationship in Supabase to populate this roster.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] text-xs uppercase tracking-wide text-[var(--muted)]">
                    <th className="px-2 py-3">Client</th>
                    <th className="px-2 py-3">Compliance</th>
                    <th className="px-2 py-3">Last check-in</th>
                    <th className="px-2 py-3">Weight</th>
                    <th className="px-2 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className={`cursor-pointer border-b border-[var(--line)] transition hover:bg-[var(--panel-muted)] ${selectedClientId === client.id ? 'bg-[var(--brand-soft)]' : ''}`}
                      onClick={() => setSelectedClientId(client.id)}
                    >
                      <td className="px-2 py-3 font-semibold">{client.username}</td>
                      <td className="px-2 py-3">{Math.round(client.complianceRate * 100)}%</td>
                      <td className="px-2 py-3 text-[var(--muted)]">{client.lastCheckin ?? 'No logs yet'}</td>
                      <td className="px-2 py-3">{client.latestWeight !== null ? `${Number(client.latestWeight).toFixed(1)} kg` : '—'}</td>
                      <td className="px-2 py-3">
                        {client.riskReasons.length ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-1 text-xs text-rose-600 dark:text-rose-300">
                            <AlertTriangle size={13} /> Needs review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 size={13} /> Stable
                          </span>
                        )}
                        {client.riskReasons.length > 0 && (
                          <p className="mt-1 max-w-[220px] text-xs text-[var(--muted)]">{client.riskReasons.join(' · ')}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="glass-panel h-fit p-4 md:p-5">
          <div className="section-heading">
            <div>
              <h2>Coach note</h2>
              <p className="page-subtext">Select a client from the roster, then save context for your next intervention.</p>
            </div>
            <MessageSquarePlus size={19} className="text-[var(--muted)]" />
          </div>

          <label className="field">
            Selected client
            <select value={selectedClientId} onChange={(event) => setSelectedClientId(event.target.value)}>
              <option value="">Choose a client</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.username}</option>)}
            </select>
          </label>

          <label className="field mt-3">
            Note
            <textarea
              rows={6}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Example: increase calories on training days and review sleep trend next check-in."
            />
          </label>

          <label className="mt-3 flex items-center gap-2 text-sm text-[var(--muted)]">
            <input type="checkbox" checked={visibleToClient} onChange={(event) => setVisibleToClient(event.target.checked)} />
            Show this note on the client dashboard
          </label>

          <button
            type="button"
            className="button-primary mt-4 w-full"
            onClick={saveNote}
            disabled={savingNote || !selectedClientId || !note.trim()}
          >
            {savingNote ? 'Saving...' : 'Save note'}
          </button>
        </article>
      </section>
    </Layout>
  )
}
