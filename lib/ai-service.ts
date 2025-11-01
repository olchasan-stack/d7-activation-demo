import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { traceLLMCall, createTraceId } from './langfuse'
import { v4 as uuidv4 } from 'uuid'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY.trim() }) : null
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY.trim() }) : null

export interface AIConfig {
  provider: 'openai' | 'anthropic'
  model: string
  temperature?: number
}

const defaultConfig: AIConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  temperature: 0.7
}

export interface LLMResponse {
  response: string
  traceId: string
  success: boolean
  error?: string
}

export async function callLLM(
  prompt: string,
  systemPrompt: string,
  config: AIConfig = defaultConfig,
  userId: string,
  workspaceId: string
): Promise<LLMResponse> {
  const traceId = createTraceId()
  const trace = traceLLMCall(traceId, userId, workspaceId, 'llm_call', {
    provider: config.provider,
    model: config.model
  })
  
  try {
    let response: string
    
    if (config.provider === 'openai') {
      if (!openai) {
        console.error('❌ OpenAI client not initialized')
        throw new Error('OpenAI API key not configured')
      }
      const completion = await openai.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature
      })
      response = completion.choices[0].message.content || ''
    } else {
      if (!anthropic) {
        throw new Error('Anthropic API key not configured')
      }
      const completion = await anthropic.messages.create({
        model: config.model as any,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096
      })
      response = completion.content[0].type === 'text' ? completion.content[0].text : ''
    }
    
    trace?.generation({
      model: config.model,
      modelParameters: { temperature: config.temperature ?? 0.7 },
      input: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
      output: [{ role: 'assistant', content: response }]
    })
    
    await trace?.score({ name: 'success', value: 1 })
    
    return { response, traceId, success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ LLM call failed:', errorMessage)
    await trace?.score({ name: 'success', value: 0 })
    
    return { response: '', traceId, success: false, error: errorMessage }
  }
}

export async function callLLMFallback(
  prompt: string,
  systemPrompt: string,
  userId: string,
  workspaceId: string
): Promise<LLMResponse> {
  // Try OpenAI first
  let result = await callLLM(
    prompt,
    systemPrompt,
    { provider: 'openai', model: 'gpt-4o-mini' },
    userId,
    workspaceId
  )
  
  // Fall back to Anthropic if OpenAI fails
  if (!result.success && process.env.ANTHROPIC_API_KEY) {
    console.warn('OpenAI failed, falling back to Anthropic')
    result = await callLLM(
      prompt,
      systemPrompt,
      { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', temperature: 0.7 },
      userId,
      workspaceId
    )
  }
  
  return result
}

