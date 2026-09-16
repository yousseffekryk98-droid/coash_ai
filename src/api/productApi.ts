import { supabase } from './supabaseClient'
import type { ClientSummary, DailyLog, GymLog, WeightEntry } from '../types'

export type DailyLogRow = {
  user_id: string
  log_date: string
  weight: number | null
  calories_target: number | null
  calories_actual: number | null
  protein_actual: number | null
  carbs_actual: number | null
  fats_actual: number | null
  fiber_actual: number | null
  sleep_quality: number | null
  stress_level: number | null
  libido: number | null
  cravings_type: 'Salty' | 'Sweet' | 'Both' | 'None' | null
  bloating: number | null
  pre_workout_glucose: number | null
  post_workout_glucose: number | null
}

export type ClientGoal = {
  id: number
  user_id: string
  title: string
  category: string
  target_value: number | null
  current_value: number | null
  unit: string | null
  target_date: string | null
  status: 'active' | 'completed' | 'paused'
  created_at: string
}

export type CoachClientRow = {
  id: string
  username: string
  complianceRate: number
  lastCheckin: string | null
  latestWeight: number | null
  riskReasons: string[]
}

export type ClientOverview = {
  logs: DailyLogRow[]
  gymLogs: GymLog[]
  weightTrend: WeightEntry[]
  bodyWeightKg: number | null
  cycleStartDate: string | null
  hasDiabetes: boolean
  coachNote: string | null
}

export type CoachOverview = {
  clients: ClientSummary[]
  recentLogs: DailyLog[]
  clientRows: CoachClientRow[]
  libidoHistory: number[]
  energyHistory: number[]
  weightDelta14d: number
  diabeticReadings?: { pre: number; post: number }
}

const emptyCoachOverview: CoachOverview = {
  clients: [],
  recentLogs: [],
  clientRows: [],
  libidoHistory: [],
  energyHistory: [],
  weightDelta14d: 0,
}

export async function getClientOverview(userId: string): Promise<ClientOverview> {
  if (!supabase) {
    return {
      logs: [],
      gymLogs: [],
      weightTrend: [],
      bodyWeightKg: null,
      cycleStartDate: null,
      hasDiabetes: false,
      coachNote: null,
    }
  }

  const [logsResult, gymResult, metricsResult, periodResult, profileResult, notesResult] = await Promise.all([
    supabase
      .from('daily_logs')
      .select('user_id,log_date,weight,calories_target,calories_actual,protein_actual,carbs_actual,fats_actual,fiber_actual,sleep_quality,stress_level,libido,cravings_type,bloating,pre_workout_glucose,post_workout_glucose')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(90),
    supabase
      .from('gym_logs')
      .select('date,workout_completed,rpe,notes')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(90),
    supabase.from('client_metrics').select('weight').eq('user_id', userId).maybeSingle(),
    supabase.from('period_data').select('last_start_date').eq('user_id', userId).maybeSingle(),
    supabase.from('profiles').select('has_diabetes').eq('id', userId).maybeSingle(),
    supabase
      .from('coach_client_notes')
      .select('body')
      .eq('client_id', userId)
      .eq('visible_to_client', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const logs = ((logsResult.data ?? []) as DailyLogRow[]).slice().reverse()
  const gymLogs = ((gymResult.data ?? []) as GymLog[]).slice().reverse()
  const weightTrend = logs
    .filter((log) => typeof log.weight === 'number')
    .map((log) => ({ date: log.log_date, weight: Number(log.weight) }))

  const latestLoggedWeight = [...logs].reverse().find((log) => typeof log.weight === 'number')?.weight ?? null

  return {
    logs,
    gymLogs,
    weightTrend,
    bodyWeightKg: latestLoggedWeight ? Number(latestLoggedWeight) : Number(metricsResult.data?.weight ?? 0) || null,
    cycleStartDate: periodResult.data?.last_start_date ?? null,
    hasDiabetes: Boolean(profileResult.data?.has_diabetes),
    coachNote: notesResult.data?.body ?? null,
  }
}

export async function getCoachClients(coachId: string): Promise<CoachClientRow[]> {
  if (!supabase) return []

  const { data: links, error: linkError } = await supabase
    .from('coaching_relationships')
    .select('client_id')
    .eq('coach_id', coachId)
    .eq('status', 'active')

  if (linkError) throw linkError

  const clientIds = (links ?? []).map((link) => link.client_id as string)
  if (!clientIds.length) return []

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [profilesResult, logsResult] = await Promise.all([
    supabase.from('profiles').select('id,username').in('id', clientIds),
    supabase
      .from('daily_logs')
      .select('user_id,log_date,weight,calories_target,calories_actual,libido,sleep_quality,stress_level,pre_workout_glucose,post_workout_glucose')
      .in('user_id', clientIds)
      .gte('log_date', since.toISOString().slice(0, 10))
      .order('log_date', { ascending: false }),
  ])

  if (profilesResult.error) throw profilesResult.error
  if (logsResult.error) throw logsResult.error

  const logs = (logsResult.data ?? []) as Array<Pick<DailyLogRow,
    'user_id' | 'log_date' | 'weight' | 'calories_target' | 'calories_actual' | 'libido' | 'sleep_quality' | 'stress_level' | 'pre_workout_glucose' | 'post_workout_glucose'
  >>

  return (profilesResult.data ?? []).map((profile) => {
    const clientLogs = logs.filter((log) => log.user_id === profile.id)
    const validComplianceLogs = clientLogs.filter(
      (log) => Number(log.calories_target ?? 0) > 0 && log.calories_actual !== null,
    )
    const compliantDays = validComplianceLogs.filter((log) => {
      const target = Number(log.calories_target)
      const actual = Number(log.calories_actual)
      return Math.abs(actual - target) / target <= 0.1
    }).length

    const riskReasons: string[] = []
    const latestThree = clientLogs.slice(0, 3)
    if (latestThree.length === 3 && latestThree.every((log) => Number(log.libido ?? 5) <= 2)) {
      riskReasons.push('Low libido trend')
    }
    if (latestThree.length === 3 && latestThree.every((log) => Number(log.sleep_quality ?? 10) <= 3)) {
      riskReasons.push('Low sleep quality')
    }
    if (clientLogs.some((log) => Number(log.post_workout_glucose ?? 0) >= 180)) {
      riskReasons.push('High glucose reading')
    }

    return {
      id: profile.id as string,
      username: String(profile.username ?? 'Client'),
      complianceRate: validComplianceLogs.length ? compliantDays / validComplianceLogs.length : 0,
      lastCheckin: clientLogs[0]?.log_date ?? null,
      latestWeight: clientLogs.find((log) => log.weight !== null)?.weight ?? null,
      riskReasons,
    }
  })
}

export async function getCoachOverview(coachId: string): Promise<CoachOverview> {
  if (!supabase) return emptyCoachOverview

  const clientRows = await getCoachClients(coachId)
  if (!clientRows.length) return emptyCoachOverview

  const clientIds = clientRows.map((client) => client.id)
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data, error } = await supabase
    .from('daily_logs')
    .select('user_id,log_date,weight,calories_target,calories_actual,protein_actual,carbs_actual,fats_actual,libido,sleep_quality,pre_workout_glucose,post_workout_glucose')
    .in('user_id', clientIds)
    .gte('log_date', since.toISOString().slice(0, 10))
    .order('log_date', { ascending: false })

  if (error) throw error

  const rows = (data ?? []) as DailyLogRow[]
  const clients: ClientSummary[] = clientRows.map((client) => ({
    clientId: client.id,
    clientName: client.username,
    complianceRate: client.complianceRate,
    plateauAlert: client.riskReasons.length > 0,
  }))

  const recentLogs: DailyLog[] = rows.slice(0, 7).map((log) => ({
    date: log.log_date,
    calories_target: Number(log.calories_target ?? 0),
    calories_actual: Number(log.calories_actual ?? 0),
    protein_target: 0,
    protein_actual: Number(log.protein_actual ?? 0),
    carbs_target: 0,
    carbs_actual: Number(log.carbs_actual ?? 0),
    fats_target: 0,
    fats_actual: Number(log.fats_actual ?? 0),
  }))

  const latestClientId = rows[0]?.user_id
  const focusLogs = latestClientId ? rows.filter((row) => row.user_id === latestClientId) : []
  const libidoHistory = focusLogs.slice(0, 3).reverse().map((row) => Number(row.libido ?? 5))
  const energyHistory = focusLogs.slice(0, 3).reverse().map((row) => Number(row.sleep_quality ?? 5))
  const weighted = focusLogs.filter((row) => row.weight !== null)
  const weightDelta14d = weighted.length > 1
    ? Number(weighted[0].weight ?? 0) - Number(weighted[Math.min(weighted.length - 1, 13)].weight ?? 0)
    : 0

  const glucoseRow = focusLogs.find((row) => row.pre_workout_glucose !== null && row.post_workout_glucose !== null)

  return {
    clients,
    recentLogs,
    clientRows,
    libidoHistory,
    energyHistory,
    weightDelta14d,
    diabeticReadings: glucoseRow
      ? {
          pre: Number(glucoseRow.pre_workout_glucose),
          post: Number(glucoseRow.post_workout_glucose),
        }
      : undefined,
  }
}

export async function getClientGoals(userId: string): Promise<ClientGoal[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('client_goals')
    .select('id,user_id,title,category,target_value,current_value,unit,target_date,status,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as ClientGoal[]
}

export async function createClientGoal(
  userId: string,
  goal: Pick<ClientGoal, 'title' | 'category' | 'target_value' | 'current_value' | 'unit' | 'target_date'>,
) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('client_goals').insert({ user_id: userId, ...goal, status: 'active' })
  if (error) throw error
}

export async function updateGoalProgress(goalId: number, currentValue: number, status?: ClientGoal['status']) {
  if (!supabase) throw new Error('Supabase is not configured')
  const payload: { current_value: number; status?: ClientGoal['status']; updated_at: string } = {
    current_value: currentValue,
    updated_at: new Date().toISOString(),
  }
  if (status) payload.status = status

  const { error } = await supabase.from('client_goals').update(payload).eq('id', goalId)
  if (error) throw error
}

export async function updateProfileSettings(userId: string, values: { username: string; gender: string | null; avatar_url: string | null }) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('profiles').update(values).eq('id', userId)
  if (error) throw error
}

export async function addCoachClientNote(coachId: string, clientId: string, body: string, visibleToClient: boolean) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('coach_client_notes').insert({
    coach_id: coachId,
    client_id: clientId,
    body,
    visible_to_client: visibleToClient,
  })
  if (error) throw error
}
