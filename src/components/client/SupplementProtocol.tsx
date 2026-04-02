import { useMemo, useState } from 'react'
import { baseSupplementProtocol } from '../../data/healthVault'
import type { CyclePhase } from '../../utils/nutritionEngine'

type SupplementProtocolProps = {
  phase: CyclePhase
}

export default function SupplementProtocol({ phase }: SupplementProtocolProps) {
  const [items, setItems] = useState(baseSupplementProtocol)
  const [notice, setNotice] = useState('')

  const visible = useMemo(
    () => items.filter((item) => item.phaseTarget === 'Any' || item.phaseTarget === phase),
    [items, phase],
  )

  const markLow = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, inventoryLevel: 'Low' } : item)))
    setNotice('Coach notified: supplement inventory is low and budget check is needed.')
  }

  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Smart Supplement Protocol</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Phase-aware timing with inventory flags and coach alerts.</p>
      <div className="mt-3 space-y-2">
        {visible.map((item) => (
          <article key={item.id} className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm">
            <p className="font-semibold">{item.name}</p>
            <p className="text-xs text-[var(--muted)]">Timing: {item.timing}</p>
            <p className="text-xs text-[var(--muted)]">Phase target: {item.phaseTarget}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className={`rounded px-2 py-1 text-xs ${item.inventoryLevel === 'Low' ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`}>
                Inventory: {item.inventoryLevel}
              </span>
              <button
                type="button"
                onClick={() => markLow(item.id)}
                className="rounded-md bg-[var(--brand)] px-2 py-1 text-xs font-semibold text-white"
              >
                Mark as Low
              </button>
            </div>
          </article>
        ))}
      </div>
      {notice && <p className="mt-2 text-xs text-[var(--muted)]">{notice}</p>}
    </section>
  )
}
