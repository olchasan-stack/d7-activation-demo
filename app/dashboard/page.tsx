'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PDRCopilot from '@/components/PDRCopilot'
import SQLGenerator from '@/components/SQLGenerator'
import AnomalyDetector from '@/components/AnomalyDetector'

interface WorkspaceStats {
  workspaceId: string
  workspaceName: string
  createdAt: string
  hasProject: boolean
  taskCount: number
  isActivated: boolean
  inviteSent: boolean
  inviteAccepted: boolean
  distinctId?: string
}

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceStats[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      setWorkspaces(data.workspaces || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Refresh every 5 seconds to show real-time updates
    const interval = setInterval(fetchStats, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const totalWorkspaces = workspaces.length
  const activatedCount = workspaces.filter(w => w.isActivated).length
  const activationRate = totalWorkspaces > 0 ? (activatedCount / totalWorkspaces * 100).toFixed(1) : '0'

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Demo
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">D7 Activation Dashboard</h1>
          <p className="text-gray-600">Monitor workspace activation rates across your platform</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Workspaces</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalWorkspaces}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activated</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{activatedCount}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activation Rate</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{activationRate}%</p>
              </div>
              <div className="bg-indigo-100 rounded-full p-3">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* AI Features */}
        {workspaces.length > 0 && workspaces[0].distinctId && (
          <>
            <PDRCopilot userId={workspaces[0].distinctId} workspaceId={workspaces[0].workspaceId} />
            <SQLGenerator userId={workspaces[0].distinctId} workspaceId={workspaces[0].workspaceId} />
            <AnomalyDetector userId={workspaces[0].distinctId} workspaceId={workspaces[0].workspaceId} />
          </>
        )}

        {/* D7 Activation Criteria Info */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-indigo-900 mb-3">D7 Activation Criteria</h2>
          <p className="text-indigo-800 mb-3">
            A workspace is considered <span className="font-semibold">"activated"</span> within 7 days of creation if it has:
          </p>
          <ul className="list-disc list-inside space-y-2 text-indigo-800">
            <li><span className="font-semibold">≥1</span> <code className="bg-indigo-100 px-2 py-0.5 rounded">project_created</code> event</li>
            <li><span className="font-semibold">≥3</span> distinct <code className="bg-indigo-100 px-2 py-0.5 rounded">task_completed</code> events</li>
          </ul>
        </div>

        {/* Workspaces Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Workspace Details</h2>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading workspace data...</p>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Workspaces Yet</h3>
              <p className="text-gray-600 mb-6">Create your first workspace to start tracking D7 activation</p>
              <Link
                href="/"
                className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                ← Go to Onboarding
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Workspace
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tasks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invites
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workspaces.map((workspace) => (
                    <tr key={workspace.workspaceId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{workspace.workspaceName}</div>
                          <div className="text-sm text-gray-500">{workspace.workspaceId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(workspace.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {workspace.hasProject ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Project Created
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            No Project
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{workspace.taskCount} / 3</div>
                        <div className="text-xs text-gray-500">
                          {workspace.taskCount >= 3 ? '✓ Threshold met' : 'Threshold not met'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {workspace.inviteSent ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              No
                            </span>
                          )}
                          {workspace.inviteAccepted ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Accepted
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              No
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {workspace.isActivated ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            ✓ Activated
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-600 space-y-1">
          <p>
            💡 This is a demo dashboard. In production, connect to PostHog's Query API to fetch real-time event data.
          </p>
          {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA && (
            <p className="text-xs text-gray-500">
              Build: {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.substring(0, 7)}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}

