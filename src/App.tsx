import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import CoachDashboard from './pages/CoachDashboard'
import ClientDashboard from './pages/ClientDashboard'
import NotFoundPage from './pages/NotFoundPage'
import RoadmapPage from './pages/RoadmapPage'
import IntegrationsPage from './pages/IntegrationsPage'

type ProtectedRouteProps = {
  role: 'coach' | 'client'
  children: ReactNode
}

function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const { profile, loading, session } = useAuth()

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-slate-500">Loading session...</div>
  }

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  if (profile.role !== role) {
    return <Navigate to={profile.role === 'coach' ? '/admin' : '/dashboard'} replace />
  }

  const emailConfirmedAt = (session?.user as { email_confirmed_at?: string | null } | undefined)
    ?.email_confirmed_at
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
