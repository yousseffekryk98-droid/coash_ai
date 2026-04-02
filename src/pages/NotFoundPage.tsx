import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section className="glass-panel w-full max-w-md p-6 text-center">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">The route you requested does not exist.</p>
        <Link to="/" className="mt-4 inline-flex rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white">
          Return home
        </Link>
      </section>
    </main>
  )
}
