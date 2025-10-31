import { NextRequest, NextResponse } from 'next/server'
import { updateWorkspaceStats } from '@/lib/workspace-stats'
import posthog from 'posthog-js'

export async function POST(req: NextRequest) {
  try {
    const { workspaceId } = await req.json()
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 })
    }

    // Update workspace stats
    updateWorkspaceStats(workspaceId, {
      hasProject: true
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error tracking project:', error)
    return NextResponse.json({ error: 'Failed to track project' }, { status: 500 })
  }
}

