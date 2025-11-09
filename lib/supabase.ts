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

type SupabaseRow = Record<string, any>

interface EventSourceConfig {
  table: string
  selectWorkspaceList: string
  selectWorkspaceEvents: string
  eventField: string
  timestampField: string
  workspaceIdFromRow: (row: SupabaseRow) => string | undefined
  workspaceNameFromRow: (row: SupabaseRow) => string | undefined
  distinctIdFromRow: (row: SupabaseRow) => string | undefined
  applyWorkspaceFilter: (query: any, workspaceId: string) => any
}

const EVENT_SOURCES: EventSourceConfig[] = [
  {
    table: 'events_d7_new',
    selectWorkspaceList: 'properties,timestamp,distinct_id,event',
    selectWorkspaceEvents: 'event,properties,timestamp',
    eventField: 'event',
    timestampField: 'timestamp',
    workspaceIdFromRow: (row) => row?.properties?.workspace_id as string | undefined,
    workspaceNameFromRow: (row) => row?.properties?.workspace_name as string | undefined,
    distinctIdFromRow: (row) => row?.distinct_id as string | undefined,
    applyWorkspaceFilter: (query, workspaceId) =>
      query.eq('properties->>workspace_id', workspaceId)
  },
  {
    table: 'external_events_raw',
    selectWorkspaceList: 'properties,timestamp,distinct_id,event',
    selectWorkspaceEvents: 'event,properties,timestamp',
    eventField: 'event',
    timestampField: 'timestamp',
    workspaceIdFromRow: (row) => row?.properties?.workspace_id as string | undefined,
    workspaceNameFromRow: (row) => row?.properties?.workspace_name as string | undefined,
    distinctIdFromRow: (row) => row?.distinct_id as string | undefined,
    applyWorkspaceFilter: (query, workspaceId) =>
      query.eq('properties->>workspace_id', workspaceId)
  },
  {
    table: 'events',
    selectWorkspaceList: 'properties,ts:timestamp,distinct_id,event:event_name,workspace_id',
    selectWorkspaceEvents: 'event:event_name,properties,ts:timestamp,workspace_id',
    eventField: 'event',
    timestampField: 'timestamp',
    workspaceIdFromRow: (row) =>
      (row?.workspace_id as string | undefined) ?? (row?.properties?.workspace_id as string | undefined),
    workspaceNameFromRow: (row) => row?.properties?.workspace_name as string | undefined,
    distinctIdFromRow: (row) => row?.distinct_id as string | undefined,
    applyWorkspaceFilter: (query, workspaceId) =>
      query.or(`workspace_id.eq.${workspaceId},properties->>workspace_id.eq.${workspaceId}`)
  }
]

export async function getAllWorkspacesFromSupabase(): Promise<WorkspaceStats[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty array')
    return []
  }

  for (const source of EVENT_SOURCES) {
    const workspaces = await fetchWorkspacesFromSource(source)
    if (workspaces.length > 0) {
      return workspaces
    }
  }

  console.warn('No workspaces found across configured Supabase event sources')
  return []
}

async function fetchWorkspacesFromSource(source: EventSourceConfig): Promise<WorkspaceStats[]> {
  try {
    const { data: workspaceEvents, error: workspaceError } = await supabase!
      .from(source.table)
      .select(source.selectWorkspaceList)
      .eq(source.eventField, 'workspace_created')
      .order(source.timestampField, { ascending: true })

    if (workspaceError) {
      console.warn(`Error fetching workspace_created events from ${source.table}:`, workspaceError)
      return []
    }

    if (!workspaceEvents || workspaceEvents.length === 0) {
      return []
    }

    const uniqueWorkspaces = new Map<string, SupabaseRow>()
    for (const wsEvent of workspaceEvents) {
      const workspaceId = source.workspaceIdFromRow(wsEvent)
      if (workspaceId && !uniqueWorkspaces.has(workspaceId)) {
        uniqueWorkspaces.set(workspaceId, wsEvent)
      }
    }

    const workspaceStats: (WorkspaceStats | null)[] = await Promise.all(
      Array.from(uniqueWorkspaces.entries()).map(async ([workspaceId, wsEvent]) => {
        try {
          const workspaceQuery = source.applyWorkspaceFilter(
            supabase!.from(source.table).select(source.selectWorkspaceEvents),
            workspaceId
          )

          const { data: allEvents, error: eventsError } = await workspaceQuery

          if (eventsError) {
            console.warn(`Error fetching events for workspace ${workspaceId} from ${source.table}:`, eventsError)
            return null
          }

          const workspaceName = source.workspaceNameFromRow(wsEvent) || 'Untitled Workspace'
          const createdAt =
            (wsEvent?.timestamp as string | undefined) ??
            (wsEvent?.ts as string | undefined) ??
            new Date().toISOString()
          const distinctId = source.distinctIdFromRow(wsEvent)

          const eventsArray = (allEvents ?? []) as SupabaseRow[]
          const hasProject = eventsArray.some((eventRow: SupabaseRow) => eventRow?.event === 'project_created')
          const taskCount = eventsArray.filter((eventRow: SupabaseRow) => eventRow?.event === 'task_completed').length
          const inviteSent = eventsArray.some((eventRow: SupabaseRow) => eventRow?.event === 'invite_sent')
          const inviteAccepted = eventsArray.some((eventRow: SupabaseRow) => eventRow?.event === 'invite_accepted')
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
        } catch (error) {
          console.warn(`Unexpected error processing workspace ${workspaceId} from ${source.table}:`, error)
          return null
        }
      })
    )

    const filteredWorkspaces = workspaceStats.filter((ws): ws is WorkspaceStats => ws !== null)
    return filteredWorkspaces
  } catch (error) {
    console.warn(`Failed to fetch workspaces from ${source.table}:`, error)
    return []
  }
}

