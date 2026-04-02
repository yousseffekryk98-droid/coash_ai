import { supabase } from './supabaseClient'

export function subscribeToWorkoutCheckins(onEvent: (payload: unknown) => void) {
  if (!supabase) return () => undefined
  const client = supabase

  const channel = client
    .channel('gym-log-events')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gym_logs' }, onEvent)
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}

export async function uploadCheckinPhoto(file: File, userId: string, poseType: 'front' | 'side' | 'back') {
  if (!supabase) return { error: new Error('Supabase is not configured'), data: null }

  const path = `${userId}/${new Date().toISOString().slice(0, 10)}-${poseType}-${file.name}`
  const uploaded = await supabase.storage.from('checkins').upload(path, file, { upsert: true })
  if (uploaded.error) return { error: uploaded.error, data: null }

  return supabase.from('photo_checkins').insert({
    user_id: userId,
    week_start: new Date().toISOString().slice(0, 10),
    pose_type: poseType,
    image_path: path,
  })
}
