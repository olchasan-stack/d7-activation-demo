"use client"

import { useState } from "react"
import { captureProjectCreated, captureTaskCompleted } from "@/lib/posthog-client"

type StepStatus = "idle" | "success"

export default function OnboardingStepper() {
  const [step1Status, setStep1Status] = useState<StepStatus>("idle")
  const [step2Status, setStep2Status] = useState<StepStatus>("idle")
  const [inviteSentStatus, setInviteSentStatus] = useState<StepStatus>("idle")
  const [inviteAcceptedStatus, setInviteAcceptedStatus] = useState<StepStatus>("idle")

  const handleCreateProject = async () => {
    await captureProjectCreated("ws_2001", "pr_3001")
    setStep1Status("success")
  }

  const handleCompleteTask = async () => {
    await captureTaskCompleted("ws_2001", "t_4001", "pr_3001")
    setStep2Status("success")
  }

  const handleInviteSent = async () => {
    const response = await fetch("/api/track/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        event: "invite_sent", 
        distinctId: "u_1001", 
        workspaceId: "ws_2001" 
      }),
    })
    if (response.ok) {
      setInviteSentStatus("success")
    }
  }

  const handleInviteAccepted = async () => {
    const response = await fetch("/api/track/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        event: "invite_accepted", 
        distinctId: "u_1001", 
        workspaceId: "ws_2001" 
      }),
    })
    if (response.ok) {
      setInviteAcceptedStatus("success")
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Onboarding Steps</h1>

      <div className="space-y-6">
        {/* Step 1: Create Project */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Step 1: Create Project</h2>
              <p className="mt-1 text-sm text-gray-600">Initialize your first project</p>
            </div>
            {step1Status === "success" && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                ✓ Completed
              </span>
            )}
          </div>
          <button
            onClick={handleCreateProject}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Project
          </button>
        </div>

        {/* Step 2: Complete Task */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Step 2: Complete Task</h2>
              <p className="mt-1 text-sm text-gray-600">
                Mark your first task as done (can be clicked multiple times)
              </p>
            </div>
            {step2Status === "success" && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                ✓ Completed
              </span>
            )}
          </div>
          <button
            onClick={handleCompleteTask}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Complete Task
          </button>
        </div>

        {/* Step 3: Invite Teammate */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Step 3: Invite Teammate</h2>
            <p className="mt-1 text-sm text-gray-600">Send and accept team invitations</p>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col gap-2">
              <button
                onClick={handleInviteSent}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Send Invite
              </button>
              {inviteSentStatus === "success" && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-center text-xs font-medium text-green-800">
                  ✓ Invite Sent
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleInviteAccepted}
                className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                Accept Invite
              </button>
              {inviteAcceptedStatus === "success" && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-center text-xs font-medium text-green-800">
                  ✓ Invite Accepted
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
