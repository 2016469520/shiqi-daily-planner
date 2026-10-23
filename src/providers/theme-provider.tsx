'use client'

import { AppearanceProvider } from './appearance-provider'
import type { ReactNode } from 'react'

/**
 * 主题入口。
 *
 * 历史上这里包的是 next-themes，现在由 AppearanceProvider 同时掌管
 * 「明暗模式」与「六套主题」，避免两套状态互相覆盖。
 * 保留这个组件名是为了让 app-providers 等既有调用方不需要改动。
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <AppearanceProvider>{children}</AppearanceProvider>
}
