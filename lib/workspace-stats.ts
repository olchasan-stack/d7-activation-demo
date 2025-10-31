// Simple in-memory store for workspace statistics
// In production, this would query PostHog's API or your database

interface WorkspaceStats {
  workspaceId: string
  workspaceName: string
  createdAt: string
  hasProject: boolean
  taskCount: number
  isActivated: boolean
  inviteSent: boolean
  inviteAccepted: boolean
}

// In-memory store - resets on server restart
const workspaceStatsMap = new Map<string, WorkspaceStats>()

export function getWorkspaceStats(workspaceId: string): WorkspaceStats | undefined {
  return workspaceStatsMap.get(workspaceId)
}

export function getAllWorkspaceStats(): WorkspaceStats[] {
  return Array.from(workspaceStatsMap.values())
}

export function updateWorkspaceStats(
  workspaceId: string, 
  updates: Partial<WorkspaceStats>
): WorkspaceStats {
  const existing = workspaceStatsMap.get(workspaceId)
  
  if (existing) {
    const updated = { ...existing, ...updates }
    // Calculate activation status
    updated.isActivated = updated.hasProject && updated.taskCount >= 3
    workspaceStatsMap.set(workspaceId, updated)
    return updated
  }
  
  const newStats: WorkspaceStats = {
    workspaceId,
    workspaceName: updates.workspaceName || 'Untitled Workspace',
    createdAt: updates.createdAt || new Date().toISOString(),
    hasProject: updates.hasProject || false,
    taskCount: updates.taskCount || 0,
    isActivated: false,
    inviteSent: updates.inviteSent || false,
    inviteAccepted: updates.inviteAccepted || false,
  }
  
  newStats.isActivated = newStats.hasProject && newStats.taskCount >= 3
  workspaceStatsMap.set(workspaceId, newStats)
  return newStats
}

// Increment task count for a workspace
export function incrementTaskCount(workspaceId: string): WorkspaceStats {
  const existing = workspaceStatsMap.get(workspaceId)
  const currentCount = existing?.taskCount || 0
  
  return updateWorkspaceStats(workspaceId, {
    taskCount: currentCount + 1
  })
}

