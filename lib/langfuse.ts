import { Langfuse } from 'langfuse'
import { v4 as uuidv4 } from 'uuid'

const langfuseKey = process.env.LANGFUSE_PUBLIC_KEY?.trim()
const langfuseSecretKey = process.env.LANGFUSE_SECRET_KEY?.trim()
const langfuseHost = process.env.LANGFUSE_HOST?.trim() || 'https://cloud.langfuse.com'

export const langfuse = langfuseKey && langfuseSecretKey
  ? new Langfuse({ 
      publicKey: langfuseKey, 
      secretKey: langfuseSecretKey, 
      baseUrl: langfuseHost 
    })
  : null

export interface TraceMetadata {
  workspace_id: string
  operation: string
  [key: string]: any
}

export function traceLLMCall(
  traceId: string,
  userId: string,
  workspaceId: string,
  operation: string,
  metadata?: Record<string, any>
) {
  if (!langfuse) {
    console.warn('Langfuse not configured, skipping trace')
    return null
  }
  
  return langfuse.trace({
    id: traceId,
    userId,
    metadata: { workspace_id: workspaceId, operation, ...metadata }
  })
}

export function createTraceId(): string {
  return uuidv4()
}

