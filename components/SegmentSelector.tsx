"use client"

import { SegmentSelection, segmentOptionLabels } from "@/lib/segments"

const plans: SegmentSelection['plan'][] = ['free', 'pro']
const regions: SegmentSelection['region'][] = ['eu', 'us']
const channels: SegmentSelection['channel'][] = ['self_serve', 'sales']
const variants: SegmentSelection['variant'][] = ['control', 'treatment']

interface SegmentSelectorProps {
  segment: SegmentSelection
  onChange: (segment: SegmentSelection) => void
}

export default function SegmentSelector({ segment, onChange }: SegmentSelectorProps) {
  const updateSegment = <K extends keyof SegmentSelection>(key: K, value: SegmentSelection[K]) => {
    onChange({ ...segment, [key]: value })
  }

  return (
    <div className="bg-white border border-indigo-100 rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Segment & Variant (Demo Only)</h3>
        <span className="text-xs font-medium uppercase tracking-wide text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
          Demo Controls
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Choose a persona segment and experiment variant. All demo events will automatically include these properties so you can show segment-aware guardrails and feature flagging in PostHog and the CPO cockpit.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectorGroup
          label="Plan"
          options={plans}
          currentValue={segment.plan}
          onChange={(value) => updateSegment('plan', value)}
          getLabel={(option) => segmentOptionLabels.plan[option]}
        />
        <SelectorGroup
          label="Region"
          options={regions}
          currentValue={segment.region}
          onChange={(value) => updateSegment('region', value)}
          getLabel={(option) => segmentOptionLabels.region[option]}
        />
        <SelectorGroup
          label="Channel"
          options={channels}
          currentValue={segment.channel}
          onChange={(value) => updateSegment('channel', value)}
          getLabel={(option) => segmentOptionLabels.channel[option]}
        />
        <SelectorGroup
          label="Experiment Variant"
          options={variants}
          currentValue={segment.variant}
          onChange={(value) => updateSegment('variant', value)}
          getLabel={(option) => segmentOptionLabels.variant[option]}
        />
      </div>
    </div>
  )
}

interface SelectorGroupProps<T extends string> {
  label: string
  options: readonly T[]
  currentValue: T
  onChange: (value: T) => void
  getLabel: (value: T) => string
}

function SelectorGroup<T extends string>({ label, options, currentValue, onChange, getLabel }: SelectorGroupProps<T>) {
  const fieldName = `segment-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <fieldset>
      <legend className="text-sm font-medium text-gray-700 mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option}
            className={`inline-flex items-center justify-center px-3 py-1.5 border rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              currentValue === option
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 text-gray-600 hover:border-indigo-200 hover:text-indigo-600'
            }`}
          >
            <input
              type="radio"
              name={fieldName}
              value={option}
              checked={currentValue === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            {getLabel(option)}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

