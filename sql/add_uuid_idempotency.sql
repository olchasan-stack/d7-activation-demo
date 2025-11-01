-- Add UUID-based idempotency support for events
-- This prevents duplicate events when processing PostHog Destination syncs or webhook replays

-- Add unique index on event_uuid in properties JSONB
-- This will automatically skip duplicate events with the same UUID
create unique index if not exists idx_events_d7_uuid_unique 
on public.events_d7 ((properties->>'event_uuid')) 
where properties->>'event_uuid' is not null;

-- Same for the base events table
create unique index if not exists idx_events_uuid_unique 
on public.events ((properties->>'event_uuid')) 
where properties->>'event_uuid' is not null;

-- Optional: Function to safely insert with idempotency check
-- This can be used as an alternative to relying on unique index
create or replace function public.insert_event_safe(
  p_event_name text,
  p_distinct_id text,
  p_workspace_id text,
  p_properties jsonb,
  p_groups jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
as $$
declare
  v_event_id bigint;
  v_event_uuid text;
begin
  v_event_uuid := p_properties->>'event_uuid';
  
  -- If UUID provided, check for existing event
  if v_event_uuid is not null then
    select id into v_event_id
    from public.events_d7
    where properties->>'event_uuid' = v_event_uuid
    limit 1;
    
    -- If event exists, return existing ID
    if v_event_id is not null then
      return v_event_id;
    end if;
  end if;
  
  -- Insert new event
  insert into public.events_d7 (event_name, distinct_id, workspace_id, properties, groups)
  values (p_event_name, p_distinct_id, p_workspace_id, p_properties, p_groups)
  returning id into v_event_id;
  
  return v_event_id;
end;
$$;

