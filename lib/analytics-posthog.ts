// PostHog analytics adapter - wraps posthog-js

import { initPostHog, identifyUser, bindWorkspace as bindPostHogGroup, resetAnalytics, captureProjectCreated, captureTaskCompleted } from './posthog-client'

export class PostHogAnalytics {
  init(): boolean {
    return initPostHog()
  }

  identify(userId: string): void {
    identifyUser(userId)
  }

  group(groupType: string, groupId: string, properties?: Record<string, unknown>): void {
    bindPostHogGroup(groupId, properties)
  }

  reset(): void {
    resetAnalytics()
  }

  captureProjectCreated(workspaceId: string, projectId: string, templateId?: string, properties?: Record<string, unknown>): void {
    captureProjectCreated(workspaceId, projectId, templateId, properties)
  }

  captureTaskCompleted(workspaceId: string, taskId: string, projectId: string, properties?: Record<string, unknown>): void {
    captureTaskCompleted(workspaceId, taskId, projectId, properties)
  }
}

