#!/usr/bin/env node

const { randomUUID } = require('crypto')

async function main() {
  const posthogHost = (process.env.POSTHOG_HOST || 'https://eu.i.posthog.com').trim()
  const posthogKey = process.env.POSTHOG_SERVER_KEY

  if (!posthogKey) {
    console.error('❌ POSTHOG_SERVER_KEY not configured. Aborting seed.')
    process.exit(1)
  }

  const plans = ['free', 'pro']
  const regions = ['eu', 'us']
  const channels = ['self_serve', 'sales']
  const variants = ['control', 'treatment']

  const combos = []
  let idx = 0
  for (const plan of plans) {
    for (const region of regions) {
      for (const channel of channels) {
        for (const variant of variants) {
          combos.push({
            index: idx++,
            plan,
            region,
            channel,
            variant
          })
        }
      }
    }
  }

  console.log(`🚀 Seeding ${combos.length} workspace combinations via PostHog API`)

  const activateUntil = Math.floor(combos.length * 0.75)

  for (const combo of combos) {
    const workspaceId = randomUUID()
    const userId = `seed_user_${combo.index}`
    const workspaceName = `Seed_${combo.plan}_${combo.region}_${combo.channel}_${combo.variant}_${combo.index}`

    const baseProperties = {
      plan: combo.plan,
      region: combo.region,
      channel: combo.channel,
      experiment_variant: combo.variant,
      seat_count: combo.plan === 'pro' ? 5 : 2,
      workspace_id: workspaceId,
      workspace_name: workspaceName
    }

    await sendGroupIdentify(posthogHost, posthogKey, userId, workspaceId, baseProperties)
    await capture(posthogHost, posthogKey, {
      distinct_id: userId,
      event: 'workspace_created',
      properties: {
        ...baseProperties,
        event_uuid: randomUUID()
      },
      groups: { workspace: workspaceId }
    })

    const shouldActivate = combo.index < activateUntil

    if (shouldActivate) {
      await capture(posthogHost, posthogKey, {
        distinct_id: userId,
        event: 'project_created',
        properties: {
          ...baseProperties,
          project_id: `pr_seed_${combo.index}`,
          event_uuid: randomUUID()
        },
        groups: { workspace: workspaceId }
      })

      for (let t = 0; t < 3; t += 1) {
        await capture(posthogHost, posthogKey, {
          distinct_id: userId,
          event: 'task_completed',
          properties: {
            ...baseProperties,
            task_id: `task_seed_${combo.index}_${t}`,
            project_id: `pr_seed_${combo.index}`,
            event_uuid: randomUUID()
          },
          groups: { workspace: workspaceId }
        })
      }

      await capture(posthogHost, posthogKey, {
        distinct_id: userId,
        event: 'invite_sent',
        properties: {
          ...baseProperties,
          event_uuid: randomUUID()
        },
        groups: { workspace: workspaceId }
      })

      await capture(posthogHost, posthogKey, {
        distinct_id: userId,
        event: 'invite_accepted',
        properties: {
          ...baseProperties,
          event_uuid: randomUUID()
        },
        groups: { workspace: workspaceId }
      })
    } else {
      // Create partial engagement for non-activated sample
      await capture(posthogHost, posthogKey, {
        distinct_id: userId,
        event: 'task_completed',
        properties: {
          ...baseProperties,
          task_id: `task_seed_${combo.index}_0`,
          project_id: `pr_seed_${combo.index}`,
          event_uuid: randomUUID()
        },
        groups: { workspace: workspaceId }
      })
    }

    await delay(150)
  }

  console.log('✅ Seed complete. Events should appear in PostHog and Supabase after sync.')
}

async function sendGroupIdentify(host, apiKey, distinctId, workspaceId, baseProperties) {
  const body = {
    api_key: apiKey,
    event: '$groupidentify',
    distinct_id: distinctId,
    properties: {
      $group_type: 'workspace',
      $group_key: workspaceId,
      name: baseProperties.workspace_name,
      plan: baseProperties.plan,
      region: baseProperties.region,
      channel: baseProperties.channel,
      experiment_variant: baseProperties.experiment_variant,
      seat_count: baseProperties.seat_count,
      created_at: new Date().toISOString()
    }
  }

  await posthogFetch(host, body)
}

async function capture(host, apiKey, payload) {
  const body = {
    api_key: apiKey,
    ...payload
  }

  await posthogFetch(host, body)
}

async function posthogFetch(host, body) {
  const response = await fetch(`${host}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('❌ PostHog API error:', response.status, text)
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

main().catch((error) => {
  console.error('❌ Seed script failed:', error)
  process.exit(1)
})


