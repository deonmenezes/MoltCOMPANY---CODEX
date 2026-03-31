'use client'

import { bots, type Bot } from '@/lib/bots'
import { TaskMiniMark } from '@/components/TaskVisual'

export function CompanionSelector({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (bot: Bot) => void
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {bots.map((bot) => (
        <button
          key={bot.id}
          onClick={() => onSelect(bot)}
          className={`rounded-[24px] border p-4 text-left transition-all duration-200 ${
            selected === bot.id
              ? 'border-brand-yellow/70 bg-brand-yellow text-black shadow-comic'
              : 'border-white/10 bg-[#10182c] text-white hover:border-brand-yellow/24 hover:shadow-comic-sm hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <TaskMiniMark color={bot.color} />
            <div className="min-w-0">
              <div className={`font-display font-bold uppercase text-sm truncate ${selected === bot.id ? 'text-black' : 'text-white'}`}>{bot.characterName}</div>
              <div className={`text-[10px] font-display font-bold uppercase ${selected === bot.id ? 'text-black/75' : 'text-brand-gray-medium'}`}>{bot.characterRole}</div>
            </div>
          </div>
          <p className={`text-[11px] font-body line-clamp-2 ${selected === bot.id ? 'text-black/76' : 'text-brand-gray-medium'}`}>{bot.tagline}</p>
          {selected === bot.id && (
            <div className="text-[10px] font-display font-bold text-black mt-2 uppercase">Task Loaded</div>
          )}
        </button>
      ))}
    </div>
  )
}
