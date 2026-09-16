import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import Layout from '../components/shared/Layout'
import ClientComplianceTable from '../components/coach/ClientComplianceTable'
import ComplianceHeatmap from '../components/coach/ComplianceHeatmap'
import PlateauRadar from '../components/coach/PlateauRadar'
import BulkUpdateEngine from '../components/coach/BulkUpdateEngine'
import CoachMedicalAlerts from '../components/coach/CoachMedicalAlerts'
import PeriodFriendlySwaps from '../components/coach/PeriodFriendlySwaps'
import EducationVault from '../components/coach/EducationVault'
import { useAuth } from '../hooks/useAuth'
import { getCoachOverview } from '../api/productApi'
import type { CoachOverview } from '../api/productApi'
import { subscribeToWorkoutCheckins } from '../api/coachApi'
import type { CravingType } from '../utils/cycleSwaps'
import { isSupabaseConfigured } from '../lib/supabase'

const emptyOverview: CoachOverview = {
  clients: [],
  recentLogs: [],
  clientRows: [],
  libidoHistory: [],
  energyHistory: [],
  weightDelta14d: 0,
}

export default function CoachDashboard() {
  const { profile, signOut } = useAuth()
  const [liveEvents, setLiveEvents] = useState(0)
  const [cravingType, setCravingType] = useState<CravingType>('Sweet')
  const [tab, setTab] = useState<'overview' | 'tools' | 'resources' | 'system'>('overview')
  const [overview, setOverview] = useState<CoachOverview>(emptyOverview)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToWorkoutCheckins(() => setLiveEvents((count) => count + 1))
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!profile) return
    setLoading(true)
    getCoachOverview(profile.id)
      .then((data) => {
        setOverview(data)
        setError('')
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load coach analytics.'))
      .finally(() => setLoading(false))
  }, [profile])

  const riskCount = overview.clientRows.filter((client) => client.riskReasons.length > 0).length
  const averageCompliance = overview.clients.length
    ? Math.round((overview.clients.reduce((sum, client) => sum + client.complianceRate, 0) / overview.clients.length) * 100)
    : 0
  const validRecentLogs = useMemo(() => overview.recentLogs.filter((log) => log.calories_target > 0), [overview.recentLogs])

  if (!profile) return null

  return (
    <Layout
      profile={profile}
      title="Coach overview"
      subtitle="A live view of client adherence, risk signals, and the work that needs your attention today."
      onSignOut={signOut}
    >
      {error && <p className="form-status mb-4">{error}</p>}

      <section className="metric-grid mb-4">
        <article className="metric-card">
          <div className="flex items-center justify-between"><p className="metric-label">Active clients</p><Users size={17} className="text-[var(--muted)]" /></div>
          <p className="metric-value">{overview.clients.length}</p>
          <p className="metric-meta">Active coach-client relationships</p>
        </article>
        <article className="metric-card">
          <div className="flex items-center justify-between"><p className="metric-label">Average compliance</p><CheckCircle2 size={17} className="text-[var(--muted)]" /></div>
          <p className="metric-value">{averageCompliance}%</p>
          <p className="metric-meta">Recent logged calories vs targets</p>
        </article>
        <article className="metric-card">
          <div className="flex items-center justify-between"><p className="metric-label">Needs attention</p><AlertTriangle size={17} className="text-[var(--muted)]" /></div>
          <p className="metric-value">{riskCount}</p>
          <p className="metric-meta">Clients with recovery or glucose flags</p>
        </article>
        <article className="metric-card">
          <div className="flex items-center justify-between"><p className="metric-label">Live check-ins</p><Activity size={17} className="text-[var(--muted)]" /></div>
          <p className="metric-value">{liveEvents}</p>
          <p className="metric-meta">Realtime gym log inserts this session</p>
        </article>
      </section>

      <section className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
        <div>
          <p className="font-semibold">Client operations</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Search clients, inspect individual risk reasons, and pin a note directly to a client dashboard.</p>
        </div>
        <Link to="/clients" className="button-primary">Open clients <ArrowRight size={16} /></Link>
      </section>

      <section className="mb-4 tab-strip">
        <button type="button" className={`tab-btn ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
        <button type="button" className={`tab-btn ${tab === 'tools' ? 'active' : ''}`} onClick={() => setTab('tools')}>Coaching tools</button>
        <button type="button" className={`tab-btn ${tab === 'resources' ? 'active' : ''}`} onClick={() => setTab('resources')}>Resources</button>
        <button type="button" className={`tab-btn ${tab === 'system' ? 'active' : ''}`} onClick={() => setTab('system')}>System</button>
      </section>

      {tab === 'overview' && (
        loading ? (
          <div className="empty-state">Loading coach analytics...</div>
        ) : overview.clients.length === 0 ? (
          <div className="empty-state">
            <div>
              <Users className="mx-auto mb-3" size={26} />
              <strong>No active client relationships yet</strong>
              <p className="mt-1 text-sm">Once clients are linked to this coach, real adherence and risk analytics will appear here.</p>
            </div>
          </div>
        ) : (
          <section className="grid gap-4 xl:grid-cols-2">
            <ClientComplianceTable clients={overview.clients} />
            {validRecentLogs.length > 0 ? (
              <ComplianceHeatmap logs={validRecentLogs} />
            ) : (
              <article className="glass-panel p-4 md:p-5">
                <h2 className="text-lg font-bold">Compliance heatmap</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">No client has logged both calorie target and actual calories yet.</p>
              </article>
            )}
            <CoachMedicalAlerts
              libidoHistory={overview.libidoHistory.length >= 3 ? overview.libidoHistory : [5, 5, 5]}
              energyHistory={overview.energyHistory.length >= 3 ? overview.energyHistory : [5, 5, 5]}
              weightDelta14d={overview.weightDelta14d}
              diabeticReadings={overview.diabeticReadings}
            />
            <PlateauRadar clients={overview.clients} />
          </section>
        )
      )}

      {tab === 'tools' && (
        <section className="grid gap-4 xl:grid-cols-2">
          <BulkUpdateEngine clients={overview.clients} />
          <PeriodFriendlySwaps cravingType={cravingType} />
          <article className="glass-panel p-4 md:p-5">
            <h2 className="text-lg font-bold">Craving context</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Switch the substitution tool to the client context you are reviewing.</p>
            <label className="field mt-4">
              Current context
              <select value={cravingType} onChange={(event) => setCravingType(event.target.value as CravingType)}>
                <option>Sweet</option>
                <option>Salty</option>
                <option>Both</option>
                <option>None</option>
              </select>
            </label>
          </article>
          <article className="glass-panel p-4 md:p-5">
            <h2 className="text-lg font-bold">Notes and interventions</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Use the Clients workspace to select a person, review their risk reasons, and save a private or client-visible coaching note.</p>
            <Link to="/clients" className="button-secondary mt-4">Open client roster</Link>
          </article>
        </section>
      )}

      {tab === 'resources' && (
        <section className="grid gap-4 xl:grid-cols-2">
          <EducationVault />
          <article className="glass-panel p-4 md:p-5">
            <h2 className="text-lg font-bold">Product workspaces</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Integration readiness and roadmap tracking remain available without mixing them into live client analytics.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/integrations" className="button-primary">Integration hub</Link>
              <Link to="/roadmap" className="button-secondary">Roadmap</Link>
            </div>
          </article>
        </section>
      )}

      {tab === 'system' && (
        <section className="grid gap-4 xl:grid-cols-2">
          <article className="glass-panel p-4 md:p-5">
            <h2 className="text-lg font-bold">Data connection</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--panel-muted)] p-3">
                <span>Supabase environment</span>
                <span className="inline-flex items-center gap-2 font-semibold"><span className={`status-dot ${isSupabaseConfigured ? 'ok' : 'warn'}`} />{isSupabaseConfigured ? 'Connected' : 'Preview only'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--panel-muted)] p-3">
                <span>Realtime workout events</span>
                <span className="font-semibold">Subscribed</span>
              </div>
            </div>
          </article>
          <article className="glass-panel p-4 md:p-5">
            <h2 className="text-lg font-bold">No fabricated business status</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Subscription, payment, and contract states are no longer shown as “Active” or “Signed” unless they come from a real backend source.</p>
          </article>
        </section>
      )}
    </Layout>
  )
}
