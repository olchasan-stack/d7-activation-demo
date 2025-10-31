# Quick Setup Checklist - PostHog → Supabase

**Your Supabase Project:** `gnuvhydnjwvuhkceihov`

## ⚡ 5-Minute Setup

### ✅ Step 1: Get Credentials (1 min)

Open: https://supabase.com/dashboard/project/gnuvhydnjwvuhkceihov/settings/api

Copy:
- [ ] Project URL: `https://gnuvhydnjwvuhkceihov.supabase.co`
- [ ] Service Role Key: `eyJ...` (the long JWT)

---

### ✅ Step 2: Run SQL Schema (2 min)

1. Go to: https://supabase.com/dashboard/project/gnuvhydnjwvuhkceihov/sql
2. Click **"New Query"**
3. Copy & paste the entire content from `sql/supabase_schema.sql`
4. Click **"Run"** (or Cmd/Ctrl + Enter)
5. Should see: "Success. No rows returned"

---

### ✅ Step 3: Configure PostHog (2 min)

1. Go to PostHog: https://eu.posthog.com
2. **Settings** → **Destinations** → **"Add Destination"**
3. Choose **"Postgres Database"**
4. Get connection string:
   - Back to Supabase → **Settings** → **Database**
   - Copy **Connection string** (URI mode)
   - Format: `postgresql://postgres.xxx:[PASSWORD]@aws-0-eu-north-1.pooler.supabase.com:6543/postgres`
5. Paste into PostHog connection string field
6. **Map fields:**
   ```
   event_name      ← event
   distinct_id     ← distinct_id
   workspace_id    ← properties.workspace_id
   properties      ← properties
   groups          ← groups
   ts              ← timestamp
   ```
7. Click **"Save"**

---

### ✅ Step 4: Test (1 min)

1. Trigger events: https://nextjsposthogsupabasescaffold.vercel.app
2. Wait 30 seconds
3. In Supabase SQL Editor, run:
   ```sql
   SELECT * FROM public.events ORDER BY ts DESC LIMIT 5;
   ```
4. ✅ Should see your events!

---

## 🎉 Done!

Your PostHog events are now flowing into Supabase!

**Next:** Run the D7 metrics query from `sql/d7_metrics.sql` to see activation rates.

---

## 🔍 Troubleshooting

| Issue | Fix |
|-------|-----|
| No events in Supabase | Check PostHog destination is "Active" |
| Connection error | Verify password in connection string |
| Permission denied | Use Service Role Key (not anon key) |

**Need help?** See `SUPABASE_SETUP.md` for detailed instructions.

