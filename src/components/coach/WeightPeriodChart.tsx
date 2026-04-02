import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { WeightEntry } from '../../types'

type WeightPeriodChartProps = {
  data: WeightEntry[]
  periodRange: { fromIndex: number; toIndex: number }
}

export default function WeightPeriodChart({ data, periodRange }: WeightPeriodChartProps) {
  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Weight Trend with Period Overlay</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Shaded area marks period-window water retention.</p>
      <div className="mt-3 h-64">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="4 4" />
            <XAxis dataKey="date" />
            <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} />
            <Tooltip />
            <ReferenceArea
              x1={data[periodRange.fromIndex]?.date}
              x2={data[periodRange.toIndex]?.date}
              fill="rgba(239,68,68,0.18)"
            />
            <Line dataKey="weight" stroke="var(--brand)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
