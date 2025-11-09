"use client"

import { SegmentSelection, describeSegment, segmentOptionLabels } from "@/lib/segments"

interface SegmentStatusCardProps {
  segment: SegmentSelection
}

const guardrailCopy = [
  {
    title: "D7 Activation Rate",
    description: "Primary OMTM for the workspace cohort. Evaluated via PDR Copilot quality checks."
  },
  {
    title: "Risk per 100",
    description: "Guardrail for stalled onboarding. Watch especially for Sales-led cohorts."
  },
  {
    title: "AI Eval Coverage",
    description: "Every PDR/SQL/Anomaly response is scored via Langfuse traces so you can evidence decisions."
  }
]

export default function SegmentStatusCard({ segment }: SegmentStatusCardProps) {
  return (
    <div className="bg-gradient-to-r from-indigo-50 via-white to-blue-50 border border-indigo-100 rounded-xl shadow-sm p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
            Segment in Focus
          </p>
          <h3 className="text-2xl font-bold text-gray-900">
            {describeSegment(segment)}
          </h3>
          <p className="text-sm text-gray-600 mt-2">
            All demo events include the segment properties below, mirroring the production flow where the customer just connects PostHog and we enrich &amp; route automatically.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm text-gray-600 bg-white border border-indigo-100 rounded-lg p-3 md:w-80">
          <div>
            <dt className="font-medium text-gray-800">Plan</dt>
            <dd className="text-gray-700">{segmentOptionLabels.plan[segment.plan]}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-800">Region</dt>
            <dd className="text-gray-700">{segmentOptionLabels.region[segment.region]}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-800">Channel</dt>
            <dd className="text-gray-700">{segmentOptionLabels.channel[segment.channel]}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-800">Variant</dt>
            <dd className="text-gray-700">{segmentOptionLabels.variant[segment.variant]}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {guardrailCopy.map((item) => (
          <div key={item.title} className="bg-white border border-indigo-100 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">{item.title}</h4>
            <p className="text-xs text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

