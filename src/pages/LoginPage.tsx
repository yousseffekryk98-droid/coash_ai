import { useState } from 'react'
import { Activity, ArrowRight, BarChart3, BrainCircuit, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured } from '../lib/supabase'

export default function LoginPage() {
  const { profile, loading, signIn, sendPasswordReset, signInAsDemoRole } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (profile) {
    return <Navigate to={profile.role === 'coach' ? '/admin' : '/dashboard'} replace />
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('')

    if (!email.trim() || !password) {
      setStatus('Enter your email and password.')
      return
    }

    setSubmitting(true)
    const error = await signIn(email.trim(), password)
    if (error) setStatus(error)
    setSubmitting(false)
  }

  const resetPassword = async () => {
    setStatus('')
    const error = await sendPasswordReset(email)
    setStatus(error ?? 'Password reset email sent. Check your inbox.')
  }

  return (
    <main className="auth-shell auth-shell-premium">
      <section className="auth-card auth-card-premium card-entrance">
        <div className="auth-hero">
          <div>
            <div className="brand-lockup">
              <span className="brand-mark"><Activity size={20} /></span>
              <div>
                <p className="brand-name">FuelForge</p>
                <p className="brand-caption">Adaptive coaching workspace</p>
              </div>
            </div>

            <h1 className="auth-title">Coaching intelligence without the spreadsheet chaos.</h1>
            <p className="auth-copy">
              Manage check-ins, nutrition, recovery, progress, client risk signals, and coaching workflows from one focused workspace.
            </p>

            <div className="auth-benefits">
              <div><BarChart3 size={18} /><span>Real progress and adherence analytics</span></div>
              <div><BrainCircuit size={18} /><span>Adaptive nutrition and wellness tools</span></div>
              <div><ShieldCheck size={18} /><span>Role-based access backed by Supabase RLS</span></div>
            </div>
          </div>

          <div className="auth-proof-card">
            <p className="eyebrow">Built for daily use</p>
            <strong>Coach command center + client companion</strong>
            <p>One product experience for both sides of the coaching relationship.</p>
          </div>
        </div>

        <div className="auth-form-panel">
          <div>
            <p className="eyebrow">Secure sign in</p>
            <h2 className="mt-2 text-2xl font-bold">Welcome back</h2>
            <p className="page-subtext">Use the account you created during onboarding.</p>
          </div>

          {isSupabaseConfigured ? (
            <form onSubmit={submit} className="mt-6 grid gap-4">
              <label className="field">
                Email
                <span className="input-with-icon">
                  <Mail size={17} />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </span>
              </label>

              <label className="field">
                Password
                <span className="input-with-icon">
                  <LockKeyhole size={17} />
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Your password"
                  />
                </span>
              </label>

              {status && <p className="form-status">{status}</p>}

              <button type="submit" className="button-primary w-full" disabled={submitting || loading}>
                {submitting || loading ? 'Signing in...' : 'Sign in'}
                {!submitting && !loading && <ArrowRight size={17} />}
              </button>

              <button type="button" className="button-ghost w-full" onClick={resetPassword}>
                Forgot password?
              </button>
            </form>
          ) : (
            <div className="mt-6 rounded-2xl border border-amber-300/70 bg-amber-500/10 p-4">
              <p className="font-semibold">Local preview mode</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Supabase environment variables are not configured, so only isolated preview accounts are available.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => signInAsDemoRole('coach')} className="button-primary">Preview coach</button>
                <button type="button" onClick={() => signInAsDemoRole('client')} className="button-secondary">Preview client</button>
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-[var(--line)] pt-5 text-sm text-[var(--muted)]">
            New to FuelForge?{' '}
            <Link to="/signup" className="font-semibold text-[var(--brand)]">Create your account</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
