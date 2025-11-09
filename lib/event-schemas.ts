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

// AI Event Properties
export const AIEventProperties = z.object({
  workspace_id: z.string(),
  user_id: z.string(),
  trace_id: z.string(),
}).passthrough() // Allow additional properties

// Full event schemas for complete validation (what PostHog receives)
const BaseEvent = z.object({
  timestamp: z.string().optional(), // ISO UTC, PostHog adds this automatically
  distinct_id: z.string(),
})

// Workspace Created Event
export const WorkspaceCreatedEvent = BaseEvent.extend({
  event: z.literal('workspace_created'),
  properties: WorkspaceCreatedProperties,
  groups: z.object({
    workspace: z.string(),
  }),
})

// Project Created Event
export const ProjectCreatedEvent = BaseEvent.extend({
  event: z.literal('project_created'),
  properties: ProjectCreatedProperties,
  groups: z.object({
    workspace: z.string(),
  }),
})

// Task Completed Event
export const TaskCompletedEvent = BaseEvent.extend({
  event: z.literal('task_completed'),
  properties: TaskCompletedProperties,
  groups: z.object({
    workspace: z.string(),
  }),
})

// Invite Sent Event
export const InviteSentEvent = BaseEvent.extend({
  event: z.literal('invite_sent'),
  properties: InviteEventProperties,
  groups: z.object({
    workspace: z.string(),
  }),
})

// Invite Accepted Event
export const InviteAcceptedEvent = BaseEvent.extend({
  event: z.literal('invite_accepted'),
  properties: InviteEventProperties,
  groups: z.object({
    workspace: z.string(),
  }),
})

// AI Events
export const AIRPDRDraftCreatedEvent = BaseEvent.extend({
  event: z.literal('ai_pdr_draft_created'),
  properties: AIEventProperties.extend({
    omtm_score: z.number().optional(),
    guardrail_1: z.string().optional(),
    guardrail_2: z.string().optional(),
  }),
  groups: z.object({
    workspace: z.string(),
  }),
})

export const AISQLGeneratedEvent = BaseEvent.extend({
  event: z.literal('ai_sql_generated'),
  properties: AIEventProperties.extend({
    query_type: z.enum(['d7_metrics', 'cohort_analysis', 'custom']),
    query_validated: z.boolean(),
  }),
  groups: z.object({
    workspace: z.string(),
  }),
})

export const AISuggestionShownEvent = BaseEvent.extend({
  event: z.literal('ai_suggestion_shown'),
  properties: AIEventProperties.extend({
    suggestion_type: z.enum(['copy_nudge', 'event_fix', 'anomaly_alert']),
    context: z.string(),
  }),
  groups: z.object({
    workspace: z.string(),
  }),
})

export const AISuggestionAcceptedEvent = BaseEvent.extend({
  event: z.literal('ai_suggestion_accepted'),
  properties: AIEventProperties.extend({
    suggestion_type: z.enum(['copy_nudge', 'event_fix', 'anomaly_alert']),
    accepted: z.boolean(),
  }),
  groups: z.object({
    workspace: z.string(),
  }),
})

export const AIAnomalyAlertedEvent = BaseEvent.extend({
  event: z.literal('ai_anomaly_alerted'),
  properties: AIEventProperties.extend({
    metric: z.enum(['d7_activation', 'risk_per_100', 'retention']),
    threshold: z.number(),
    actual_value: z.number(),
    suggested_action: z.string(),
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
  AIRPDRDraftCreatedEvent,
  AISQLGeneratedEvent,
  AISuggestionShownEvent,
  AISuggestionAcceptedEvent,
  AIAnomalyAlertedEvent,
])

// Type inference
export type Event = z.infer<typeof Event>
export type WorkspaceCreated = z.infer<typeof WorkspaceCreatedEvent>
export type ProjectCreated = z.infer<typeof ProjectCreatedEvent>
export type TaskCompleted = z.infer<typeof TaskCompletedEvent>
export type InviteSent = z.infer<typeof InviteSentEvent>
export type InviteAccepted = z.infer<typeof InviteAcceptedEvent>
export type AIRPDRDraftCreated = z.infer<typeof AIRPDRDraftCreatedEvent>
export type AISQLGenerated = z.infer<typeof AISQLGeneratedEvent>
export type AISuggestionShown = z.infer<typeof AISuggestionShownEvent>
export type AISuggestionAccepted = z.infer<typeof AISuggestionAcceptedEvent>
export type AIAnomalyAlerted = z.infer<typeof AIAnomalyAlertedEvent>

