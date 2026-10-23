import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import '@/styles/themes.css'
import { AppProviders } from '@/providers/app-providers'
import { AppShell } from '@/components/layout/app-shell'
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants'
import { PREPAINT_SCRIPT } from '@/lib/theme/prepaint'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  icons: {
    icon: '/icon-192.svg',
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* 首帧前应用主题，避免默认主题闪一下再切换 */}
        <script dangerouslySetInnerHTML={{ __html: PREPAINT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  )
}
