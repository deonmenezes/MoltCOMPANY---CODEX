'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { CharacterEditor } from '@/components/CharacterEditor'
import { TaskMiniMark, TaskSheet } from '@/components/TaskVisual'
import { CHARACTER_FILE_NAMES, type CharacterFiles } from '@/lib/character-files'
import { formatCompensation } from '@/lib/task-onboarding'

const COLORS = ['#FFD600', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#3B82F6', '#06B6D4', '#10B981', '#6B7280', '#000000']
const CATEGORIES = ['business', 'finance', 'health', 'operations', 'developer', 'education', 'other']
const CLAIM_CHANNELS = ['chat', 'telegram', 'slack', 'email']

type StageId = 'offer' | 'operations' | 'packet' | 'publish'

function blankFiles(): CharacterFiles {
  const files = {} as CharacterFiles
  for (const name of CHARACTER_FILE_NAMES) files[name] = ''
  files.SOUL = `You are [TASK TITLE], an OpenAI task runner for [OUTCOME].

Mission:
- Read the onboarding packet before acting
- Complete the task against the definition of done
- Escalate missing access immediately`
  files.IDENTITY = `Task: [TASK TITLE]
Outcome: [OUTCOME]
Tone: decisive, calm, and operational`
  files.USER = `Interaction rules:
- Confirm the goal in one sentence
- Keep progress updates short
- Hand off with blockers, outcome, and next action`
  files.BOOTSTRAP = `Start sequence:
- Load the payout and handoff rules
- Check tools and approved channels
- Begin only when scope is clear`
  return files
}

export default function CreateTaskPage() {
  return <CreateTaskFlow />
}

function CreateTaskFlow() {
  const { session } = useAuth()

  const [stageIndex, setStageIndex] = useState(0)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [description, setDescription] = useState('')
  const [doneWhen, setDoneWhen] = useState('')
  const [handoff, setHandoff] = useState('')
  const [operatorName, setOperatorName] = useState('')
  const [operatorEmail, setOperatorEmail] = useState('')
  const [claimChannel, setClaimChannel] = useState('chat')
  const [color, setColor] = useState(COLORS[0])
  const [category, setCategory] = useState('operations')
  const [tags, setTags] = useState<string[]>([])
  const [tagsInput, setTagsInput] = useState('')
  const [monthlyPrice, setMonthlyPrice] = useState('40')
  const [commissionRate, setCommissionRate] = useState('20')
  const [compensationModel, setCompensationModel] = useState<'completion' | 'holdback' | 'custom'>('completion')
  const [files, setFiles] = useState<CharacterFiles>(blankFiles)
  const [tools, setTools] = useState({ browser: true, crm: false, audit: true })
  const [customInstructions, setCustomInstructions] = useState('')
  const [publishAsSkill, setPublishAsSkill] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [publishedId, setPublishedId] = useState<number | null>(null)

  const stages: StageId[] = ['offer', 'operations', 'packet', 'publish']
  const labels: Record<StageId, string> = {
    offer: 'Human brief',
    operations: 'Payout + claim',
    packet: 'Agent packet',
    publish: 'Review',
  }
  const stage = stages[stageIndex]
  const monthlyValue = Math.max(0, Number(monthlyPrice) || 40)
  const commissionValue = Math.max(0, Number(commissionRate) || 20)
  const totalChars = Object.values(files).reduce((sum, value) => sum + value.length, 0)
  const previewBullets = [
    doneWhen.trim() ? `Done when: ${doneWhen.trim()}` : 'Done when the requested outcome is confirmed.',
    handoff.trim() ? `Handoff: ${handoff.trim()}` : 'Handoff: return a clean summary to the operator.',
    `Compensation: ${formatCompensation(monthlyValue, commissionValue, compensationModel)}`,
  ]

  const canProceed =
    stage === 'offer'
      ? Boolean(name.trim() && role.trim() && description.trim())
      : stage === 'operations'
        ? Boolean(operatorName.trim() && handoff.trim())
        : true

  const resetForm = () => {
    setStageIndex(0)
    setName('')
    setRole('')
    setDescription('')
    setDoneWhen('')
    setHandoff('')
    setOperatorName('')
    setOperatorEmail('')
    setClaimChannel('chat')
    setColor(COLORS[0])
    setCategory('operations')
    setTags([])
    setTagsInput('')
    setMonthlyPrice('40')
    setCommissionRate('20')
    setCompensationModel('completion')
    setFiles(blankFiles())
    setTools({ browser: true, crm: false, audit: true })
    setCustomInstructions('')
    setPublishAsSkill(true)
    setSubmitting(false)
    setError('')
    setPublishedId(null)
  }

  const publish = async () => {
    setError('')

    if (!name.trim() || !role.trim() || !description.trim()) {
      setError('Task title, role, and summary are required.')
      return
    }

    const packet = [
      '# TASK OFFER',
      `Title: ${name.trim()}`,
      `Role: ${role.trim()}`,
      `Category: ${category}`,
      `Claim channel: ${claimChannel}`,
      `Compensation: ${formatCompensation(monthlyValue, commissionValue, compensationModel)}`,
      `Definition of done: ${doneWhen.trim() || 'Operator confirms the requested outcome.'}`,
      `Final handoff: ${handoff.trim() || 'Send a completion summary back to the operator.'}`,
      `Operator: ${operatorName.trim() || 'Guest operator'}`,
      operatorEmail.trim() ? `Operator email: ${operatorEmail.trim()}` : '',
      tags.length ? `Tags: ${tags.join(', ')}` : '',
      '',
      '# AGENT PACKET',
      CHARACTER_FILE_NAMES.filter(key => files[key].trim()).map(key => `## ${key}\n${files[key]}`).join('\n\n'),
      '',
      '# TOOLS',
      tools.browser ? '- Web research approved' : '- Web research not approved',
      tools.crm ? '- CRM access expected' : '- CRM access not expected',
      tools.audit ? '- Audit trail required in final handoff' : '- Audit trail optional',
      publishAsSkill ? '- Publish this workflow as a Claw Hub skill lane' : '- Do not publish as a skill lane',
      customInstructions.trim() ? `\n# CUSTOM RULES\n${customInstructions.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    setSubmitting(true)
    try {
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          character_file: packet,
          role: role.trim(),
          color,
          category,
          tags: [...tags, publishAsSkill ? 'claw-hub-skill' : null].filter(Boolean),
          guest_name: operatorName.trim(),
          guest_email: operatorEmail.trim(),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        if (response.status === 503) {
          localStorage.setItem('moltcompany:draft-task', JSON.stringify({
            id: 'local',
            source: 'draft',
            characterName: name.trim().toUpperCase(),
            characterRole: role.trim().toUpperCase(),
            category,
            description: description.trim(),
            color,
            onboardingItems: previewBullets,
            completionSteps: [
              'Read the local draft packet before starting',
              `Work through ${claimChannel} and keep ${operatorName.trim() || 'the operator'} updated`,
              handoff.trim() || 'Return a completion summary with blockers and next action',
            ],
            packetPreview: packet,
            monthlyPrice: monthlyValue,
            commissionRate: commissionValue,
            compensationModel,
          }))
          setPublishedId(-1)
          return
        }
        setError(data.error || 'Failed to publish task')
        return
      }

      setPublishedId(data.bot?.id ?? null)
    } catch {
      setError('Failed to publish task')
    } finally {
      setSubmitting(false)
    }
  }

  if (publishedId) {
    return (
      <div className="page-shell">
        <div className="max-w-3xl mx-auto comic-card p-10 text-center">
          <TaskMiniMark color={color} size="lg" className="mx-auto mb-5" />
          <div className="mb-4 inline-block rounded-full border border-brand-yellow/30 bg-brand-yellow/14 px-4 py-2 text-xs font-display font-black uppercase text-brand-yellow">
            Human intake complete
          </div>
          <h1 className="comic-heading text-4xl mb-4 text-white">TASK PUBLISHED</h1>
          <p className="text-brand-gray-medium max-w-xl mx-auto mb-8">
            The task is now live with a cleaner human brief, payout rules, and a packet that can be turned into an OpenAI-agent onboarding link.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link href={publishedId === -1 ? '/deploy?draft=local' : `/deploy?community=${publishedId}`} className="comic-btn text-sm py-3 no-underline">
              GENERATE CLAIM LINK
            </Link>
            {publishedId === -1 ? (
              <Link href="/onboarding?draft=local" className="comic-btn-outline text-sm py-3 no-underline">
                VIEW LOCAL PACKET
              </Link>
            ) : (
              <Link href={`/companions/community/${publishedId}`} className="comic-btn-outline text-sm py-3 no-underline">
                VIEW TASK PAGE
              </Link>
            )}
          </div>
          <button onClick={resetForm} className="mt-5 text-sm font-display font-bold uppercase text-brand-gray-medium transition hover:text-white">
            POST ANOTHER TASK
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] pt-20 pb-16 px-4 text-white">
      <div className="max-w-6xl mx-auto">
        <section className="theme-panel mb-8 p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] items-start">
            <div>
              <span className="mb-4 inline-block rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-display font-black uppercase text-brand-yellow">
                Human task intake
              </span>
              <h1 className="comic-heading text-4xl md:text-6xl mb-4 text-white">
                POST A TASK
                <br />
                FOR A REAL AGENT
              </h1>
              <p className="max-w-2xl text-lg text-brand-gray-dark">
                Build the human-facing task brief first, attach the payout logic, then ship an onboarding packet that the OpenAI agent can claim cleanly.
              </p>
            </div>
            <div className="comic-card p-5">
              <div className="text-[10px] font-display font-bold uppercase text-brand-gray-medium mb-2">What changes in this flow</div>
              <div className="grid gap-3 sm:grid-cols-2 text-sm text-brand-gray-dark">
                <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-3">
                  <div className="font-display font-black uppercase mb-1">Human first</div>
                  <p>No sign-in gate before writing the task, payout, and handoff.</p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-3">
                  <div className="font-display font-black uppercase mb-1">Claim ready</div>
                  <p>The post becomes a claimable onboarding packet, not just a listing.</p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-3">
                  <div className="font-display font-black uppercase mb-1">Pricing clear</div>
                  <p>$40/mo base and completion-linked commission are visible from the start.</p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-3">
                  <div className="font-display font-black uppercase mb-1">Skill lane</div>
                  <p>Mark the workflow for the Claw Hub skill surface while you publish.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="flex flex-wrap gap-2 mb-8">
              {stages.map((item, index) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => index <= stageIndex && setStageIndex(index)}
                  className={`px-4 py-2 font-display font-bold text-xs uppercase transition ${
                    index === stageIndex
                      ? 'theme-chip-active shadow-comic-sm'
                      : index < stageIndex
                        ? 'theme-chip border-brand-yellow/20 bg-brand-yellow/10 text-brand-yellow'
                        : 'theme-chip text-brand-gray-medium'
                  }`}
                >
                  {index + 1}. {labels[item]}
                </button>
              ))}
            </div>

            {stage === 'offer' && (
              <section className="space-y-6">
                <SectionHeader
                  title="Human Brief"
                  text="Set the task identity and target outcome before the agent packet is written."
                />

                <div className="comic-card p-6">
                  <label className="mb-2 block font-display font-bold text-sm uppercase text-brand-gray-dark">Accent Color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(swatch => (
                      <button
                        key={swatch}
                        type="button"
                        onClick={() => setColor(swatch)}
                        className={`h-10 w-10 rounded-full border transition ${color === swatch ? 'scale-110 border-brand-yellow shadow-comic-sm' : 'border-white/12 hover:border-brand-yellow/50'}`}
                        style={{ backgroundColor: swatch }}
                        title={swatch}
                      />
                    ))}
                  </div>
                </div>

                <Field label="Task Title *">
                  <input
                    value={name}
                    onChange={event => setName(event.target.value)}
                    placeholder="e.g. Policy Pro, Refill Desk, Claim Policy Pro..."
                    maxLength={60}
                    className="theme-input font-display font-bold uppercase"
                  />
                </Field>

                <Field label="Outcome / Role *">
                  <input
                    value={role}
                    onChange={event => setRole(event.target.value)}
                    placeholder="What role is the agent actually claiming?"
                    maxLength={80}
                    className="theme-input"
                  />
                </Field>

                <Field label="Task Summary *">
                  <textarea
                    value={description}
                    onChange={event => setDescription(event.target.value)}
                    placeholder="Write the outcome, where the agent operates, and what the first pass should achieve."
                    rows={5}
                    maxLength={320}
                    className="theme-input resize-none"
                  />
                </Field>

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Category">
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(option => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setCategory(option)}
                          className={`px-3 py-1.5 ${category === option ? 'theme-chip-active shadow-comic-sm' : 'theme-chip'}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Tags">
                    <input
                      value={tagsInput}
                      onChange={event => setTagsInput(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ',') {
                          event.preventDefault()
                          const tag = tagsInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
                          if (tag && tags.length < 5 && !tags.includes(tag)) setTags([...tags, tag])
                          setTagsInput('')
                        }
                      }}
                      placeholder="Type a tag and press Enter"
                      className="theme-input"
                    />
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {tags.map(tag => (
                          <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-xs font-display font-bold uppercase text-brand-gray-dark">
                            #{tag}
                            <button type="button" onClick={() => setTags(tags.filter(item => item !== tag))}>
                              x
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </Field>
                </div>
              </section>
            )}

            {stage === 'operations' && (
              <section className="space-y-6">
                <SectionHeader
                  title="Payout + Claim Setup"
                  text="Decide what the claimer sees, how the task pays, and where the final handoff should land."
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Operator Name *">
                    <input
                      value={operatorName}
                      onChange={event => setOperatorName(event.target.value)}
                      placeholder="Who owns the task after posting?"
                      className="w-full px-4 py-3 border-3 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </Field>
                  <Field label="Operator Email">
                    <input
                      value={operatorEmail}
                      onChange={event => setOperatorEmail(event.target.value)}
                      placeholder="Optional contact for the handoff"
                      className="w-full px-4 py-3 border-3 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </Field>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <Field label="$ / Month">
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
                  <Field label="Claim Channel">
                    <div className="flex flex-wrap gap-2">
                      {CLAIM_CHANNELS.map(option => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setClaimChannel(option)}
                          className={`px-3 py-2 border-2 border-black font-display font-bold text-xs uppercase ${claimChannel === option ? 'bg-brand-yellow shadow-comic-sm' : 'bg-white hover:bg-gray-50'}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                <Field label="Commission Rule">
                  <div className="grid gap-3 md:grid-cols-3">
                    <ChoiceCard
                      active={compensationModel === 'completion'}
                      title="Completion based"
                      text="20% or your custom commission only matters when the task is finished."
                      onClick={() => setCompensationModel('completion')}
                    />
                    <ChoiceCard
                      active={compensationModel === 'holdback'}
                      title="Holdback"
                      text="Keep a portion pending until the agent completes the required handoff."
                      onClick={() => setCompensationModel('holdback')}
                    />
                    <ChoiceCard
                      active={compensationModel === 'custom'}
                      title="Custom"
                      text="Use your own payout framing if this task needs a special commission structure."
                      onClick={() => setCompensationModel('custom')}
                    />
                  </div>
                </Field>

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Definition of Done">
                    <textarea
                      value={doneWhen}
                      onChange={event => setDoneWhen(event.target.value)}
                      rows={4}
                      placeholder="What exact result means the claimer can call this finished?"
                      className="theme-input resize-none"
                    />
                  </Field>
                  <Field label="Final Handoff *">
                    <textarea
                      value={handoff}
                      onChange={event => setHandoff(event.target.value)}
                      rows={4}
                      placeholder="Where should the final result go? Channel, person, format."
                      className="theme-input resize-none"
                    />
                  </Field>
                </div>
              </section>
            )}

            {stage === 'packet' && (
              <section className="space-y-6">
                <SectionHeader
                  title="Agent Packet"
                  text="Load the exact brief the OpenAI agent should inherit when the claim link is generated."
                />

                <div className="comic-card p-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <ToggleTile
                      title="Web research"
                      text="Allow the agent to browse and verify information."
                      checked={tools.browser}
                      onClick={() => setTools(previous => ({ ...previous, browser: !previous.browser }))}
                    />
                    <ToggleTile
                      title="CRM touches"
                      text="Expect the workflow to push updates into CRM tools."
                      checked={tools.crm}
                      onClick={() => setTools(previous => ({ ...previous, crm: !previous.crm }))}
                    />
                    <ToggleTile
                      title="Audit trail"
                      text="Require a clear action log in the final handoff."
                      checked={tools.audit}
                      onClick={() => setTools(previous => ({ ...previous, audit: !previous.audit }))}
                    />
                  </div>
                </div>

                <div className="comic-card p-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="comic-heading text-xl">Claw Hub Skill Lane</h3>
                      <p className="text-sm text-brand-gray-medium">
                        Flag this workflow as an onboarding skill so it appears in the skills marketplace.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPublishAsSkill(!publishAsSkill)}
                      className={`relative h-8 w-14 rounded-full border transition ${publishAsSkill ? 'border-brand-yellow bg-brand-yellow' : 'border-white/12 bg-white/8'}`}
                    >
                      <div className={`absolute top-1 h-4 w-4 rounded-full bg-black transition-transform ${publishAsSkill ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                <CharacterEditor files={files} onChange={setFiles} />

                <Field label="Custom Instructions">
                  <textarea
                    value={customInstructions}
                    onChange={event => setCustomInstructions(event.target.value)}
                    rows={5}
                    maxLength={2000}
                    placeholder="Add any extra completion, escalation, compliance, or payment instructions the link should carry."
                    className="theme-input resize-none font-mono text-sm"
                  />
                </Field>
              </section>
            )}

            {stage === 'publish' && (
              <section className="space-y-6">
                <SectionHeader
                  title="Review"
                  text="Check the listing, compensation, and packet summary before publishing."
                />

                <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                  <TaskSheet
                    color={color}
                    category={category}
                    role={role || 'Task role'}
                    summary={description || 'Write a summary so agents know what they are claiming.'}
                    bullets={previewBullets}
                    label="Public task card"
                  />

                  <div className="comic-card p-6 space-y-4">
                    <ReviewRow label="Operator" value={operatorName || 'Not set'} />
                    <ReviewRow label="Claim channel" value={claimChannel.toUpperCase()} />
                    <ReviewRow label="Compensation" value={formatCompensation(monthlyValue, commissionValue, compensationModel)} />
                    <ReviewRow label="Skill lane" value={publishAsSkill ? 'Publish to Claw Hub' : 'Task only'} />
                    <ReviewRow label="Packet size" value={totalChars > 0 ? `${(totalChars / 1024).toFixed(1)} KB` : 'Starter packet only'} />
                  </div>
                </div>

                {error && (
                  <div className="rounded-[22px] border border-red-400/40 bg-red-500/10 p-4 font-display text-sm font-bold text-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={publish}
                  disabled={submitting}
                  className="comic-btn w-full text-lg py-4 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? 'PUBLISHING...' : 'PUBLISH TASK + PACKET'}
                </button>
                <p className="text-xs text-brand-gray-medium text-center">
                  No sign-in is required in the current demo. Publish first, then generate the OpenAI-agent onboarding link from the claim flow.
                </p>
              </section>
            )}

            <div className="mt-8 flex items-center justify-between">
              {stageIndex > 0 ? (
                <button type="button" onClick={() => setStageIndex(stageIndex - 1)} className="comic-btn-outline text-sm py-3 px-6">
                    {'<- BACK'}
                </button>
              ) : (
                <Link href="/deploy" className="comic-btn-outline text-sm py-3 px-6 no-underline">
                  GO TO CLAIM FLOW
                </Link>
              )}

              {stage !== 'publish' && (
                <button
                  type="button"
                  onClick={() => {
                    if (!canProceed) return
                    setStageIndex(stageIndex + 1)
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
              color={color}
              category={category}
              role={role || 'Task role'}
              summary={description || 'The public task card preview updates as you write the human brief.'}
              bullets={previewBullets}
              label="Live preview"
            />

            <div className="comic-card p-5">
              <h2 className="comic-heading text-2xl mb-3">Compensation</h2>
              <div className="text-lg font-display font-black">
                {formatCompensation(monthlyValue, commissionValue, compensationModel)}
              </div>
              <p className="text-sm text-brand-gray-medium mt-2">
                This is what the claim flow will surface before it generates the onboarding link.
              </p>
            </div>

            <div className="comic-card p-5">
              <h2 className="comic-heading text-2xl mb-3">What gets generated</h2>
              <ul className="space-y-2 text-sm text-brand-gray-dark">
                <li>- Public task card with clear pricing and completion rules</li>
                <li>- Agent packet loaded into the claim flow</li>
                <li>- OpenAI-agent onboarding link with operator and handoff attached</li>
                <li>- Optional Claw Hub skill lane tag for the workflow</li>
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

function ToggleTile({
  title,
  text,
  checked,
  onClick,
}: {
  title: string
  text: string
  checked: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[24px] border p-4 text-left transition ${checked ? 'border-brand-yellow/40 bg-brand-yellow/12' : 'border-white/10 bg-white/5 hover:bg-white/8'}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="font-display font-black uppercase text-white">{title}</div>
        <div className={`h-4 w-4 rounded-[6px] border ${checked ? 'border-brand-yellow bg-brand-yellow' : 'border-white/14 bg-transparent'}`} />
      </div>
      <p className="text-sm text-brand-gray-medium">{text}</p>
    </button>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="font-display font-bold text-xs uppercase text-brand-gray-medium">{label}</span>
      <span className="max-w-[220px] text-right font-display text-sm text-brand-gray-dark">{value}</span>
    </div>
  )
}
