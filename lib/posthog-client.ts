'use client'
import posthog from 'posthog-js'
import { ProjectCreatedProperties, TaskCompletedProperties } from './event-schemas'

let isInit = false

export function initPostHog() {
  if (isInit) {
    console.log('PostHog already initialized, skipping')
    return true
  }
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()
  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com').trim()
  console.log('initPostHog called:', { key: key ? 'Present' : 'Missing', host })
  if (!key) {
    console.error('PostHog key missing!')
    return false
  }
  try {
    posthog.init(key, {
      api_host: host,
      capture_pageview: false,
      loaded: () => {
        console.log('✅ PostHog successfully initialized')
      }
    })
    isInit = true
    return true
  } catch (error) {
    console.error('Error initializing PostHog:', error)
    return false
  }
}

export function identifyUser(userId: string) {
  initPostHog()
  posthog.identify(String(userId))
}

export function bindWorkspace(workspaceId: string, props?: Record<string, any>) {
  initPostHog()
  // Use posthog.group() to create the group and associate session events with it
  // This follows PostHog's exact pattern from their docs
  posthog.group('workspace', String(workspaceId), props)
}

export function resetAnalytics() {
  posthog.reset()
}

export function captureProjectCreated(
  workspaceId: string,
  projectId: string,
  templateId?: string,
  extraProperties?: Record<string, unknown>
) {
  const initialized = initPostHog()
  console.log('captureProjectCreated called:', { workspaceId, projectId, templateId, initialized })
  if (!initialized) {
    console.error('Cannot capture project_created: PostHog not initialized')
    return
  }
  
  // Validate properties match schema
  const properties = {
    workspace_id: String(workspaceId),
    project_id: String(projectId),
    ...(templateId ? { template_id: String(templateId) } : {}),
    ...(extraProperties ?? {})
  }
  
  try {
    ProjectCreatedProperties.parse(properties)
  } catch (error) {
    console.error('❌ ProjectCreatedProperties validation failed:', error)
    return
  }
  
  try {
    const result = posthog.capture('project_created', properties)
    console.log('captureProjectCreated result:', result)
  } catch (error) {
    console.error('Error capturing project_created:', error)
  }
}

export function captureTaskCompleted(
  workspaceId: string,
  taskId: string,
  projectId: string,
  extraProperties?: Record<string, unknown>
) {
  const initialized = initPostHog()
  console.log('captureTaskCompleted called:', { workspaceId, taskId, projectId, initialized })
  if (!initialized) {
    console.error('Cannot capture task_completed: PostHog not initialized')
    return
  }
  
  // Validate properties match schema
  const properties = {
    workspace_id: String(workspaceId),
    task_id: String(taskId),
    project_id: String(projectId),
    ...(extraProperties ?? {})
  }
  
  try {
    TaskCompletedProperties.parse(properties)
  } catch (error) {
    console.error('❌ TaskCompletedProperties validation failed:', error)
    return
  }
  
  try {
    const result = posthog.capture('task_completed', properties)
    console.log('captureTaskCompleted result:', result)
  } catch (error) {
    console.error('Error capturing task_completed:', error)
  }
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
