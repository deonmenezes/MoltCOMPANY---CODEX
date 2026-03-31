import { NextRequest, NextResponse } from 'next/server'
import { listAgentTasks } from '@/lib/agent-pickup'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const source = (req.nextUrl.searchParams.get('source') || 'all') as 'all' | 'official' | 'community'
    const search = req.nextUrl.searchParams.get('q') || ''
    const category = req.nextUrl.searchParams.get('category') || ''
    const limit = Number(req.nextUrl.searchParams.get('limit') || '50')
    const offset = Number(req.nextUrl.searchParams.get('offset') || '0')
    const origin = req.nextUrl.origin

    const data = await listAgentTasks({
      source,
      search,
      category,
      limit,
      offset,
      origin,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Agent task list error:', error)
    return NextResponse.json({ error: 'Failed to list agent tasks' }, { status: 500 })
  }
}
