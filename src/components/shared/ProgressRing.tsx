type ProgressRingProps = {
  value: number
  total: number
  label: string
}

export default function ProgressRing({ value, total, label }: ProgressRingProps) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(value / Math.max(total, 1), 1)
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="glass-panel card-entrance flex w-fit flex-col items-center p-4">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} stroke="var(--line)" strokeWidth="10" fill="none" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="var(--brand)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <p className="-mt-20 text-xl font-bold">{Math.round(progress * 100)}%</p>
      <p className="mt-10 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="text-sm text-[var(--muted)]">{value} / {total}</p>
    </div>
  )
}
