import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/ai-service'
import { captureServerEvent } from '@/lib/posthog-server'
import { getAllWorkspacesFromSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { userId, workspaceId } = await req.json()
    
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
      { provider: 'openai', model: 'gpt-4-turbo-preview' },
      userId,
      workspaceId
    )
    
    if (!success) {
      return NextResponse.json({ error: 'LLM call failed', details: error }, { status: 500 })
    }
    
    // Track AI event
    await captureServerEvent(
      'ai_pdr_draft_created',
      userId,
      workspaceId,
      { trace_id: traceId, omtm_score: activationRate }
    )
    
    return NextResponse.json({ pdr: response, traceId })
  } catch (error) {
    console.error('Error generating PDR:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

