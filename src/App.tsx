import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import CoachDashboard from './pages/CoachDashboard'
import ClientDashboard from './pages/ClientDashboard'
import CoachClientsPage from './pages/CoachClientsPage'
import CoachIntelligencePage from './pages/CoachIntelligencePage'
import HabitsPage from './pages/HabitsPage'
import CalendarPage from './pages/CalendarPage'
import MessagesPage from './pages/MessagesPage'
import ProgressPage from './pages/ProgressPage'
import GoalsPage from './pages/GoalsPage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'
import RoadmapPage from './pages/RoadmapPage'
import IntegrationsPage from './pages/IntegrationsPage'

type ProtectedRouteProps = {
  role: 'coach' | 'client'
  children: ReactNode
}

function LoadingScreen() {
  return <div className="grid min-h-screen place-items-center text-sm text-[var(--muted)]">Loading your workspace...</div>
}

function AuthenticatedRoute({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!profile) return <Navigate to="/login" replace />
  return <>{children}</>
}

function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const { profile, loading, session } = useAuth()

  if (loading) return <LoadingScreen />

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  if (profile.role !== role) {
    return <Navigate to={profile.role === 'coach' ? '/admin' : '/dashboard'} replace />
  }

  const emailConfirmedAt = (session?.user as { email_confirmed_at?: string | null } | undefined)?.email_confirmed_at
  if (role === 'coach' && session && !emailConfirmedAt) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  const { profile } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="coach">
            <CoachDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute role="coach">
            <CoachClientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/intelligence"
        element={
          <ProtectedRoute role="coach">
            <CoachIntelligencePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/roadmap"
        element={
          <ProtectedRoute role="coach">
            <RoadmapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/integrations"
        element={
          <ProtectedRoute role="coach">
            <IntegrationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="client">
            <ClientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute role="client">
            <ProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/goals"
        element={
          <ProtectedRoute role="client">
            <GoalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/habits"
        element={
          <AuthenticatedRoute>
            <HabitsPage />
          </AuthenticatedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <AuthenticatedRoute>
            <CalendarPage />
          </AuthenticatedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <AuthenticatedRoute>
            <MessagesPage />
          </AuthenticatedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <AuthenticatedRoute>
            <SettingsPage />
          </AuthenticatedRoute>
        }
      />
      <Route
        path="/"
        element={
          <Navigate
            replace
            to={profile ? (profile.role === 'coach' ? '/admin' : '/dashboard') : '/login'}
          />
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
