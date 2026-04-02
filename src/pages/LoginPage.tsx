import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { profile, signInAsDemoRole } = useAuth()

  if (profile) {
    return <Navigate to={profile.role === 'coach' ? '/admin' : '/dashboard'} replace />
  }

  return (
    <main className="auth-shell">
      <section className="auth-card card-entrance">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">FuelForge Auth</p>
            <h1 className="mt-2 text-3xl font-bold">Welcome Back</h1>
            <p className="page-subtext">Sign up with full onboarding or keep testing instantly using demo roles.</p>
            <Link
              to="/signup"
              className="mt-4 inline-flex rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
            >
              Create Account
            </Link>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] p-4">
            <p className="text-sm font-semibold">Quick Demo Access</p>
            <p className="mt-1 text-xs text-[var(--muted)]">These 2 buttons stay available for testing both experiences.</p>
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={() => signInAsDemoRole('coach')}
                className="rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white"
              >
                Continue as Coach (Demo)
              </button>
              <button
                type="button"
                onClick={() => signInAsDemoRole('client')}
                className="rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-3 text-sm font-semibold"
              >
                Continue as Client (Demo)
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
