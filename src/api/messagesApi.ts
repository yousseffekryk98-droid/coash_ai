import { supabase } from './supabaseClient'

export type DirectMessage = {
  id: number
  coach_id: string
  client_id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
}

export async function getDirectMessages(clientId?: string): Promise<DirectMessage[]> {
  const client = supabase
  if (!client) return []

  let query = client
    .from('direct_messages')
    .select('id,coach_id,client_id,sender_id,body,created_at,read_at')
    .order('created_at', { ascending: true })
    .limit(500)

  if (clientId) query = query.eq('client_id', clientId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as DirectMessage[]
}

export async function getActiveCoachForClient(clientId: string): Promise<string | null> {
  const client = supabase
  if (!client) return null

  const { data, error } = await client
    .from('coaching_relationships')
    .select('coach_id')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return (data?.coach_id as string | undefined) ?? null
}

export async function sendDirectMessage(coachId: string, clientId: string, senderId: string, body: string) {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')

  const trimmed = body.trim()
  if (!trimmed) return

  const { error } = await client.from('direct_messages').insert({
    coach_id: coachId,
    client_id: clientId,
    sender_id: senderId,
    body: trimmed,
  })
  if (error) throw error
}
