import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { sanitizePlainText } from '../utils/sanitize'

type CoachNotesProps = {
  clientId: string
  initialText?: string
}

export default function CoachNotes({ clientId, initialText = '' }: CoachNotesProps) {
  const [note, setNote] = useState(initialText)
  const [status, setStatus] = useState<string>('')

  const saveNote = async () => {
    if (!supabase) {
      setStatus('Demo mode: connect Supabase to persist notes.')
      return
    }

    const today = new Date().toISOString().slice(0, 10)
    const cleanedNote = sanitizePlainText(note)
    const { error } = await supabase.from('gym_logs').upsert({
      user_id: clientId,
      date: today,
      notes: cleanedNote,
      workout_completed: false,
    })

    setStatus(error ? error.message : 'Saved note for today.')
  }

  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Coach Notes</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Daily instruction for recovery, nutrition, and training cues.</p>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className="mt-3 min-h-28 w-full rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] p-3"
        placeholder="Example: Add magnesium-rich foods tonight and keep hydration above 3L."
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-[var(--muted)]">{status}</span>
        <button
          type="button"
          onClick={saveNote}
          className="rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white"
        >
          Save note
        </button>
      </div>
    </section>
  )
}
