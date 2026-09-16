import type { CoachClientRow } from '../api/productApi'
import type { AIRecommendation } from '../api/engagementApi'

type RecommendationType = AIRecommendation['recommendation_type']

export type CoachInsight = {
  clientId: string
  username: string
  priorityScore: number
  priority: 'high' | 'medium' | 'low'
  recommendationType: RecommendationType
  title: string
  rationale: string
  confidence: number
  actions: string[]
  evidence: string[]
}

function daysBetween(dateValue: string | null, todayIso: string) {
  if (!dateValue) return 999
  const start = new Date(`${dateValue}T12:00:00Z`).getTime()
  const end = new Date(`${todayIso}T12:00:00Z`).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 999
  return Math.max(0, Math.round((end - start) / 86_400_000))
}

function selectType(client: CoachClientRow, staleDays: number): RecommendationType {
  if (staleDays >= 5) return 'engagement'
  if (client.riskReasons.some((reason) => reason.toLowerCase().includes('sleep') || reason.toLowerCase().includes('libido'))) {
    return 'recovery'
  }
  if (client.riskReasons.some((reason) => reason.toLowerCase().includes('glucose'))) return 'nutrition'
  if (client.complianceRate < 0.7) return 'adherence'
  return 'general'
}

export function buildCoachInsight(client: CoachClientRow, todayIso: string): CoachInsight {
  const staleDays = daysBetween(client.lastCheckin, todayIso)
  const compliancePenalty = Math.round((1 - Math.max(0, Math.min(1, client.complianceRate))) * 45)
  const riskPenalty = Math.min(35, client.riskReasons.length * 14)
  const stalePenalty = staleDays >= 7 ? 25 : staleDays >= 4 ? 16 : staleDays >= 2 ? 7 : 0
  const priorityScore = Math.min(100, compliancePenalty + riskPenalty + stalePenalty)
  const priority = priorityScore >= 65 ? 'high' : priorityScore >= 35 ? 'medium' : 'low'
  const recommendationType = selectType(client, staleDays)

  const evidence: string[] = []
  if (client.complianceRate < 0.8) evidence.push(`${Math.round(client.complianceRate * 100)}% recent nutrition compliance`)
  if (staleDays >= 2) evidence.push(`${staleDays} days since last check-in`)
  evidence.push(...client.riskReasons)
  if (!evidence.length) evidence.push('No current risk flags; maintain normal follow-up cadence')

  const actions: string[] = []
  if (staleDays >= 5) actions.push('Send a short check-in message and ask what is blocking logging or training consistency.')
  if (client.complianceRate < 0.7) actions.push('Review the current plan for friction and simplify one nutrition target for the next 7 days.')
  if (client.riskReasons.some((reason) => reason.toLowerCase().includes('sleep'))) {
    actions.push('Review sleep and recovery context before increasing training demand.')
  }
  if (client.riskReasons.some((reason) => reason.toLowerCase().includes('libido'))) {
    actions.push('Discuss recovery, stress, training load, and energy intake without treating the signal as a diagnosis.')
  }
  if (client.riskReasons.some((reason) => reason.toLowerCase().includes('glucose'))) {
    actions.push('Review the logged reading and confirm the client follows clinician guidance; do not change medical treatment from this tool.')
  }
  if (!actions.length) actions.push('Keep the current plan and reinforce the next measurable goal at the next check-in.')

  const title = priority === 'high'
    ? `Review ${client.username} today`
    : priority === 'medium'
      ? `Follow up with ${client.username}`
      : `Maintain ${client.username}'s momentum`

  const rationale = `Priority is ${priority} (${priorityScore}/100) based on adherence, check-in recency, and recorded coaching flags. This is decision support for coach review, not a medical assessment.`
  const confidence = client.lastCheckin ? (client.riskReasons.length || client.complianceRate > 0 ? 0.82 : 0.65) : 0.5

  return {
    clientId: client.id,
    username: client.username,
    priorityScore,
    priority,
    recommendationType,
    title,
    rationale,
    confidence,
    actions,
    evidence,
  }
}

export function buildCoachInsights(clients: CoachClientRow[], todayIso: string) {
  return clients
    .map((client) => buildCoachInsight(client, todayIso))
    .sort((left, right) => right.priorityScore - left.priorityScore)
}
