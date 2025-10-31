import { NextResponse } from 'next/server'
import { getAllWorkspaceStats } from '@/lib/workspace-stats'

export async function GET() {
  const workspaces = getAllWorkspaceStats()
  const totalWorkspaces = workspaces.length
  const activatedCount = workspaces.filter(w => w.isActivated).length
  const activationRate = totalWorkspaces > 0 ? (activatedCount / totalWorkspaces) : 0

  const stats = {
    workspaces,
    totalWorkspaces,
    activatedCount,
    activationRate,
  }

  return NextResponse.json(stats)
}

