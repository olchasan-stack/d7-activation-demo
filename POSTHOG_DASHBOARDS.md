# PostHog Dashboard Setup Guide

## Overview

This demo uses PostHog Group Analytics to track D7 Activation at the **workspace level**. All events are aggregated by unique workspaces, not users.

---

## Prerequisites

✅ PostHog EU project configured  
✅ Group Analytics enabled for "workspace" type  
✅ Events include `$groups.workspace` property  
✅ `NEXT_PUBLIC_ANALYTICS_PROVIDER=posthog` set in Vercel

---

## Dashboard 1: D7 Activation Funnel

**Purpose:** Track workspace progression through activation milestones

**Setup:**
1. Go to **Insights** → **Funnels** → **New**
2. Add steps:
   - `workspace_created`
   - `project_created`
   - `task_completed`
   - `invite_sent`
3. Set steps 2-4 to **"Optional"**
4. **Critical:** Set **Aggregating by** to: **`properties.workspace_id`**
5. Save as: **"D7 Activation Funnel"**

**Expected Result:**
- Shows conversion rate at each step
- Example: "63.64% of workspaces created projects"

---

## Dashboard 2: Risk per 100 (Guardrail)

**Purpose:** Identify workspaces that created projects but didn't complete tasks

**Setup:**
1. Go to **Insights** → **Trends** → **New**
2. **Series A:**
   - Event: `task_completed`
   - Aggregation: `properties.workspace_id`
3. **Series B:**
   - Event: `project_created`
   - Aggregation: `properties.workspace_id`
4. **Formula:** `(B - A) / max(B, 1) * 100`
5. **Date Range:** Last 7 days (rolling)
6. Save as: **"Risk per 100 (7d)"**

**Expected Result:**
- 0% = All workspaces completed tasks
- 100% = No workspaces completed tasks

---

## Dashboard 3: Retention

**Purpose:** Measure workspace stickiness (weekly cohorts)

**Setup:**
1. Go to **Insights** → **Retention** → **New**
2. **Target Event:** `workspace_created`
3. **Returning Event:** `project_created` (or `task_completed`)
4. **Aggregate by:** `properties.workspace_id`
5. **Period:** Weekly
6. **Cohorts:** Last 4 weeks
7. Save as: **"D7 Retention (Workspace)"**

**Expected Result:**
- Shows % of workspaces that returned each week
- Helps identify cohorts with low activation

---

## Troubleshooting

### "Unique workspaces" returns 0 results

**Problem:** PostHog default aggregation is "Unique users"

**Fix:** Use **Custom SQL expression** with `properties.workspace_id`

---

### Group properties missing

**Problem:** `$groups.workspace` not in events

**Check:**
1. Browser console: `analytics.group('workspace', id)` called?
2. Vercel logs: "Group identify response: 200"?
3. Live Events: Event has `$groups` property?

**Fix:**
1. Verify `NEXT_PUBLIC_ANALYTICS_PROVIDER=posthog` in Vercel
2. Redeploy if recently changed
3. Test with new workspace creation

---

### Formula errors in Risk Dashboard

**Problem:** "Invalid formula syntax"

**Fix:** Use exact formula: `(B - A) / max(B, 1) * 100`

---

## Next Steps

1. Add dashboards to a shared **Project Dashboard**
2. Set up **alerts** for risk metric > 20%
3. Create **cohorts** for activated vs non-activated workspaces
4. Run **Feature Flags** experiments on low-retention cohorts

---

**Questions?** Check PostHog docs: https://posthog.com/docs/product-analytics/group-analytics

