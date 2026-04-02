import { LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { isSupabaseConfigured } from '../lib/supabase'
import type { Profile } from '../types'
import ThemeToggle from './ThemeToggle'

type LayoutProps = {
  profile: Profile
  title: string
  subtitle: string
  children: ReactNode
  onSignOut: () => Promise<void>
}

export default function Layout({ profile, title, subtitle, children, onSignOut }: LayoutProps) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <header className="glass-panel card-entrance mb-6 flex flex-wrap items-center justify-between gap-3 p-4 md:p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">FuelForge Coach Suite</p>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
          {!isSupabaseConfigured && (
            <p className="mt-2 text-sm text-[var(--brand)]">Running in demo mode. Add .env values for Supabase auth + data.</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to={profile.role === 'coach' ? '/admin' : '/dashboard'}
            className="rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-2 text-sm font-semibold"
          >
            @{profile.username}
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </header>

      {children}
    </main>
  )
}
