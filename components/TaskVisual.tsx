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
    <div className={`border-3 border-black bg-white shadow-comic-sm shrink-0 ${sizeClass} ${className}`.trim()}>
      <div className="h-1.5 border border-black mb-1" style={{ backgroundColor: color }} />
      <div className="space-y-1">
        <div className="h-1 bg-black" />
        <div className="h-1 bg-black/70 w-4/5" />
        <div className="h-1 bg-black/40 w-3/5" />
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
    <div className={`border-3 border-black bg-white overflow-hidden ${className}`.trim()}>
      <div className="h-2" style={{ backgroundColor: color }} />
      <div className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[10px] font-display font-bold uppercase text-brand-gray-medium">{label}</span>
          {category ? (
            <span className="px-2 py-0.5 text-[10px] font-display font-bold uppercase border-2 border-black bg-white">
              {category}
            </span>
          ) : null}
        </div>

        <div className="border-2 border-black bg-black/[0.03] px-3 py-2 mb-3">
          <div className="text-[10px] font-display font-bold uppercase text-brand-gray-medium mb-1">Scope</div>
          <div className={compact ? 'font-display font-black text-sm uppercase' : 'font-display font-black text-lg uppercase'}>
            {role}
          </div>
          <p className="text-xs text-brand-gray-dark font-body mt-1 line-clamp-2">{summary}</p>
        </div>

        <div className="space-y-2">
          {visibleBullets.map((bullet) => (
            <div key={bullet} className="flex items-start gap-2">
              <div className="w-3 h-3 border-2 border-black mt-0.5 shrink-0" style={{ backgroundColor: color }} />
              <p className="text-xs text-brand-gray-dark font-body line-clamp-1">{bullet}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
