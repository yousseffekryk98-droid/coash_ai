import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { WeightEntry } from '../../types'

type PerformanceChartsProps = {
  weight: WeightEntry[]
  compliance: Array<{ day: string; score: number }>
  strength: Array<{ day: string; orm: number }>
}

export default function PerformanceCharts({ weight, compliance, strength }: PerformanceChartsProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <article className="glass-panel card-entrance p-3">
        <p className="mb-2 text-sm font-semibold">Weight Trend</p>
        <div className="h-52">
          <ResponsiveContainer>
            <LineChart data={weight}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="4 4" />
              <XAxis dataKey="date" />
              <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} />
              <Tooltip />
              <Line dataKey="weight" stroke="var(--brand)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="glass-panel card-entrance p-3">
        <p className="mb-2 text-sm font-semibold">Macro Compliance</p>
        <div className="h-52">
          <ResponsiveContainer>
            <BarChart data={compliance}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="4 4" />
              <XAxis dataKey="day" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="var(--brand)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="glass-panel card-entrance p-3">
        <p className="mb-2 text-sm font-semibold">Strength (1RM)</p>
        <div className="h-52">
          <ResponsiveContainer>
            <LineChart data={strength}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="4 4" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line dataKey="orm" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  )
}
