// PostHog analytics adapter - wraps posthog-js

import { initPostHog, identifyUser, bindWorkspace as bindPostHogGroup, resetAnalytics, captureProjectCreated, captureTaskCompleted } from './posthog-client'

export class PostHogAnalytics {
  init(): boolean {
    return initPostHog()
  }

  identify(userId: string): void {
    identifyUser(userId)
  }

  group(groupType: string, groupId: string): void {
    bindPostHogGroup(groupId)
  }

  reset(): void {
    resetAnalytics()
  }

  captureProjectCreated(workspaceId: string, projectId: string, templateId?: string): void {
    captureProjectCreated(workspaceId, projectId, templateId)
  }

  captureTaskCompleted(workspaceId: string, taskId: string, projectId: string): void {
    captureTaskCompleted(workspaceId, taskId, projectId)
  }
}

