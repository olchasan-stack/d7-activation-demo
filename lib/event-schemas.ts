import { z } from 'zod'

// Property schemas for validation (what we send to posthog.capture)
export const ProjectCreatedProperties = z.object({
  workspace_id: z.string(),
  project_id: z.string(),
  template_id: z.string().optional(),
}).passthrough() // Allow additional properties

export const TaskCompletedProperties = z.object({
  workspace_id: z.string(),
  task_id: z.string(),
  project_id: z.string(),
}).passthrough() // Allow additional properties

export const WorkspaceCreatedProperties = z.object({
  workspace_id: z.string(),
  workspace_name: z.string(),
}).passthrough() // Allow additional properties

export const InviteEventProperties = z.object({
  workspace_id: z.string(),
}).passthrough() // Allow additional properties

// Full event schemas for complete validation (what PostHog receives)
const BaseEvent = z.object({
  timestamp: z.string().optional(), // ISO UTC, PostHog adds this automatically
  distinct_id: z.string(),
})

// Workspace Created Event
export const WorkspaceCreatedEvent = BaseEvent.extend({
  event: z.literal('workspace_created'),
  properties: z.object({
    workspace_id: z.string(),
    workspace_name: z.string(),
  }),
  groups: z.object({
    workspace: z.string(),
  }),
})

// Project Created Event
export const ProjectCreatedEvent = BaseEvent.extend({
  event: z.literal('project_created'),
  properties: z.object({
    workspace_id: z.string(),
    project_id: z.string(),
    template_id: z.string().optional(),
  }),
  groups: z.object({
    workspace: z.string(),
  }),
})

// Task Completed Event
export const TaskCompletedEvent = BaseEvent.extend({
  event: z.literal('task_completed'),
  properties: z.object({
    workspace_id: z.string(),
    task_id: z.string(),
    project_id: z.string(),
  }),
  groups: z.object({
    workspace: z.string(),
  }),
})

// Invite Sent Event
export const InviteSentEvent = BaseEvent.extend({
  event: z.literal('invite_sent'),
  properties: z.object({
    workspace_id: z.string(),
  }),
  groups: z.object({
    workspace: z.string(),
  }),
})

// Invite Accepted Event
export const InviteAcceptedEvent = BaseEvent.extend({
  event: z.literal('invite_accepted'),
  properties: z.object({
    workspace_id: z.string(),
  }),
  groups: z.object({
    workspace: z.string(),
  }),
})

// Union of all event types
export const Event = z.discriminatedUnion('event', [
  WorkspaceCreatedEvent,
  ProjectCreatedEvent,
  TaskCompletedEvent,
  InviteSentEvent,
  InviteAcceptedEvent,
])

// Type inference
export type Event = z.infer<typeof Event>
export type WorkspaceCreated = z.infer<typeof WorkspaceCreatedEvent>
export type ProjectCreated = z.infer<typeof ProjectCreatedEvent>
export type TaskCompleted = z.infer<typeof TaskCompletedEvent>
export type InviteSent = z.infer<typeof InviteSentEvent>
export type InviteAccepted = z.infer<typeof InviteAcceptedEvent>

