import type { ClientSummary } from '../../types'

type ClientComplianceTableProps = {
  clients: ClientSummary[]
}

export default function ClientComplianceTable({ clients }: ClientComplianceTableProps) {
  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Client Command Center</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-[var(--muted)]">
              <th className="py-2">Client</th>
              <th className="py-2">Compliance</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.clientId} className="border-t border-[var(--line)]">
                <td className="py-2 font-semibold">{client.clientName}</td>
                <td className="py-2">{Math.round(client.complianceRate * 100)}%</td>
                <td className="py-2">
                  {client.plateauAlert ? (
                    <span className="rounded bg-rose-500/20 px-2 py-1 text-xs">Red Flag</span>
                  ) : (
                    <span className="rounded bg-emerald-500/20 px-2 py-1 text-xs">Stable</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
