'use client'

import { useState } from 'react'
import { llmProviders } from '@/lib/providers'

export function ApiKeyInput({
  provider,
  apiKey,
  onSave,
}: {
  provider: string
  apiKey: string
  onSave: (key: string) => void
}) {
  const [value, setValue] = useState(apiKey)
  const [saved, setSaved] = useState(!!apiKey)
  const info = llmProviders.find(p => p.id === provider) || llmProviders[0]

  return (
    <div className="max-w-lg">
      <div className="comic-card p-6">
        <h4 className="mb-1 font-display font-bold uppercase text-white">Enter your {info.name} API Key</h4>
        <p className="text-sm text-brand-gray-medium mb-4">
          Your key is encrypted before storage and only used by your instance.
        </p>
        <input
          type="password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setSaved(false)
          }}
          placeholder={info.keyPlaceholder}
          className="theme-input w-full px-4 py-3"
        />
        <button
          onClick={() => {
            if (value.trim()) {
              onSave(value.trim())
              setSaved(true)
            }
          }}
          disabled={!value.trim()}
          className={`mt-4 w-full py-3 font-display font-bold uppercase border-3 transition ${
            saved
              ? 'border-green-400/40 bg-green-500/12 text-green-200'
              : 'comic-btn disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none'
          }`}
        >
          {saved ? 'SAVED' : 'SAVE API KEY'}
        </button>
        <a
          href={info.keyHelpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-sm font-bold text-brand-yellow underline hover:text-brand-gray-dark"
        >
          How to get your {info.name} API key &rarr;
        </a>
      </div>
    </div>
  )
}
