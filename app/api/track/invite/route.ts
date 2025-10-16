import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { event, distinctId, workspaceId, properties } = await req.json()
    
    if (!event || !distinctId || !workspaceId) {
      return NextResponse.json({ error: 'Missing event/distinctId/workspaceId' }, { status: 400 })
    }

    const posthogHost = process.env.POSTHOG_HOST || 'https://eu.i.posthog.com'
    const posthogKey = process.env.POSTHOG_SERVER_KEY

    console.log('PostHog tracking request:', { event, distinctId, workspaceId, posthogKey: posthogKey ? 'Present' : 'Missing' })

    if (!posthogKey) {
      return NextResponse.json({ error: 'PostHog server key not configured' }, { status: 500 })
    }

    // Track event directly via PostHog API
    const trackingData = {
      api_key: posthogKey,
      event,
      distinct_id: distinctId,
      properties: {
        workspace_id: workspaceId,
        ...properties
      },
      groups: {
        workspace: workspaceId
      }
    }

    console.log('Sending to PostHog:', trackingData)

    const response = await fetch(`${posthogHost}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackingData)
    })

    const responseText = await response.text()
    console.log('PostHog response:', response.status, responseText)

    if (!response.ok) {
      console.error('PostHog tracking failed:', responseText)
      return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error tracking event:', error)
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}
