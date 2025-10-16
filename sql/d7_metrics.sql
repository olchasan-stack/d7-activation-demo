with seeds as (
  select workspace_id, min(ts) as first_ts
  from public.events
  where event_name = 'workspace_created'
  group by workspace_id
),
windowed as (
  select
    s.workspace_id,
    date_trunc('week', s.first_ts) as cohort_week,
    e.event_name,
    e.properties,
    e.ts
  from seeds s
  join public.events e
    on e.workspace_id = s.workspace_id
   and e.ts <= s.first_ts + interval '7 days'
),
activated as (
  select workspace_id, cohort_week
  from windowed
  group by workspace_id, cohort_week
  having
    count(*) filter (where event_name = 'project_created') >= 1
    and count(distinct (properties->>'task_id')) filter (where event_name = 'task_completed') >= 3
),
cohort as (
  select cohort_week, count(*) as new_workspaces
  from (
    select workspace_id, date_trunc('week', min(ts)) as cohort_week
    from public.events
    where event_name = 'workspace_created'
    group by workspace_id
  ) x
  group by cohort_week
),
act as (
  select cohort_week, count(*) as activated_ws
  from activated
  group by cohort_week
)
select
  c.cohort_week,
  c.new_workspaces,
  coalesce(a.activated_ws, 0) as activated_workspaces,
  round(100.0 * coalesce(a.activated_ws, 0) / nullif(c.new_workspaces, 0), 2) as d7_activation_pct
from cohort c
left join act a using (cohort_week)
order by c.cohort_week desc;
