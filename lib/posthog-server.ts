import { PostHog } from 'posthog-node'
import { v4 as uuidv4 } from 'uuid'

const host = (process.env.POSTHOG_HOST || 'https://eu.i.posthog.com').trim()
const key = (process.env.POSTHOG_SERVER_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY || '').trim()

export const posthogServer = new PostHog(key, { host })

export async function captureServerEvent(event: string, distinctId: string, workspaceId: string, properties: Record<string, any> = {}) {
  // Generate UUID for idempotency (deduplication in Supabase)
  const eventUuid = uuidv4()
  
  console.log('📊 Capturing server event:', { event, distinctId, workspaceId, hasKey: !!key, host })
  
  try {
    await posthogServer.capture({
      event,
      distinctId: String(distinctId),
      groups: { workspace: String(workspaceId) },
      properties: {
        workspace_id: String(workspaceId),
        event_uuid: eventUuid,
        ...properties
      }
    })
    console.log('✅ Successfully captured:', event)
  } catch (error) {
    console.error('❌ Failed to capture event:', event, error)
    throw error
  }
  
  return eventUuid
}

export async function createWorkspace(workspaceId: string, userId: string, properties: Record<string, any> = {}) {
  // Create the workspace group with properties
  await posthogServer.groupIdentify({
    groupType: 'workspace',
    groupKey: String(workspaceId),
    properties: {
      ...properties,
      created_by: String(userId),
      created_at: new Date().toISOString()
    }
  })

  // Associate the user with the workspace
  const workspaceEventUuid = uuidv4()
  await posthogServer.capture({
    event: 'workspace_created',
    distinctId: String(userId),
    groups: { workspace: String(workspaceId) },
    properties: {
      workspace_id: String(workspaceId),
      workspace_name: properties.name || 'Untitled Workspace',
      event_uuid: workspaceEventUuid,
      ...properties
    }
  })

  // Set user properties to include workspace membership
  await posthogServer.identify({
    distinctId: String(userId),
    properties: {
      current_workspace_id: String(workspaceId),
      workspace_count: { $increment: 1 }
    }
  })
}
