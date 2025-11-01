import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not configured')
}

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

export interface WorkspaceStats {
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

export async function getAllWorkspacesFromSupabase(): Promise<WorkspaceStats[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty array')
    return []
  }

  try {
    // Get all workspace_created events to get workspace list
    const { data: workspaceEvents, error: workspaceError } = await supabase
      .from('events_d7_new')
      .select('properties, timestamp, distinct_id')
      .eq('event', 'workspace_created')
      .order('timestamp', { ascending: true })

    if (workspaceError) {
      console.error('Error fetching workspace_created events:', workspaceError)
      return []
    }

    if (!workspaceEvents || workspaceEvents.length === 0) {
      return []
    }

    // Deduplicate by workspace_id (PostHog Destination might create duplicates)
    const uniqueWorkspaces = new Map<string, typeof workspaceEvents[0]>()
    for (const wsEvent of workspaceEvents) {
      const workspaceId = wsEvent.properties?.workspace_id as string
      if (workspaceId && !uniqueWorkspaces.has(workspaceId)) {
        uniqueWorkspaces.set(workspaceId, wsEvent)
      }
    }

    // For each workspace, get all events and calculate stats
    const workspaceStats = await Promise.all(
      Array.from(uniqueWorkspaces.values()).map(async (wsEvent) => {
        const workspaceId = wsEvent.properties?.workspace_id as string
        if (!workspaceId) return null

        // Get all events for this workspace
        const { data: allEvents, error: eventsError } = await supabase
          .from('events_d7_new')
          .select('event, properties, timestamp')
          .eq('properties->>workspace_id', workspaceId)

        if (eventsError) {
          console.error('Error fetching events for workspace:', workspaceId, eventsError)
          return null
        }

        const workspaceName = wsEvent.properties?.workspace_name as string || 'Untitled Workspace'
        const createdAt = wsEvent.timestamp
        const distinctId = wsEvent.distinct_id as string | undefined

        // Calculate stats
        const hasProject = allEvents?.some(e => e.event === 'project_created') || false
        const taskCount = allEvents?.filter(e => e.event === 'task_completed').length || 0
        const inviteSent = allEvents?.some(e => e.event === 'invite_sent') || false
        const inviteAccepted = allEvents?.some(e => e.event === 'invite_accepted') || false
        const isActivated = hasProject && taskCount >= 3

        return {
          workspaceId,
          workspaceName,
          createdAt,
          hasProject,
          taskCount,
          isActivated,
          inviteSent,
          inviteAccepted,
          distinctId
        }
      })
    )

    return workspaceStats.filter((ws) => ws !== null) as WorkspaceStats[]
  } catch (error) {
    console.error('Error in getAllWorkspacesFromSupabase:', error)
    return []
  }
}

