import { MoonStar, SunMedium } from 'lucide-react'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'coach-theme'

const getInitialTheme = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  return (
    <button
      type="button"
      onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
      className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-2 text-sm font-semibold"
    >
      {theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  )
}
