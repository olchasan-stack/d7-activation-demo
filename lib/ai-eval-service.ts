import { callLLM, AIConfig } from './ai-service'
import { traceLLMCall } from './langfuse'

export interface EvalResult {
  format_valid: boolean
  data_driven?: boolean
  actionable?: boolean
  sql_safe?: boolean
  sql_relevant?: boolean
  root_cause_quality?: boolean
  overall_score: number
}

export interface EvalConfig {
  enabled: boolean
  operation: 'pdr' | 'sql' | 'anomaly'
  userId: string
  workspaceId: string
  traceId: string
}

const isEvaluationEnabled = (): boolean => {
  return process.env.ENABLE_AI_EVALUATION === 'true'
}

/**
 * Evaluate PDR output quality using LLM-as-a-Judge
 * Criteria: Format compliance, data-driven insights, actionability
 */
export async function evaluatePDRQuality(
  pdrContent: string,
  context: { activationRate: number; total: number; activated: number },
  config: EvalConfig
): Promise<EvalResult | null> {
  if (!isEvaluationEnabled() || !config.enabled) return null
  
  const judgeTrace = traceLLMCall(
    config.traceId + '-eval',
    config.userId,
    config.workspaceId,
    'pdr_evaluation'
  )

  if (!judgeTrace) {
    console.warn('Langfuse not configured, skipping PDR evaluation')
    return null
  }

  const judgePrompt = `You are an expert product analyst evaluating a PDR (Progress/Decision/Review) card.

Evaluate the following PDR content based on these criteria:
1. **Format Valid** (0-1): Does it follow the PDR structure (OMTM, Guardrails, Decision)?
2. **Data-Driven** (0-1): Are insights grounded in the metrics provided?
3. **Actionable** (0-1): Does it provide clear, specific next steps?

Context:
- D7 Activation Rate: ${(context.activationRate * 100).toFixed(1)}%
- Total Workspaces: ${context.total}
- Activated: ${context.activated}

PDR Content:
${pdrContent}

Return ONLY a JSON object with:
{
  "format_valid": 0 or 1,
  "data_driven": 0 or 1,
  "actionable": 0 or 1,
  "overall_score": <average of the three scores>
}`

  const judgeSystemPrompt = 'You are a strict quality evaluator. Return only valid JSON.'

  const aiConfig: AIConfig = {
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.2 // Lower temperature for consistent evaluation
  }

  try {
    const response = await callLLM(
      judgePrompt,
      judgeSystemPrompt,
      aiConfig,
      config.userId,
      config.workspaceId
    )

    if (!response.success) {
      console.error('❌ PDR evaluation failed:', response.error)
      return null
    }

    const evalData = JSON.parse(response.response.trim())
    
    // Score to Langfuse
    await judgeTrace.score({ name: 'format_valid', value: evalData.format_valid })
    await judgeTrace.score({ name: 'data_driven', value: evalData.data_driven })
    await judgeTrace.score({ name: 'actionable', value: evalData.actionable })
    await judgeTrace.score({ name: 'overall_score', value: evalData.overall_score })

    console.log('✅ PDR Evaluation:', {
      format: evalData.format_valid,
      dataDriven: evalData.data_driven,
      actionable: evalData.actionable,
      overall: evalData.overall_score
    })

    return {
      format_valid: evalData.format_valid === 1,
      data_driven: evalData.data_driven === 1,
      actionable: evalData.actionable === 1,
      overall_score: evalData.overall_score
    }
  } catch (error) {
    console.error('❌ PDR evaluation parsing failed:', error)
    return null
  }
}

/**
 * Evaluate SQL query quality
 * Criteria: Syntax safety, SQL safety, relevance
 */
export async function evaluateSQLQuality(
  sqlQuery: string,
  naturalLanguageQuery: string,
  config: EvalConfig
): Promise<EvalResult | null> {
  if (!isEvaluationEnabled() || !config.enabled) return null

  const judgeTrace = traceLLMCall(
    config.traceId + '-eval',
    config.userId,
    config.workspaceId,
    'sql_evaluation'
  )

  if (!judgeTrace) {
    console.warn('Langfuse not configured, skipping SQL evaluation')
    return null
  }

  const judgePrompt = `You are a SQL expert evaluating a generated query.

Evaluate the SQL query based on:
1. **Format Valid** (0-1): Is it syntactically valid SQL?
2. **SQL Safe** (0-1): Does it avoid DROP/DELETE/TRUNCATE/UPDATE without safeguards?
3. **SQL Relevant** (0-1): Does it match the user's intent?

Original Request: "${naturalLanguageQuery}"

SQL Query:
\`\`\`sql
${sqlQuery}
\`\`\`

Return ONLY a JSON object:
{
  "format_valid": 0 or 1,
  "sql_safe": 0 or 1,
  "sql_relevant": 0 or 1,
  "overall_score": <average of the three scores>
}`

  const judgeSystemPrompt = 'You are a strict SQL security evaluator. Return only valid JSON.'

  const aiConfig: AIConfig = {
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.2
  }

  try {
    const response = await callLLM(
      judgePrompt,
      judgeSystemPrompt,
      aiConfig,
      config.userId,
      config.workspaceId
    )

    if (!response.success) {
      console.error('❌ SQL evaluation failed:', response.error)
      return null
    }

    const evalData = JSON.parse(response.response.trim())
    
    await judgeTrace.score({ name: 'format_valid', value: evalData.format_valid })
    await judgeTrace.score({ name: 'sql_safe', value: evalData.sql_safe })
    await judgeTrace.score({ name: 'sql_relevant', value: evalData.sql_relevant })
    await judgeTrace.score({ name: 'overall_score', value: evalData.overall_score })

    console.log('✅ SQL Evaluation:', {
      format: evalData.format_valid,
      safe: evalData.sql_safe,
      relevant: evalData.sql_relevant,
      overall: evalData.overall_score
    })

    return {
      format_valid: evalData.format_valid === 1,
      sql_safe: evalData.sql_safe === 1,
      sql_relevant: evalData.sql_relevant === 1,
      overall_score: evalData.overall_score
    }
  } catch (error) {
    console.error('❌ SQL evaluation parsing failed:', error)
    return null
  }
}

/**
 * Evaluate anomaly detection quality
 * Criteria: Root cause quality, data-driven analysis
 */
export async function evaluateAnomalyQuality(
  anomalyAnalysis: string,
  context: { activationRate: number; threshold: number },
  config: EvalConfig
): Promise<EvalResult | null> {
  if (!isEvaluationEnabled() || !config.enabled) return null

  const judgeTrace = traceLLMCall(
    config.traceId + '-eval',
    config.userId,
    config.workspaceId,
    'anomaly_evaluation'
  )

  if (!judgeTrace) {
    console.warn('Langfuse not configured, skipping Anomaly evaluation')
    return null
  }

  const judgePrompt = `You are a data science analyst evaluating anomaly detection insights.

Evaluate the anomaly analysis based on:
1. **Format Valid** (0-1): Is the response coherent and structured?
2. **Root Cause Quality** (0-1): Does it identify plausible root causes?
3. **Data-Driven** (0-1): Are recommendations based on actual metrics?

Context:
- Activation Rate: ${(context.activationRate * 100).toFixed(1)}%
- Threshold: ${(context.threshold * 100).toFixed(1)}%
- Gap: ${((context.activationRate - context.threshold) * 100).toFixed(1)}%

Anomaly Analysis:
${anomalyAnalysis}

Return ONLY a JSON object:
{
  "format_valid": 0 or 1,
  "root_cause_quality": 0 or 1,
  "data_driven": 0 or 1,
  "overall_score": <average of the three scores>
}`

  const judgeSystemPrompt = 'You are a strict analytical evaluator. Return only valid JSON.'

  const aiConfig: AIConfig = {
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.2
  }

  try {
    const response = await callLLM(
      judgePrompt,
      judgeSystemPrompt,
      aiConfig,
      config.userId,
      config.workspaceId
    )

    if (!response.success) {
      console.error('❌ Anomaly evaluation failed:', response.error)
      return null
    }

    const evalData = JSON.parse(response.response.trim())
    
    await judgeTrace.score({ name: 'format_valid', value: evalData.format_valid })
    await judgeTrace.score({ name: 'root_cause_quality', value: evalData.root_cause_quality })
    await judgeTrace.score({ name: 'data_driven', value: evalData.data_driven })
    await judgeTrace.score({ name: 'overall_score', value: evalData.overall_score })

    console.log('✅ Anomaly Evaluation:', {
      format: evalData.format_valid,
      rootCause: evalData.root_cause_quality,
      dataDriven: evalData.data_driven,
      overall: evalData.overall_score
    })

    return {
      format_valid: evalData.format_valid === 1,
      data_driven: evalData.data_driven === 1,
      root_cause_quality: evalData.root_cause_quality === 1,
      overall_score: evalData.overall_score
    }
  } catch (error) {
    console.error('❌ Anomaly evaluation parsing failed:', error)
    return null
  }
}

