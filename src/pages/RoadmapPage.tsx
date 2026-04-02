import { useMemo, useState } from 'react'
import Layout from '../components/shared/Layout'
import { useAuth } from '../hooks/useAuth'
import { roadmapTasks } from '../data/mvpRoadmap'

const STORAGE_KEY = 'mvp-roadmap-checks'

const loadChecks = (): Record<string, boolean> => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, boolean>
  } catch {
    return {}
  }
}

export default function RoadmapPage() {
  const { profile, signOut } = useAuth()
  const [checks, setChecks] = useState<Record<string, boolean>>(loadChecks)

  const toggle = (id: string) => {
    setChecks((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const completed = useMemo(
    () => roadmapTasks.filter((task) => checks[task.id]).length,
    [checks],
  )

  const progress = Math.round((completed / roadmapTasks.length) * 100)

  const grouped = useMemo(() => {
    return {
      'Milestone 1': roadmapTasks.filter((task) => task.phase === 'Milestone 1'),
      'Milestone 2': roadmapTasks.filter((task) => task.phase === 'Milestone 2'),
      'Milestone 3': roadmapTasks.filter((task) => task.phase === 'Milestone 3'),
    }
  }, [])

  if (!profile) return null

  return (
    <Layout
      profile={profile}
      title="MVP Roadmap Tracker"
      subtitle="Interactive startup execution board with persistent progress."
      onSignOut={signOut}
    >
      <section className="glass-panel card-entrance mb-4 p-4 md:p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Launch Progress</p>
        <h2 className="mt-1 text-2xl font-bold">{progress}%</h2>
        <p className="text-sm text-[var(--muted)]">{completed} of {roadmapTasks.length} roadmap tasks completed.</p>
        <div className="mt-3 h-2 rounded-full bg-[var(--line)]">
          <div className="h-2 rounded-full bg-[var(--brand)]" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {Object.entries(grouped).map(([milestone, tasks]) => (
          <article key={milestone} className="glass-panel card-entrance p-4 md:p-5">
            <h3 className="text-lg font-bold">{milestone}</h3>
            <div className="mt-3 space-y-2">
              {tasks.map((task) => (
                <label key={task.id} className="flex items-start gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(checks[task.id])}
                    onChange={() => toggle(task.id)}
                  />
                  <span>
                    <span className="font-semibold">{task.title}</span>
                    <span className="ml-2 rounded bg-slate-500/15 px-2 py-0.5 text-xs">{task.priority}</span>
                  </span>
                </label>
              ))}
            </div>
          </article>
        ))}
      </section>
    </Layout>
  )
}
