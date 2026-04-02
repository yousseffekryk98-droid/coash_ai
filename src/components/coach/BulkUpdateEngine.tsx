import { useMemo, useState } from 'react'
import type { ClientSummary } from '../../types'

type BulkUpdateEngineProps = {
  clients: ClientSummary[]
}

export default function BulkUpdateEngine({ clients }: BulkUpdateEngineProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [message, setMessage] = useState('')

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const selectedNames = useMemo(
    () => clients.filter((item) => selected.includes(item.clientId)).map((item) => item.clientName),
    [clients, selected],
  )

  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Bulk-Update Engine</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Select multiple clients and apply the same macro adjustment instantly.</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {clients.map((client) => (
          <label key={client.clientId} className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2 text-sm">
            <input type="checkbox" checked={selected.includes(client.clientId)} onChange={() => toggle(client.clientId)} />
            {client.clientName}
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setMessage(`Applied: Increase carbs by 20g for ${selectedNames.join(', ') || 'no clients selected'}.`)}
        className="mt-3 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white"
      >
        Increase Carbs by 20g
      </button>
      {message && <p className="mt-2 text-xs text-[var(--muted)]">{message}</p>}
    </section>
  )
}
