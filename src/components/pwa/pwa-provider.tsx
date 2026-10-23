'use client'

import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import { IS_LOCAL_ONLY } from '@/lib/runtime'

// ---------- Context ----------

interface PwaContextValue {
  isOnline: boolean
  isInstallable: boolean
  promptInstall: () => void
  registration: ServiceWorkerRegistration | null
}

const PwaContext = createContext<PwaContextValue>({
  isOnline: true,
  isInstallable: false,
  promptInstall: () => {},
  registration: null,
})

export function usePwa() {
  return useContext(PwaContext)
}

// ---------- Provider ----------

interface PwaProviderProps {
  children: React.ReactNode
}

export function PwaProvider({ children }: PwaProviderProps) {
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine
  )
  const [isInstallable, setIsInstallable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null)
  const [showOfflineBanner, setShowOfflineBanner] = useState(false)

  // Register service worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    // 打包版没有网络依赖，也不需要 Service Worker
    if (IS_LOCAL_ONLY) return

    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineBanner(false)
      toast.success('已恢复网络连接')
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineBanner(true)
      toast.warning('网络连接已断开，离线模式下仍可查看数据')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Register SW
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        setRegistration(reg)
        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                toast.info('有新版本可用，刷新页面以更新', {
                  action: {
                    label: '刷新',
                    onClick: () => window.location.reload(),
                  },
                })
              }
            })
          }
        })
      })
      .catch(() => {
        // SW registration failed (e.g., not HTTPS, or blocked)
        // App continues to work without SW
      })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Listen for beforeinstallprompt
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Also listen for appinstalled
    const installedHandler = () => {
      setIsInstallable(false)
      setInstallPrompt(null)
      toast.success('应用已安装')
    }
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  // Prompt install
  const promptInstall = useCallback(() => {
    if (installPrompt) {
      ;(installPrompt as { prompt?: () => Promise<void> }).prompt?.()
      setInstallPrompt(null)
      setIsInstallable(false)
    } else {
      toast.info('安装功能仅在支持的浏览器中可用')
    }
  }, [installPrompt])

  const value: PwaContextValue = {
    isOnline,
    isInstallable,
    promptInstall,
    registration,
  }

  return (
    <PwaContext.Provider value={value}>
      {children}

      {/* Offline banner —— 本地版本来就不依赖网络，不显示 */}
      <div
        className={cn(
          'fixed bottom-16 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300',
          showOfflineBanner && !IS_LOCAL_ONLY
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm shadow-lg">
          <WifiOff className="h-3.5 w-3.5" />
          <span>离线模式</span>
        </div>
      </div>
    </PwaContext.Provider>
  )
}
