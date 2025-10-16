import { PostHog } from 'posthog-node'

const host = process.env.POSTHOG_HOST || 'https://eu.i.posthog.com'
const key = process.env.POSTHOG_SERVER_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY || ''

export const posthogServer = new PostHog(key, { host })

export async function captureServerEvent(event: string, distinctId: string, workspaceId: string, properties: Record<string, any> = {}) {
  await posthogServer.capture({
    event,
    distinctId: String(distinctId),
    groups: { workspace: String(workspaceId) },
    properties: {
      workspace_id: String(workspaceId),
      ...properties
    }
  })
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
  await posthogServer.capture({
    event: 'workspace_created',
    distinctId: String(userId),
    groups: { workspace: String(workspaceId) },
    properties: {
      workspace_id: String(workspaceId),
      workspace_name: properties.name || 'Untitled Workspace',
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
