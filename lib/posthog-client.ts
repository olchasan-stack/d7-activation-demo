'use client'
import posthog from 'posthog-js'

let isInit = false

export function initPostHog() {
  if (isInit) return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com').trim()
  console.log('initPostHog called:', { key: key ? 'Present' : 'Missing', host })
  if (!key) {
    console.error('PostHog key missing!')
    return
  }
  posthog.init(key, {
    api_host: host,
    capture_pageview: false,
    loaded: (posthog) => console.log('PostHog initialized:', posthog)
  })
  isInit = true
}

export function identifyUser(userId: string) {
  initPostHog()
  posthog.identify(String(userId))
}

export function bindWorkspace(workspaceId: string, props?: Record<string, any>) {
  initPostHog()
  // Use posthog.group() to create the group and associate session events with it
  // This follows PostHog's exact pattern from their docs
  posthog.group('workspace', String(workspaceId))
}

export function resetAnalytics() {
  posthog.reset()
}

export function captureProjectCreated(workspaceId: string, projectId: string, templateId?: string) {
  initPostHog()
  console.log('captureProjectCreated:', workspaceId, projectId)
  posthog.capture('project_created', {
    workspace_id: String(workspaceId),
    project_id: String(projectId),
    ...(templateId ? { template_id: String(templateId) } : {})
  })
}

export function captureTaskCompleted(workspaceId: string, taskId: string, projectId: string) {
  initPostHog()
  posthog.capture('task_completed', {
    workspace_id: String(workspaceId),
    task_id: String(taskId),
    project_id: String(projectId)
  })
}

export async function createWorkspace(name: string, userId: string, additionalProps?: Record<string, any>) {
  try {
    const response = await fetch('/api/workspace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        userId,
        properties: additionalProps
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create workspace')
    }

    const result = await response.json()
    
    // Bind the user to the workspace on the client side
    bindWorkspace(result.workspaceId)
    
    return result
  } catch (error) {
    console.error('Error creating workspace:', error)
    throw error
  }
}
