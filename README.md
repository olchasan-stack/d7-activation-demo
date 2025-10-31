# D7 Activation Demo — Next.js (App Router) + PostHog + Supabase

This scaffold lets you **play through** D7 Activation with a minimal Next.js app,
using PostHog (groups on `workspace`) and an optional Supabase ingestion path.

> Works great with Cursor. You can paste files into a fresh `create-next-app` project.

---
## 1) Quickstart

### Create project
```bash
npx create-next-app@latest d7-demo --ts --eslint
cd d7-demo
npm i posthog-js posthog-node
```

### Add the files from this scaffold
Copy the `app`, `components`, `lib`, and `app/api` directories into your project.
Also copy `env.example` → `.env.local` and set your keys.

### Environment
`.env.local`
```
NEXT_PUBLIC_POSTHOG_KEY=phc_XXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
POSTHOG_SERVER_KEY=phc_XXXXXXXXXXXXXXXXXXXX
POSTHOG_HOST=https://eu.i.posthog.com

# Optional if you use the Supabase Edge Function webhook route
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```
> Use EU host if your project is in the EU.

### Run
```bash
npm run dev
```
Open: http://localhost:3000/

---
## 2) What you get in the demo

- **Client analytics**: identify user and bind `workspace` group via `AnalyticsProvider`.
- **Minimal events**: `project_created`, `task_completed` sent from client helpers.
- **Server events** (API routes): `invite_sent`, `invite_accepted` captured with `posthog-node` and `groups`.
- **Interactive D7 Dashboard**: Real-time workspace activation metrics at `/dashboard`.
- **D7 SQL** and **Supabase schema** (see `/sql`): compute D7 on your own DB.

> You can replace the UI with v0.app generated components and just call the helpers.

---
## 3) Files

- `components/AnalyticsProvider.tsx` – Client-only init of PostHog, + expose helpers.
- `lib/posthog-client.ts` – posthog-js binding (identify, group, capture).
- `lib/posthog-server.ts` – posthog-node client for API routes.
- `lib/workspace-stats.ts` – In-memory workspace statistics tracking.
- `app/page.tsx` – **Simple onboarding flow** - intuitive step-by-step guide.
- `components/OnboardingStepper.tsx` – **Interactive stepper** with progress tracking and visual feedback.
- `app/dashboard/page.tsx` – **D7 Activation Dashboard** with real-time metrics.
- `app/api/workspace/route.ts` – Create workspace and track workspace_created event.
- `app/api/track/invite/route.ts` – server capture example for invite events.
- `app/api/track/project/route.ts` – Track project_created events.
- `app/api/track/task/route.ts` – Track task_completed events.
- `app/api/dashboard/stats/route.ts` – Dashboard statistics API endpoint.
- `sql/supabase_schema.sql` – events table + indexes.
- `sql/d7_metrics.sql` – weekly D7 calculation.

---
## 4) Supabase ingestion (two options)

**A) PostHog → Postgres Destination** (recommended to start)
- In PostHog, add **Destination: Postgres** and point it at your Supabase DB (use a dedicated DB user).
- Map event payload into `public.events` (columns: name, distinct_id, user_id, workspace_id, timestamp, properties JSON, groups JSON).

**B) Webhook → Supabase Edge Function**
- Send PostHog events to `supabase_edge_posthog_webhook` (see D7 Starter Kit you already downloaded).
- The Edge Function writes rows into `public.events`.

Once data lands in `public.events`, run `sql/d7_metrics.sql` to compute D7.

---
## 5) QA Checklist (15 minutes)

- [ ] After login, PostHog shows a **Group: workspace** with your ID.
- [ ] Client events include `workspace_id` and appear under the workspace group.
- [ ] Server events (invite) include `groups: { workspace }`.
- [ ] Timezone/clock sane (UTC preferred).
- [ ] SQL returns plausible D7 for a known test cohort.

Happy shipping.
