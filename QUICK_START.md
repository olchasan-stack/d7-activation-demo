# 🚀 Quick Start Guide

## For Non-Technical Users (PM, Executives, Designers)

**Open:** http://localhost:3000

### What You'll See
1. **A simple info box** explaining D7 Activation
2. **4 clear steps** to activate your workspace
3. **Big, friendly buttons** with progress tracking
4. **Live dashboard** showing your activation rate

### Try It Now (2 minutes)

1. **Enter a workspace name** (e.g., "Acme Corp")
2. **Click "Create Workspace"** ✅
3. **Click "Create Project"** ✅
4. **Click "Complete Task" 3 times** ✅
5. **Click "Send Invite"** ✅
6. **Click "View Dashboard"** to see your activation rate! 📊

### What Happens Behind the Scenes

All actions are automatically tracked in PostHog:
- Workspace creation
- Project creation  
- Task completion (counted!)
- Invite sending
- Dashboard updates every 5 seconds

### Need to Test Multiple Users?

Use the "Developer Controls" at the bottom to change the User ID.

---

## For Developers

### Architecture

- **Client-side**: PostHog JS tracks user actions
- **Server-side**: API routes send events with `groups: { workspace }`
- **Dashboard**: Live stats refresh every 5 seconds
- **Storage**: In-memory (production would use PostHog Query API)

### Key Files

- `components/OnboardingStepper.tsx` - Main UI flow
- `lib/posthog-client.ts` - Client tracking
- `app/api/*/route.ts` - Server tracking
- `app/dashboard/page.tsx` - Metrics display

### D7 Definition

A workspace is "activated" if within 7 days of creation:
- ≥1 project created
- ≥3 tasks completed

### Customization

Want to add more events? Just follow the pattern in `app/api/track/project/route.ts`:

```typescript
// 1. Track in PostHog
await captureProjectCreated(workspaceId, projectId)

// 2. Update dashboard stats  
await fetch("/api/track/project", {
  method: "POST",
  body: JSON.stringify({ workspaceId }),
})
```

Done! 🎉

