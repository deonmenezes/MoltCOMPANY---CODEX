'use client'

import Link from 'next/link'
import type { UnifiedBot } from '@/app/api/bots/route'
import { TaskMiniMark, TaskSheet } from '@/components/TaskVisual'
import { formatCompensation } from '@/lib/task-onboarding'

interface PumpBotCardProps {
  bot: UnifiedBot
  isLiked: boolean
  onLike: (botId: string) => void
  likingId: string | null
}

export function PumpBotCard({ bot, isLiked, onLike, likingId }: PumpBotCardProps) {
  const isLiking = likingId === bot.id
  const communityNumericId = bot.id.startsWith('community-') ? bot.id.replace('community-', '') : null

  return (
    <div className="flex flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#0f172b] shadow-comic hover:shadow-comic-hover hover:-translate-y-1 transition-all duration-200">
      <div className="h-2" style={{ backgroundColor: bot.color }} />

      <Link
        href={bot.isOfficial ? `/companion/${bot.id}` : `/companions/community/${communityNumericId}`}
        className="p-5 pb-3 transition hover:bg-white/[0.025]"
      >
        <div className="flex items-start gap-4">
          <TaskMiniMark color={bot.color} size="lg" />

          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="comic-heading text-xl leading-tight text-white">{bot.name}</h3>
              {bot.isOfficial && (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/16 px-2.5 py-1 text-[10px] font-display font-bold uppercase text-emerald-300">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  READY
                </span>
              )}
            </div>
            {!bot.isOfficial && (
              <span className="text-xs text-brand-gray-medium font-display">
                by {bot.creator}
              </span>
            )}
            {bot.role && (
              <div className="mt-1.5">
                <span
                  className="inline-block rounded-full border border-white/8 px-2.5 py-1 text-[11px] font-display font-bold uppercase"
                  style={{ backgroundColor: bot.color, color: bot.color === '#FFD600' ? '#050816' : '#fff' }}
                >
                  {bot.role}
                </span>
              </div>
            )}
          </div>
        </div>

        <TaskSheet
          color={bot.color}
          category={bot.category}
          role={bot.role || 'AI Task'}
          summary={bot.description}
          bullets={[
            bot.description,
            bot.creator === 'OFFICIAL' ? 'Official launch-ready workflow included' : `Posted by ${bot.creator}`,
            bot.deployCount > 0 ? `${bot.deployCount} launches recorded` : 'Ready to be claimed and launched',
          ]}
          compact
          className="mt-4"
        />
      </Link>

      <div className="mt-auto flex items-center justify-between border-t border-white/8 px-5 pb-4 pt-3">
        <div className="flex items-center gap-5 text-sm text-brand-gray-medium font-display">
          <button
            onClick={(e) => { e.preventDefault(); onLike(bot.id) }}
            disabled={isLiking}
            className={`flex items-center gap-1.5 transition-colors ${
              isLiked ? 'text-red-500' : 'hover:text-red-400'
            } ${isLiking ? 'opacity-50' : ''}`}
          >
            <svg
              width="18" height="18" viewBox="0 0 24 24"
              fill={isLiked ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={isLiked ? 'heart-pop' : ''}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span className="font-bold">{bot.likeCount}</span>
          </button>

          {bot.deployCount > 0 && (
            <span className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L15 22l-4-9-9-4z"/>
              </svg>
              {bot.deployCount}
            </span>
          )}

          {bot.viewCount > 0 && (
            <span className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              {bot.viewCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden xl:inline text-[10px] font-display font-black uppercase text-brand-gray-medium">
            {formatCompensation(40, 20, 'completion')}
          </span>
          <Link
            href={bot.href}
            className="comic-btn text-xs px-4 py-2 no-underline"
          >
            {bot.isOfficial ? 'CLAIM + LINK' : 'VIEW TASK'}
          </Link>
        </div>
      </div>
    </div>
  )
}
