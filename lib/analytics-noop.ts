// Noop analytics adapter - does nothing (useful for tests, GDPR opt-out, etc.)

export class NoopAnalytics {
  init(): boolean {
    return false
  }

  identify(_userId: string): void {
    // No-op
  }

  group(_groupType: string, _groupId: string, _properties?: Record<string, unknown>): void {
    // No-op
  }

  reset(): void {
    // No-op
  }

  captureProjectCreated(_workspaceId: string, _projectId: string, _templateId?: string, _properties?: Record<string, unknown>): void {
    // No-op
  }

  captureTaskCompleted(_workspaceId: string, _taskId: string, _projectId: string, _properties?: Record<string, unknown>): void {
    // No-op
  }
}

