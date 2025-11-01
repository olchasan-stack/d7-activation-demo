// Tool-agnostic analytics adapter with noop support
import { NoopAnalytics } from './analytics-noop'
import { PostHogAnalytics } from './analytics-posthog'

interface IAnalytics {
  init(): boolean
  identify(userId: string): void
  group(groupType: string, groupId: string): void
  reset(): void
  captureProjectCreated(workspaceId: string, projectId: string, templateId?: string): void
  captureTaskCompleted(workspaceId: string, taskId: string, projectId: string): void
}

// Factory: return noop if analytics disabled, otherwise PostHog
export const createAnalytics = (): IAnalytics => {
  const provider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER
  if (provider === 'noop' || !provider) {
    console.log('🔕 Analytics disabled (noop mode)')
    return new NoopAnalytics()
  }
  return new PostHogAnalytics()
}

// Singleton instance
export const analytics = createAnalytics()

