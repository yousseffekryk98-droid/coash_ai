import { supabase } from './supabaseClient'

export type ClientHabit = {
  id: number
  coach_id: string
  client_id: string
  title: string
  description: string | null
  cadence: 'daily' | 'weekly'
  target_per_period: number
  starts_on: string
  ends_on: string | null
  active: boolean
  created_at: string
}

export type HabitCheckin = {
  id: number
  habit_id: number
  client_id: string
  checkin_date: string
  completed_count: number
  note: string | null
}

export type CoachingAppointment = {
  id: number
  coach_id: string
  client_id: string
  title: string
  scheduled_at: string
  duration_minutes: number
  meeting_url: string | null
  notes: string | null
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
}

export type AIRecommendation = {
  id: number
  coach_id: string
  client_id: string
  recommendation_type: 'adherence' | 'recovery' | 'nutrition' | 'training' | 'engagement' | 'general'
  title: string
  rationale: string
  payload: Record<string, unknown>
  confidence: number | null
  model_version: string
  status: 'draft' | 'approved' | 'rejected' | 'applied'
  created_at: string
}

export async function getHabits(clientId?: string): Promise<ClientHabit[]> {
  const client = supabase
  if (!client) return []

  let query = client
    .from('client_habits')
    .select('id,coach_id,client_id,title,description,cadence,target_per_period,starts_on,ends_on,active,created_at')
    .order('active', { ascending: false })
    .order('created_at', { ascending: false })

  if (clientId) query = query.eq('client_id', clientId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as ClientHabit[]
}

export async function createHabit(
  coachId: string,
  clientId: string,
  values: Pick<ClientHabit, 'title' | 'description' | 'cadence' | 'target_per_period' | 'starts_on' | 'ends_on'>,
) {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')

  const { error } = await client.from('client_habits').insert({
    coach_id: coachId,
    client_id: clientId,
    ...values,
    active: true,
  })
  if (error) throw error
}

export async function setHabitActive(habitId: number, active: boolean) {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')

  const { error } = await client
    .from('client_habits')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', habitId)
  if (error) throw error
}

export async function getHabitCheckins(clientId: string, sinceDate: string): Promise<HabitCheckin[]> {
  const client = supabase
  if (!client) return []

  const { data, error } = await client
    .from('habit_checkins')
    .select('id,habit_id,client_id,checkin_date,completed_count,note')
    .eq('client_id', clientId)
    .gte('checkin_date', sinceDate)
    .order('checkin_date', { ascending: false })

  if (error) throw error
  return (data ?? []) as HabitCheckin[]
}

export async function upsertHabitCheckin(
  clientId: string,
  habitId: number,
  checkinDate: string,
  completedCount: number,
  note?: string,
) {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')

  const { error } = await client.from('habit_checkins').upsert(
    {
      habit_id: habitId,
      client_id: clientId,
      checkin_date: checkinDate,
      completed_count: completedCount,
      note: note?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'habit_id,checkin_date' },
  )
  if (error) throw error
}

export async function getAppointments(): Promise<CoachingAppointment[]> {
  const client = supabase
  if (!client) return []

  const { data, error } = await client
    .from('coaching_appointments')
    .select('id,coach_id,client_id,title,scheduled_at,duration_minutes,meeting_url,notes,status,created_at')
    .order('scheduled_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as CoachingAppointment[]
}

export async function createAppointment(
  coachId: string,
  clientId: string,
  values: Pick<CoachingAppointment, 'title' | 'scheduled_at' | 'duration_minutes' | 'meeting_url' | 'notes'>,
) {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')

  const { error } = await client.from('coaching_appointments').insert({
    coach_id: coachId,
    client_id: clientId,
    ...values,
    status: 'scheduled',
  })
  if (error) throw error
}

export async function updateAppointmentStatus(appointmentId: number, status: CoachingAppointment['status']) {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')

  const { error } = await client
    .from('coaching_appointments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', appointmentId)
  if (error) throw error
}

export async function getAIRecommendations(coachId: string): Promise<AIRecommendation[]> {
  const client = supabase
  if (!client) return []

  const { data, error } = await client
    .from('ai_recommendations')
    .select('id,coach_id,client_id,recommendation_type,title,rationale,payload,confidence,model_version,status,created_at')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return (data ?? []) as AIRecommendation[]
}

export async function saveAIRecommendation(
  coachId: string,
  clientId: string,
  values: Pick<AIRecommendation, 'recommendation_type' | 'title' | 'rationale' | 'payload' | 'confidence' | 'model_version'>,
) {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')

  const { error } = await client.from('ai_recommendations').insert({
    coach_id: coachId,
    client_id: clientId,
    ...values,
    status: 'draft',
  })
  if (error) throw error
}

export async function updateAIRecommendationStatus(recommendationId: number, status: AIRecommendation['status']) {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')

  const { error } = await client
    .from('ai_recommendations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', recommendationId)
  if (error) throw error
}

export async function upsertAIRecommendationFeedback(
  recommendationId: number,
  coachId: string,
  score: number,
  outcomeLabel: 'helpful' | 'neutral' | 'not_helpful' | 'unsafe' | 'not_applicable',
  reason?: string,
) {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')

  const { error } = await client.from('ai_recommendation_feedback').upsert(
    {
      recommendation_id: recommendationId,
      coach_id: coachId,
      score,
      outcome_label: outcomeLabel,
      reason: reason?.trim() || null,
    },
    { onConflict: 'recommendation_id,coach_id' },
  )
  if (error) throw error
}
