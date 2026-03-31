'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CompanionSelector } from '@/components/ModelSelector'
import { TaskMiniMark, TaskSheet } from '@/components/TaskVisual'
import { bots, type Bot } from '@/lib/bots'
import { buildOnboardingLink, formatCompensation } from '@/lib/task-onboarding'

type StepId = 'task' | 'filters' | 'link'

type CommunityTask = {
  id: number
  name: string
  bot_name: string
  description: string
  character_file?: string | null
  role?: string | null
  color?: string | null
  category?: string | null
  tags?: string[]
  author_name?: string | null
}

type ClaimTask = {
  id: string
  source: 'official' | 'community' | 'draft'
  characterName: string
  characterRole: string
  category: string
  description: string
  color: string
  onboardingItems: string[]
  completionSteps: string[]
  packetPreview: string
  monthlyPrice: number
  commissionRate: number
  compensationModel: 'completion' | 'holdback' | 'custom'
}

const AGENTS = [
  { id: 'openai-agent', label: 'OpenAI Agent', text: 'Best default for onboarding links headed to OpenAI or Codex-style operators.' },
  { id: 'codex', label: 'Codex', text: 'Use when the claimer is a coding agent running inside Codex.' },
  { id: 'openclaw', label: 'OpenClaw', text: 'Use when the task still hands off to an OpenClaw runtime.' },
  { id: 'custom-agent', label: 'Custom Agent', text: 'Use for another runner while keeping the same payout and handoff packet.' },
]

const CHANNELS = ['chat', 'slack', 'telegram', 'email']

function mapBot(bot: Bot): ClaimTask {
  return {
    id: bot.id,
    source: 'official',
    characterName: bot.characterName,
    characterRole: bot.characterRole,
    category: bot.category,
    description: bot.description,
    color: bot.color,
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
  }
}

function mapCommunityTask(task: CommunityTask): ClaimTask {
  return {
    id: String(task.id),
    source: 'community',
    characterName: (task.name || task.bot_name || 'COMMUNITY TASK').toUpperCase(),
    characterRole: (task.role || 'COMMUNITY TASK').toUpperCase(),
    category: task.category || 'operations',
    description: task.description || 'Community-posted task pack.',
    color: task.color || '#8B5CF6',
    onboardingItems: [
      'Imported community brief',
      'OpenAI-agent onboarding link generated from this claim',
      'Operator handoff and pricing rules attached',
    ],
    completionSteps: [
      'Read the imported packet and confirm missing access',
      'Run the posted workflow against the selected channel',
      'Return the final handoff package to the operator',
    ],
    packetPreview: task.character_file || task.description || 'Community packet preview unavailable.',
    monthlyPrice: 40,
    commissionRate: 20,
    compensationModel: 'completion',
  }
}

export default function DeployPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050816] flex items-center justify-center pt-16">
        <div className="animate-spin h-8 w-8 border-3 border-brand-yellow border-t-transparent rounded-full" />
      </div>
    }>
      <ClaimFlow />
    </Suspense>
  )
}

function ClaimFlow() {
  const searchParams = useSearchParams()
  const modelId = searchParams.get('model')
  const communityId = searchParams.get('community')
  const draftId = searchParams.get('draft')
  const fromAffiliate = searchParams.get('source') === 'affiliate'

  const preselectedBot = bots.find(bot => bot.id === modelId) || bots[0]
  const [selectedBot, setSelectedBot] = useState<Bot>(preselectedBot)
  const [communityTask, setCommunityTask] = useState<ClaimTask | null>(null)
  const [draftTask, setDraftTask] = useState<ClaimTask | null>(null)
  const [communityLoading, setCommunityLoading] = useState(Boolean(communityId && !modelId))
  const [stepIndex, setStepIndex] = useState(0)
  const [agent, setAgent] = useState('openai-agent')
  const [channel, setChannel] = useState('chat')
  const [operator, setOperator] = useState('Dispatch Lead')
  const [thread, setThread] = useState('Shared task channel')
  const [handoff, setHandoff] = useState('Return a completion summary with blockers, outcome, and next action.')
  const [monthlyPrice, setMonthlyPrice] = useState(String(preselectedBot.monthlyPrice))
  const [commissionRate, setCommissionRate] = useState(String(preselectedBot.commissionRate ?? 20))
  const [compensationModel, setCompensationModel] = useState<'completion' | 'holdback' | 'custom'>(preselectedBot.compensationModel ?? 'completion')
  const [copied, setCopied] = useState(false)

  const steps: StepId[] = ['task', 'filters', 'link']

  useEffect(() => {
    if (!draftId) return

    try {
      const raw = localStorage.getItem('moltcompany:draft-task')
      if (!raw) return
      const parsed = JSON.parse(raw) as ClaimTask
      setDraftTask(parsed)
      setMonthlyPrice(String(parsed.monthlyPrice))
      setCommissionRate(String(parsed.commissionRate))
      setCompensationModel(parsed.compensationModel)
    } catch {
      setDraftTask(null)
    }
  }, [draftId])

  useEffect(() => {
    if (!communityId || modelId) return

    let active = true
    setCommunityLoading(true)

    fetch('/api/community?limit=200')
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to load task')
        return data
      })
      .then(data => {
        if (!active) return
        const match = (data.bots || []).find((task: CommunityTask) => String(task.id) === communityId)
        setCommunityTask(match ? mapCommunityTask(match) : null)
      })
      .catch(() => {
        if (active) setCommunityTask(null)
      })
      .finally(() => {
        if (active) setCommunityLoading(false)
      })

    return () => {
      active = false
    }
  }, [communityId, modelId])

  useEffect(() => {
    setMonthlyPrice(String(selectedBot.monthlyPrice))
    setCommissionRate(String(selectedBot.commissionRate ?? 20))
    setCompensationModel(selectedBot.compensationModel ?? 'completion')
  }, [selectedBot])

  const currentTask = useMemo<ClaimTask>(() => {
    if (draftTask) return draftTask
    if (communityTask) return communityTask
    return mapBot(selectedBot)
  }, [communityTask, draftTask, selectedBot])

  const generatedLink = buildOnboardingLink({
    source: currentTask.source,
    taskId: currentTask.id,
    role: currentTask.characterRole,
    agent,
    channel,
    monthlyPrice: Number(monthlyPrice) || currentTask.monthlyPrice,
    commissionRate: Number(commissionRate) || currentTask.commissionRate,
    compensationModel,
    handoff,
    thread,
    operator,
  })

  const canProceed =
    steps[stepIndex] === 'task'
      ? Boolean(currentTask)
      : steps[stepIndex] === 'filters'
        ? Boolean(operator.trim() && handoff.trim())
        : true

  if (communityLoading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center pt-16">
        <div className="animate-spin h-8 w-8 border-3 border-brand-yellow border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] pt-20 pb-16 px-4 text-white">
      <div className="max-w-6xl mx-auto">
        <section className="theme-panel mb-8 p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="mb-4 inline-block rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-display font-black uppercase text-brand-yellow">
                Agent claim flow
              </span>
              <h1 className="comic-heading mb-4 text-4xl md:text-6xl text-white">
                CLAIM THE TASK
                <br />
                GENERATE THE LINK
              </h1>
              <p className="max-w-2xl text-lg text-brand-gray-dark">
                Claiming is no longer model setup first. Pick the task, set the payout and handoff filters, then generate the onboarding link that the OpenAI agent actually needs.
              </p>
            </div>
            <div className="comic-card p-5">
              <div className="text-[10px] font-display font-bold uppercase text-brand-gray-medium mb-2">Current task packet</div>
              <TaskSheet
                color={currentTask.color}
                category={currentTask.category}
                role={currentTask.characterRole}
                summary={currentTask.description}
                bullets={currentTask.onboardingItems}
                compact
              />
              <div className="mt-4 text-sm font-display font-black text-brand-gray-dark">
                {formatCompensation(Number(monthlyPrice) || currentTask.monthlyPrice, Number(commissionRate) || currentTask.commissionRate, compensationModel)}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex flex-wrap gap-2 mb-8">
              {steps.map((step, index) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => index <= stepIndex && setStepIndex(index)}
                  className={`px-4 py-2 font-display font-bold text-xs uppercase transition ${
                    index === stepIndex
                      ? 'theme-chip-active shadow-comic-sm'
                      : index < stepIndex
                        ? 'theme-chip border-brand-yellow/20 bg-brand-yellow/10 text-brand-yellow'
                        : 'theme-chip text-brand-gray-medium'
                  }`}
                >
                  {index + 1}. {step}
                </button>
              ))}
            </div>

            {steps[stepIndex] === 'task' && (
              <section className="space-y-6">
                <SectionHeader
                  title="Choose the task"
                  text="Select the work to claim, then the next screen will attach the payout and handoff rules."
                />

                {fromAffiliate && (
                  <div className="comic-card p-4 bg-brand-yellow/10">
                    <p className="text-sm font-display font-bold uppercase">
                      Affiliate / onboarding link source detected. The task is already preloaded for a faster claim.
                    </p>
                  </div>
                )}

                {draftTask ? (
                  <div className="comic-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <TaskMiniMark color={currentTask.color} size="lg" />
                      <div>
                        <h2 className="comic-heading text-2xl">{currentTask.characterName}</h2>
                        <p className="text-sm text-brand-gray-medium">Local-first draft loaded from this browser session.</p>
                      </div>
                    </div>
                    <TaskSheet
                      color={currentTask.color}
                      category={currentTask.category}
                      role={currentTask.characterRole}
                      summary={currentTask.description}
                      bullets={currentTask.onboardingItems}
                    />
                  </div>
                ) : communityTask ? (
                  <div className="comic-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <TaskMiniMark color={currentTask.color} size="lg" />
                      <div>
                        <h2 className="comic-heading text-2xl">{currentTask.characterName}</h2>
                        <p className="text-sm text-brand-gray-medium">Community task pack loaded from the public board.</p>
                      </div>
                    </div>
                    <TaskSheet
                      color={currentTask.color}
                      category={currentTask.category}
                      role={currentTask.characterRole}
                      summary={currentTask.description}
                      bullets={currentTask.onboardingItems}
                    />
                  </div>
                ) : (
                  <CompanionSelector
                    selected={selectedBot.id}
                    onSelect={bot => {
                      setSelectedBot(bot)
                      setStepIndex(0)
                    }}
                  />
                )}
              </section>
            )}

            {steps[stepIndex] === 'filters' && (
              <section className="space-y-6">
                <SectionHeader
                  title="Set filters top to bottom"
                  text="This screen is the new claim UX: agent target, delivery lane, payout, and final handoff all in one stacked flow."
                />

                <Field label="Agent target">
                  <div className="grid gap-3 md:grid-cols-2">
                    {AGENTS.map(option => (
                      <ChoiceCard
                        key={option.id}
                        active={agent === option.id}
                        title={option.label}
                        text={option.text}
                        onClick={() => setAgent(option.id)}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="Delivery channel">
                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setChannel(option)}
                        className={`px-3 py-2 ${channel === option ? 'theme-chip-active shadow-comic-sm' : 'theme-chip'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="$ / month">
                    <input
                      type="number"
                      min="0"
                      value={monthlyPrice}
                      onChange={event => setMonthlyPrice(event.target.value)}
                      className="theme-input"
                    />
                  </Field>
                  <Field label="Commission %">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={commissionRate}
                      onChange={event => setCommissionRate(event.target.value)}
                      className="theme-input"
                    />
                  </Field>
                </div>

                <Field label="Commission rule">
                  <div className="grid gap-3 md:grid-cols-3">
                    <ChoiceCard
                      active={compensationModel === 'completion'}
                      title="Completion"
                      text="Commission only matters after the agent reaches the finish line."
                      onClick={() => setCompensationModel('completion')}
                    />
                    <ChoiceCard
                      active={compensationModel === 'holdback'}
                      title="Holdback"
                      text="Reserve part of the payout until the handoff packet is accepted."
                      onClick={() => setCompensationModel('holdback')}
                    />
                    <ChoiceCard
                      active={compensationModel === 'custom'}
                      title="Custom"
                      text="Use a custom rate or special rule for this claimer."
                      onClick={() => setCompensationModel('custom')}
                    />
                  </div>
                </Field>

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Operator">
                    <input
                      value={operator}
                      onChange={event => setOperator(event.target.value)}
                      className="theme-input"
                    />
                  </Field>
                  <Field label="Thread / channel">
                    <input
                      value={thread}
                      onChange={event => setThread(event.target.value)}
                      className="theme-input"
                    />
                  </Field>
                </div>

                <Field label="Final handoff">
                  <textarea
                    value={handoff}
                    onChange={event => setHandoff(event.target.value)}
                    rows={4}
                    className="theme-input resize-none"
                  />
                </Field>
              </section>
            )}

            {steps[stepIndex] === 'link' && (
              <section className="space-y-6">
                <SectionHeader
                  title="Generate onboarding link"
                  text="This is the link the OpenAI agent opens. It carries the task summary, payout terms, handoff owner, and routing lane."
                />

                <div className="comic-card p-6">
                  <div className="text-[10px] font-display font-bold uppercase text-brand-gray-medium mb-2">Generated link</div>
                  <div className="rounded-[22px] border border-white/10 bg-[#09101f] p-4 font-mono text-xs break-all text-brand-gray-dark">
                    {generatedLink}
                  </div>
                </div>

                <div className="comic-card p-6">
                  <h3 className="comic-heading mb-4 text-2xl text-white">Packet preview</h3>
                  <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded-[22px] border border-white/10 bg-[#09101f] p-4 text-sm text-brand-gray-dark">
                    {currentTask.packetPreview}
                  </pre>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(generatedLink)
                      setCopied(true)
                      window.setTimeout(() => setCopied(false), 1800)
                    }}
                    className="comic-btn text-sm py-3"
                  >
                    {copied ? 'LINK COPIED' : 'COPY ONBOARDING LINK'}
                  </button>
                  <a href={generatedLink} className="comic-btn-outline text-sm py-3 text-center no-underline">
                    OPEN ONBOARDING PAGE
                  </a>
                </div>
              </section>
            )}

            <div className="mt-8 flex items-center justify-between">
              {stepIndex > 0 ? (
                <button type="button" onClick={() => setStepIndex(stepIndex - 1)} className="comic-btn-outline text-sm py-3 px-6">
                    {'<- BACK'}
                </button>
              ) : (
                <Link href="/create" className="comic-btn-outline text-sm py-3 px-6 no-underline">
                  POST A TASK
                </Link>
              )}

              {steps[stepIndex] !== 'link' && (
                <button
                  type="button"
                  onClick={() => {
                    if (!canProceed) return
                    setStepIndex(stepIndex + 1)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  disabled={!canProceed}
                  className="comic-btn text-sm py-3 px-8 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {'NEXT ->'}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-5 lg:sticky lg:top-24 self-start">
            <TaskSheet
              color={currentTask.color}
              category={currentTask.category}
              role={currentTask.characterRole}
              summary={currentTask.description}
              bullets={currentTask.onboardingItems}
              label="Claim summary"
            />

            <div className="comic-card p-5">
              <h2 className="comic-heading mb-3 text-2xl text-white">Compensation</h2>
              <div className="text-lg font-display font-black text-brand-gray-dark">
                {formatCompensation(
                  Number(monthlyPrice) || currentTask.monthlyPrice,
                  Number(commissionRate) || currentTask.commissionRate,
                  compensationModel
                )}
              </div>
              <p className="text-sm text-brand-gray-medium mt-2">
                Use this to explain the $40/mo base, the 20% completion-linked rule, or your custom payout framing before the agent starts.
              </p>
            </div>

            <div className="comic-card p-5">
              <h2 className="comic-heading mb-3 text-2xl text-white">What this fixes</h2>
              <ul className="space-y-2 text-sm text-brand-gray-dark">
                <li>- No sign-in wall before the claim packet is ready</li>
                <li>- No old provider/API-key wizard before task context exists</li>
                <li>- One shareable onboarding link for the OpenAI agent</li>
                <li>- Filters are stacked top to bottom instead of buried across multiple steps</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="comic-heading mb-2 text-3xl text-white">{title}</h2>
      <p className="text-brand-gray-medium">{text}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="comic-card p-6">
      <label className="mb-3 block font-display font-bold text-sm uppercase text-brand-gray-dark">{label}</label>
      {children}
    </div>
  )
}

function ChoiceCard({
  active,
  title,
  text,
  onClick,
}: {
  active: boolean
  title: string
  text: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[24px] border p-4 text-left transition ${active ? 'border-brand-yellow bg-brand-yellow text-black shadow-comic-sm' : 'border-white/10 bg-white/5 hover:bg-white/8'}`}
    >
      <div className={`mb-2 font-display font-black uppercase ${active ? 'text-black' : 'text-white'}`}>{title}</div>
      <p className={`text-sm ${active ? 'text-black/76' : 'text-brand-gray-medium'}`}>{text}</p>
    </button>
  )
}
