import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { demoClient, demoCoach } from '../data/mock'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Profile, UserRole } from '../types'

type AuthContextValue = {
  profile: Profile | null
  session: Session | null
  loading: boolean
  signInAsDemoRole: (role: UserRole) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }
    const client = supabase

    let isActive = true

    client.auth.getSession().then(async ({ data }) => {
      if (!isActive) return

      setSession(data.session)

      if (data.session?.user.id) {
        const { data: profileData } = await client
          .from('profiles')
          .select('id,username,role,gender,avatar_url')
          .eq('id', data.session.user.id)
          .single()

        setProfile(profileData ?? null)
      }

      setLoading(false)
    })

    const { data: listener } = client.auth.onAuthStateChange(async (_event, authSession) => {
      setSession(authSession)

      if (!authSession?.user.id) {
        setProfile(null)
        return
      }

      const { data: profileData } = await client
        .from('profiles')
        .select('id,username,role,gender,avatar_url')
        .eq('id', authSession.user.id)
        .single()

      setProfile(profileData ?? null)
    })

    return () => {
      isActive = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signInAsDemoRole = (role: UserRole) => {
    setProfile(role === 'coach' ? demoCoach : demoClient)
    setSession(null)
  }

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setProfile(null)
    setSession(null)
  }

  const value = useMemo(
    () => ({
      profile,
      session,
      loading,
      signInAsDemoRole,
      signOut,
    }),
    [profile, session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
