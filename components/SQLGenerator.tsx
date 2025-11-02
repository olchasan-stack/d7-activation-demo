'use client'
import { useState, useEffect } from 'react'
import { analytics } from '@/lib/analytics'

interface SQLGeneratorProps {
  userId: string
  workspaceId: string
}

export default function SQLGenerator({ userId, workspaceId }: SQLGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [sql, setSql] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [queryType, setQueryType] = useState<'d7_metrics' | 'cohort_analysis' | 'custom'>('custom')
  const [validated, setValidated] = useState<boolean | null>(null)
  
  // Bind to workspace group when component mounts
  useEffect(() => {
    if (userId && workspaceId) {
      analytics.identify(userId)
      analytics.group('workspace', workspaceId)
    }
  }, [userId, workspaceId])
  
  const generateSQL = async () => {
    if (!query.trim()) {
      setError('Please enter a query')
      return
    }
    
    setLoading(true)
    setError(null)
    setSql(null)
    setValidated(null)
    
    try {
      const response = await fetch('/api/ai/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, workspaceId, naturalLanguageQuery: query, queryType })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to generate SQL')
        console.error('SQL API error:', data)
        throw new Error(errorMsg)
      }
      
      setSql(data.sql)
      setValidated(data.validated)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMsg)
      console.error('SQL generation error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">SQL Generator</h3>
        <button 
          onClick={generateSQL}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Generate SQL
            </>
          )}
        </button>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Query Type</label>
        <select
          value={queryType}
          onChange={(e) => setQueryType(e.target.value as 'd7_metrics' | 'cohort_analysis' | 'custom')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="custom">Custom Query</option>
          <option value="d7_metrics">D7 Metrics</option>
          <option value="cohort_analysis">Cohort Analysis</option>
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Natural Language Query</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., Show me all workspaces created in the last 7 days with activation status..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-20"
        />
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      
      {sql && (
        <div className="mt-4">
          {validated !== null && (
            <div className={`mb-2 p-3 rounded-md ${validated ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <p className={`text-sm font-medium ${validated ? 'text-green-800' : 'text-yellow-800'}`}>
                {validated ? '✓ SQL Validated' : '⚠️ SQL Contains Dangerous Keywords'}
              </p>
            </div>
          )}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono overflow-x-auto">
              {sql}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

