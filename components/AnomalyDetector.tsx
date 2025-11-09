'use client'
import { useState, useEffect } from 'react'
import { analytics } from '@/lib/analytics'
import { SegmentSelection, toSegmentProperties } from '@/lib/segments'

interface AnomalyDetectorProps {
  userId: string
  workspaceId: string
  segment: SegmentSelection
}

export default function AnomalyDetector({ userId, workspaceId, segment }: AnomalyDetectorProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ alert: boolean; activationRate: number; threshold: number; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [threshold, setThreshold] = useState(50)
  
  // Bind to workspace group when component mounts
  useEffect(() => {
    if (userId && workspaceId) {
      analytics.identify(userId)
      analytics.group('workspace', workspaceId, toSegmentProperties(segment))
    }
  }, [userId, workspaceId, segment])
  
  const detectAnomaly = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const response = await fetch('/api/ai/anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, workspaceId, threshold: threshold / 100, segment })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to detect anomaly')
        console.error('Anomaly API error:', data)
        throw new Error(errorMsg)
      }
      
      setResult(data)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMsg)
      console.error('Anomaly detection error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Anomaly Detector</h3>
        <button 
          onClick={detectAnomaly}
          disabled={loading}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Detect Anomalies
            </>
          )}
        </button>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Activation Rate Threshold: <span className="font-bold text-orange-600">{threshold}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      
      {result && (
        <div className={`mt-4 p-4 rounded-md border ${result.alert ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-start gap-3">
            {result.alert ? (
              <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <div className="flex-1">
              <h4 className={`font-semibold mb-2 ${result.alert ? 'text-red-800' : 'text-green-800'}`}>
                {result.alert ? '⚠️ Anomaly Detected' : '✓ Metrics Normal'}
              </h4>
              <div className="text-sm mb-3">
                <p className={result.alert ? 'text-red-700' : 'text-green-700'}>
                  <span className="font-medium">Activation Rate:</span> {(result.activationRate * 100).toFixed(1)}%
                </p>
                <p className={result.alert ? 'text-red-700' : 'text-green-700'}>
                  <span className="font-medium">Threshold:</span> {(result.threshold * 100).toFixed(1)}%
                </p>
              </div>
              {result.message && (
                <div className={`mt-3 p-3 rounded-md ${result.alert ? 'bg-red-100' : 'bg-green-100'}`}>
                  <p className={`text-sm whitespace-pre-wrap ${result.alert ? 'text-red-900' : 'text-green-900'}`}>
                    {result.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

