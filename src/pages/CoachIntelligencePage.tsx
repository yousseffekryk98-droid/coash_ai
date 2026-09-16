import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BrainCircuit, CheckCircle2, Save, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react'
import Layout from '../components/shared/Layout'
import { getCoachClients } from '../api/productApi'
import type { CoachClientRow } from '../api/productApi'
import {
  getAIRecommendations,
  saveAIRecommendation,
  updateAIRecommendationStatus,
  upsertAIRecommendationFeedback,
} from '../api/engagementApi'
import type { AIRecommendation } from '../api/engagementApi'
import { buildCoachInsights } from '../utils/coachIntelligence'
import type { CoachInsight } from '../utils/coachIntelligence'
import { useAuth } from '../hooks/useAuth'

export default function CoachIntelligencePage() {
  const { profile, signOut } = useAuth()
  const [todayIso] = useState(() => new Date().toISOString().slice(0, 10))
  const [clients, setClients] = useState<CoachClientRow[]>([])
  const [saved, setSaved] = useState<AIRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | number | null>(null)

  const load = useCallback(async () => {
    if (!profile) return
    try {
      const [clientRows, recommendations] = await Promise.all([
        getCoachClients(profile.id),
        getAIRecommendations(profile.id),
      ])
      setClients(clientRows)
      setSaved(recommendations)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load coach intelligence.')
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    void load()
  }, [load])

  const insights = useMemo(() => buildCoachInsights(clients, todayIso), [clients, todayIso])
  const highPriority = insights.filter((item) => item.priority === 'high').length
  const mediumPriority = insights.filter((item) => item.priority === 'medium').length
  const approved = saved.filter((item) => item.status === 'approved' || item.status === 'applied').length

  if (!profile) return null

  const saveDraft = async (insight: CoachInsight) => {
    setBusyId(insight.clientId)
    setError('')
    try {
      await saveAIRecommendation(profile.id, insight.clientId, {
        recommendation_type: insight.recommendationType,
        title: insight.title,
        rationale: insight.rationale,
        confidence: insight.confidence,
        model_version: 'coach-rules-v2',
        payload: {
          priority: insight.priority,
          priorityScore: insight.priorityScore,
          actions: insight.actions,
          evidence: insight.evidence,
          generatedForDate: todayIso,
        },
      })
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save recommendation.')
    } finally {
      setBusyId(null)
    }
  }

  const changeStatus = async (recommendation: AIRecommendation, status: AIRecommendation['status']) => {
    setBusyId(recommendation.id)
    try {
      await updateAIRecommendationStatus(recommendation.id, status)
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update recommendation.')
    } finally {
      setBusyId(null)
    }
  }

  const rate = async (recommendation: AIRecommendation, helpful: boolean) => {
    setBusyId(recommendation.id)
    try {
      await upsertAIRecommendationFeedback(
        recommendation.id,
        profile.id,
        helpful ? 5 : 1,
        helpful ? 'helpful' : 'not_helpful',
      )
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save feedback.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Layout
      profile={profile}
      title="Coach intelligence"
      subtitle="Prioritize attention, review evidence, and approve or reject coaching suggestions before they become actions."
      onSignOut={signOut}
    >
      <section className="mb-4 rounded-2xl border border-amber-300/60 bg-amber-500/10 p-4 text-sm">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-semibold">Human review is required</p>
            <p className="mt-1 text-[var(--muted)]">This workspace ranks coaching follow-up from logged behavior and coach-visible flags. It does not diagnose conditions or replace clinical judgment.</p>
          </div>
        </div>
      </section>

      {error && <p className="form-status mb-4">{error}</p>}

      <section className="metric-grid mb-4">
        <article className="metric-card"><p className="metric-label">High priority</p><p className="metric-value">{highPriority}</p><p className="metric-meta">Clients suggested for review today</p></article>
        <article className="metric-card"><p className="metric-label">Medium priority</p><p className="metric-value">{mediumPriority}</p><p className="metric-meta">Follow-up worth scheduling</p></article>
        <article className="metric-card"><p className="metric-label">Review queue</p><p className="metric-value">{saved.filter((item) => item.status === 'draft').length}</p><p className="metric-meta">Saved suggestions awaiting a decision</p></article>
        <article className="metric-card"><p className="metric-label">Approved/applied</p><p className="metric-value">{approved}</p><p className="metric-meta">Coach-controlled recommendation history</p></article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <article className="glass-panel p-4 md:p-5">
          <div className="section-heading">
            <div><h2>Priority queue</h2><p className="page-subtext">Ranked from adherence, recent check-ins, and existing coaching flags.</p></div>
            <BrainCircuit size={20} className="text-[var(--muted)]" />
          </div>

          {loading ? (
            <div className="empty-state">Analyzing current coaching data...</div>
          ) : insights.length === 0 ? (
            <div className="empty-state">No active clients are available for intelligence review yet.</div>
          ) : (
            <div className="grid gap-3">
              {insights.map((insight) => (
                <article key={insight.clientId} className="rounded-2xl border border-[var(--line)] bg-[var(--panel-muted)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">{insight.title}</h3>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${insight.priority === 'high' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300' : insight.priority === 'medium' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>{insight.priority}</span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted)]">Priority score {insight.priorityScore}/100 · confidence {Math.round(insight.confidence * 100)}%</p>
                    </div>
                    <button type="button" className="button-secondary" disabled={busyId === insight.clientId} onClick={() => saveDraft(insight)}>
                      <Save size={15} /> Save for review
                    </button>
                  </div>

                  <p className="mt-3 text-sm text-[var(--muted)]">{insight.rationale}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl bg-[var(--panel-strong)] p-3 text-sm">
                      <p className="font-semibold">Evidence</p>
                      <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">{insight.evidence.map((item) => <li key={item}>• {item}</li>)}</ul>
                    </div>
                    <div className="rounded-xl bg-[var(--panel-strong)] p-3 text-sm">
                      <p className="font-semibold">Suggested actions</p>
                      <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">{insight.actions.map((item) => <li key={item}>• {item}</li>)}</ul>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="glass-panel h-fit p-4 md:p-5">
          <div className="section-heading">
            <div><h2>Coach review queue</h2><p className="page-subtext">Your decisions become structured feedback for later model evaluation.</p></div>
            <Sparkles size={20} className="text-[var(--muted)]" />
          </div>

          {saved.length === 0 ? (
            <div className="empty-state">Save a suggestion from the priority queue to start a review history.</div>
          ) : (
            <div className="grid gap-3">
              {saved.slice(0, 12).map((recommendation) => (
                <article key={recommendation.id} className="rounded-2xl border border-[var(--line)] bg-[var(--panel-muted)] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div><p className="text-sm font-semibold">{recommendation.title}</p><p className="mt-1 text-xs capitalize text-[var(--muted)]">{recommendation.recommendation_type} · {recommendation.status}</p></div>
                    {recommendation.status === 'approved' || recommendation.status === 'applied' ? <CheckCircle2 size={16} className="text-emerald-500" /> : null}
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted)]">{recommendation.rationale}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {recommendation.status === 'draft' && <button type="button" className="button-primary" disabled={busyId === recommendation.id} onClick={() => changeStatus(recommendation, 'approved')}>Approve</button>}
                    {recommendation.status === 'draft' && <button type="button" className="button-secondary" disabled={busyId === recommendation.id} onClick={() => changeStatus(recommendation, 'rejected')}>Reject</button>}
                    {recommendation.status === 'approved' && <button type="button" className="button-secondary" disabled={busyId === recommendation.id} onClick={() => changeStatus(recommendation, 'applied')}>Mark applied</button>}
                    <button type="button" className="button-secondary" aria-label="Helpful suggestion" disabled={busyId === recommendation.id} onClick={() => rate(recommendation, true)}><ThumbsUp size={14} /></button>
                    <button type="button" className="button-secondary" aria-label="Not helpful suggestion" disabled={busyId === recommendation.id} onClick={() => rate(recommendation, false)}><ThumbsDown size={14} /></button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    </Layout>
  )
}
