import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { demoClient, demoCoach } from '../data/mock'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Profile, UserRole } from '../types'
import { AuthContext } from './auth-context'

async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id,username,role,gender,avatar_url')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Unable to load profile', error)
    return null
  }

  return data as Profile | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    const client = supabase
    let isActive = true

    const hydrate = async () => {
      const { data, error } = await client.auth.getSession()
      if (!isActive) return

      if (error) {
        console.error('Unable to restore session', error)
        setLoading(false)
        return
      }

      const nextProfile = data.session?.user.id ? await fetchProfile(data.session.user.id) : null
      if (!isActive) return

      setSession(data.session)
      setProfile(nextProfile)
      setLoading(false)
    }

    void hydrate()

    const { data: listener } = client.auth.onAuthStateChange((_event, authSession) => {
      setSession(authSession)

      if (!authSession?.user.id) {
        setProfile(null)
        setLoading(false)
        return
      }

      void fetchProfile(authSession.user.id).then((nextProfile) => {
        if (isActive) {
          setProfile(nextProfile)
          setLoading(false)
        }
      })
    })

    return () => {
      isActive = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) return 'Supabase is not configured yet.'

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      return error.message
    }

    return null
  }

  const sendPasswordReset = async (email: string) => {
    if (!supabase) return 'Supabase is not configured yet.'
    if (!email.trim()) return 'Enter your email first.'

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    })

    return error?.message ?? null
  }

  const signInAsDemoRole = (role: UserRole) => {
    if (isSupabaseConfigured) return
    setProfile(role === 'coach' ? demoCoach : demoClient)
    setSession(null)
  }

  const refreshProfile = async () => {
    const userId = session?.user.id
    if (!userId) return
    setProfile(await fetchProfile(userId))
  }

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setProfile(null)
    setSession(null)
  }

  const value = {
    profile,
    session,
    loading,
    signIn,
    sendPasswordReset,
    signInAsDemoRole,
    refreshProfile,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
