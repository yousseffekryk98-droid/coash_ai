import type { PhotoCheckin } from '../../types'

type PhotoComparisonProps = {
  checkins: PhotoCheckin[]
}

export default function PhotoComparison({ checkins }: PhotoComparisonProps) {
  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Photo Check-in Comparison</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">4-week front-pose timeline for body composition review.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {checkins.slice(0, 4).map((item, index) => (
          <article key={item.id} className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3">
            <p className="text-xs text-[var(--muted)]">Week {index + 1}</p>
            <div className="mt-2 grid h-24 place-items-center rounded-md border border-dashed border-[var(--line)] text-xs text-[var(--muted)]">
              {item.image_path}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
