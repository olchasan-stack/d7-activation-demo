-- Create events_d7 table for D7 Activation Demo
-- This table stores PostHog events with workspace groups

create table if not exists public.events_d7 (
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
create index if not exists idx_events_d7_ws_ts on public.events_d7 (workspace_id, ts);
create index if not exists idx_events_d7_name_ts on public.events_d7 (event_name, ts);
create index if not exists idx_events_d7_props_gin on public.events_d7 using gin (properties);
create index if not exists idx_events_d7_groups_gin on public.events_d7 using gin (groups);
