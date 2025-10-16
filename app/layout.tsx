import './globals.css'
import type { Metadata } from 'next'
import AnalyticsProvider from '@/components/AnalyticsProvider'

export const metadata: Metadata = {
  title: 'D7 Activation Demo',
  description: 'Next.js + PostHog + Supabase demo for workspace-level analytics',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  )
}
