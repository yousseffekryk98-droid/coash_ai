import { supabase } from './supabaseClient'

export async function saveIntegrationConnection(provider: string, status: 'connected' | 'disconnected') {
  if (!supabase) return { error: new Error('Supabase is not configured') }

  const { error } = await supabase.from('integration_connections').upsert({
    provider,
    status,
    last_synced_at: new Date().toISOString(),
  })

  return { error }
}

export async function logWearableMetric(payload: {
  user_id: string
  metric_date: string
  steps?: number
  sleep_hours?: number
  sleep_deep_minutes?: number
  sleep_rem_minutes?: number
  resting_heart_rate?: number
  source_provider: string
}) {
  if (!supabase) return { error: new Error('Supabase is not configured') }
  return supabase.from('wearable_metrics_daily').upsert(payload)
}

export async function logSmartScaleWeight(payload: {
  user_id: string
  measured_at: string
  weight: number
  body_fat?: number
  source_provider: string
}) {
  if (!supabase) return { error: new Error('Supabase is not configured') }
  return supabase.from('smart_scale_weights').insert(payload)
}

export async function logCgmReading(payload: {
  user_id: string
  measured_at: string
  glucose_mg_dl: number
  source_provider: string
}) {
  if (!supabase) return { error: new Error('Supabase is not configured') }
  return supabase.from('cgm_readings').insert(payload)
}

export async function enqueueWhatsAppReminder(payload: {
  user_id: string
  template_name: string
  body: string
}) {
  if (!supabase) return { error: new Error('Supabase is not configured') }
  return supabase.from('outbound_notifications').insert({
    user_id: payload.user_id,
    channel: 'whatsapp',
    template_name: payload.template_name,
    payload: { body: payload.body },
    status: 'queued',
  })
}

// External providers must be called from server-side functions only.
// Never call provider secrets directly from React client code.
