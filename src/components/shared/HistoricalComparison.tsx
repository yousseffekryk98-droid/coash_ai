import type { WeightEntry } from '../../types'

type HistoricalComparisonProps = {
  thisYear: WeightEntry[]
  lastYear: WeightEntry[]
}

export default function HistoricalComparison({ thisYear, lastYear }: HistoricalComparisonProps) {
  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Historical Comparison</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Side-by-side year-over-year progress snapshots for review.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <article className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3">
          <p className="text-sm font-semibold">This prep</p>
          <div className="mt-2 space-y-1 text-xs text-[var(--muted)]">
            {thisYear.map((entry) => (
              <p key={entry.date}>{entry.date}: {entry.weight} kg</p>
            ))}
          </div>
        </article>
        <article className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3">
          <p className="text-sm font-semibold">Last prep</p>
          <div className="mt-2 space-y-1 text-xs text-[var(--muted)]">
            {lastYear.map((entry) => (
              <p key={entry.date}>{entry.date}: {entry.weight} kg</p>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
