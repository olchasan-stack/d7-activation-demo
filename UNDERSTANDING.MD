You are my implementation assistant for a small demo app that proves D7 Activation on the ACCOUNT/WORKSPACE level using PostHog Group Analytics.

## Goal (what “done” looks like)
- A Next.js (App Router, TypeScript) demo that:
  1) Identifies a user and binds all subsequent events to a **Group type = "workspace"** in PostHog.
  2) Emits a **minimal set of 6 events** to validate D7 Activation.
  3) Shows a tiny Onboarding UI (3 steps) that triggers those events.
  4) Passes a QA checklist that verifies GROUP analytics works (not just person-level).
- Optional later: mirror events to Supabase via PostHog → Postgres Destination or a webhook.

## Non-negotiables (Group Analytics correctness)
- Use PostHog **EU host** (`https://eu.posthog.com`).
- On login:
  - `posthog.identify(userId)` (person binding)
  - `posthog.group('workspace', workspaceId)` (group binding)
  - Optional: `posthog.groupIdentify('workspace', workspaceId, { plan, seat_count })`
- **Server events** MUST include `groups: { workspace: workspaceId }`.
- Ensure group binding happens **before** emitting any client events.
- Provide a clear `reset()` flow to avoid stale group state.

## Minimal event catalog (6 events)
All events must include: `distinct_id`, `workspace_id`, and a proper timestamp.
- Backend (source of truth):
  1) `user_signed_up` (props: user_id, workspace_id, plan, utm_*)
  2) `workspace_created` (props: workspace_id, creator_id, seat_count)
  3) `invite_sent` (props: workspace_id, inviter_id)
  4) `invite_accepted` (props: workspace_id, invitee_id)
- Client:
  5) `project_created` (props: workspace_id, project_id, template_id?)
  6) `task_completed` (props: workspace_id, task_id, project_id)

## D7 definition (for this demo)
A workspace is “activated” within 7 days after `workspace_created` if:
- it has **≥1** `project_created` AND **≥3** distinct `task_completed`.

## Architecture & files to create/update
- `lib/posthog-client.ts`: init PostHog, `identifyUser`, `bindWorkspace`, `resetAnalytics`, `captureProjectCreated`, `captureTaskCompleted`.
- `lib/posthog-server.ts`: PostHog Node client + `captureServerEvent(event, distinctId, workspaceId, properties)`.
- `app/page.tsx`: simple UI to:
  - set `userId`, `workspaceId`
  - buttons: Identify, Bind Workspace Group, project_created, task_completed (repeatable), Server: invite_sent, Server: invite_accepted, Reset
- `app/api/track/invite/route.ts`: POST handler that calls `captureServerEvent(...)`.
- Tailwind optional; if used, correct directives are `@tailwind base; @tailwind components; @tailwind utilities;` (no `@tailwindcss ...` at-rules).

## Environment variables (use EU project)
- `.env.local`
  - `NEXT_PUBLIC_POSTHOG_KEY=phc_...` (frontend)
  - `NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com`
  - `POSTHOG_SERVER_KEY=phx_...` (server)
  - `POSTHOG_HOST=https://eu.posthog.com`

## Onboarding UI (can be built with v0)
Create a component `OnboardingStepper` with 3 steps:
1) “Create project” → call `captureProjectCreated(workspaceId, projectId)`
2) “Complete task” → call `captureTaskCompleted(workspaceId, taskId, projectId)` (multiple clicks allowed)
3) “Invite teammate” → POST `/api/track/invite` with `{ event: 'invite_sent' }` and another button for `{ event: 'invite_accepted' }`
Show a small status pill after each step fires.

## QA checklist (must pass)
- After clicking **Identify** and **Bind Workspace Group**, I can see a **Group: workspace** in PostHog (Data → Groups).
- Live events appear in PostHog and contain `workspace_id`; server events show `$groups.workspace` (or `groups.workspace`) in payload.
- If I click **Reset**, subsequent client events are not attached to the previous workspace until I bind again.
- No unknownAtRules errors (if Tailwind is used).
- Node >= 18.17; no unresolved imports (path alias `@/*` works).

## D7 SQL (for later)
Prepare a `sql/d7_metrics.sql` that computes D7 by weekly cohort using events landed in `public.events` (we will wire up Supabase later).

## Task
1) Confirm the above understanding in a short summary (max 6 lines).
2) Generate/modify the files listed under “Architecture & files”.
3) Provide a short “Run of Show” (steps I click in the UI + where to look in PostHog to verify).
4) List 3 common failure modes and how to diagnose them (keys/host wrong, group not bound before events, ad-blockers).

IMPORTANT: Keep the implementation minimal and production-sane. Prefer clear function names, small components, and no extraneous libraries.