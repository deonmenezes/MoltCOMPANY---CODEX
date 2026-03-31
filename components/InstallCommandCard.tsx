'use client'

import { useState } from 'react'

type InstallCommandCardProps = {
  title: string
  description: string
  command: string
  note?: string
}

export function InstallCommandCard({ title, description, command, note }: InstallCommandCardProps) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="comic-card p-5 h-full">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="comic-heading text-2xl text-white">{title}</h3>
          <p className="text-sm text-brand-gray-medium">{description}</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(command)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1600)
          }}
          className="comic-btn-outline text-xs py-2 px-3 shrink-0"
        >
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>

      <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-[22px] border border-white/10 bg-[#0a1020] p-4 text-sm text-brand-gray-dark">
        <code>{command}</code>
      </pre>

      {note ? (
        <p className="text-xs text-brand-gray-medium mt-3">{note}</p>
      ) : null}
    </div>
  )
}
