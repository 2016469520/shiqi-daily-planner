'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { RepositoryFactory } from '@/lib/repositories/interfaces'
import { createIndexedDBRepositoryFactory } from '@/lib/repositories/indexeddb-impl'
import { createSupabaseRepositoryFactory } from '@/lib/repositories/supabase-impl'
import { useAuth, DEMO_USER_ID } from './auth-provider'

const RepoContext = createContext<RepositoryFactory | null>(null)

export function useRepos(): RepositoryFactory {
  const ctx = useContext(RepoContext)
  if (!ctx) throw new Error('useRepos must be used within RepoProvider')
  return ctx
}

/**
 * Check if Supabase is configured (client-side env vars present).
 * This runs once per session and does not change at runtime.
 */
function isSupabaseConfigured(): boolean {
  if (typeof window === 'undefined') return false
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && key && url !== 'https://your-project-id.supabase.co')
}

export function RepoProvider({ children }: { children: ReactNode }) {
  const { user, isDemoMode } = useAuth()

  const repos = useMemo((): RepositoryFactory => {
    // In demo mode (no Supabase env), always use IndexedDB
    if (isDemoMode || user?.id === DEMO_USER_ID) {
      return createIndexedDBRepositoryFactory()
    }

    // If Supabase is configured, use Supabase implementation
    if (isSupabaseConfigured()) {
      return createSupabaseRepositoryFactory()
    }

    // Fallback to IndexedDB (should not normally reach here)
    return createIndexedDBRepositoryFactory()
  }, [isDemoMode, user?.id])

  return <RepoContext.Provider value={repos}>{children}</RepoContext.Provider>
}
