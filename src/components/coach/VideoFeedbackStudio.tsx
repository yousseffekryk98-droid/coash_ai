import { useState } from 'react'
import type { VideoFeedbackItem } from '../../types'

type VideoFeedbackStudioProps = {
  archive: VideoFeedbackItem[]
}

export default function VideoFeedbackStudio({ archive }: VideoFeedbackStudioProps) {
  const [recording, setRecording] = useState(false)

  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Video Feedback Studio</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Record side-by-side critique with posing clip and progress graph voice-over.</p>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3">
          <p className="text-xs text-[var(--muted)]">Posing video panel</p>
          <div className="mt-2 grid h-28 place-items-center rounded border border-dashed border-[var(--line)] text-xs text-[var(--muted)]">Client posing feed</div>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3">
          <p className="text-xs text-[var(--muted)]">Weight trend panel</p>
          <div className="mt-2 grid h-28 place-items-center rounded border border-dashed border-[var(--line)] text-xs text-[var(--muted)]">Weight chart overlay</div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setRecording((prev) => !prev)}
        className="mt-3 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white"
      >
        {recording ? 'Stop Recording' : 'Start 2-min Voice-over'}
      </button>

      <div className="mt-3 space-y-2">
        <p className="text-sm font-semibold">Client Feedback Archive</p>
        {archive.map((item) => (
          <article key={item.id} className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm">
            <p className="font-semibold">Week {item.week}: {item.title}</p>
            <p className="text-xs text-[var(--muted)]">{item.durationSec}s | {item.createdAt}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
