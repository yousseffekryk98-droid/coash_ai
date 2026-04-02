import type { DailyLog } from '../../types'

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const withinFivePercent = (target: number, actual: number) => {
  if (target <= 0) return false
  return Math.abs(actual - target) / target <= 0.05
}

export default function ComplianceHeatmap({ logs }: { logs: DailyLog[] }) {
  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Compliance Heatmap</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Green means daily calories were within +/-5% of assigned plan.</p>
      <div className="mt-3 grid grid-cols-7 gap-2">
        {logs.slice(0, 7).map((log, index) => {
          const good = withinFivePercent(log.calories_target, log.calories_actual)
          return (
            <div key={log.date} className={`rounded-lg border p-2 text-center text-xs ${good ? 'border-emerald-300 bg-emerald-500/20' : 'border-rose-300 bg-rose-500/20'}`}>
              <p className="font-semibold">{dayLabels[index]}</p>
              <p>{Math.round((log.calories_actual / log.calories_target) * 100)}%</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
