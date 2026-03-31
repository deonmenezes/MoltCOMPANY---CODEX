import { bots } from '@/lib/bots'
import {
  buildClaimLink,
  createClaimId,
  createOnboardingPacket,
  DEFAULT_AGENT,
  DEFAULT_CHANNEL,
  DEFAULT_HANDOFF,
  DEFAULT_OPERATOR,
  DEFAULT_THREAD,
  type CompensationModel,
  type OnboardingPacket,
  type TaskSource,
} from '@/lib/task-onboarding'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export type PublicTaskSource = Exclude<TaskSource, 'draft'>

export type AgentTask = {
  source: PublicTaskSource
  taskId: string
  title: string
  role: string
  description: string
  category: string
  color: string
  author: string
  tags: string[]
  onboardingItems: string[]
  completionSteps: string[]
  packetPreview: string
  monthlyPrice: number
  commissionRate: number
  compensationModel: CompensationModel
  skill: string
  claimUrl: string
}

export type AgentTaskListOptions = {
  origin?: string
  source?: 'all' | PublicTaskSource
  category?: string
  q?: string
  limit?: number
}

export type AgentClaimOptions = {
  origin?: string
  agent?: string
  channel?: string
  monthlyPrice?: number
  commissionRate?: number
  compensationModel?: CompensationModel
  operator?: string
  thread?: string
  handoff?: string
  claimId?: string
  skill?: string
}

export type AgentTaskClaim = {
  claimId: string
  task: AgentTask
  packet: OnboardingPacket
  commands: {
    list: string
    show: string
    claim: string
    openclaw: string
    dockerRun: string
  }
}

type CommunityRow = {
  id: number
  name: string | null
  bot_name: string | null
  description: string | null
  character_file: string | null
  soul_md: string | null
  author_name: string | null
  bot_role: string | null
  color: string | null
  category: string | null
  tags: string[] | null
}

function resolveOrigin(origin?: string) {
  return (origin || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.moltcompany.ai').replace(/\/+$/, '')
}

function quoteArg(value: string) {
  if (!value) return '""'
  if (!/[ \t"\n]/.test(value)) return value
  return `"${value.replace(/(["\\$`])/g, '\\$1')}"`
}

function matchesTask(task: AgentTask, query?: string, category?: string) {
  const normalizedQuery = (query || '').trim().toLowerCase()
  if (category && category !== 'all' && task.category !== category) return false
  if (!normalizedQuery) return true

  return [
    task.title,
    task.role,
    task.description,
    task.author,
    ...task.tags,
  ].join(' ').toLowerCase().includes(normalizedQuery)
}

function officialTaskToAgentTask(bot: (typeof bots)[number], origin?: string): AgentTask {
  return {
    source: 'official',
    taskId: bot.id,
    title: bot.characterName,
    role: bot.characterRole,
    description: bot.description,
    category: bot.category,
    color: bot.color,
    author: 'MoltCompany',
    tags: [bot.category, bot.featuredSkillId || 'agent-onboarding-link'],
    onboardingItems: bot.onboardingItems,
    completionSteps: bot.completionSteps,
    packetPreview: [
      `Task: ${bot.characterName}`,
      `Role: ${bot.characterRole}`,
      '',
      ...bot.onboardingItems,
    ].join('\n'),
    monthlyPrice: bot.monthlyPrice,
    commissionRate: bot.commissionRate ?? 20,
    compensationModel: bot.compensationModel ?? 'completion',
    skill: bot.featuredSkillId || 'agent-onboarding-link',
    claimUrl: buildClaimLink({
      origin: resolveOrigin(origin),
      source: 'official',
      taskId: bot.id,
      absolute: true,
    }),
  }
}

function communityTaskToAgentTask(row: CommunityRow, origin?: string): AgentTask {
  const title = row.name || row.bot_name || 'Community Task'
  const role = row.bot_role || 'COMMUNITY TASK'
  const preview = row.character_file || row.soul_md || row.description || 'Community packet preview unavailable.'

  return {
    source: 'community',
    taskId: String(row.id),
    title,
    role,
    description: row.description || 'Community-posted task pack for external agents.',
    category: row.category || 'other',
    color: row.color || '#8B5CF6',
    author: row.author_name || 'Community',
    tags: row.tags || [],
    onboardingItems: [
      'Read the imported community brief before execution starts.',
      'Confirm operator, handoff, and payout filters before launch.',
      'Return the completion summary in the attached thread or channel.',
    ],
    completionSteps: [
      'Open the generated onboarding packet.',
      'Execute the posted workflow with the approved tools and channels.',
      'Return a final completion handoff with blockers, outcome, and next action.',
    ],
    packetPreview: preview,
    monthlyPrice: 40,
    commissionRate: 20,
    compensationModel: 'completion',
    skill: 'agent-onboarding-link',
    claimUrl: buildClaimLink({
      origin: resolveOrigin(origin),
      source: 'community',
      taskId: String(row.id),
      absolute: true,
    }),
  }
}

async function fetchCommunityTasks(origin?: string) {
  if (!isSupabaseConfigured) return [] as AgentTask[]

  const { data } = await supabase
    .from('community_bots')
    .select('id, name, bot_name, description, character_file, soul_md, author_name, bot_role, color, category, tags')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  return (data || []).map(row => communityTaskToAgentTask(row as CommunityRow, origin))
}

export async function listAgentTasks(options: AgentTaskListOptions = {}) {
  const source = options.source || 'all'
  const limit = Math.min(Math.max(options.limit || 20, 1), 100)
  const official = source === 'community' ? [] : bots.map(bot => officialTaskToAgentTask(bot, options.origin))
  const community = source === 'official' ? [] : await fetchCommunityTasks(options.origin)

  return [...official, ...community]
    .filter(task => matchesTask(task, options.q, options.category))
    .slice(0, limit)
}

export async function getAgentTask(source: PublicTaskSource, taskId: string, origin?: string) {
  if (source === 'official') {
    const bot = bots.find(entry => entry.id === taskId)
    return bot ? officialTaskToAgentTask(bot, origin) : null
  }

  const community = await fetchCommunityTasks(origin)
  return community.find(task => task.taskId === taskId) || null
}

function buildOpenClawDockerCommand(origin: string) {
  return [
    'docker run -d \\',
    '  --name openclaw \\',
    '  -p 8080:8080 \\',
    '  -e OPENAI_API_KEY=$OPENAI_API_KEY \\',
    '  -e AUTH_PASSWORD=$AUTH_PASSWORD \\',
    '  -e OPENCLAW_GATEWAY_TOKEN=$OPENCLAW_GATEWAY_TOKEN \\',
    `  -e OPENCLAW_ALLOWED_ORIGINS=http://localhost:3000,${origin} \\`,
    '  -v openclaw-data:/data \\',
    '  coollabsio/openclaw:latest',
  ].join('\n')
}

function buildCommandSet(task: AgentTask, packet: OnboardingPacket, origin: string) {
  const common = `--origin ${quoteArg(origin)} --source ${task.source} --task-id ${quoteArg(task.taskId)}`
  const claimArgs = [
    common,
    `--agent ${quoteArg(packet.agent)}`,
    `--channel ${quoteArg(packet.channel)}`,
    `--claim-id ${quoteArg(packet.claimId || '')}`,
    `--operator ${quoteArg(packet.operator)}`,
    `--thread ${quoteArg(packet.thread)}`,
    `--handoff ${quoteArg(packet.handoff)}`,
    `--monthly ${packet.compensationLabel.match(/\$(\d+)/)?.[1] || '40'}`,
    `--commission ${packet.compensationLabel.match(/(\d+)%/)?.[1] || '20'}`,
  ].join(' ')

  return {
    list: `npx moltcompany task-list --origin ${quoteArg(origin)} --source ${task.source}`,
    show: `npx moltcompany task-show ${common}`,
    claim: `npx moltcompany task-claim ${claimArgs}`,
    openclaw: [
      `npx moltcompany task-openclaw ${claimArgs}`,
      `# Onboarding URL: ${packet.onboardingUrl}`,
    ].join('\n'),
    dockerRun: buildOpenClawDockerCommand(origin),
  }
}

export async function createAgentTaskClaim(
  source: PublicTaskSource,
  taskId: string,
  options: AgentClaimOptions = {}
): Promise<AgentTaskClaim | null> {
  const origin = resolveOrigin(options.origin)
  const task = await getAgentTask(source, taskId, origin)

  if (!task) return null

  const claimId = options.claimId || createClaimId(source, taskId)
  const packet = createOnboardingPacket({
    origin,
    source,
    taskId,
    claimId,
    title: task.title,
    role: task.role,
    description: task.description,
    brief: task.packetPreview,
    bullets: task.onboardingItems,
    agent: options.agent || DEFAULT_AGENT,
    channel: options.channel || DEFAULT_CHANNEL,
    monthlyPrice: options.monthlyPrice ?? task.monthlyPrice,
    commissionRate: options.commissionRate ?? task.commissionRate,
    compensationModel: options.compensationModel || task.compensationModel,
    operator: options.operator || DEFAULT_OPERATOR,
    thread: options.thread || DEFAULT_THREAD,
    handoff: options.handoff || DEFAULT_HANDOFF,
    skill: options.skill || task.skill,
  })

  return {
    claimId,
    task,
    packet,
    commands: buildCommandSet(task, packet, origin),
  }
}
