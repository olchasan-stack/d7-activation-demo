'use client'

import { ReactNode, useEffect } from 'react'
import { analytics } from '@/lib/analytics'

export default function AnalyticsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    analytics.init()
  }, [])
  return <>{children}</>
}
