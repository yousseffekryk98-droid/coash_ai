import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Layout from '../components/shared/Layout'
import ClientComplianceTable from '../components/coach/ClientComplianceTable'
import ComplianceHeatmap from '../components/coach/ComplianceHeatmap'
import PlateauRadar from '../components/coach/PlateauRadar'
import BulkUpdateEngine from '../components/coach/BulkUpdateEngine'
import CoachMedicalAlerts from '../components/coach/CoachMedicalAlerts'
import WeightPeriodChart from '../components/coach/WeightPeriodChart'
import PhotoComparison from '../components/coach/PhotoComparison'
import PeriodFriendlySwaps from '../components/coach/PeriodFriendlySwaps'
import EducationVault from '../components/coach/EducationVault'
import VideoFeedbackStudio from '../components/coach/VideoFeedbackStudio'
import { useAuth } from '../hooks/useAuth'
import { demoCheckins, demoDailyLogs, demoWeightTrend } from '../data/mock'
import { demoClientSummaries } from '../store/appStore'
import { subscribeToWorkoutCheckins } from '../api/coachApi'
import type { CravingType } from '../utils/cycleSwaps'
import { videoFeedbackArchive } from '../data/healthVault'

export default function CoachDashboard() {
  const { profile, signOut } = useAuth()
  const [liveEvents, setLiveEvents] = useState(0)
  const [cravingType, setCravingType] = useState<CravingType>('Sweet')
  const [tab, setTab] = useState<'overview' | 'clients' | 'media' | 'business'>('overview')

  useEffect(() => {
    const unsubscribe = subscribeToWorkoutCheckins(() => setLiveEvents((count) => count + 1))
    return () => unsubscribe()
  }, [])

  if (!profile) return null

  return (
    <Layout
      profile={profile}
      title="Coach Command Center"
      subtitle="Compliance analytics, medical alerts, periodization controls, and realtime monitoring."
      onSignOut={signOut}
    >
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-4 rounded-xl border border-emerald-300 bg-emerald-500/10 p-3 text-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p>Live workout check-ins received: {liveEvents}</p>
          <div className="flex items-center gap-2">
            <Link to="/roadmap" className="rounded-md bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white">
              Open MVP Tracker
            </Link>
            <Link to="/integrations" className="rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-1.5 text-xs font-semibold">
              Open Integration Hub
            </Link>
          </div>
        </div>
      </motion.section>

      <section className="mb-4 tab-strip">
        <button type="button" className={`tab-btn ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
        <button type="button" className={`tab-btn ${tab === 'clients' ? 'active' : ''}`} onClick={() => setTab('clients')}>Client Analytics</button>
        <button type="button" className={`tab-btn ${tab === 'media' ? 'active' : ''}`} onClick={() => setTab('media')}>Media and Feedback</button>
        <button type="button" className={`tab-btn ${tab === 'business' ? 'active' : ''}`} onClick={() => setTab('business')}>Business Ops</button>
      </section>

      {tab === 'overview' && (
        <section className="grid gap-4 xl:grid-cols-2">
          <ClientComplianceTable clients={demoClientSummaries} />
          <ComplianceHeatmap logs={demoDailyLogs} />
          <CoachMedicalAlerts
            libidoHistory={[2, 2, 1]}
            energyHistory={[2, 2, 2]}
            weightDelta14d={0.04}
            diabeticReadings={{ pre: 110, post: 188 }}
          />
          <PlateauRadar clients={demoClientSummaries} />
        </section>
      )}

      {tab === 'clients' && (
        <section className="grid gap-4 xl:grid-cols-2">
          <BulkUpdateEngine clients={demoClientSummaries} />
          <PeriodFriendlySwaps cravingType={cravingType} />
          <WeightPeriodChart data={demoWeightTrend} periodRange={{ fromIndex: 4, toIndex: 6 }} />
          <section className="glass-panel card-entrance p-4 md:p-5">
            <h2 className="text-lg font-bold">Craving Context</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Set current phase craving mode for fast substitution tools.</p>
            <label className="mt-2 block rounded border border-[var(--line)] bg-[var(--panel-strong)] p-2 text-sm">
              Current craving context
              <select
                value={cravingType}
                onChange={(event) => setCravingType(event.target.value as CravingType)}
                className="mt-1 block w-full rounded border border-[var(--line)] bg-transparent p-2"
              >
                <option>Sweet</option>
                <option>Salty</option>
                <option>Both</option>
                <option>None</option>
              </select>
            </label>
          </section>
        </section>
      )}

      {tab === 'media' && (
        <section className="grid gap-4 xl:grid-cols-2">
          <PhotoComparison checkins={demoCheckins} />
          <VideoFeedbackStudio archive={videoFeedbackArchive} />
          <EducationVault />
        </section>
      )}

      {tab === 'business' && (
        <section className="grid gap-4 xl:grid-cols-2">
          <section className="glass-panel card-entrance p-4 md:p-5">
            <h2 className="text-lg font-bold">Realtime and Business Layer</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Subscriptions, onboarding status, and monetization readiness.</p>
            <div className="mt-3 grid gap-2 text-sm">
              <p className="rounded border border-[var(--line)] bg-[var(--panel-strong)] p-2">Subscription: Active</p>
              <p className="rounded border border-[var(--line)] bg-[var(--panel-strong)] p-2">Onboarding Contract: Signed</p>
              <p className="rounded border border-[var(--line)] bg-[var(--panel-strong)] p-2">Payment Provider: Stripe (planned live)</p>
            </div>
          </section>
        </section>
      )}
    </Layout>
  )
}
