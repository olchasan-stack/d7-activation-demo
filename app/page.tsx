'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { analytics } from '@/lib/analytics'
import OnboardingStepper from '@/components/OnboardingStepper'

export default function Page() {
  const [userId, setUserId] = useState('u_1001')

  useEffect(() => {
    // Auto-identify user on mount
    analytics.identify(userId)
  }, [userId])

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">D7 Activation Demo</h1>
              <p className="text-sm text-gray-600">Track workspace activation with PostHog Group Analytics</p>
            </div>
            <Link 
              href="/dashboard" 
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
            >
              📊 View Dashboard →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                What is D7 Activation?
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  A workspace is "activated" within 7 days if it has <strong>≥1 project</strong> and <strong>≥3 completed tasks</strong>.
                  Track your activation rate in the dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding Stepper */}
        <OnboardingStepper 
          userId={userId}
          workspaceId=""
          onWorkspaceCreated={(newWorkspaceId) => console.log('Workspace created:', newWorkspaceId)}
        />

        {/* Developer Controls (Collapsed by default) */}
        <details className="mt-12 bg-gray-100 rounded-lg p-4">
          <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
            🔧 Developer Controls
          </summary>
          <div className="mt-4 space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input 
                value={userId} 
                onChange={e => setUserId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <p className="text-xs text-gray-600">
              Change this to simulate different users. The user will be auto-identified in PostHog.
      </p>
          </div>
        </details>
      </div>
    </main>
  )
}
