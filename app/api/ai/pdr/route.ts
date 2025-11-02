import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { callLLM } from '@/lib/ai-service'
import { getAllWorkspacesFromSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  console.log('🎯 PDR API called')
  try {
    const { userId, workspaceId } = await req.json()
    console.log('📥 Request data:', { userId, workspaceId })
    
    if (!userId || !workspaceId) {
      return NextResponse.json({ error: 'Missing userId or workspaceId' }, { status: 400 })
    }
    
    // Fetch dashboard stats from Supabase
    const workspaces = await getAllWorkspacesFromSupabase()
    const total = workspaces.length
    const activated = workspaces.filter(w => w.isActivated).length
    const activationRate = total > 0 ? activated / total : 0
    
    const systemPrompt = `You are a data analyst specializing in summarizing key metrics into a One Metric That Matters (OMTM) and 2 guardrails for decision-making.

Format your response as a PDR (Progress/Decision/Review) card:
1. OMTM: The single most important metric to track (justify why)
2. Guardrail 1: A leading indicator metric
3. Guardrail 2: A lagging indicator metric
4. Decision: If [condition] then [action], else [alternative action]`
    
    const prompt = `Given these D7 Activation metrics:
- Total workspaces: ${total}
- Activated (project + 3 tasks): ${activated}
- D7 Activation Rate: ${(activationRate * 100).toFixed(1)}%

Generate a concise PDR card following the format above. Be specific and actionable.`
    
    const { response, traceId, success, error } = await callLLM(
      prompt,
      systemPrompt,
      { provider: 'openai', model: 'gpt-4o-mini' },
      userId,
      workspaceId
    )
    
    if (!success) {
      return NextResponse.json({ error: 'LLM call failed', details: error }, { status: 500 })
    }
    
    // Track AI event via direct PostHog API
    try {
      const posthogHost = (process.env.POSTHOG_HOST || 'https://eu.i.posthog.com').trim()
      const posthogKey = process.env.POSTHOG_SERVER_KEY?.trim()
      
      if (posthogKey) {
        const eventUuid = uuidv4()
        const trackingData = {
          api_key: posthogKey,
          event: 'ai_pdr_draft_created',
          distinct_id: userId,
          properties: {
            workspace_id: workspaceId,
            event_uuid: eventUuid,
            trace_id: traceId,
            omtm_score: activationRate
          },
          groups: {
            workspace: workspaceId
          }
        }
        
        console.log('Sending to PostHog:', trackingData)
        
        const trackResponse = await fetch(`${posthogHost}/capture/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trackingData)
        })
        
        const trackResponseText = await trackResponse.text()
        console.log('PostHog response:', trackResponse.status, trackResponseText)
        
        if (!trackResponse.ok) {
          console.error('❌ PostHog tracking failed:', trackResponseText)
        } else {
          console.log('✅ Tracked ai_pdr_draft_created event')
        }
      }
    } catch (trackError) {
      console.error('❌ Failed to track ai_pdr_draft_created:', trackError)
    }
    
    return NextResponse.json({ pdr: response, traceId })
  } catch (error) {
    console.error('Error generating PDR:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

