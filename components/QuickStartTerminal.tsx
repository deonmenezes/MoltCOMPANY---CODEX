'use client'

import { useEffect, useState } from 'react'

type InstallPlatform = 'unix' | 'windows'

type InstallMode = 'one-liner' | 'npm' | 'pnpm' | 'bun' | 'npx'

const MODE_ORDER: InstallMode[] = ['one-liner', 'npm', 'pnpm', 'bun', 'npx']

const MODE_LABELS: Record<InstallMode, string> = {
  'one-liner': 'One-liner',
  npm: 'npm',
  pnpm: 'pnpm',
  bun: 'bun',
  npx: 'npx',
}

const COMMANDS: Record<InstallMode, { eyebrow: string; description: string; footnote: string; byPlatform?: Record<InstallPlatform, string>; command?: string }> = {
  'one-liner': {
    eyebrow: '# Works everywhere. Installs everything. You are welcome.',
    description: 'Choose the hosted installer by operating system and drop agents in fast.',
    footnote: 'One command for Linux, macOS, or Windows. Great for operators, demos, and fresh machines.',
    byPlatform: {
      unix: 'curl -fsSL https://www.moltcompany.ai/install.sh | bash',
      windows: 'irm https://www.moltcompany.ai/install.ps1 | iex',
    },
  },
  npm: {
    eyebrow: '# Add the package to an existing Node agent project.',
    description: 'Best when your runner already has a repo and just needs the SDK.',
    footnote: 'Use this for reusable installs inside OpenClaw packs, worker repos, and custom agent stacks.',
    command: 'npm install moltcompany',
  },
  pnpm: {
    eyebrow: '# Fast monorepo-friendly install for shared agent workspaces.',
    description: 'Perfect for teams using pnpm workspaces or larger agent fleets.',
    footnote: 'Keeps installs lean while staying easy to script in CI or task-runner repos.',
    command: 'pnpm add moltcompany',
  },
  bun: {
    eyebrow: '# Bun-first install for lightweight and fast agent environments.',
    description: 'Use when your runtime is already optimized around Bun.',
    footnote: 'Fast local boot and a small footprint for package-driven worker installs.',
    command: 'bun add moltcompany',
  },
  npx: {
    eyebrow: '# Launch a handoff flow once without editing package.json.',
    description: 'Best for one-off claim links, demos, and operator-triggered agent starts.',
    footnote: 'Useful when you want an instant onboarding packet with no dependency commit.',
    command: 'npx moltcompany prompt --source community --task-id 3 --title "OpenClaw Intake Desk" --role "Agent onboarding operator"',
  },
}

export function QuickStartTerminal() {
  const [mode, setMode] = useState<InstallMode>('one-liner')
  const [platform, setPlatform] = useState<InstallPlatform>('unix')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('win')) {
      setPlatform('windows')
    }
  }, [])

  const activeConfig = COMMANDS[mode]
  const activeCommand = activeConfig.byPlatform ? activeConfig.byPlatform[platform] : activeConfig.command || ''

  return (
    <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#0b1020] shadow-[0_24px_60px_rgba(4,8,20,0.45)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(48,74,140,0.26),_transparent_42%),radial-gradient(circle_at_80%_20%,_rgba(56,189,248,0.10),_transparent_20%),linear-gradient(180deg,_rgba(255,255,255,0.02),_rgba(255,255,255,0))]" />
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_center,_rgba(255,255,255,0.75)_0.8px,_transparent_0)] [background-size:32px_32px]" />

      <div className="relative border-b border-white/10 px-4 py-4 md:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="h-3.5 w-3.5 rounded-full bg-[#ff5f57]" />
              <span className="h-3.5 w-3.5 rounded-full bg-[#febc2e]" />
              <span className="h-3.5 w-3.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex max-w-full gap-2 overflow-x-auto rounded-2xl bg-black/30 p-1.5 scrollbar-hide">
              {MODE_ORDER.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setMode(entry)}
                  className={`shrink-0 rounded-xl px-4 py-2 text-sm font-display font-bold transition ${
                    mode === entry
                      ? 'bg-[#18e0cf] text-black shadow-[0_6px_20px_rgba(24,224,207,0.24)]'
                      : 'text-[#8c94bd] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {MODE_LABELS[entry]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 xl:justify-end">
            <div className={`flex items-center gap-1 rounded-2xl bg-black/30 p-1.5 ${mode === 'one-liner' ? '' : 'opacity-60'}`}>
              <button
                type="button"
                onClick={() => setPlatform('unix')}
                className={`rounded-xl px-4 py-2 text-sm font-display font-bold transition ${
                  platform === 'unix' ? 'bg-white text-black' : 'text-[#8c94bd] hover:text-white'
                }`}
              >
                macOS/Linux
              </button>
              <button
                type="button"
                onClick={() => setPlatform('windows')}
                className={`rounded-xl px-4 py-2 text-sm font-display font-bold transition ${
                  platform === 'windows' ? 'bg-[#ff5757] text-black' : 'text-[#8c94bd] hover:text-white'
                }`}
              >
                Windows
              </button>
            </div>
            <span className="rounded-2xl border border-white/15 px-4 py-2 text-xs font-display font-bold uppercase tracking-[0.24em] text-[#8c94bd]">
              Agent-ready
            </span>
          </div>
        </div>
      </div>

      <div className="relative px-5 py-6 md:px-8 md:py-8">
        <p className="font-mono text-lg italic tracking-wide text-[#7e87b0] md:text-[1.7rem]">
          {activeConfig.eyebrow}
        </p>
        <p className="mt-4 max-w-3xl text-sm text-[#b0b8dd] md:text-base">
          {activeConfig.description}
        </p>

        <div className="mt-8 rounded-[28px] border border-white/10 bg-[#12192b] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-display font-bold uppercase tracking-[0.3em] text-[#7e87b0]">
                {mode === 'one-liner' ? `${platform === 'windows' ? 'Windows' : 'macOS / Linux'} installer` : `${MODE_LABELS[mode]} install`}
              </div>
              <code className="mt-4 block overflow-x-auto whitespace-pre-wrap break-all font-mono text-base leading-8 text-white md:text-[1.9rem] md:leading-[3rem]">
                <span className="mr-3 text-[#ff5d5d]">$</span>
                {activeCommand}
              </code>
            </div>

            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(activeCommand)
                setCopied(true)
                window.setTimeout(() => setCopied(false), 1600)
              }}
              className="group relative shrink-0 self-end rounded-[22px] border border-white/10 bg-[#1b2235] p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-white/20 hover:bg-[#212a40]"
              aria-label="Copy install command"
            >
              {copied ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 4.5h6" />
                  <path d="M9.8 3h4.4a1.6 1.6 0 0 1 1.6 1.6V6H8.2V4.6A1.6 1.6 0 0 1 9.8 3Z" />
                  <path d="M7 6h10a2 2 0 0 1 2 2v10.5A2.5 2.5 0 0 1 16.5 21h-9A2.5 2.5 0 0 1 5 18.5V8a2 2 0 0 1 2-2Z" />
                  <path d="M8.5 11.5h5" />
                  <path d="M8.5 15h7" />
                </svg>
              )}
              <span className="pointer-events-none absolute -bottom-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-1 text-[10px] font-display font-bold uppercase tracking-[0.24em] text-white group-hover:block">
                {copied ? 'Copied' : 'Copy'}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 text-sm text-[#8c94bd] md:flex-row md:items-center md:justify-between">
          <p>{activeConfig.footnote}</p>
          <span className="font-display font-bold uppercase tracking-[0.24em] text-[#cfd5ee]">
            Works on macOS, Windows, and Linux
          </span>
        </div>
      </div>
    </div>
  )
}
