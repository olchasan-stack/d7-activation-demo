import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/ai-service'
import { captureServerEvent } from '@/lib/posthog-server'
import { getAllWorkspacesFromSupabase } from '@/lib/supabase'

const DEFAULT_THRESHOLD = 0.5 // 50% activation rate

export async function POST(req: NextRequest) {
  try {
    const { userId, workspaceId, threshold = DEFAULT_THRESHOLD } = await req.json()
    
    if (!userId || !workspaceId) {
      return NextResponse.json({ error: 'Missing userId or workspaceId' }, { status: 400 })
    }
    
    // Fetch dashboard stats from Supabase
    const workspaces = await getAllWorkspacesFromSupabase()
    const total = workspaces.length
    const activated = workspaces.filter(w => w.isActivated).length
    const activationRate = total > 0 ? activated / total : 0
    
    // Check if anomaly detected
    const isAnomaly = activationRate < threshold
    
    if (!isAnomaly) {
      return NextResponse.json({ 
        alert: false, 
        activationRate, 
        threshold,
        message: 'D7 metrics within normal range' 
      })
    }
    
    const systemPrompt = `You are an analytics anomaly detector specializing in SaaS metrics.

When D7 Activation rates drop below threshold, you identify root causes and suggest actionable fixes.

Be specific and data-driven. Focus on:
1. Funnel drop-offs (which step loses most users?)
2. Onboarding UX issues (friction points, unclear CTAs)
3. Event tracking gaps (missing properties, misconfigurations)

Format: [Root Cause] → [Actionable Fix] → [Expected Impact]`
    
    const prompt = `D7 Activation Rate dropped to ${(activationRate * 100).toFixed(1)}%, below threshold of ${(threshold * 100).toFixed(0)}%.

Current metrics:
- Total workspaces: ${total}
- Activated (project + 3 tasks): ${activated}
- Activation rate: ${(activationRate * 100).toFixed(1)}%

Analyze and provide:
1. Root cause hypothesis (most likely reason for drop)
2. Specific actionable fix
3. Expected impact on activation rate`
    
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
    
    await captureServerEvent(
      'ai_anomaly_alerted',
      userId,
      workspaceId,
      {
        trace_id: traceId,
        metric: 'd7_activation',
        threshold,
        actual_value: activationRate,
        suggested_action: response
      }
    )
    
    return NextResponse.json({ 
      alert: true, 
      activationRate,
      threshold,
      message: response, 
      traceId 
    })
  } catch (error) {
    console.error('Error detecting anomaly:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

