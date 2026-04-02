import { useMemo } from 'react'
import { detectCrashAlert, getGlucoseAdvice } from '../../utils/healthOptimizer'

type CoachMedicalAlertsProps = {
  libidoHistory: number[]
  energyHistory: number[]
  weightDelta14d: number
  diabeticReadings?: { pre: number; post: number }
}

export default function CoachMedicalAlerts({
  libidoHistory,
  energyHistory,
  weightDelta14d,
  diabeticReadings,
}: CoachMedicalAlertsProps) {
  const crashAlert = useMemo(
    () => detectCrashAlert(libidoHistory, energyHistory, weightDelta14d),
    [libidoHistory, energyHistory, weightDelta14d],
  )

  const glucoseAlert = diabeticReadings
    ? getGlucoseAdvice(diabeticReadings.pre, diabeticReadings.post)
    : null

  if (!crashAlert && !glucoseAlert) {
    return (
      <section className="glass-panel card-entrance p-4">
        <h2 className="text-lg font-bold">Medical Alerts</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">No crash or glucose spike alerts right now.</p>
      </section>
    )
  }

  return (
    <section className="glass-panel card-entrance space-y-3 p-4">
      <h2 className="text-lg font-bold">Medical Alerts</h2>
      {crashAlert && <p className="rounded-lg border border-rose-300 bg-rose-500/10 p-3 text-sm">{crashAlert}</p>}
      {glucoseAlert && <p className="rounded-lg border border-amber-300 bg-amber-500/10 p-3 text-sm">{glucoseAlert}</p>}
    </section>
  )
}
