import { NextRequest, NextResponse } from 'next/server'
import { getAgentTask, listAgentTasks } from '@/lib/agent-pickup'

export const dynamic = 'force-dynamic'

function normalizeTaskRef(taskRef?: string | null) {
  const [source, ...rest] = (taskRef || '').split(':')
  const taskId = rest.join(':').trim()
  if (!taskId || (source !== 'official' && source !== 'community')) return null
  return { source, taskId }
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams
    const origin = req.nextUrl.origin
    const taskRef = normalizeTaskRef(params.get('taskRef'))
    const explicitSource = params.get('source')
    const explicitTaskId = params.get('taskId')

    if (taskRef || (explicitSource && explicitTaskId)) {
      const source = (taskRef?.source || explicitSource) as 'official' | 'community'
      const taskId = taskRef?.taskId || explicitTaskId || ''
      const task = await getAgentTask(source, taskId, origin)

      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }

      return NextResponse.json({ task })
    }

    const source = (params.get('source') || 'all') as 'all' | 'official' | 'community'
    const q = params.get('q') || ''
    const category = params.get('category') || ''
    const limit = Number(params.get('limit') || '20')
    const offset = Number(params.get('offset') || '0')

    const data = await listAgentTasks({
      source,
      search: q,
      category,
      limit,
      offset,
      origin,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('OpenClaw task route error:', error)
    return NextResponse.json({ error: 'Failed to load OpenClaw tasks' }, { status: 500 })
  }
}
