import { NextRequest, NextResponse } from 'next/server'
import { createAgentClaim, getAgentTask, type AgentRunner } from '@/lib/agent-pickup'
import { type CompensationModel } from '@/lib/task-onboarding'

function normalizeTaskRef(taskRef?: string | null) {
  const [source, ...rest] = (taskRef || '').split(':')
  const taskId = rest.join(':').trim()
  if (!taskId || (source !== 'official' && source !== 'community')) return null
  return { source, taskId }
}

function toNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value !== 'string' || !value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function normalizeBody(payload: Record<string, unknown>, origin: string) {
  const taskRef = normalizeTaskRef(typeof payload.taskRef === 'string' ? payload.taskRef : null)
  return {
    source: (taskRef?.source || payload.source || 'official') as 'official' | 'community',
    taskId: taskRef?.taskId || String(payload.taskId || payload.task_id || ''),
    agent: (typeof payload.agent === 'string' ? payload.agent : 'openclaw') as AgentRunner,
    channel: typeof payload.channel === 'string' ? payload.channel : 'chat',
    operator: typeof payload.operator === 'string' ? payload.operator : undefined,
    thread: typeof payload.thread === 'string' ? payload.thread : undefined,
    handoff: typeof payload.handoff === 'string' ? payload.handoff : undefined,
    monthlyPrice: toNumber(payload.monthlyPrice) ?? toNumber(payload.monthly_price),
    commissionRate: toNumber(payload.commissionRate) ?? toNumber(payload.commission_rate),
    compensationModel: (payload.compensationModel || payload.compensation_model) as CompensationModel | undefined,
    skill: typeof payload.skill === 'string' ? payload.skill : undefined,
    origin,
  }
}

async function handleClaim(payload: Record<string, unknown>, origin: string) {
  const claim = normalizeBody(payload, origin)

  if (!claim.taskId) {
    return NextResponse.json({ error: 'taskId or taskRef is required' }, { status: 400 })
  }

  const task = await getAgentTask(claim.source, claim.taskId, origin)
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  return NextResponse.json(createAgentClaim(task, claim))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    return await handleClaim(body, req.nextUrl.origin)
  } catch (error) {
    console.error('OpenClaw claim POST error:', error)
    return NextResponse.json({ error: 'Failed to claim OpenClaw task' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    return await handleClaim(Object.fromEntries(req.nextUrl.searchParams.entries()), req.nextUrl.origin)
  } catch (error) {
    console.error('OpenClaw claim GET error:', error)
    return NextResponse.json({ error: 'Failed to claim OpenClaw task' }, { status: 500 })
  }
}
