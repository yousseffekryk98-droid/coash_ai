import { useEffect, useState } from 'react'
import { CheckCircle2, Database, Save, ShieldCheck, UserRound } from 'lucide-react'
import Layout from '../components/shared/Layout'
import { updateProfileSettings } from '../api/productApi'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured } from '../lib/supabase'

export default function SettingsPage() {
  const { profile, signOut, refreshProfile, session } = useAuth()
  const [username, setUsername] = useState('')
  const [gender, setGender] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!profile) return
    setUsername(profile.username)
    setGender(profile.gender ?? '')
    setAvatarUrl(profile.avatar_url ?? '')
  }, [profile])

  if (!profile) return null

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!username.trim()) {
      setStatus('Display name is required.')
      return
    }

    setSaving(true)
    setStatus('')
    try {
      await updateProfileSettings(profile.id, {
        username: username.trim(),
        gender: gender || null,
        avatar_url: avatarUrl.trim() || null,
      })
      await refreshProfile()
      setStatus('Profile settings saved.')
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : 'Unable to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout
      profile={profile}
      title="Settings"
      subtitle="Manage your profile and verify the environment used by your coaching account."
      onSignOut={signOut}
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <article className="glass-panel p-4 md:p-5">
          <div className="section-heading">
            <div>
              <h2>Profile</h2>
              <p className="page-subtext">Keep the identity shown throughout the coach and client workspaces up to date.</p>
            </div>
            <UserRound size={20} className="text-[var(--muted)]" />
          </div>

          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            <label className="field">Display name
              <input value={username} onChange={(event) => setUsername(event.target.value)} />
            </label>
            <label className="field">Gender
              <select value={gender} onChange={(event) => setGender(event.target.value)}>
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="field md:col-span-2">Avatar URL
              <input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://..." />
            </label>

            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button type="submit" className="button-primary" disabled={saving}>
                <Save size={17} /> {saving ? 'Saving...' : 'Save changes'}
              </button>
              {status && <p className="text-sm text-[var(--muted)]">{status}</p>}
            </div>
          </form>
        </article>

        <div className="grid gap-4">
          <article className="glass-panel p-4 md:p-5">
            <div className="flex items-center gap-2">
              <Database size={18} className="text-[var(--muted)]" />
              <h2 className="font-bold">Environment</h2>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">Supabase</span>
                <span className="inline-flex items-center gap-2 font-semibold">
                  <span className={`status-dot ${isSupabaseConfigured ? 'ok' : 'warn'}`} />
                  {isSupabaseConfigured ? 'Connected' : 'Preview only'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">Role</span>
                <span className="font-semibold capitalize">{profile.role}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">Email</span>
                <span className="max-w-[210px] truncate font-semibold">{session?.user.email ?? 'Preview account'}</span>
              </div>
            </div>
          </article>

          <article className="glass-panel p-4 md:p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[var(--muted)]" />
              <h2 className="font-bold">Security</h2>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
              <p className="flex gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" />Role-based routes protect coach and client workspaces.</p>
              <p className="flex gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" />The browser uses only the Supabase anon key; service-role keys are rejected.</p>
              <p className="flex gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" />Sensitive coaching tables rely on row-level security policies.</p>
            </div>
          </article>
        </div>
      </section>
    </Layout>
  )
}
