'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { bots, categories } from '@/lib/bots'
import { TaskMiniMark, TaskSheet } from '@/components/TaskVisual'
import { formatCompensation } from '@/lib/task-onboarding'

type CommunityBot = {
  id: number
  name: string
  bot_name: string
  description: string
  icon_url: string | null
  author_name: string
  upvotes: number
  downvotes: number
  created_at: string
}

type Filter = 'all' | 'verified' | 'community' | string

export default function CompanionsPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [communityBots, setCommunityBots] = useState<CommunityBot[]>([])
  const [loadingCommunity, setLoadingCommunity] = useState(true)

  useEffect(() => {
    fetch('/api/community')
      .then(r => r.json())
      .then(data => setCommunityBots(data.bots || []))
      .catch(() => {})
      .finally(() => setLoadingCommunity(false))
  }, [])

  // Filter logic
  const filteredOfficial = bots.filter(b => {
    if (filter === 'community') return false
    if (filter === 'all' || filter === 'verified') return true
    return b.category === filter
  })

  const showCommunity = filter === 'all' || filter === 'community'

  const filterOptions: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'verified', label: 'Verified' },
    { id: 'community', label: 'Community' },
    ...categories.filter(c => c.id !== 'all').map(c => ({ id: c.id as Filter, label: c.label })),
  ]

  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="comic-heading text-3xl">ALL AI AGENT TASKS</h1>
            <p className="text-sm text-brand-gray-medium mt-1">Browse official task packs and community-posted OpenClaw workflows</p>
          </div>
          <Link href="/create" className="comic-btn text-sm py-2 px-5 whitespace-nowrap">
            POST A TASK
          </Link>
        </div>

        {/* Amazon-style filter bar */}
        <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b-2 border-black/10">
          {filterOptions.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 border-3 border-black font-display font-bold text-xs uppercase transition-all duration-200 ${
                filter === f.id
                  ? 'bg-brand-yellow shadow-comic-sm'
                  : 'bg-white hover:bg-gray-50 hover:-translate-y-0.5'
              }`}
            >
              {f.label}
              {f.id === 'verified' && (
                <span className="ml-1 text-[10px] bg-green-500 text-white px-1.5 py-0.5 -mr-1 font-bold">&#10003;</span>
              )}
            </button>
          ))}
        </div>

        {/* Verified / Official Jobs */}
        {filteredOfficial.length > 0 && (
          <section className="mb-12">
            {filter !== 'verified' && filter !== 'all' && filter !== 'community' ? null : (
              <div className="flex items-center gap-2 mb-6">
                <h2 className="comic-heading text-xl">
                  {filter === 'verified' ? 'VERIFIED TASK PACKS' : filter === 'community' ? '' : 'VERIFIED TASK PACKS'}
                </h2>
                <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-display font-bold uppercase border border-green-700">
                  Official
                </span>
              </div>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOfficial.map(bot => (
                <OfficialCard key={bot.id} bot={bot} />
              ))}
            </div>
          </section>
        )}

        {/* Community Jobs */}
        {showCommunity && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="comic-heading text-xl">COMMUNITY TASK PACKS</h2>
              <span className="px-2 py-0.5 bg-purple-500 text-white text-[10px] font-display font-bold uppercase border border-purple-700">
                OpenClaw
              </span>
            </div>
            {loadingCommunity ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-3 border-brand-yellow border-t-transparent rounded-full" />
              </div>
            ) : communityBots.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {communityBots.map(bot => (
                  <CommunityCard key={bot.id} bot={bot} />
                ))}
              </div>
            ) : (
              <div className="comic-card p-8 text-center">
                <p className="text-brand-gray-medium mb-4">No public task packs yet. Be the first to post one.</p>
                <Link href="/create" className="comic-btn-outline text-sm inline-block">
                  POST YOUR TASK
                </Link>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

function OfficialCard({ bot }: { bot: typeof bots[number] }) {
  return (
    <div className="comic-card-hover flex flex-col">
      <Link href={`/companion/${bot.id}`} className="p-6 pb-2 hover:bg-gray-50/50 transition">
        <div className="flex items-center gap-3 mb-3">
          <TaskMiniMark color={bot.color} size="lg" />
          <h3 className="comic-heading text-2xl">{bot.characterName}</h3>
          <span className="text-green-500 text-sm" title="Verified">&#10003;</span>
        </div>
        <TaskSheet
          color={bot.color}
          category={bot.category}
          role={bot.characterRole}
          summary={bot.description}
          bullets={bot.onboardingItems}
          className="mt-4"
        />
      </Link>
      <div className="p-6 pt-4 mt-auto">
        <div className="flex items-baseline justify-center gap-2 mb-4">
          <span className="comic-heading text-3xl">${bot.monthlyPrice}</span>
          <span className="text-brand-gray-medium font-medium text-sm">/month</span>
        </div>
        <p className="text-center text-[10px] font-display font-black uppercase text-brand-gray-medium mb-4">
          {formatCompensation(bot.monthlyPrice, bot.commissionRate ?? 20, bot.compensationModel ?? 'completion')}
        </p>
        <div className="flex gap-2">
          <Link href={`/companion/${bot.id}`} className="comic-btn-outline block text-center flex-1 text-sm">
            VIEW TASK
          </Link>
          <Link href={`/deploy?model=${bot.id}`} className="comic-btn block text-center flex-1 text-sm">
            CLAIM + LINK
          </Link>
        </div>
      </div>
    </div>
  )
}

function CommunityCard({ bot }: { bot: CommunityBot }) {
  return (
    <div className="comic-card-hover flex flex-col">
      <Link href={`/companions/community/${bot.id}`} className="p-6 pb-2 hover:bg-gray-50/50 transition">
        <div className="flex items-center gap-3 mb-3">
          <TaskMiniMark color="#A855F7" size="lg" />
          <h3 className="comic-heading text-xl">{bot.name || bot.bot_name}</h3>
        </div>
        <span className="text-[10px] text-brand-gray-medium font-display mt-1 block">
          by {bot.author_name}
        </span>
        <TaskSheet
          color="#A855F7"
          category="community"
          role="COMMUNITY TASK"
          summary={bot.description || 'A community-posted task pack for OpenClaw agents'}
          bullets={[
            bot.description || 'Community onboarding brief included',
            `Posted by ${bot.author_name}`,
            'Review the shared workflow before launch',
          ]}
          className="mt-4"
        />
      </Link>
      <div className="p-6 pt-4 mt-auto">
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="flex items-center gap-1 text-sm font-bold text-green-600">
            &#9650; {bot.upvotes || 0}
          </span>
          <span className="flex items-center gap-1 text-sm font-bold text-red-500">
            &#9660; {bot.downvotes || 0}
          </span>
        </div>
        <Link
          href={`/companions/community/${bot.id}`}
          className="comic-btn-outline block text-center w-full text-sm"
        >
          VIEW TASK
        </Link>
      </div>
    </div>
  )
}
