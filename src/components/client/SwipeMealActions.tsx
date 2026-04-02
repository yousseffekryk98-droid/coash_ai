import { useState } from 'react'

type SwipeMealActionsProps = {
  mealName: string
}

export default function SwipeMealActions({ mealName }: SwipeMealActionsProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [status, setStatus] = useState('Pending')

  const onTouchEnd = (x: number) => {
    if (touchStart === null) return
    const delta = x - touchStart
    if (delta > 50) setStatus('Marked as eaten')
    if (delta < -50) setStatus('Swap requested')
    setTouchStart(null)
  }

  return (
    <div
      className="glass-panel card-entrance p-3"
      onTouchStart={(event) => setTouchStart(event.changedTouches[0].clientX)}
      onTouchEnd={(event) => onTouchEnd(event.changedTouches[0].clientX)}
    >
      <p className="text-sm font-semibold">{mealName}</p>
      <p className="text-xs text-[var(--muted)]">Swipe right to log meal, left to request alternative.</p>
      <div className="mt-2 flex gap-2 sm:hidden">
        <button type="button" onClick={() => setStatus('Marked as eaten')} className="rounded-md bg-emerald-600 px-2 py-1 text-xs text-white">Eat</button>
        <button type="button" onClick={() => setStatus('Swap requested')} className="rounded-md bg-slate-700 px-2 py-1 text-xs text-white">Swap</button>
      </div>
      <p className="mt-2 text-xs">Status: {status}</p>
    </div>
  )
}
