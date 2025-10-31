'use client'

import { useState } from 'react'
import Link from 'next/link'
import { identifyUser, bindWorkspace, resetAnalytics, captureProjectCreated, captureTaskCompleted } from '@/lib/posthog-client'
import OnboardingStepper from '@/components/OnboardingStepper'

export default function Page() {
  const [userId, setUserId] = useState('u_1001')
  const [workspaceId, setWorkspaceId] = useState('ws_2001')
  const [projectId, setProjectId] = useState('pr_3001')
  const [taskId, setTaskId] = useState('t_4001')

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1>D7 Activation — Demo Controls</h1>
          <p>Step 1: Identify a user and bind a <b>workspace</b> group. Then fire minimal events.</p>
        </div>
        <Link href="/dashboard" style={{ padding: '8px 16px', backgroundColor: '#4F46E5', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 500 }}>
          📊 Dashboard →
        </Link>
      </div>

      <section style={{ display: 'grid', gap: 12, marginTop: 20 }}>
        <label>
          User ID: <input value={userId} onChange={e => setUserId(e.target.value)} />
        </label>
        <label>
          Workspace ID: <input value={workspaceId} onChange={e => setWorkspaceId(e.target.value)} />
        </label>
        <label>
          Project ID: <input value={projectId} onChange={e => setProjectId(e.target.value)} />
        </label>
        <label>
          Task ID: <input value={taskId} onChange={e => setTaskId(e.target.value)} />
        </label>
      </section>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
                <button onClick={() => identifyUser(userId)}>Identify</button>
                <button onClick={async () => {
                  try {
                    const response = await fetch('/api/workspace', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        name: 'Demo Workspace', 
                        userId: userId,
                        properties: { plan: 'free', seat_count: 2 }
                      })
                    })
                    const result = await response.json()
                    if (response.ok) {
                      console.log('Workspace created:', result)
                      // Update the workspace ID in the input
                      setWorkspaceId(result.workspaceId)
                      // Bind the workspace on client side
                      bindWorkspace(result.workspaceId)
                    } else {
                      console.error('Failed to create workspace:', result)
                    }
                  } catch (error) {
                    console.error('Error creating workspace:', error)
                  }
                }}>Create Workspace Group</button>
                <button onClick={() => bindWorkspace(workspaceId, { plan: 'free', seat_count: 2 })}>Bind Workspace Group</button>
                <button onClick={() => captureProjectCreated(workspaceId, projectId)}>Capture project_created</button>
                <button onClick={() => captureTaskCompleted(workspaceId, taskId, projectId)}>Capture task_completed</button>
                <button onClick={async () => {
                  await fetch('/api/track/invite', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ event: 'invite_sent', distinctId: userId, workspaceId })
                  })
                }}>Server: invite_sent</button>
                <button onClick={async () => {
                  await fetch('/api/track/invite', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ event: 'invite_accepted', distinctId: userId, workspaceId })
                  })
                }}>Server: invite_accepted</button>
                <button onClick={() => resetAnalytics()}>Reset (logout)</button>
              </div>

      <p style={{ marginTop: 24 }}>
        Check your PostHog project: Workspace group should be set; events should appear under the group.
      </p>

      <div style={{ marginTop: 40, borderTop: '1px solid #ccc', paddingTop: 20 }}>
        <h2>Onboarding UI (v0.app style)</h2>
        <OnboardingStepper />
      </div>
    </main>
  )
}
