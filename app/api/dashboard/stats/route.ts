import { NextResponse } from 'next/server'
import { getAllWorkspaceStats, updateWorkspaceStats } from '@/lib/workspace-stats'

export async function GET() {
  const workspaces = getAllWorkspaceStats()
  
  console.log('Dashboard stats request:', { total: workspaces.length, activated: workspaces.filter(w => w.isActivated).length, workspaces: workspaces.map(w => ({ id: w.workspaceId.slice(0, 8), name: w.workspaceName, active: w.isActivated })) })

  return NextResponse.json({ workspaces })
}

