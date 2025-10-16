create schema if not exists public;

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

create index if not exists idx_events_ws_ts on public.events (workspace_id, ts);
create index if not exists idx_events_name_ts on public.events (event_name, ts);
create index if not exists idx_events_props_gin on public.events using gin (properties);
create index if not exists idx_events_groups_gin on public.events using gin (groups);
