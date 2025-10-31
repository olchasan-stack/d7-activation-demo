"use client"

import { useState } from "react"
import { captureProjectCreated, captureTaskCompleted } from "@/lib/posthog-client"

type StepStatus = "idle" | "success"

export default function OnboardingStepper({ 
  userId = "u_1001", 
  workspaceId: initialWorkspaceId = "ws_2001",
  onWorkspaceCreated
}: { 
  userId?: string
  workspaceId?: string
  onWorkspaceCreated?: (workspaceId: string) => void
}) {
  const [workspaceId, setWorkspaceId] = useState(initialWorkspaceId)
  const [workspaceName, setWorkspaceName] = useState("My Workspace")
  const [workspaceStatus, setWorkspaceStatus] = useState<StepStatus>("idle")
  const [step1Status, setStep1Status] = useState<StepStatus>("idle")
  const [step2Status, setStep2Status] = useState<StepStatus>("idle")
  const [inviteSentStatus, setInviteSentStatus] = useState<StepStatus>("idle")
  const [inviteAcceptedStatus, setInviteAcceptedStatus] = useState<StepStatus>("idle")

  const handleCreateWorkspace = async () => {
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: workspaceName, 
          userId: userId,
          properties: { plan: 'free', seat_count: 2 }
        }),
      })
      const result = await response.json()
      if (response.ok) {
        console.log('Workspace created:', result)
        setWorkspaceId(result.workspaceId)
        if (onWorkspaceCreated) {
          onWorkspaceCreated(result.workspaceId)
        }
        setWorkspaceStatus("success")
      } else {
        console.error('Failed to create workspace:', result)
      }
    } catch (error) {
      console.error('Error creating workspace:', error)
    }
  }

  const handleCreateProject = async () => {
    await captureProjectCreated(workspaceId, "pr_3001")
    // Update dashboard stats
    await fetch("/api/track/project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    })
    setStep1Status("success")
  }

  const handleCompleteTask = async () => {
    await captureTaskCompleted(workspaceId, "t_4001", "pr_3001")
    // Update dashboard stats
    await fetch("/api/track/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    })
    setStep2Status("success")
  }

  const handleInviteSent = async () => {
    const response = await fetch("/api/track/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        event: "invite_sent", 
        distinctId: userId, 
        workspaceId 
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
        distinctId: userId, 
        workspaceId 
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
        {/* Step 0: Create Workspace */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex-1 mr-4">
              <h2 className="text-xl font-semibold text-gray-900">Step 0: Create Your Workspace</h2>
              <p className="mt-1 text-sm text-gray-600">Set up your workspace to get started</p>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Workspace Name</label>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Workspace"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                  <input
                    type="text"
                    value={userId}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>
            {workspaceStatus === "success" && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                ✓ Created
              </span>
            )}
          </div>
          <button
            onClick={handleCreateWorkspace}
            disabled={workspaceStatus === "success"}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
              workspaceStatus === "success"
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {workspaceStatus === "success" ? "Workspace Created" : "Create Workspace"}
          </button>
        </div>

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
