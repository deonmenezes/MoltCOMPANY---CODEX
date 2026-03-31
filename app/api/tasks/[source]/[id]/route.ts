import { NextRequest, NextResponse } from 'next/server'
import {
  createAgentTaskClaim,
  getAgentTask,
  type PublicTaskSource,
} from '@/lib/agent-tasks'

export const dynamic = 'force-dynamic'

function parseCompensation(value: string | null) {
  if (value === 'holdback' || value === 'custom') return value
  return 'completion'
}

export async function GET(
  req: NextRequest,
  context: { params: { source: string; id: string } }
) {
  try {
    const source = context.params.source as PublicTaskSource
    const taskId = context.params.id

    if (!['official', 'community'].includes(source)) {
      return NextResponse.json({ error: 'Invalid source' }, { status: 400 })
    }

    const task = await getAgentTask(source, taskId, req.nextUrl.origin)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const claim = await createAgentTaskClaim(source, taskId, {
      origin: req.nextUrl.origin,
      agent: req.nextUrl.searchParams.get('agent') || undefined,
      channel: req.nextUrl.searchParams.get('channel') || undefined,
      operator: req.nextUrl.searchParams.get('operator') || undefined,
      thread: req.nextUrl.searchParams.get('thread') || undefined,
      handoff: req.nextUrl.searchParams.get('handoff') || undefined,
      claimId: req.nextUrl.searchParams.get('claimId') || req.nextUrl.searchParams.get('claim') || undefined,
      skill: req.nextUrl.searchParams.get('skill') || undefined,
      monthlyPrice: req.nextUrl.searchParams.get('monthly')
        ? Number(req.nextUrl.searchParams.get('monthly'))
        : undefined,
      commissionRate: req.nextUrl.searchParams.get('commission')
        ? Number(req.nextUrl.searchParams.get('commission'))
        : undefined,
      compensationModel: parseCompensation(req.nextUrl.searchParams.get('compensation')),
    })

    return NextResponse.json({
      task,
      claim,
    })
  } catch (error) {
    console.error('Task detail error:', error)
    return NextResponse.json({ error: 'Failed to load task' }, { status: 500 })
  }
}
