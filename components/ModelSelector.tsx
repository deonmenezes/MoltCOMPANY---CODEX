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
          className={`p-4 border-3 transition-all duration-200 text-left ${
            selected === bot.id
              ? 'border-black bg-brand-yellow shadow-comic'
              : 'border-black bg-white hover:shadow-comic-sm hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <TaskMiniMark color={bot.color} />
            <div className="min-w-0">
              <div className="font-display font-bold text-black uppercase text-sm truncate">{bot.characterName}</div>
              <div className="text-[10px] text-brand-gray-medium font-display font-bold uppercase">{bot.characterRole}</div>
            </div>
          </div>
          <p className="text-[11px] text-brand-gray-dark font-body line-clamp-2">{bot.tagline}</p>
          {selected === bot.id && (
            <div className="text-[10px] font-display font-bold text-black mt-2 uppercase">Task Loaded</div>
          )}
        </button>
      ))}
    </div>
  )
}
