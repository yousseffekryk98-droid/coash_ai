type StickyCoachNoteProps = {
  message: string
}

export default function StickyCoachNote({ message }: StickyCoachNoteProps) {
  return (
    <section className="card-entrance relative rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-100 to-yellow-50 p-4 text-amber-900 shadow-sm dark:from-amber-300/30 dark:to-yellow-300/20 dark:text-amber-100">
      <p className="text-xs uppercase tracking-[0.18em]">Pinned Coach Note</p>
      <p className="mt-2 text-sm font-medium">{message}</p>
    </section>
  )
}
