'use client'

import { ReactNode, useEffect } from 'react'
import { initPostHog } from '@/lib/posthog-client'

export default function AnalyticsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initPostHog()
  }, [])
  return <>{children}</>
}
