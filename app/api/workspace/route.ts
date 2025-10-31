import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { updateWorkspaceStats } from '@/lib/workspace-stats'

export async function POST(req: NextRequest) {
  try {
    const { name, userId, properties } = await req.json()
    
    if (!name || !userId) {
      return NextResponse.json({ error: 'Missing name or userId' }, { status: 400 })
    }

    const workspaceId = uuidv4()
    const posthogHost = process.env.POSTHOG_HOST || 'https://eu.i.posthog.com'
    const posthogKey = process.env.POSTHOG_SERVER_KEY

    if (!posthogKey) {
      return NextResponse.json({ error: 'PostHog server key not configured' }, { status: 500 })
    }

    console.log('Creating workspace group:', { workspaceId, userId, name })

    // Step 1: Create the workspace group using $groupidentify (following PostHog docs)
    const groupIdentifyData = {
      api_key: posthogKey,
      event: '$groupidentify',
      distinct_id: userId, // Use the user ID as distinct_id for group creation
      properties: {
        $group_type: 'workspace',
        $group_key: workspaceId,
        name: name, // This is important - PostHog UI uses 'name' property to identify groups
        created_by: userId,
        created_at: new Date().toISOString(),
        ...properties
      }
    }

    console.log('Sending group identify:', groupIdentifyData)

    const groupResponse = await fetch(`${posthogHost}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(groupIdentifyData)
    })

    const groupResponseText = await groupResponse.text()
    console.log('Group identify response:', groupResponse.status, groupResponseText)

    if (!groupResponse.ok) {
      console.error('Group identify failed:', groupResponseText)
      return NextResponse.json({ error: 'Failed to create workspace group' }, { status: 500 })
    }

    // Step 2: Track the workspace_created event
    const workspaceCreatedData = {
      api_key: posthogKey,
      event: 'workspace_created',
      distinct_id: userId,
      properties: {
        workspace_id: workspaceId,
        workspace_name: name,
        ...properties
      },
      groups: {
        workspace: workspaceId
      }
    }

    console.log('Sending workspace_created event:', workspaceCreatedData)

    const eventResponse = await fetch(`${posthogHost}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workspaceCreatedData)
    })

    const eventResponseText = await eventResponse.text()
    console.log('Workspace created response:', eventResponse.status, eventResponseText)

    if (!eventResponse.ok) {
      console.error('Workspace created event failed:', eventResponseText)
      return NextResponse.json({ error: 'Failed to track workspace_created event' }, { status: 500 })
    }

    // Update our in-memory workspace stats
    const stats = updateWorkspaceStats(workspaceId, {
      workspaceName: name,
      createdAt: new Date().toISOString(),
      hasProject: false,
      taskCount: 0,
      inviteSent: false,
      inviteAccepted: false,
    })
    console.log('Updated workspace stats:', stats)

    return NextResponse.json({ 
      workspaceId,
      success: true,
      message: 'Workspace group created and workspace_created event tracked'
    })

  } catch (error) {
    console.error('Error creating workspace:', error)
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
  }
}