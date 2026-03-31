import { NextRequest, NextResponse } from 'next/server'
import { listAgentTasks } from '@/lib/agent-tasks'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const source = (req.nextUrl.searchParams.get('source') || 'all') as 'all' | 'official' | 'community'
    const category = req.nextUrl.searchParams.get('category') || undefined
    const q = req.nextUrl.searchParams.get('q') || undefined
    const limit = Number(req.nextUrl.searchParams.get('limit') || '20')
    const origin = req.nextUrl.origin

    if (!['all', 'official', 'community'].includes(source)) {
      return NextResponse.json({ error: 'Invalid source' }, { status: 400 })
    }

    const tasks = await listAgentTasks({
      origin,
      source,
      category,
      q,
      limit,
    })

    return NextResponse.json({
      tasks,
      total: tasks.length,
      usage: {
        show: 'GET /api/tasks/:source/:taskId',
        claim: 'GET /api/tasks/:source/:taskId?agent=openclaw&channel=telegram',
      },
    })
  } catch (error) {
    console.error('Tasks list error:', error)
    return NextResponse.json({ error: 'Failed to load tasks' }, { status: 500 })
  }
}
