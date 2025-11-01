'use client'
import { useState } from 'react'

interface PDRCopilotProps {
  userId: string
  workspaceId: string
}

export default function PDRCopilot({ userId, workspaceId }: PDRCopilotProps) {
  const [loading, setLoading] = useState(false)
  const [pdr, setPdr] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const generatePDR = async () => {
    setLoading(true)
    setError(null)
    setPdr(null)
    
    try {
      const response = await fetch('/api/ai/pdr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, workspaceId })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate PDR')
      }
      
      setPdr(data.pdr)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">PDR Copilot</h3>
        <button 
          onClick={generatePDR}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Generate PDR
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      
      {pdr && (
        <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-md">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
            {pdr}
          </pre>
        </div>
      )}
    </div>
  )
}

