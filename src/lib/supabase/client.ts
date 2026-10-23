import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    // Return a no-op client for demo mode
    // This will throw if actually used for data operations
    return createBrowserClient(
      'http://localhost:54321',
      'demo-mode-placeholder-key'
    )
  }

  return createBrowserClient(url, anonKey)
}
