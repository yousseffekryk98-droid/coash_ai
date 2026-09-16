import { useCallback, useEffect, useState } from 'react'
import { MessageCircle, Send, Users } from 'lucide-react'
import Layout from '../components/shared/Layout'
import { getCoachClients } from '../api/productApi'
import type { CoachClientRow } from '../api/productApi'
import { getActiveCoachForClient, getDirectMessages, sendDirectMessage } from '../api/messagesApi'
import type { DirectMessage } from '../api/messagesApi'
import { useAuth } from '../hooks/useAuth'

export default function MessagesPage() {
  const { profile, signOut } = useAuth()
  const [clients, setClients] = useState<CoachClientRow[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [activeCoachId, setActiveCoachId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const initialize = useCallback(async () => {
    if (!profile) return
    try {
      if (profile.role === 'coach') {
        setClients(await getCoachClients(profile.id))
      } else {
        const coachId = await getActiveCoachForClient(profile.id)
        setActiveCoachId(coachId)
        setMessages(await getDirectMessages(profile.id))
      }
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load messages.')
    } finally {
      setLoading(false)
    }
  }, [profile])

  const loadCoachThread = useCallback(async () => {
    if (!profile || profile.role !== 'coach' || !selectedClientId) return
    try {
      setMessages(await getDirectMessages(selectedClientId))
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load this conversation.')
    }
  }, [profile, selectedClientId])

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    void loadCoachThread()
  }, [loadCoachThread])

  if (!profile) return null

  const send = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!body.trim()) return

    const coachId = profile.role === 'coach' ? profile.id : activeCoachId
    const clientId = profile.role === 'coach' ? selectedClientId : profile.id
    if (!coachId || !clientId) return

    setSending(true)
    try {
      await sendDirectMessage(coachId, clientId, profile.id, body)
      setBody('')
      if (profile.role === 'coach') {
        await loadCoachThread()
      } else {
        setMessages(await getDirectMessages(profile.id))
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to send message.')
    } finally {
      setSending(false)
    }
  }

  const threadReady = profile.role === 'coach' ? Boolean(selectedClientId) : Boolean(activeCoachId)

  return (
    <Layout
      profile={profile}
      title="Messages"
      subtitle="Keep coaching communication attached to the client relationship instead of scattered across external chats."
      onSignOut={signOut}
    >
      {error && <p className="form-status mb-4">{error}</p>}

      <section className={`grid gap-4 ${profile.role === 'coach' ? 'xl:grid-cols-[280px_minmax(0,1fr)]' : ''}`}>
        {profile.role === 'coach' && (
          <aside className="glass-panel h-fit p-4">
            <div className="mb-3 flex items-center gap-2"><Users size={18} /><h2 className="font-bold">Clients</h2></div>
            {clients.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No active clients available.</p>
            ) : (
              <div className="grid gap-2">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => setSelectedClientId(client.id)}
                    className={`rounded-xl border px-3 py-3 text-left text-sm ${selectedClientId === client.id ? 'border-[var(--brand)] bg-[var(--brand-soft)]' : 'border-[var(--line)] bg-[var(--panel-muted)]'}`}
                  >
                    <p className="font-semibold">@{client.username}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{Math.round(client.complianceRate * 100)}% recent compliance</p>
                  </button>
                ))}
              </div>
            )}
          </aside>
        )}

        <article className="glass-panel flex min-h-[620px] flex-col overflow-hidden p-0">
          <div className="border-b border-[var(--line)] p-4">
            <div className="flex items-center gap-2"><MessageCircle size={19} /><h2 className="font-bold">Conversation</h2></div>
            <p className="mt-1 text-xs text-[var(--muted)]">Messages are available only to the active coach/client pair.</p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {loading ? (
              <div className="empty-state">Loading messages...</div>
            ) : !threadReady ? (
              <div className="empty-state">{profile.role === 'coach' ? 'Select a client to open the conversation.' : 'No active coach relationship is available yet.'}</div>
            ) : messages.length === 0 ? (
              <div className="empty-state">No messages yet. Start the coaching conversation below.</div>
            ) : (
              messages.map((message) => {
                const mine = message.sender_id === profile.id
                return (
                  <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${mine ? 'bg-[var(--brand)] text-white' : 'border border-[var(--line)] bg-[var(--panel-muted)]'}`}>
                      <p className="whitespace-pre-wrap break-words">{message.body}</p>
                      <p className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-[var(--muted)]'}`}>{new Date(message.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <form onSubmit={send} className="border-t border-[var(--line)] p-4">
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                disabled={!threadReady || sending}
                placeholder={threadReady ? 'Write a coaching message...' : 'Open a conversation first'}
                className="min-w-0 flex-1 resize-none rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-2 text-sm"
              />
              <button type="submit" className="button-primary self-end" disabled={!threadReady || sending || !body.trim()}><Send size={16} /> Send</button>
            </div>
          </form>
        </article>
      </section>
    </Layout>
  )
}
