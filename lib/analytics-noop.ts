// Noop analytics adapter - does nothing (useful for tests, GDPR opt-out, etc.)

export class NoopAnalytics {
  init(): boolean {
    return false
  }

  identify(_userId: string): void {
    // No-op
  }

  group(_groupType: string, _groupId: string): void {
    // No-op
  }

  reset(): void {
    // No-op
  }

  captureProjectCreated(_workspaceId: string, _projectId: string, _templateId?: string): void {
    // No-op
  }

  captureTaskCompleted(_workspaceId: string, _taskId: string, _projectId: string): void {
    // No-op
  }
}

