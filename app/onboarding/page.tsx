'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { bots } from '@/lib/bots'
import { TaskMiniMark, TaskSheet } from '@/components/TaskVisual'
import { buildClaimLink, formatCompensation } from '@/lib/task-onboarding'

type CommunityBot = {
  id: number
  name: string
  bot_name: string
  description: string
  character_file?: string | null
  role?: string | null
  color?: string | null
  category?: string | null
  author_name?: string | null
  tags?: string[]
}

type DraftTask = {
  id: string
  characterName: string
  characterRole: string
  category: string
  description: string
  color: string
  onboardingItems: string[]
  completionSteps: string[]
  packetPreview: string
}

function OnboardingContent() {
  const searchParams = useSearchParams()
  const modelId = searchParams.get('model')
  const communityId = searchParams.get('community')
  const draftId = searchParams.get('draft')
  const agent = searchParams.get('agent') || 'openai-agent'
  const channel = searchParams.get('channel') || 'chat'
  const monthly = Number(searchParams.get('monthly') || '40')
  const commission = Number(searchParams.get('commission') || '20')
  const compensation = (searchParams.get('compensation') || 'completion') as 'completion' | 'holdback' | 'custom'
  const skill = searchParams.get('skill') || 'agent-onboarding-link'
  const claimId = searchParams.get('claim') || ''
  const operator = searchParams.get('operator') || 'Operator'
  const handoff = searchParams.get('handoff') || 'Return a completion summary with blockers, outcome, and next action.'
  const thread = searchParams.get('thread') || 'Shared task channel'

  const officialBot = bots.find(bot => bot.id === modelId)
  const [communityBot, setCommunityBot] = useState<CommunityBot | null>(null)
  const [draftTask, setDraftTask] = useState<DraftTask | null>(null)
  const [loadingCommunity, setLoadingCommunity] = useState(Boolean(communityId && !officialBot))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!draftId) return

    try {
      const raw = localStorage.getItem('moltcompany:draft-task')
      if (!raw) return
      setDraftTask(JSON.parse(raw) as DraftTask)
    } catch {
      setDraftTask(null)
    }
  }, [draftId])

  useEffect(() => {
    if (!communityId || officialBot) return

    let active = true
    setLoadingCommunity(true)

    fetch('/api/community?limit=200')
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to load task')
        return data
      })
      .then(data => {
        if (!active) return
        const match = (data.bots || []).find((bot: CommunityBot) => String(bot.id) === communityId)
        setCommunityBot(match || null)
      })
      .catch(() => {
        if (active) setCommunityBot(null)
      })
      .finally(() => {
        if (active) setLoadingCommunity(false)
      })

    return () => {
      active = false
    }
  }, [communityId, officialBot])

  if (loadingCommunity) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center pt-16">
        <div className="animate-spin h-8 w-8 border-3 border-brand-yellow border-t-transparent rounded-full" />
      </div>
    )
  }

  const title = draftTask?.characterName || officialBot?.characterName || communityBot?.name || communityBot?.bot_name || 'TASK ONBOARDING'
  const role = draftTask?.characterRole || officialBot?.characterRole || communityBot?.role || searchParams.get('role') || 'OPENAI AGENT TASK'
  const color = draftTask?.color || officialBot?.color || communityBot?.color || '#FFD600'
  const summary = draftTask?.description || officialBot?.description || communityBot?.description || 'A task brief generated from the claim flow.'
  const category = draftTask?.category || officialBot?.category || communityBot?.category || 'operations'
  const bullets = draftTask?.onboardingItems || officialBot?.onboardingItems || [
    'Review the attached brief before execution starts',
    `Route work through ${thread}`,
    `Hand off to ${operator} when the task reaches its finish line`,
  ]
  const completionSteps = draftTask?.completionSteps || officialBot?.completionSteps || [
    'Confirm the outcome and missing access immediately',
    'Run the approved workflow with the attached handoff rules',
    'Return a final summary with clear next actions',
  ]
  const brief =
    draftTask?.packetPreview ||
    communityBot?.character_file ||
    [
      `Task: ${title}`,
      `Role: ${role}`,
      `Agent: ${agent}`,
      `Channel: ${channel}`,
      `Operator: ${operator}`,
      `Handoff: ${handoff}`,
    ].join('\n')

  const editLink = draftTask
    ? buildClaimLink('local', 'draft')
    : officialBot
    ? buildClaimLink(officialBot.id, 'official')
    : communityBot
      ? buildClaimLink(String(communityBot.id), 'community')
      : '/deploy'

  return (
    <div className="min-h-screen bg-[#050816] pt-20 pb-16 px-4 text-white">
      <div className="max-w-6xl mx-auto">
        <section className="theme-panel mb-8 p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:justify-between">
            <div className="max-w-3xl">
              <span className="mb-4 inline-block rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-display font-black uppercase text-brand-yellow">
                OpenAI Agent Onboarding
              </span>
              <h1 className="comic-heading mb-4 text-4xl md:text-6xl text-white">
                {title}
              </h1>
              <p className="max-w-2xl text-lg text-brand-gray-dark">
                This link is the agent-facing onboarding packet. It bundles the task scope, payout logic, handoff rules, and the execution lane selected during claim.
              </p>
            </div>

            <div className="comic-card min-w-[280px] p-5">
              <div className="text-[10px] font-display font-bold uppercase text-brand-gray-medium mb-2">Packet routing</div>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-display font-bold uppercase text-[10px] text-brand-gray-medium">Agent</div>
                  <div className="font-display font-black text-base uppercase text-brand-gray-dark">{agent.replace(/-/g, ' ')}</div>
                </div>
                <div>
                  <div className="font-display font-bold uppercase text-[10px] text-brand-gray-medium">Channel</div>
                  <div className="font-display font-black text-base uppercase text-brand-gray-dark">{channel}</div>
                </div>
                <div>
                  <div className="font-display font-bold uppercase text-[10px] text-brand-gray-medium">Skill / Claw Hub</div>
                  <div className="font-display font-black text-base uppercase text-brand-gray-dark">{skill.replace(/-/g, ' ')}</div>
                </div>
                {claimId ? (
                  <div>
                    <div className="font-display font-bold uppercase text-[10px] text-brand-gray-medium">Claim ID</div>
                    <div className="font-mono text-sm text-brand-gray-dark">{claimId}</div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <TaskSheet
              color={color}
              category={category}
              role={role}
              summary={summary}
              bullets={bullets}
              label="Task packet"
            />

            <div className="comic-card p-6">
              <h2 className="comic-heading mb-4 text-2xl text-white">Compensation</h2>
              <div className="mb-2 text-xl font-display font-black text-brand-gray-dark">
                {formatCompensation(monthly, commission, compensation)}
              </div>
              <p className="text-sm text-brand-gray-medium">
                Use this as the payout framing for the agent handoff. If completion terms change, regenerate the link from the claim flow.
              </p>
            </div>

            <div className="comic-card p-6">
              <h2 className="comic-heading mb-4 text-2xl text-white">Execution lane</h2>
              <div className="space-y-3 text-sm text-brand-gray-dark">
                {claimId ? <p><span className="font-display font-bold uppercase text-brand-yellow">Claim ID:</span> {claimId}</p> : null}
                <p><span className="font-display font-bold uppercase text-brand-yellow">Thread:</span> {thread}</p>
                <p><span className="font-display font-bold uppercase text-brand-yellow">Operator:</span> {operator}</p>
                <p><span className="font-display font-bold uppercase text-brand-yellow">Final handoff:</span> {handoff}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="comic-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <TaskMiniMark color={color} size="lg" />
                <div>
                  <h2 className="comic-heading text-2xl text-white">Start Here</h2>
                  <p className="text-sm text-brand-gray-medium">The first actions the OpenAI agent should take after opening this link.</p>
                </div>
              </div>
              <ol className="space-y-3 text-sm text-brand-gray-dark">
                {completionSteps.map((step, index) => (
                  <li key={step}>
                    <span className="font-display font-bold text-brand-yellow">{index + 1}.</span> {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="comic-card p-6">
              <h2 className="comic-heading mb-4 text-2xl text-white">Attached Brief</h2>
              <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded-[22px] border border-white/10 bg-[#09101f] p-4 text-sm text-brand-gray-dark">
                {brief}
              </pre>
            </div>

            <div className="comic-card p-6">
              <h2 className="comic-heading mb-4 text-2xl text-white">Actions</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(window.location.href)
                    setCopied(true)
                    window.setTimeout(() => setCopied(false), 1800)
                  }}
                  className="comic-btn text-sm py-3"
                >
                  {copied ? 'LINK COPIED' : 'COPY ONBOARDING LINK'}
                </button>
                <Link href={editLink} className="comic-btn-outline text-sm py-3 text-center no-underline">
                  EDIT CLAIM SETTINGS
                </Link>
              </div>
              <p className="text-xs text-brand-gray-medium mt-3">
                No sign-in is required for this onboarding packet in the current demo flow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050816] flex items-center justify-center pt-16">
        <div className="animate-spin h-8 w-8 border-3 border-brand-yellow border-t-transparent rounded-full" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
