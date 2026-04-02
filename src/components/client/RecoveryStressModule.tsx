import { useMemo, useState } from 'react'

type RecoveryStressModuleProps = {
  baseRhr?: number
}

export default function RecoveryStressModule({ baseRhr = 58 }: RecoveryStressModuleProps) {
  const [sleepHours, setSleepHours] = useState(6.5)
  const [restfulness, setRestfulness] = useState(4)
  const [stress, setStress] = useState(7)
  const [rhrToday, setRhrToday] = useState(64)
  const [strengthDown, setStrengthDown] = useState(true)

  const deloadAlert = useMemo(() => {
    const rhrUp = rhrToday - baseRhr >= 5
    return restfulness < 5 && rhrUp && strengthDown && stress >= 7
  }, [restfulness, rhrToday, baseRhr, strengthDown, stress])

  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Recovery & Stress Monitor</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Tracks cortisol-linked recovery markers and deload triggers.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Sleep hours
          <input type="number" step="0.5" value={sleepHours} onChange={(event) => setSleepHours(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" />
        </label>
        <label className="text-sm">Restfulness (1-10)
          <input type="number" min="1" max="10" value={restfulness} onChange={(event) => setRestfulness(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" />
        </label>
        <label className="text-sm">Stress (1-10)
          <input type="number" min="1" max="10" value={stress} onChange={(event) => setStress(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" />
        </label>
        <label className="text-sm">Morning RHR
          <input type="number" value={rhrToday} onChange={(event) => setRhrToday(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2" />
        </label>
      </div>
      <label className="mt-3 inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={strengthDown} onChange={(event) => setStrengthDown(event.target.checked)} />
        Strength down this week
      </label>

      {deloadAlert && <p className="mt-3 rounded-lg border border-amber-300 bg-amber-500/10 p-3 text-sm">Deload recommended: poor sleep + high stress + elevated RHR + reduced strength.</p>}
    </section>
  )
}
