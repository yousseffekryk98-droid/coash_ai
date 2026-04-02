import { useMemo, useState } from 'react'
import Layout from '../components/shared/Layout'
import { integrationChecklist, integrationProviders } from '../data/integrations'
import { useAuth } from '../hooks/useAuth'

const STORAGE_KEY = 'integration-checklist'

const loadChecks = (): Record<string, boolean> => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, boolean>
  } catch {
    return {}
  }
}

export default function IntegrationsPage() {
  const { profile, signOut } = useAuth()
  const [checks, setChecks] = useState<Record<string, boolean>>(loadChecks)

  const completion = useMemo(() => {
    const completed = integrationChecklist.filter((_, index) => checks[String(index)]).length
    return { completed, total: integrationChecklist.length, percent: Math.round((completed / integrationChecklist.length) * 100) }
  }, [checks])

  const toggle = (index: number) => {
    setChecks((prev) => {
      const next = { ...prev, [String(index)]: !prev[String(index)] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  if (!profile) return null

  return (
    <Layout
      profile={profile}
      title="Integration Hub"
      subtitle="External ecosystem setup for wearables, food APIs, payments, messaging, and smart hardware."
      onSignOut={signOut}
    >
      <section className="glass-panel card-entrance mb-4 p-4 md:p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Integration Readiness</p>
        <p className="mt-1 text-2xl font-bold">{completion.percent}%</p>
        <p className="text-sm text-[var(--muted)]">{completion.completed} of {completion.total} checklist items completed</p>
        <div className="mt-3 h-2 rounded-full bg-[var(--line)]">
          <div className="h-2 rounded-full bg-[var(--brand)]" style={{ width: `${completion.percent}%` }} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="glass-panel card-entrance p-4 md:p-5">
          <h2 className="text-lg font-bold">Final Integration Checklist</h2>
          <div className="mt-3 space-y-2">
            {integrationChecklist.map((item, index) => (
              <label key={item} className="flex items-start gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm">
                <input type="checkbox" checked={Boolean(checks[String(index)])} onChange={() => toggle(index)} />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </article>

        <article className="glass-panel card-entrance p-4 md:p-5">
          <h2 className="text-lg font-bold">Provider Matrix</h2>
          <div className="mt-3 space-y-2">
            {integrationProviders.map((provider) => (
              <div key={provider.id} className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm">
                <p className="font-semibold">{provider.name}</p>
                <p className="text-xs text-[var(--muted)]">{provider.category}</p>
                <p className="mt-1 text-xs">{provider.notes}</p>
                <span className={`mt-2 inline-flex rounded px-2 py-1 text-xs ${provider.status === 'ready-for-api-keys' ? 'bg-emerald-500/20' : provider.status === 'in-progress' ? 'bg-amber-500/20' : 'bg-slate-500/20'}`}>
                  {provider.status}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </Layout>
  )
}
