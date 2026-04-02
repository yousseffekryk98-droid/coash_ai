const resources = [
  { title: 'Why fats support hormonal health', type: 'PDF' },
  { title: 'Diabetes carb timing guide', type: 'Video' },
  { title: 'Peak week sodium strategy', type: 'Checklist' },
]

export default function EducationVault() {
  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Coach Education Vault</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Upload and share educational assets to reduce repetitive client Q&A.</p>
      <div className="mt-3 space-y-2">
        {resources.map((item) => (
          <article key={item.title} className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm">
            <p className="font-semibold">{item.title}</p>
            <p className="text-xs text-[var(--muted)]">{item.type}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
