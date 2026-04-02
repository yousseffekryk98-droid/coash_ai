import { useMemo } from 'react'

type CompetitionPrepCountdownProps = {
  showDate: string
}

export default function CompetitionPrepCountdown({ showDate }: CompetitionPrepCountdownProps) {
  const daysLeft = useMemo(() => {
    const diff = new Date(showDate).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)))
  }, [showDate])

  const peakWeek = daysLeft <= 7

  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Competition Prep Countdown</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Tracks peak-week water, sodium, and carb loading strategy.</p>
      <div className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Show Day</p>
        <p className="text-xl font-bold">{daysLeft} days left</p>
      </div>

      {peakWeek && (
        <div className="mt-3 space-y-2 rounded-lg border border-cyan-300 bg-cyan-500/10 p-3 text-sm">
          <p>Peak Week Active</p>
          <p>Water load plan: 8L to 6L to 4L to 2L.</p>
          <p>Track sodium and carb-up execution daily.</p>
        </div>
      )}
    </section>
  )
}
