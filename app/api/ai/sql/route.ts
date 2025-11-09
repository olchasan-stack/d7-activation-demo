import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { callLLM } from '@/lib/ai-service'
import { evaluateSQLQuality } from '@/lib/ai-eval-service'
import { SegmentSelection, defaultSegmentSelection, toSegmentProperties } from '@/lib/segments'

const SQL_SCHEMA = `
Database: PostgreSQL (Supabase)
Table: events_d7_new
Columns:
- id: bigserial primary key
- event: text (workspace_created, project_created, task_completed, invite_sent, invite_accepted)
- distinct_id: text
- timestamp: timestamptz
- properties: jsonb (contains workspace_id, project_id, task_id, etc.)
- workspace_id: text (derived from properties->>'workspace_id')

Example D7 query structure:
- CTE with workspace cohorts by week
- Window functions for 7-day activation
- Filter for project_created >= 1 AND task_completed >= 3
`

export async function POST(req: NextRequest) {
  try {
    const { userId, workspaceId, naturalLanguageQuery, queryType = 'custom', segment } = await req.json()
    
    if (!userId || !workspaceId || !naturalLanguageQuery) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const segmentSelection: SegmentSelection = {
      plan: segment?.plan ?? defaultSegmentSelection.plan,
      region: segment?.region ?? defaultSegmentSelection.region,
      channel: segment?.channel ?? defaultSegmentSelection.channel,
      variant: segment?.variant ?? defaultSegmentSelection.variant
    }
    const segmentProperties = toSegmentProperties(segmentSelection)
    
    const systemPrompt = `You are a SQL expert specializing in PostgreSQL/Supabase queries for analytics.

${SQL_SCHEMA}

Guidelines:
- Use workspace-level aggregation
- Optimize for Supabase performance
- Include proper JSONB operators (->, ->>)
- Add comments for complex logic
- Return only valid SQL, no markdown formatting`
    
    const { response, traceId, success, error } = await callLLM(
      naturalLanguageQuery,
      systemPrompt,
      { provider: 'openai', model: 'gpt-4o-mini' },
      userId,
      workspaceId
    )
    
    if (!success) {
      return NextResponse.json({ error: 'LLM call failed', details: error }, { status: 500 })
    }
    
    // Basic SQL validation (check for dangerous keywords)
    const dangerousKeywords = ['drop', 'delete', 'truncate', 'update', 'alter', 'grant', 'revoke']
    const lowerSql = response.toLowerCase()
    const hasDangerousKeyword = dangerousKeywords.some(keyword => lowerSql.includes(keyword))
    
    if (hasDangerousKeyword && !lowerSql.includes('comment on')) {
      return NextResponse.json(
        { error: 'Generated SQL contains dangerous keywords', sql: response, validated: false },
        { status: 400 }
      )
    }
    
    // Evaluate SQL quality (optional, controlled by ENABLE_AI_EVALUATION env var)
    const evalResult = await evaluateSQLQuality(
      response,
      naturalLanguageQuery,
      {
        enabled: true,
        operation: 'sql',
        userId,
        workspaceId,
        traceId
      }
    )
    
    // Track AI event via direct PostHog API
    try {
      const posthogHost = (process.env.POSTHOG_HOST || 'https://eu.i.posthog.com').trim()
      const posthogKey = process.env.POSTHOG_SERVER_KEY?.trim()
      
      if (posthogKey) {
        const eventUuid = uuidv4()
        const trackingData = {
          api_key: posthogKey,
          event: 'ai_sql_generated',
          distinct_id: userId,
          properties: {
            workspace_id: workspaceId,
            event_uuid: eventUuid,
            trace_id: traceId,
            query_type: queryType as 'd7_metrics' | 'cohort_analysis' | 'custom',
            query_validated: !hasDangerousKeyword,
            ...segmentProperties
          },
          groups: {
            workspace: workspaceId
          }
        }
        
        await fetch(`${posthogHost}/capture/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trackingData)
        })
      }
    } catch (trackError) {
      console.error('❌ Failed to track ai_sql_generated:', trackError)
    }
    
    return NextResponse.json({
      sql: response,
      traceId,
      validated: !hasDangerousKeyword,
      segment: segmentSelection
    })
  } catch (error) {
    console.error('Error generating SQL:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

