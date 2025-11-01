import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/ai-service'
import { captureServerEvent } from '@/lib/posthog-server'

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
    const { userId, workspaceId, naturalLanguageQuery, queryType = 'custom' } = await req.json()
    
    if (!userId || !workspaceId || !naturalLanguageQuery) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
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
      { provider: 'openai', model: 'gpt-4-turbo-preview' },
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
    
    await captureServerEvent(
      'ai_sql_generated',
      userId,
      workspaceId,
      { 
        trace_id: traceId, 
        query_type: queryType as 'd7_metrics' | 'cohort_analysis' | 'custom',
        query_validated: !hasDangerousKeyword 
      }
    )
    
    return NextResponse.json({ 
      sql: response, 
      traceId, 
      validated: !hasDangerousKeyword 
    })
  } catch (error) {
    console.error('Error generating SQL:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

