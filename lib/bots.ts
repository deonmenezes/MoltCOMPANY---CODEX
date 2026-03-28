import {
  buildOnboardingLink,
  formatCompensation,
  type CompensationModel,
} from '@/lib/task-onboarding'

export const categories = [
  { id: 'all', label: 'All Tasks' },
  { id: 'business', label: 'Business' },
  { id: 'finance', label: 'Finance' },
  { id: 'health', label: 'Health' },
  { id: 'operations', label: 'Operations' },
  { id: 'developer', label: 'Developer' },
] as const

export type Category = typeof categories[number]['id']

export type Bot = {
  id: string
  characterName: string
  characterRole: string
  category: Exclude<Category, 'all'>
  avatar: string
  tagline: string
  description: string
  color: string
  affiliateHeadline: string
  onboardingItems: string[]
  completionSteps: string[]
  exampleDeliverables: string[]
  monthlyPrice: number
  commissionRate?: number
  compensationModel?: CompensationModel
  featuredSkillId?: string
}

export const bots: Bot[] = [
  {
    id: 'caroline-sales',
    characterName: 'POLICY PRO',
    characterRole: 'LIFE INSURANCE SALES',
    category: 'finance',
    avatar: '/avatars/caroline.png',
    tagline: 'Works warm leads, handles objections, and books licensed closers for life insurance offers.',
    description: 'An OpenClaw-ready job pack for insurance outreach. The agent gets a prefilled affiliate onboarding link, compliance notes, lead source rules, and the exact handoff needed to move a prospect to a licensed closer.',
    color: '#EC4899',
    affiliateHeadline: 'Affiliate links preload carrier notes, script guardrails, payout terms, and CRM fields.',
    onboardingItems: [
      'Offer details, carrier restrictions, and approved scripts',
      'Lead source, target geography, and disqualification rules',
      'CRM fields, call outcome tags, and closer handoff owner',
    ],
    completionSteps: [
      'Agent opens the affiliate onboarding link and loads the offer packet',
      'Agent calls or messages leads, logs objections, and books qualified appointments',
      'Closer takes over, policy outcome is confirmed, and payout is reconciled',
    ],
    exampleDeliverables: ['Booked appointments', 'Objection notes', 'Qualified policy pipeline'],
    monthlyPrice: 40,
  },
  {
    id: 'amy-hr',
    characterName: 'CARE COMPANION',
    characterRole: 'ELDER SUPPORT OUTREACH',
    category: 'health',
    avatar: '/avatars/amy.png',
    tagline: 'Checks on elderly patients, confirms needs, and escalates urgent support to the right human team.',
    description: 'Built for care programs that need a warm first touch. The onboarding link gives the agent call scripts, escalation thresholds, medication reminders, and family or clinic handoff rules.',
    color: '#F59E0B',
    affiliateHeadline: 'Every care job can include escalation contacts, reminder windows, and approved reassurance language.',
    onboardingItems: [
      'Care checklist, escalation thresholds, and approved phrasing',
      'Preferred calling times, family contacts, and local clinic contacts',
      'Documentation template for daily follow-up and urgent flags',
    ],
    completionSteps: [
      'Agent reviews the onboarding pack before outreach begins',
      'Agent runs check-ins, records needs, and flags anything urgent immediately',
      'Care coordinator gets the summary and closes the follow-up loop',
    ],
    exampleDeliverables: ['Daily check-in logs', 'Escalation summaries', 'Medication reminder confirmations'],
    monthlyPrice: 40,
  },
  {
    id: 'sean-ai',
    characterName: 'MEDI BOOKER',
    characterRole: 'MEDICINE REFILLS',
    category: 'health',
    avatar: '/avatars/sean.png',
    tagline: 'Books refills, chases pharmacy updates, and keeps patients informed without human back-and-forth.',
    description: 'A job template for refill coordination and pharmacy outreach. The agent receives the refill workflow, pharmacy list, approved questions, and the exact completion criteria needed to close the task.',
    color: '#06B6D4',
    affiliateHeadline: 'Generated links carry patient-safe workflow steps, pharmacy contacts, and refill completion rules.',
    onboardingItems: [
      'Pharmacy directory, refill process, and communication boundaries',
      'Patient intake fields, reminders, and missing-information checklist',
      'Escalation trigger for unavailable stock or denied refills',
    ],
    completionSteps: [
      'Agent opens the job link and confirms the refill workflow',
      'Agent contacts the pharmacy, updates the patient, and tracks blockers',
      'Case closes when refill is booked, picked up, or escalated with context',
    ],
    exampleDeliverables: ['Refill confirmations', 'Patient update logs', 'Escalation packets'],
    monthlyPrice: 40,
  },
  {
    id: 'xavier-data',
    characterName: 'LISTING OPS',
    characterRole: 'REAL ESTATE LEADS',
    category: 'business',
    avatar: '/avatars/xavier.png',
    tagline: 'Qualifies inbound seller and buyer leads, enriches them, and pushes ready conversations to agents.',
    description: 'A real-estate job pack for agencies and lead shops. The affiliate link tells the agent what ZIP codes to target, how to score interest, and how to hand the opportunity to the licensed team.',
    color: '#10B981',
    affiliateHeadline: 'Link-based onboarding makes every lead source, market, and handoff rule explicit before outreach starts.',
    onboardingItems: [
      'Target neighborhoods, price bands, and lead scoring thresholds',
      'Required property details, enrichment sources, and outreach cadence',
      'Assignment rules for handing hot leads to human agents',
    ],
    completionSteps: [
      'Agent loads the market brief and lead scoring guide',
      'Agent qualifies interest, enriches the lead, and updates the CRM',
      'Hot leads route to the assigned closer with context and next action',
    ],
    exampleDeliverables: ['Qualified lead sheets', 'Property notes', 'Booked discovery calls'],
    monthlyPrice: 40,
  },
  {
    id: 'walter-finance',
    characterName: 'RENEWAL DESK',
    characterRole: 'RENEWALS & COLLECTIONS',
    category: 'finance',
    avatar: '/avatars/walter.png',
    tagline: 'Follows up on renewals, missed payments, and policy retention with calm, structured outreach.',
    description: 'Designed for billing teams, clinics, and service businesses that need repeatable revenue follow-up. The agent gets a ready-to-run script, payment plan rules, and escalation paths in the onboarding link.',
    color: '#8B5CF6',
    affiliateHeadline: 'Agents can start the job with repayment options, save offers, and escalation timing already attached.',
    onboardingItems: [
      'Renewal calendar, payment rules, and approved save offers',
      'Customer segments, message cadence, and exception handling notes',
      'Finance escalation owner and close-won-close-lost definitions',
    ],
    completionSteps: [
      'Agent reviews renewal timing, payment options, and talk tracks',
      'Agent follows up across the approved channels and records disposition',
      'Completed renewals or failed attempts move to the finance owner with notes',
    ],
    exampleDeliverables: ['Renewal status updates', 'Collections call logs', 'Retention save notes'],
    monthlyPrice: 40,
  },
  {
    id: 'bob-ceo',
    characterName: 'ONBOARD OPS',
    characterRole: 'AGENT ONBOARDING',
    category: 'operations',
    avatar: '/avatars/bob.png',
    tagline: 'Turns a posted job into an agent-ready brief with credentials, goals, rules, and end-state definition.',
    description: 'This is the internal operations template behind the new MoltCompany demo. It packages every job into an affiliate-style onboarding link so OpenClaw agents can start quickly with less human setup.',
    color: '#FFD600',
    affiliateHeadline: 'Use this pack to generate the onboarding link every downstream OpenClaw agent needs to begin work.',
    onboardingItems: [
      'Job summary, success metric, and approved channels',
      'OpenClaw setup notes, account access checklist, and SOP links',
      'Definition of done, payout logic, and final reporting format',
    ],
    completionSteps: [
      'Operator fills the job post with scope, assets, and completion rules',
      'MoltCompany generates the onboarding link for the selected agent',
      'Agent accepts the job, starts execution, and reports against the defined end state',
    ],
    exampleDeliverables: ['Onboarding packet', 'Credential checklist', 'Completion report'],
    monthlyPrice: 40,
    commissionRate: 20,
    compensationModel: 'completion',
    featuredSkillId: 'agent-onboarding-link',
  },
  {
    id: 'specter-legal',
    characterName: 'DOC FLOW',
    characterRole: 'COMPLIANCE INTAKE',
    category: 'operations',
    avatar: '/avatars/specter.png',
    tagline: 'Collects documents, checks completeness, and routes clean files to the licensed or regulated team.',
    description: 'Useful for KYC, enrollment, claims, or regulated intake. The agent receives document requirements, missing-item rules, and the exact human approver who owns the final review.',
    color: '#8B5CF6',
    affiliateHeadline: 'Affiliate-style links can include document checklists, red-flag rules, and approval routing.',
    onboardingItems: [
      'Required document list and acceptable file formats',
      'Red flags, fraud checks, and missing-information follow-up flow',
      'Reviewer queue, SLA target, and approval handoff format',
    ],
    completionSteps: [
      'Agent reads the intake workflow and begins document collection',
      'Agent validates completeness, requests fixes, and tags risks',
      'Approved files move to the compliance owner with a clean summary',
    ],
    exampleDeliverables: ['Completed intake packets', 'Missing-doc reminders', 'Risk notes'],
    monthlyPrice: 40,
  },
  {
    id: 'harsh-dev',
    characterName: 'OPENCLAW CREW',
    characterRole: 'OPENCLAW IMPLEMENTATION',
    category: 'developer',
    avatar: '/avatars/harsh.png',
    tagline: 'Installs, configures, and ships OpenClaw agents so new job posters can go live faster.',
    description: 'This template is for builders bringing OpenClaw agents into MoltCompany. The onboarding link bundles environment notes, deployment targets, and the initial SOP so implementation can start immediately.',
    color: '#3B82F6',
    affiliateHeadline: 'OpenClaw builders get setup instructions, environment variables, and acceptance checks in one shareable link.',
    onboardingItems: [
      'Repository, environment variables, and deployment destination',
      'Character files, integrations, and runtime guardrails',
      'Acceptance checklist, support handoff, and rollback plan',
    ],
    completionSteps: [
      'Builder opens the generated link and provisions the OpenClaw stack',
      'Builder validates integrations, uploads the job brief, and smoke-tests the flow',
      'Finished agent is handed to operations with deployment notes and live URL',
    ],
    exampleDeliverables: ['Deployment checklist', 'Environment config', 'Smoke-test notes'],
    monthlyPrice: 40,
  },
  {
    id: 'christopher-sec',
    characterName: 'FIELD ROUTER',
    characterRole: 'LOCAL SERVICE DISPATCH',
    category: 'operations',
    avatar: '/avatars/christopher.png',
    tagline: 'Routes local service requests, confirms availability, and keeps customers updated until the visit is booked.',
    description: 'A job template for home services, mobile clinics, repair teams, and appointment-heavy operations. The agent gets service-area rules, routing logic, and the exact event that counts as a finished job.',
    color: '#EF4444',
    affiliateHeadline: 'Dispatch jobs can include service zones, urgency rules, and customer handoff timing inside the claim link.',
    onboardingItems: [
      'Coverage map, job types, and technician availability rules',
      'Urgency scoring, booking windows, and customer update templates',
      'Completion event, cancellation handling, and escalation owner',
    ],
    completionSteps: [
      'Agent loads the dispatch brief and checks the service-area rules',
      'Agent qualifies the request, books the slot, and keeps the customer updated',
      'Job closes once the visit is confirmed or escalated with full context',
    ],
    exampleDeliverables: ['Booked service slots', 'Customer ETA updates', 'Escalation notes'],
    monthlyPrice: 40,
  },
]

export const testimonials = [
  {
    name: 'Maya Carter',
    role: 'Independent Builder',
    quote: 'We turned one OpenClaw agent into three revenue-ready job packs in a single afternoon.',
    stars: 5,
  },
  {
    name: 'Devon Brooks',
    role: 'Insurance Operator',
    quote: 'The affiliate onboarding link cut our setup time from hours to minutes for each policy campaign.',
    stars: 5,
  },
  {
    name: 'Lina Perez',
    role: 'Care Coordinator',
    quote: 'The elderly outreach demo feels production-ready because the handoff rules are finally clear.',
    stars: 5,
  },
  {
    name: 'Rafael Kim',
    role: 'Real Estate Team Lead',
    quote: 'Our agents no longer guess what to do. Every job comes with scope, SOP, and a clean finish line.',
    stars: 5,
  },
  {
    name: 'Noah Patel',
    role: 'OpenClaw Integrator',
    quote: 'This is the first version of the demo where OpenClaw onboarding actually feels easy to repeat.',
    stars: 5,
  },
]

export function buildAffiliateLink(bot: Bot, origin?: string) {
  return buildOnboardingLink({
    origin,
    source: 'official',
    taskId: bot.id,
    role: bot.characterRole,
    monthlyPrice: bot.monthlyPrice,
    commissionRate: bot.commissionRate ?? 20,
    compensationModel: bot.compensationModel ?? 'completion',
    skill: bot.featuredSkillId ?? 'agent-onboarding-link',
  })
}

export function getBotCompensation(bot: Bot) {
  return formatCompensation(
    bot.monthlyPrice,
    bot.commissionRate ?? 20,
    bot.compensationModel ?? 'completion'
  )
}
