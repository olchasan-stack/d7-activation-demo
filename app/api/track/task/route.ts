import { NextRequest, NextResponse } from 'next/server'
import { incrementTaskCount } from '@/lib/workspace-stats'

export async function POST(req: NextRequest) {
  try {
    const { workspaceId } = await req.json()
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 })
    }

    // Increment task count
    incrementTaskCount(workspaceId)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error tracking task:', error)
    return NextResponse.json({ error: 'Failed to track task' }, { status: 500 })
  }
}

