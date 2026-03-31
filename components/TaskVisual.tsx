'use client'

type TaskMiniMarkProps = {
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

type TaskSheetProps = {
  color: string
  category?: string | null
  role: string
  summary: string
  bullets: string[]
  compact?: boolean
  label?: string
  className?: string
}

export function TaskMiniMark({ color, size = 'md', className = '' }: TaskMiniMarkProps) {
  const sizeClass =
    size === 'sm'
      ? 'w-8 h-8 p-1'
      : size === 'lg'
        ? 'w-14 h-14 p-2'
        : 'w-10 h-10 p-1.5'

  return (
    <div className={`shrink-0 rounded-[18px] border border-white/12 bg-[#11192d] shadow-comic-sm ${sizeClass} ${className}`.trim()}>
      <div className="mb-1 h-1.5 rounded-full border border-white/10" style={{ backgroundColor: color }} />
      <div className="space-y-1">
        <div className="h-1 rounded-full bg-white/90" />
        <div className="h-1 w-4/5 rounded-full bg-white/55" />
        <div className="h-1 w-3/5 rounded-full bg-white/28" />
      </div>
    </div>
  )
}

export function TaskSheet({
  color,
  category,
  role,
  summary,
  bullets,
  compact = false,
  label = 'Task Brief',
  className = '',
}: TaskSheetProps) {
  const visibleBullets = bullets.slice(0, compact ? 2 : 3)

  return (
    <div className={`overflow-hidden rounded-[26px] border border-white/10 bg-[#10182c] ${className}`.trim()}>
      <div className="h-2" style={{ backgroundColor: color }} />
      <div className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[10px] font-display font-bold uppercase text-brand-gray-medium">{label}</span>
          {category ? (
            <span className="rounded-full border border-white/12 bg-white/5 px-2.5 py-1 text-[10px] font-display font-bold uppercase text-white/84">
              {category}
            </span>
          ) : null}
        </div>

        <div className="mb-3 rounded-[18px] border border-white/8 bg-[#0a1020] px-3 py-3">
          <div className="text-[10px] font-display font-bold uppercase text-brand-gray-medium mb-1">Scope</div>
          <div className={compact ? 'font-display font-black text-sm uppercase text-white' : 'font-display font-black text-lg uppercase text-white'}>
            {role}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-brand-gray-medium font-body">{summary}</p>
        </div>

        <div className="space-y-2">
          {visibleBullets.map((bullet) => (
            <div key={bullet} className="flex items-start gap-2">
              <div className="mt-0.5 h-3 w-3 shrink-0 rounded-[4px] border border-white/10" style={{ backgroundColor: color }} />
              <p className="line-clamp-1 text-xs text-brand-gray-medium font-body">{bullet}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
