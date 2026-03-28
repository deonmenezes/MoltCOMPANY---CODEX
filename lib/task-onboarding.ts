export type CompensationModel = 'completion' | 'holdback' | 'custom'

export type OnboardingLinkOptions = {
  origin?: string
  source: 'official' | 'community' | 'draft'
  taskId: string
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

const FALLBACK_ORIGIN = 'https://moltcompany.ai'

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

  return `$${monthlyPrice}/mo base • ${suffix}`
}

export function buildOnboardingLink({
  origin,
  source,
  taskId,
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
  const resolvedOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : FALLBACK_ORIGIN)

  const params = new URLSearchParams({
    role,
    channel,
    agent,
    monthly: String(monthlyPrice),
    commission: String(commissionRate),
    compensation: compensationModel,
    skill,
  })

  if (source === 'community') {
    params.set('community', taskId)
  } else if (source === 'draft') {
    params.set('draft', taskId)
  } else {
    params.set('model', taskId)
  }

  if (handoff?.trim()) params.set('handoff', handoff.trim())
  if (thread?.trim()) params.set('thread', thread.trim())
  if (operator?.trim()) params.set('operator', operator.trim())

  return `${resolvedOrigin}/onboarding?${params.toString()}`
}

export function buildClaimLink(taskId: string, source: 'official' | 'community' | 'draft' = 'official') {
  const params = new URLSearchParams(
    source === 'community'
      ? { community: taskId }
      : source === 'draft'
        ? { draft: taskId }
        : { model: taskId }
  )

  return `/deploy?${params.toString()}`
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
