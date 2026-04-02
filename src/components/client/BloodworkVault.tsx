import { useMemo, useState } from 'react'
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { biomarkerReadings } from '../../data/healthVault'
import type { BiomarkerKey } from '../../types'

const markerLabels: Record<BiomarkerKey, string> = {
  testosterone: 'Testosterone',
  ast: 'AST',
  alt: 'ALT',
  creatinine: 'Creatinine',
  egfr: 'eGFR',
  ldl: 'LDL',
}

export default function BloodworkVault() {
  const [activeMarker, setActiveMarker] = useState<BiomarkerKey>('testosterone')

  const markerRows = useMemo(
    () => biomarkerReadings.filter((item) => item.marker === activeMarker),
    [activeMarker],
  )

  const latest = markerRows[markerRows.length - 1]
  const outOfRange =
    latest && (latest.value < latest.minAthleticRange || latest.value > latest.maxAthleticRange)

  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">Bloodwork and Biomarker Vault</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">16-week trend tracking for hormones, liver, kidney, and lipid health.</p>
        </div>
        <label className="text-sm">
          Marker
          <select
            value={activeMarker}
            onChange={(event) => setActiveMarker(event.target.value as BiomarkerKey)}
            className="ml-2 rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-2"
          >
            {Object.entries(markerLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {latest && (
        <div className={`mt-3 rounded-lg border p-3 text-sm ${outOfRange ? 'border-rose-300 bg-rose-500/10' : 'border-emerald-300 bg-emerald-500/10'}`}>
          Latest reading: {latest.value} {latest.unit} (athletic range {latest.minAthleticRange} - {latest.maxAthleticRange})
        </div>
      )}

      <div className="mt-3 h-64">
        <ResponsiveContainer>
          <LineChart data={markerRows}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="4 4" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="var(--brand)" strokeWidth={2} name="Value" />
            <Line type="monotone" dataKey="minAthleticRange" stroke="#22c55e" strokeDasharray="6 3" name="Min" />
            <Line type="monotone" dataKey="maxAthleticRange" stroke="#22c55e" strokeDasharray="6 3" name="Max" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-2 text-sm">
        Upload lab report
        <input type="file" className="ml-2" />
      </label>
    </section>
  )
}
