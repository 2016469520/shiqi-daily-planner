'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { setupNewUser } from '@/lib/supabase/new-user-setup'
import { IS_LOCAL_ONLY } from '@/lib/runtime'

interface AuthState {
  user: User | null
  isLoading: boolean
  isDemoMode: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  enterDemoMode: () => void
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthState | undefined>(undefined)
const DEMO_USER_STORAGE_KEY = 'plan-calendar-demo-user'
export const DEMO_USER_ID = 'demo-user'

function createDemoUser(email = 'demo@local.app'): User {
  return { id: DEMO_USER_ID, email } as User
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    // 本地打包版：不连任何服务器，直接以本机身份进入
    if (IS_LOCAL_ONLY) {
      setIsDemoMode(true)
      setUser(createDemoUser('local@device'))
      setIsLoading(false)
      return
    }

    try {
      const stored = localStorage.getItem(DEMO_USER_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.id === DEMO_USER_ID && parsed?.email) {
          setIsDemoMode(true)
          setUser(parsed as User)
          setIsLoading(false)
          return
        }
      }
    } catch { /* ignore parse errors */ }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      setIsDemoMode(true)
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (isDemoMode) {
      // Demo mode: accept any credentials
      const demoUser = createDemoUser(email)
      setUser(demoUser)
      // Persist demo session so page refreshes don't log out
      try { localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoUser)) } catch { /* ignore */ }
      return {}
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  }, [isDemoMode])

  const signUp = useCallback(async (email: string, password: string) => {
    if (isDemoMode) {
      const demoUser = createDemoUser(email)
      setUser(demoUser)
      try { localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoUser)) } catch { /* ignore */ }
      return {}
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }

    // Set up new user profile, preferences, and default tags
    if (data.user) {
      await setupNewUser(data.user.id, email)
    }

    return {}
  }, [isDemoMode])

  const enterDemoMode = useCallback(() => {
    const demoUser = createDemoUser()
    setIsDemoMode(true)
    setUser(demoUser)
    try { localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoUser)) } catch { /* ignore */ }
  }, [])

  const signOut = useCallback(async () => {
    // 本地打包版没有账号体系，退出会把人锁在空白的登录页，直接忽略
    if (IS_LOCAL_ONLY) return

    if (isDemoMode) {
      setUser(null)
      setIsDemoMode(false)
      try { localStorage.removeItem(DEMO_USER_STORAGE_KEY) } catch { /* ignore */ }
      return
    }

    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
  }, [isDemoMode])

  const resetPassword = useCallback(async (email: string) => {
    if (isDemoMode) {
      return {}
    }

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    if (error) return { error: error.message }
    return {}
  }, [isDemoMode])

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isDemoMode, signIn, signUp, enterDemoMode, signOut, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}
