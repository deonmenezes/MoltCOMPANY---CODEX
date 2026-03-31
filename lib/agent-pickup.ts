import { bots, type Bot } from '@/lib/bots'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  DEFAULT_HANDOFF,
  DEFAULT_OPERATOR,
  DEFAULT_THREAD,
  buildAgentLaunchPrompt,
  buildClaimLink,
  createOnboardingPacket,
  formatCompensation,
  type CompensationModel,
  type OnboardingPacket,
  type TaskSource,
} from '@/lib/task-onboarding'

export type AgentSource = TaskSource
export type AgentRunner = 'openclaw' | 'openai-agent' | 'codex' | 'custom-agent'

type CommunityBotRow = {
  id: number
  name: string | null
  bot_name: string | null
  description: string | null
  author_name: string | null
  bot_role: string | null
  color: string | null
  category: string | null
  tags: string[] | null
  character_file: string | null
  soul_md: string | null
  created_at: string
  upvotes: number | null
  downvotes: number | null
  deploys: number | null
}

export type AgentTask = {
  source: AgentSource
  taskId: string
  taskRef: string
  title: string
  role: string
  category: string
  description: string
  color: string
  author: string
  createdAt: string
  tags: string[]
  bullets: string[]
  brief: string
  onboardingItems: string[]
  completionSteps: string[]
  monthlyPrice: number
  commissionRate: number
  compensationModel: CompensationModel
  compensationLabel: string
  claimUrl: string
  deployCount: number
  score: number
}

export type ListAgentTasksOptions = {
  source?: AgentSource | 'all'
  search?: string
  category?: string
  limit?: number
  offset?: number
  origin?: string
}

export type ClaimAgentTaskInput = {
  source: AgentSource
  taskId: string
  agent?: AgentRunner
  channel?: string
  operator?: string
  thread?: string
  handoff?: string
  monthlyPrice?: number
  commissionRate?: number
  compensationModel?: CompensationModel
  skill?: string
  origin?: string
}

export type AgentClaimResult = {
  claimId: string
  taskRef: string
  task: AgentTask
  packet: OnboardingPacket
  prompt: string
  commands: {
    install: string
    onboard: string
    dashboard: string
    bundle: string
    listCurl: string
    taskCurl: string
    claimCurl: string
    listCli: string
    taskCli: string
    claimCli: string
    connectOpenClaw: string
    mcpServer: string
    open: string
  }
}

function mapOfficialBot(bot: Bot, origin?: string): AgentTask {
  return {
    source: 'official',
    taskId: bot.id,
    taskRef: `official:${bot.id}`,
    title: bot.characterName,
    role: bot.characterRole,
    category: bot.category,
    description: bot.description,
    color: bot.color,
    author: 'MoltCompany',
    createdAt: '2025-01-01T00:00:00Z',
    tags: [bot.category, 'official', 'openclaw'],
    bullets: bot.onboardingItems,
    brief: [
      `Task: ${bot.characterName}`,
      `Role: ${bot.characterRole}`,
      '',
      ...bot.onboardingItems.map(item => `- ${item}`),
    ].join('\n'),
    onboardingItems: bot.onboardingItems,
    completionSteps: bot.completionSteps,
    monthlyPrice: bot.monthlyPrice,
    commissionRate: bot.commissionRate ?? 20,
    compensationModel: bot.compensationModel ?? 'completion',
    compensationLabel: formatCompensation(bot.monthlyPrice, bot.commissionRate ?? 20, bot.compensationModel ?? 'completion'),
    claimUrl: buildClaimLink({ taskId: bot.id, source: 'official', origin, absolute: true }),
    deployCount: 0,
    score: 0,
  }
}

function mapCommunityBot(bot: CommunityBotRow, origin?: string): AgentTask {
  return {
    source: 'community',
    taskId: String(bot.id),
    taskRef: `community:${bot.id}`,
    title: bot.name || bot.bot_name || 'Community task',
    role: bot.bot_role || 'COMMUNITY TASK',
    category: bot.category || 'other',
    description: bot.description || 'Community-posted OpenClaw task pack.',
    color: bot.color || '#8B5CF6',
    author: bot.author_name || 'Anonymous',
    createdAt: bot.created_at,
    tags: bot.tags || [],
    bullets: [
      'Read the imported community brief before execution starts',
      'Use the generated onboarding URL instead of rebuilding the packet manually',
      'Return a final handoff tied to the attached claim ID',
    ],
    brief: bot.character_file || bot.soul_md || bot.description || 'Community task brief unavailable.',
    onboardingItems: [
      'Read the imported community brief before execution starts',
      'Use the generated onboarding URL instead of rebuilding the packet manually',
      'Return a final handoff tied to the attached claim ID',
    ],
    completionSteps: [
      'Open the onboarding packet and confirm missing access immediately',
      'Run the posted workflow against the selected channel',
      'Return the final completion packet with blockers, outcome, and next action',
    ],
    monthlyPrice: 40,
    commissionRate: 20,
    compensationModel: 'completion',
    compensationLabel: formatCompensation(40, 20, 'completion'),
    claimUrl: buildClaimLink({ taskId: String(bot.id), source: 'community', origin, absolute: true }),
    deployCount: bot.deploys || 0,
    score: (bot.upvotes || 0) - (bot.downvotes || 0),
  }
}

async function loadCommunityTasks(origin?: string) {
  if (!isSupabaseConfigured) return [] as AgentTask[]

  const { data } = await supabase
    .from('community_bots')
    .select('id, name, bot_name, description, author_name, bot_role, color, category, tags, character_file, soul_md, created_at, upvotes, downvotes, deploys')
    .eq('status', 'published')

  return (data || []).map(row => mapCommunityBot(row as CommunityBotRow, origin))
}

export async function listAgentTasks({
  source = 'all',
  search = '',
  category = '',
  limit = 50,
  offset = 0,
  origin,
}: ListAgentTasksOptions = {}) {
  const query = search.trim().toLowerCase()
  const safeLimit = Math.min(Math.max(limit, 1), 200)
  const safeOffset = Math.max(offset, 0)

  const official = source === 'all' || source === 'official'
    ? bots.map(bot => mapOfficialBot(bot, origin))
    : []
  const community = source === 'all' || source === 'community'
    ? await loadCommunityTasks(origin)
    : []

  let tasks = [...official, ...community]

  if (category.trim()) {
    tasks = tasks.filter(task => task.category === category)
  }

  if (query) {
    tasks = tasks.filter(task =>
      task.title.toLowerCase().includes(query) ||
      task.role.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query) ||
      task.author.toLowerCase().includes(query) ||
      task.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  tasks.sort((left, right) => {
    if (left.source !== right.source) return left.source === 'official' ? -1 : 1
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  })

  return {
    tasks: tasks.slice(safeOffset, safeOffset + safeLimit),
    total: tasks.length,
  }
}

export async function getAgentTask(source: AgentSource, taskId: string, origin?: string) {
  if (source === 'official') {
    const bot = bots.find(entry => entry.id === taskId)
    return bot ? mapOfficialBot(bot, origin) : null
  }

  const community = await loadCommunityTasks(origin)
  return community.find(task => task.taskId === taskId) || null
}

function toCommandPayload(input: ClaimAgentTaskInput) {
  const payload = {
    source: input.source,
    task_id: input.taskId,
    agent: input.agent || 'openclaw',
    channel: input.channel || 'chat',
    operator: input.operator || DEFAULT_OPERATOR,
    thread: input.thread || DEFAULT_THREAD,
    handoff: input.handoff || DEFAULT_HANDOFF,
    monthly_price: input.monthlyPrice,
    commission_rate: input.commissionRate,
    compensation_model: input.compensationModel,
    skill: input.skill || 'openclaw-task-pickup',
  }

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
}

function buildTaskRef(task: AgentTask) {
  return `${task.source}:${task.taskId}`
}

export function createAgentClaim(task: AgentTask, input: ClaimAgentTaskInput): AgentClaimResult {
  const claimId = crypto.randomUUID()
  const origin = input.origin
  const packet = createOnboardingPacket({
    origin,
    source: task.source,
    taskId: task.taskId,
    claimId,
    title: task.title,
    role: task.role,
    description: task.description,
    brief: [
      `Task: ${task.title}`,
      `Role: ${task.role}`,
      `Claim ID: ${claimId}`,
      `Author: ${task.author}`,
      '',
      ...task.onboardingItems.map(item => `- ${item}`),
    ].join('\n'),
    bullets: task.onboardingItems,
    agent: input.agent || 'openclaw',
    channel: input.channel || 'chat',
    monthlyPrice: input.monthlyPrice ?? task.monthlyPrice,
    commissionRate: input.commissionRate ?? task.commissionRate,
    compensationModel: input.compensationModel ?? task.compensationModel,
    skill: input.skill || 'openclaw-task-pickup',
    operator: input.operator || DEFAULT_OPERATOR,
    thread: input.thread || DEFAULT_THREAD,
    handoff: input.handoff || DEFAULT_HANDOFF,
  })

  const commandPayload = JSON.stringify(toCommandPayload(input))
  const originPrefix = (origin || 'https://www.moltcompany.ai').replace(/\/+$/, '')
  const taskRef = buildTaskRef(task)

  return {
    claimId,
    taskRef,
    task,
    packet,
    prompt: buildAgentLaunchPrompt(packet),
    commands: {
      install: 'npm install -g openclaw@latest',
      onboard: 'openclaw onboard --install-daemon',
      dashboard: 'openclaw dashboard',
      bundle: 'git clone https://github.com/deonmenezes/moltcompany.git && cd moltcompany && openclaw plugins install .',
      listCurl: `curl -fsSL "${originPrefix}/api/openclaw/tasks?source=${task.source}&limit=20"`,
      taskCurl: `curl -fsSL "${originPrefix}/api/openclaw/tasks?taskRef=${taskRef}"`,
      claimCurl: `curl -fsSL -X POST "${originPrefix}/api/openclaw/claim" -H "Content-Type: application/json" -d '${commandPayload}'`,
      listCli: `npx moltcompany tasks --origin "${originPrefix}" --source ${task.source} --limit 20`,
      taskCli: `npx moltcompany task --origin "${originPrefix}" --task-ref ${taskRef}`,
      claimCli: `npx moltcompany claim --origin "${originPrefix}" --task-ref ${taskRef} --agent ${input.agent || 'openclaw'} --channel ${input.channel || 'chat'}`,
      connectOpenClaw: `npx moltcompany connect-openclaw --origin "${originPrefix}" --task-ref ${taskRef}`,
      mcpServer: `npx moltcompany mcp --origin "${originPrefix}"`,
      open: packet.onboardingUrl,
    },
  }
}
