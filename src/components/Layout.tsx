import { Activity, BarChart3, LayoutDashboard, LogOut, Map, Plug, Settings, Target, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'
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

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
}

const coachNav: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/integrations', label: 'Integrations', icon: Plug },
  { to: '/roadmap', label: 'Roadmap', icon: Map },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const clientNav: NavItem[] = [
  { to: '/dashboard', label: 'Today', icon: LayoutDashboard },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout({ profile, title, subtitle, children, onSignOut }: LayoutProps) {
  const navItems = profile.role === 'coach' ? coachNav : clientNav

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark"><Activity size={20} /></span>
          <div>
            <p className="brand-name">FuelForge</p>
            <p className="brand-caption">Coach OS</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                end={item.to === '/admin' || item.to === '/dashboard'}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-mini">
            <div className="avatar-fallback">{profile.username.slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{profile.username}</p>
              <p className="text-xs capitalize text-[var(--muted)]">{profile.role}</p>
            </div>
          </div>
          <button type="button" onClick={onSignOut} className="nav-link nav-button">
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="eyebrow">{profile.role === 'coach' ? 'Coach workspace' : 'Client workspace'}</p>
              {!isSupabaseConfigured && <span className="preview-badge">Preview</span>}
            </div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="header-actions">
            <ThemeToggle />
            <NavLink to="/settings" className="user-chip">
              <span className="avatar-fallback small">{profile.username.slice(0, 1).toUpperCase()}</span>
              <span className="hidden sm:inline">@{profile.username}</span>
            </NavLink>
          </div>
        </header>

        <section className="app-content">{children}</section>
      </main>
    </div>
  )
}
