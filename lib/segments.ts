export type SegmentSelection = {
  plan: 'free' | 'pro'
  region: 'eu' | 'us'
  channel: 'self_serve' | 'sales'
  variant: 'control' | 'treatment'
}

export const defaultSegmentSelection: SegmentSelection = {
  plan: 'free',
  region: 'eu',
  channel: 'self_serve',
  variant: 'control'
}

export const segmentOptionLabels: Record<keyof SegmentSelection, Record<string, string>> = {
  plan: {
    free: 'Free',
    pro: 'Pro'
  },
  region: {
    eu: 'EU',
    us: 'US'
  },
  channel: {
    self_serve: 'Self-Serve',
    sales: 'Sales'
  },
  variant: {
    control: 'Control',
    treatment: 'Treatment'
  }
}

export function toSegmentProperties(segment: SegmentSelection) {
  return {
    segment_plan: segment.plan,
    segment_region: segment.region,
    segment_channel: segment.channel,
    experiment_variant: segment.variant
  }
}

export function describeSegment(segment: SegmentSelection) {
  return [
    segmentOptionLabels.plan[segment.plan],
    segmentOptionLabels.region[segment.region],
    segmentOptionLabels.channel[segment.channel],
    `Variant: ${segmentOptionLabels.variant[segment.variant]}`
  ].join(' • ')
}

