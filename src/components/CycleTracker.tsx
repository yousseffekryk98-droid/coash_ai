import { getCyclePhase } from '../utils/nutrition'

type CycleTrackerProps = {
  cycleStartDate?: string
}

const phaseLabels = [
  { label: 'Follicular', start: 1, end: 13 },
  { label: 'Ovulation', start: 14, end: 14 },
  { label: 'Luteal', start: 15, end: 28 },
] as const

export default function CycleTracker({ cycleStartDate }: CycleTrackerProps) {
  if (!cycleStartDate) {
    return (
      <section className="glass-panel card-entrance p-4 md:p-5">
        <h2 className="text-lg font-bold">Cycle Tracker</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">No cycle start date set yet.</p>
      </section>
    )
  }

  const start = new Date(cycleStartDate)
  const phase = getCyclePhase(start)
  const daysElapsed = Math.floor((Date.now() - start.getTime()) / (1000 * 3600 * 24))
  const cycleDay = (((daysElapsed % 28) + 28) % 28) + 1

  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Cycle Tracker</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Current phase: <span className="font-semibold text-[var(--ink)]">{phase}</span></p>
      <p className="text-sm text-[var(--muted)]">Cycle day: {cycleDay}/28</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {phaseLabels.map((item) => (
          <div
            key={item.label}
            className={`rounded-lg border p-2 text-center text-xs ${phase === item.label ? 'border-[var(--brand)] bg-[var(--brand-soft)]' : 'border-[var(--line)] bg-[var(--panel-strong)]'}`}
          >
            <p className="font-semibold">{item.label}</p>
            <p className="text-[var(--muted)]">Days {item.start}-{item.end}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
