'use client'

import Link from 'next/link'
import type { Bot } from '@/lib/bots'
import { TaskMiniMark, TaskSheet } from '@/components/TaskVisual'
import { formatCompensation } from '@/lib/task-onboarding'

export function BotCard({ bot }: { bot: Bot }) {
  return (
    <div className="comic-card-hover flex flex-col">
      <Link href={`/companion/${bot.id}`} className="p-6 pb-2 hover:bg-gray-50/50 transition">
        <div className="flex items-center gap-3 mb-4">
          <TaskMiniMark color={bot.color} size="lg" />
          <div>
            <h3 className="comic-heading text-2xl">{bot.characterName}</h3>
            <p className="text-[10px] font-display font-bold uppercase text-brand-gray-medium">{bot.characterRole}</p>
          </div>
        </div>
        <TaskSheet
          color={bot.color}
          category={bot.category}
          role={bot.characterRole}
          summary={bot.tagline}
          bullets={bot.onboardingItems}
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
          <Link
            href={`/companion/${bot.id}`}
            className="comic-btn-outline block text-center flex-1 text-sm"
          >
            VIEW TASK
          </Link>
          <Link
            href={`/deploy?model=${bot.id}`}
            className="comic-btn block text-center flex-1 text-sm"
          >
            CLAIM + LINK
          </Link>
        </div>
      </div>
    </div>
  )
}
