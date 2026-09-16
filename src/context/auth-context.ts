import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Profile, UserRole } from '../types'

export type AuthContextValue = {
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  sendPasswordReset: (email: string) => Promise<string | null>
  signInAsDemoRole: (role: UserRole) => void
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
