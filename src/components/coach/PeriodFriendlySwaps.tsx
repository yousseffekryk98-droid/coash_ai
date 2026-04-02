import { useMemo, useState } from 'react'
import type { CravingType } from '../../utils/cycleSwaps'
import { getPeriodFriendlySwap, healthyFixes } from '../../utils/cycleSwaps'

type PeriodFriendlySwapsProps = {
  cravingType: CravingType
}

export default function PeriodFriendlySwaps({ cravingType }: PeriodFriendlySwapsProps) {
  const [applied, setApplied] = useState(false)
  const swaps = useMemo(() => getPeriodFriendlySwap(cravingType), [cravingType])
  const fix = healthyFixes[cravingType]

  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Apply Period-Friendly Swaps</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">One-click substitution for sweet/salty luteal cravings.</p>

      <div className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm">
        <p className="font-semibold">Healthy fix</p>
        <p>{fix.substitute}</p>
        <p className="text-xs text-[var(--muted)]">{fix.nutrients}</p>
      </div>

      <div className="mt-3 space-y-2">
        {swaps.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No swap needed for current craving type.</p>
        ) : (
          swaps.map((swap) => (
            <div key={swap.to} className="rounded-lg border border-[var(--line)] p-3 text-sm">
              <p><span className="font-semibold">From:</span> {swap.from}</p>
              <p><span className="font-semibold">To:</span> {swap.to}</p>
              <p className="text-xs text-[var(--muted)]">{swap.reason}</p>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={() => setApplied(true)}
        className="mt-3 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white"
      >
        Apply Period-Friendly Swaps
      </button>

      {applied && <p className="mt-2 text-xs text-[var(--muted)]">Updated mobile/PDF meal plan with selected alternatives.</p>}
    </section>
  )
}
