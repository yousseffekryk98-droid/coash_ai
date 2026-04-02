import type { ClientSummary } from '../../types'

type PlateauRadarProps = {
  clients: ClientSummary[]
}

export default function PlateauRadar({ clients }: PlateauRadarProps) {
  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Plateau Radar</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Flags clients with stalled weight + high compliance patterns.</p>
      <div className="mt-3 space-y-2">
        {clients.map((client) => (
          <article
            key={client.clientId}
            className={`rounded-lg border p-3 text-sm ${client.plateauAlert ? 'border-rose-300 bg-rose-500/10' : 'border-[var(--line)] bg-[var(--panel-strong)]'}`}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">{client.clientName}</p>
              <p className="text-xs">Compliance {Math.round(client.complianceRate * 100)}%</p>
            </div>
            {client.plateauAlert ? <p className="mt-1 text-xs">Red flag: possible water retention or adaptation.</p> : <p className="mt-1 text-xs text-[var(--muted)]">On track.</p>}
          </article>
        ))}
      </div>
    </section>
  )
}
