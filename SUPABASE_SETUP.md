# Supabase Setup Guide for D7 Demo

## Overview

This guide will help you connect your Supabase database to PostHog for event ingestion.

**Your Project ID:** `gnuvhydnjwvuhkceihov`  
**Project Name:** Diagnostic Lite  
**Region:** eu-north-1

---

## Step 1: Get Supabase Credentials

### A) Project URL & Service Role Key

1. Visit: https://supabase.com/dashboard/project/gnuvhydnjwvuhkceihov
2. Go to **Settings** → **API**
3. Copy these values:

   ```
   Project URL: https://gnuvhydnjwvuhkceihov.supabase.co
   Service Role Key: eyJ... (long JWT token)
   ```

### B) Database Connection String

1. Go to **Settings** → **Database**
2. Find "Connection string" → select **URI** tab
3. Copy the connection string that looks like:

   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-eu-north-1.pooler.supabase.com:6543/postgres
   ```

   **Important:** You'll need to replace `[YOUR-PASSWORD]` with your actual database password.

---

## Step 2: Create Database Schema

1. In Supabase, go to **SQL Editor** → click **New Query**
2. Copy and paste this SQL:

```sql
-- Create events table
create table if not exists public.events (
  id bigserial primary key,
  event_name text not null,
  distinct_id text,
  user_id uuid,
  workspace_id text,
  ts timestamptz not null default now(),
  properties jsonb not null default '{}'::jsonb,
  groups jsonb not null default '{}'::jsonb
);

-- Create indexes for performance
create index if not exists idx_events_ws_ts on public.events (workspace_id, ts);
create index if not exists idx_events_name_ts on public.events (event_name, ts);
create index if not exists idx_events_props_gin on public.events using gin (properties);
create index if not exists idx_events_groups_gin on public.events using gin (groups);
```

3. Click **Run** (or press Ctrl/Cmd + Enter)

You should see: "Success. No rows returned"

---

## Step 3: Configure PostHog → Postgres Destination

1. In PostHog, go to **Settings** → **Destinations** → **Add Destination**
2. Choose **Postgres Database**
3. Enter the connection string from Step 1B
4. **Field Mapping:**
   - `event_name` ← `event`
   - `distinct_id` ← `distinct_id`
   - `user_id` ← `properties.user_id` (optional)
   - `workspace_id` ← `properties.workspace_id`
   - `properties` ← `properties` (whole object)
   - `groups` ← `groups` (whole object)
   - `ts` ← `timestamp`
5. Click **Save**

PostHog will start sending events to your Supabase database!

---

## Step 4: Test the Connection

### A) Generate Some Events

1. Go to your demo: https://nextjsposthogsupabasescaffold.vercel.app
2. Complete the onboarding flow (creates 6 events)
3. Wait ~30 seconds for PostHog to sync

### B) Query Supabase

In Supabase SQL Editor, run:

```sql
SELECT 
  event_name,
  distinct_id,
  workspace_id,
  ts,
  properties
FROM public.events
ORDER BY ts DESC
LIMIT 10;
```

You should see your events!

### C) Run D7 Metrics Query

Copy the query from `sql/d7_metrics.sql` into the SQL Editor:

```sql
-- This calculates your D7 activation rate
WITH seeds AS (
  SELECT workspace_id, MIN(ts) AS first_ts
  FROM public.events
  WHERE event_name = 'workspace_created'
  GROUP BY workspace_id
),
windowed AS (
  SELECT
    s.workspace_id,
    date_trunc('week', s.first_ts) AS cohort_week,
    e.event_name,
    e.properties,
    e.ts
  FROM seeds s
  JOIN public.events e
    ON e.workspace_id = s.workspace_id
   AND e.ts <= s.first_ts + interval '7 days'
),
activated AS (
  SELECT workspace_id, cohort_week
  FROM windowed
  GROUP BY workspace_id, cohort_week
  HAVING
    count(*) FILTER (WHERE event_name = 'project_created') >= 1
    AND count(DISTINCT (properties->>'task_id')) FILTER (WHERE event_name = 'task_completed') >= 3
),
cohort AS (
  SELECT cohort_week, count(*) AS new_workspaces
  FROM (
    SELECT workspace_id, date_trunc('week', MIN(ts)) AS cohort_week
    FROM public.events
    WHERE event_name = 'workspace_created'
    GROUP BY workspace_id
  ) x
  GROUP BY cohort_week
),
act AS (
  SELECT cohort_week, count(*) AS activated_ws
  FROM activated
  GROUP BY cohort_week
)
SELECT
  c.cohort_week,
  c.new_workspaces,
  COALESCE(a.activated_ws, 0) AS activated_workspaces,
  ROUND(100.0 * COALESCE(a.activated_ws, 0) / NULLIF(c.new_workspaces, 0), 2) AS d7_activation_pct
FROM cohort c
LEFT JOIN act a USING (cohort_week)
ORDER BY c.cohort_week DESC;
```

---

## Step 5: Update Environment Variables (Optional)

If you want to query Supabase from your Next.js app, add these to `.env.local`:

```
SUPABASE_URL=https://gnuvhydnjwvuhkceihov.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... (your service role key)
```

---

## Troubleshooting

### "Events not appearing in Supabase"

- **Check PostHog:** Settings → Destinations → Verify destination is "Active"
- **Check connection:** PostHog may show sync errors
- **Wait a bit:** Events sync in batches, can take 30-60 seconds

### "Permission denied"

- Make sure you're using the **Service Role Key** for API access
- The `public.events` table should be in the `public` schema

### "Connection timeout"

- Verify your database password in the connection string
- Check that your Supabase project is not paused (free tier pauses after inactivity)
- Try using the "Transaction" mode in PostHog destination instead of "Query"

---

## What You Get

✅ **All PostHog events** stored in your Supabase database  
✅ **Custom SQL queries** for deeper analysis  
✅ **No data lock-in** - you own your data  
✅ **Historical D7 metrics** for any time period  
✅ **Join with other data** in your Supabase database  

---

## Next Steps

- Build custom dashboards in Supabase Studio
- Connect to BI tools (Metabase, Tableau, etc.)
- Schedule automated D7 reports
- Combine with customer/user data for richer insights

Happy querying! 📊

