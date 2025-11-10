import { NextResponse } from 'next/server'
import { getAllWorkspaceStats } from '@/lib/workspace-stats'
import { getAllWorkspacesFromSupabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Try to get workspaces from Supabase first, fallback to in-memory store
    let workspaces
    
    const supabaseWorkspaces = await getAllWorkspacesFromSupabase()
    if (supabaseWorkspaces.length > 0) {
      console.log('Dashboard stats from Supabase:', { total: supabaseWorkspaces.length, activated: supabaseWorkspaces.filter(w => w.isActivated).length })
      workspaces = supabaseWorkspaces
    } else {
      // Fallback to in-memory store for backwards compatibility
      workspaces = getAllWorkspaceStats()
      console.log('Dashboard stats from in-memory store:', { total: workspaces.length, activated: workspaces.filter(w => w.isActivated).length })
    }

    const response = NextResponse.json({ workspaces })
    response.headers.set('Cache-Control', 'no-store')
    return response
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Fallback to in-memory store on error
    const workspaces = getAllWorkspaceStats()
    const response = NextResponse.json({ workspaces })
    response.headers.set('Cache-Control', 'no-store')
    return response
  }
}

