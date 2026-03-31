import { NextRequest, NextResponse } from 'next/server'
import { createAgentClaim, getAgentTask, type AgentRunner } from '@/lib/agent-pickup'
import { type CompensationModel, type TaskSource } from '@/lib/task-onboarding'

function toNumber(value: string | number | null | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value !== 'string' || !value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function normalizeClaimBody(payload: Record<string, unknown>, origin: string) {
  return {
    source: (payload.source || 'official') as TaskSource,
    taskId: String(payload.task_id || payload.taskId || ''),
    agent: (payload.agent || 'openclaw') as AgentRunner,
    channel: typeof payload.channel === 'string' ? payload.channel : 'chat',
    operator: typeof payload.operator === 'string' ? payload.operator : undefined,
    thread: typeof payload.thread === 'string' ? payload.thread : undefined,
    handoff: typeof payload.handoff === 'string' ? payload.handoff : undefined,
    monthlyPrice: toNumber(payload.monthly_price as string | number | undefined) ?? toNumber(payload.monthlyPrice as string | number | undefined),
    commissionRate: toNumber(payload.commission_rate as string | number | undefined) ?? toNumber(payload.commissionRate as string | number | undefined),
    compensationModel: (payload.compensation_model || payload.compensationModel) as CompensationModel | undefined,
    skill: typeof payload.skill === 'string' ? payload.skill : undefined,
    origin,
  }
}

async function handleClaim(body: Record<string, unknown>, origin: string) {
  const claim = normalizeClaimBody(body, origin)

  if (!claim.taskId) {
    return NextResponse.json({ error: 'task_id is required' }, { status: 400 })
  }

  if (!['official', 'community', 'draft'].includes(claim.source)) {
    return NextResponse.json({ error: 'source must be official, community, or draft' }, { status: 400 })
  }

  if (claim.source === 'draft') {
    return NextResponse.json(
      { error: 'draft tasks are browser-local only. Publish the task or use official/community sources.' },
      { status: 400 }
    )
  }

  const task = await getAgentTask(claim.source, claim.taskId, origin)
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  return NextResponse.json(createAgentClaim(task, claim))
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams
    const body = Object.fromEntries(params.entries())
    return await handleClaim(body, req.nextUrl.origin)
  } catch (error) {
    console.error('Agent claim GET error:', error)
    return NextResponse.json({ error: 'Failed to generate agent claim packet' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    return await handleClaim(body, req.nextUrl.origin)
  } catch (error) {
    console.error('Agent claim POST error:', error)
    return NextResponse.json({ error: 'Failed to generate agent claim packet' }, { status: 500 })
  }
}
