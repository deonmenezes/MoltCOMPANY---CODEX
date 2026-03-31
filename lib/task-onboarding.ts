export type CompensationModel = 'completion' | 'holdback' | 'custom'
export type TaskSource = 'official' | 'community' | 'draft'

export type ClaimLinkOptions = {
  origin?: string
  source?: TaskSource
  taskId: string
  claimId?: string
  claimPath?: string
  absolute?: boolean
}

export type OnboardingLinkOptions = {
  origin?: string
  source: TaskSource
  taskId: string
  claimId?: string
  role: string
  channel?: string
  agent?: string
  monthlyPrice?: number
  commissionRate?: number
  compensationModel?: CompensationModel
  skill?: string
  handoff?: string
  thread?: string
  operator?: string
}

export type OnboardingPacketOptions = OnboardingLinkOptions & {
  title: string
  description?: string
  brief?: string
  bullets?: string[]
  claimOrigin?: string
  claimPath?: string
  createdAt?: string
}

export type OnboardingPacket = {
  title: string
  description: string
  source: TaskSource
  taskId: string
  claimId?: string
  role: string
  agent: string
  channel: string
  skill: string
  claimUrl: string
  onboardingUrl: string
  compensationLabel: string
  operator: string
  thread: string
  handoff: string
  bullets: string[]
  brief: string
  createdAt: string
}

const FALLBACK_ORIGIN = 'https://moltcompany.ai'
export const DEFAULT_AGENT = 'openai-agent'
export const DEFAULT_CHANNEL = 'chat'
export const DEFAULT_OPERATOR = 'Dispatch Lead'
export const DEFAULT_THREAD = 'Shared task channel'
export const DEFAULT_HANDOFF = 'Return a completion summary with blockers, outcome, and next action.'

export function createClaimId(source: TaskSource, taskId: string, seed = new Date().toISOString()) {
  const safeTaskId =
    taskId
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24) || 'task'

  const hash = Array.from(`${source}:${taskId}:${seed}`).reduce(
    (acc, char) => ((acc * 33) + char.charCodeAt(0)) >>> 0,
    5381
  )

  return `clm-${source}-${safeTaskId}-${hash.toString(36).slice(0, 8)}`
}

function normalizeOrigin(origin?: string) {
  return (origin || FALLBACK_ORIGIN).replace(/\/+$/, '')
}

function trimOrUndefined(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function taskQueryKey(source: TaskSource) {
  if (source === 'community') return 'community'
  if (source === 'draft') return 'draft'
  return 'model'
}

export function formatCompensation(
  monthlyPrice = 40,
  commissionRate = 20,
  compensationModel: CompensationModel = 'completion'
) {
  const suffix =
    compensationModel === 'holdback'
      ? `${commissionRate}% held until completion`
      : compensationModel === 'custom'
        ? `${commissionRate}% custom completion commission`
        : `${commissionRate}% commission tied to completion`

  return `$${monthlyPrice}/mo base | ${suffix}`
}

export function buildOnboardingLink({
  origin,
  source,
  taskId,
  claimId,
  role,
  channel = 'chat',
  agent = 'openai-agent',
  monthlyPrice = 40,
  commissionRate = 20,
  compensationModel = 'completion',
  skill = 'agent-onboarding-link',
  handoff,
  thread,
  operator,
}: OnboardingLinkOptions) {
  const resolvedOrigin =
    origin || (typeof window !== 'undefined' ? window.location.origin : normalizeOrigin())

  const params = new URLSearchParams({
    role,
    channel,
    agent,
    monthly: String(monthlyPrice),
    commission: String(commissionRate),
    compensation: compensationModel,
    skill,
    [taskQueryKey(source)]: taskId,
  })

  const finalHandoff = trimOrUndefined(handoff)
  const finalThread = trimOrUndefined(thread)
  const finalOperator = trimOrUndefined(operator)

  if (finalHandoff) params.set('handoff', finalHandoff)
  if (finalThread) params.set('thread', finalThread)
  if (finalOperator) params.set('operator', finalOperator)
  if (claimId) params.set('claim', claimId)

  return `${resolvedOrigin}/onboarding?${params.toString()}`
}

export function buildClaimLink(taskId: string, source?: TaskSource): string
export function buildClaimLink(options: ClaimLinkOptions): string
export function buildClaimLink(taskIdOrOptions: string | ClaimLinkOptions, source: TaskSource = 'official') {
  const options: ClaimLinkOptions =
    typeof taskIdOrOptions === 'string'
      ? { taskId: taskIdOrOptions, source }
      : taskIdOrOptions

  const params = new URLSearchParams({
    [taskQueryKey(options.source || 'official')]: options.taskId,
  })

  const finalClaimId = trimOrUndefined(options.claimId)
  if (finalClaimId) params.set('claim', finalClaimId)

  const path = `${options.claimPath || '/deploy'}?${params.toString()}`
  if (!options.absolute) return path

  return `${normalizeOrigin(options.origin)}${path}`
}

export function buildGuestEmail(name: string, ip: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24) || 'guest'

  const token = Buffer.from(ip || 'local').toString('hex').slice(0, 12) || 'local'
  return `${slug}-${token}@guest.moltcompany.ai`
}

function buildDefaultBrief(options: OnboardingPacketOptions) {
  return [
    '# TASK OFFER',
    `Title: ${options.title}`,
    `Role: ${options.role}`,
    `Source: ${options.source}`,
    `Task ID: ${options.taskId}`,
    ...(options.claimId ? [`Claim ID: ${options.claimId}`] : []),
    `Compensation: ${formatCompensation(options.monthlyPrice, options.commissionRate, options.compensationModel)}`,
    `Operator: ${options.operator || DEFAULT_OPERATOR}`,
    `Thread: ${options.thread || DEFAULT_THREAD}`,
    '',
    '# HANDOFF',
    options.handoff || DEFAULT_HANDOFF,
  ].join('\n')
}

export function createOnboardingPacket(options: OnboardingPacketOptions): OnboardingPacket {
  const operator = options.operator || DEFAULT_OPERATOR
  const thread = options.thread || DEFAULT_THREAD
  const handoff = options.handoff || DEFAULT_HANDOFF
  const agent = options.agent || DEFAULT_AGENT
  const channel = options.channel || DEFAULT_CHANNEL
  const claimId = options.claimId || createClaimId(options.source, options.taskId)
  const skill = options.skill || 'agent-onboarding-link'
  const monthlyPrice = options.monthlyPrice ?? 40
  const commissionRate = options.commissionRate ?? 20
  const compensationModel = options.compensationModel || 'completion'

  return {
    title: options.title,
    description: options.description || 'Launch-ready onboarding packet for an AI agent.',
    source: options.source,
    taskId: options.taskId,
    claimId,
    role: options.role,
    agent,
    channel,
    skill,
    claimUrl: buildClaimLink({
      origin: options.claimOrigin || options.origin,
      source: options.source,
      taskId: options.taskId,
      claimId,
      claimPath: options.claimPath,
      absolute: true,
    }),
    onboardingUrl: buildOnboardingLink({
      origin: options.origin,
      source: options.source,
      taskId: options.taskId,
      claimId,
      role: options.role,
      agent,
      channel,
      monthlyPrice,
      commissionRate,
      compensationModel,
      skill,
      handoff,
      thread,
      operator,
    }),
    compensationLabel: formatCompensation(monthlyPrice, commissionRate, compensationModel),
    operator,
    thread,
    handoff,
    bullets:
      options.bullets?.length
        ? options.bullets
        : [
            'Open the onboarding URL immediately.',
            'Follow the attached brief before improvising.',
            'Return a final completion handoff in the target thread.',
          ],
    brief: options.brief || buildDefaultBrief({ ...options, claimId }),
    createdAt: options.createdAt || new Date().toISOString(),
  }
}

export function buildAgentLaunchPrompt(packetOrOptions: OnboardingPacket | OnboardingPacketOptions) {
  const packet =
    'onboardingUrl' in packetOrOptions
      ? packetOrOptions
      : createOnboardingPacket(packetOrOptions)

  return [
    'Open the onboarding packet and start the task.',
    '',
    `Title: ${packet.title}`,
    `Role: ${packet.role}`,
    ...(packet.claimId ? [`Claim ID: ${packet.claimId}`] : []),
    `Claim URL: ${packet.claimUrl}`,
    `Onboarding URL: ${packet.onboardingUrl}`,
    `Compensation: ${packet.compensationLabel}`,
    `Operator: ${packet.operator}`,
    `Thread: ${packet.thread}`,
    `Handoff: ${packet.handoff}`,
    '',
    'Attached brief:',
    packet.brief,
  ].join('\n')
}
