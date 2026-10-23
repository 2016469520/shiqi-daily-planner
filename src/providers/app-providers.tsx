'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from './theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from './auth-provider'
import { RepoProvider } from './repo-provider'
import { PwaProvider } from '@/components/pwa/pwa-provider'
import { useState, type ReactNode } from 'react'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      })
  )

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delay={300}>
          <AuthProvider>
            <RepoProvider>
              <PwaProvider>
                {children}
                <Toaster position="bottom-right" richColors closeButton />
              </PwaProvider>
            </RepoProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
