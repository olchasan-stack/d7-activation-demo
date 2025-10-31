"use client"

import { useState } from "react"
import { captureProjectCreated, captureTaskCompleted, bindWorkspace } from "@/lib/posthog-client"

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
  const [taskCount, setTaskCount] = useState(0)

  const handleCreateWorkspace = async () => {
    try {
      console.log('Creating workspace with name:', workspaceName, 'for user:', userId)
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
        console.log('✅ Workspace created successfully:', result)
        setWorkspaceId(result.workspaceId)
        // Bind workspace to PostHog client side
        bindWorkspace(result.workspaceId)
        if (onWorkspaceCreated) {
          onWorkspaceCreated(result.workspaceId)
        }
        setWorkspaceStatus("success")
      } else {
        console.error('❌ Failed to create workspace:', result)
      }
    } catch (error) {
      console.error('❌ Error creating workspace:', error)
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
    await captureTaskCompleted(workspaceId, `t_${Date.now()}`, "pr_3001")
    // Update dashboard stats
    await fetch("/api/track/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    })
    setStep2Status("success")
    setTaskCount(prev => prev + 1)
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

  const allStepsComplete = workspaceStatus === "success" && step1Status === "success" && taskCount >= 3 && inviteSentStatus === "success" && inviteAcceptedStatus === "success"

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🚀 Get Started in 4 Steps</h1>
        <p className="text-lg text-gray-600">Track your D7 activation rate in PostHog</p>
      </div>

      <div className="space-y-4">
        {/* Step 0: Create Workspace */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          workspaceStatus === "success" ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"
        }`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {workspaceStatus === "success" ? (
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                  ✓
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  1
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Your Workspace</h3>
              {workspaceStatus === "success" ? (
                <div className="space-y-2">
                  <p className="text-green-700 font-medium">✓ Workspace "{workspaceName}" created successfully!</p>
                  <p className="text-sm text-gray-600">Your workspace is now being tracked in PostHog</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name your workspace</label>
                    <input
                      type="text"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="My Awesome Workspace"
                    />
                  </div>
                  <button
                    onClick={handleCreateWorkspace}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    Create Workspace →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 1: Create Project */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          step1Status === "success" ? "border-green-500 bg-green-50" : workspaceStatus === "success" ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50"
        }`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {step1Status === "success" ? (
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                  ✓
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                  2
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Your First Project</h3>
              {step1Status === "success" ? (
                <p className="text-green-700 font-medium">✓ Project created!</p>
              ) : workspaceStatus === "success" ? (
                <div>
                  <p className="text-gray-600 mb-3">Click the button to create your first project</p>
                  <button
                    onClick={handleCreateProject}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    Create Project →
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 italic">Complete step 1 first</p>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Complete Tasks */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          taskCount >= 3 ? "border-green-500 bg-green-50" : step1Status === "success" ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50"
        }`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {taskCount >= 3 ? (
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                  ✓
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                  3
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Complete 3 Tasks</h3>
              {taskCount >= 3 ? (
                <p className="text-green-700 font-medium">✓ {taskCount} tasks completed!</p>
              ) : step1Status === "success" ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${(taskCount / 3) * 100}%` }}></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{taskCount}/3</span>
                  </div>
                  <p className="text-gray-600 mb-3">Click the button 3 times to complete tasks</p>
                  <button
                    onClick={handleCompleteTask}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    Complete Task ({taskCount}/3) →
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 italic">Complete step 2 first</p>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Send Invite */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          inviteSentStatus === "success" ? "border-green-500 bg-green-50" : taskCount >= 3 ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50"
        }`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {inviteSentStatus === "success" ? (
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                  ✓
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                  4
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Invite a Team Member</h3>
              {inviteSentStatus === "success" ? (
                <p className="text-green-700 font-medium">✓ Invite sent!</p>
              ) : taskCount >= 3 ? (
                <button
                  onClick={handleInviteSent}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Send Invite →
                </button>
              ) : (
                <p className="text-gray-500 italic">Complete step 3 first</p>
              )}
            </div>
          </div>
        </div>

        {/* Success Message */}
        {allStepsComplete && (
          <div className="rounded-xl border-2 border-green-500 bg-gradient-to-r from-green-50 to-blue-50 p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Congratulations!</h2>
            <p className="text-lg text-gray-700 mb-4">Your workspace is now fully activated!</p>
            <div className="flex gap-3 justify-center">
              <a
                href="/dashboard"
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
              >
                View Dashboard →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
