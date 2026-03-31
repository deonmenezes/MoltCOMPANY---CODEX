'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { TaskMiniMark, TaskSheet } from '@/components/TaskVisual'

interface CompanionCardProps {
  instance: {
    id: string
    status: string
    public_ip: string | null
    model_provider: string | null
    model_name: string | null
    channel: string
    gateway_token: string | null
    region: string
    created_at: string
    ec2_instance_id: string | null
    companion_name: string | null
    companion_role: string | null
    companion_color: string | null
    companion_avatar: string | null
  }
  onAction: (instanceId: string, action: 'start' | 'stop' | 'terminate') => void
  onRefresh: () => void
  actionLoading: string | null
}

const statusConfig: Record<string, { dot: string; label: string; bg: string }> = {
  running: { dot: 'bg-green-400', label: 'ONLINE', bg: 'border border-green-400/30 bg-green-500/12 text-green-100' },
  provisioning: { dot: 'bg-yellow-400 animate-pulse', label: 'STARTING', bg: 'border border-brand-yellow/30 bg-brand-yellow/12 text-brand-yellow' },
  stopped: { dot: 'bg-gray-400', label: 'STOPPED', bg: 'border border-white/10 bg-white/8 text-white' },
  failed: { dot: 'bg-red-400', label: 'FAILED', bg: 'border border-red-400/30 bg-red-500/12 text-red-100' },
  payment_failed: { dot: 'bg-red-400', label: 'PAYMENT FAILED', bg: 'border border-red-400/30 bg-red-500/12 text-red-100' },
  terminated: { dot: 'bg-gray-500', label: 'TERMINATED', bg: 'border border-white/10 bg-white/8 text-white' },
  pending_payment: { dot: 'bg-yellow-400 animate-pulse', label: 'PROCESSING', bg: 'border border-brand-yellow/30 bg-brand-yellow/12 text-brand-yellow' },
}

function formatModel(modelName: string | null): string {
  if (!modelName) return 'N/A'
  const parts = modelName.split('/')
  return parts.length > 1 ? parts[1] : modelName
}

export function CompanionCard({ instance, onAction, onRefresh, actionLoading }: CompanionCardProps) {
  const { session } = useAuth()
  const status = statusConfig[instance.status] || { dot: 'bg-gray-500', label: instance.status.toUpperCase(), bg: 'border border-white/10 bg-white/8 text-white' }
  const color = instance.companion_color || '#FFD600'
  const isLoading = actionLoading === instance.id
  const name = instance.companion_name || 'Task Runner'
  const role = instance.companion_role || 'AI Task'

  const [showKeyForm, setShowKeyForm] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [updatingKey, setUpdatingKey] = useState(false)
  const [cancelingSubscription, setCancelingSubscription] = useState(false)
  const [retryingLaunch, setRetryingLaunch] = useState(false)

  const handleUpdateKey = async () => {
    if (!newKey.trim() || newKey.trim().length < 10) {
      alert('Please enter a valid API key (at least 10 characters)')
      return
    }
    setUpdatingKey(true)
    try {
      const res = await fetch('/api/instance', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'update_key',
          instance_id: instance.id,
          new_api_key: newKey.trim(),
        }),
      })
      if (res.ok) {
        setShowKeyForm(false)
        setNewKey('')
        onRefresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update API key')
      }
    } catch {
      alert('Failed to update API key')
    } finally {
      setUpdatingKey(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm(`Cancel subscription and terminate ${name}? This will permanently shut down this task runner and cancel your billing.`)) return
    setCancelingSubscription(true)
    try {
      const res = await fetch('/api/instance', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'cancel_subscription',
          instance_id: instance.id,
        }),
      })
      if (res.ok) {
        onRefresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to cancel subscription')
      }
    } catch {
      alert('Failed to cancel subscription')
    } finally {
      setCancelingSubscription(false)
    }
  }

  const handleRetryLaunch = async () => {
    setRetryingLaunch(true)
    try {
      const res = await fetch('/api/instance', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'retry_launch',
          instance_id: instance.id,
        }),
      })
      if (res.ok) {
        onRefresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to launch instance')
      }
    } catch {
      alert('Failed to launch instance')
    } finally {
      setRetryingLaunch(false)
    }
  }

  return (
    <div className="comic-card overflow-hidden flex flex-col">
      {/* Color bar */}
      <div className="h-2" style={{ backgroundColor: color }} />

      {/* Header: Task + Name + Status */}
      <div className="p-5 pb-3">
        <div className="flex items-start gap-4">
          <TaskMiniMark color={color} size="lg" />

          {/* Name + Role */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-black text-lg uppercase tracking-tight leading-tight truncate text-white">
              {name}
            </h3>
            <span
              className="inline-block text-[10px] font-display font-bold uppercase px-2 py-0.5 mt-1 border-2 border-black"
              style={{ backgroundColor: `${color}30`, color: '#000' }}
            >
              {role}
            </span>
          </div>

          {/* Status badge */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-sm ${status.bg} flex-shrink-0`}>
            <div className={`w-2 h-2 rounded-full ${status.dot}`} />
            <span className="text-[10px] font-display font-bold uppercase">{status.label}</span>
          </div>
        </div>
      </div>

      <div className="px-5 pb-4">
        <TaskSheet
          color={color}
          role={role}
          summary={`${name} is configured on ${formatModel(instance.model_name)} and connected through ${instance.channel}.`}
          bullets={[
            instance.public_ip ? `Runner endpoint ready at ${instance.public_ip}` : 'Runner endpoint is still being assigned',
            `Region: ${instance.region}`,
            `Created: ${new Date(instance.created_at).toLocaleDateString()}`,
          ]}
          compact
        />
      </div>

      {/* Info grid */}
      <div className="px-5 pb-4 grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <div className="text-[10px] text-brand-gray-medium font-display font-bold uppercase">Model</div>
          <div className="text-xs text-white font-mono truncate">{formatModel(instance.model_name)}</div>
        </div>
        <div>
          <div className="text-[10px] text-brand-gray-medium font-display font-bold uppercase">Region</div>
          <div className="text-xs text-white">{instance.region}</div>
        </div>
        <div>
          <div className="text-[10px] text-brand-gray-medium font-display font-bold uppercase">IP</div>
          <div className="text-xs text-white font-mono">{instance.public_ip || 'Assigning...'}</div>
        </div>
        <div>
          <div className="text-[10px] text-brand-gray-medium font-display font-bold uppercase">Created</div>
          <div className="text-xs text-white">{new Date(instance.created_at).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Teams endpoint (only for Teams channel, when instance has a public IP) */}
      {instance.channel === 'teams' && instance.public_ip && instance.status === 'running' && (
        <div className="mx-5 mb-4 rounded-[22px] border border-blue-400/30 bg-blue-500/12 p-3">
          <div className="text-[10px] font-display font-bold uppercase text-blue-700 mb-1">Teams Messaging Endpoint</div>
          <div className="flex items-center justify-between gap-2">
            <code className="text-[11px] text-white font-mono block truncate">
              http://{instance.public_ip}:3978/api/messages
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(`http://${instance.public_ip}:3978/api/messages`)}
              className="text-[10px] font-display font-bold uppercase px-2 py-1 border-2 border-black hover:bg-brand-yellow transition flex-shrink-0"
            >
              COPY
            </button>
          </div>
          <p className="text-[10px] text-blue-600 mt-2">
            Paste this URL as the &quot;Messaging endpoint&quot; in your Azure Bot resource &rarr; Configuration.
          </p>
        </div>
      )}

      {/* WhatsApp status (only for WhatsApp channel, when instance is running) */}
      {instance.channel === 'whatsapp' && instance.status === 'running' && (
        <div className="mx-5 mb-4 rounded-[22px] border border-green-400/30 bg-green-500/12 p-3">
          <div className="text-[10px] font-display font-bold uppercase text-green-700 mb-1">WhatsApp Connected</div>
          <p className="text-[10px] text-green-600">
            Messages to your WhatsApp Business number are routed through MoltCompany.ai to this task runner.
          </p>
          <p className="text-[10px] text-green-600 mt-1">
            Make sure the webhook URL in your Meta App Dashboard points to: <code className="font-mono">https://moltcompany.ai/api/whatsapp/webhook</code>
          </p>
        </div>
      )}

      {/* Gateway token */}
      {instance.gateway_token && (
        <div className="mx-5 mb-4 rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] font-display font-bold uppercase text-brand-gray-medium mb-0.5">UI Password</div>
              <code className="text-[11px] text-white font-mono block truncate">{instance.gateway_token}</code>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(instance.gateway_token!)}
              className="text-[10px] font-display font-bold uppercase px-2 py-1 border-2 border-black hover:bg-brand-yellow transition flex-shrink-0"
            >
              COPY
            </button>
          </div>
        </div>
      )}

      {/* Update API Key form */}
      {showKeyForm && (
        <div className="mx-5 mb-4 rounded-[22px] border border-brand-yellow/40 bg-brand-yellow/12 p-3">
          <div className="text-[10px] font-display font-bold uppercase text-brand-gray-medium mb-2">New LLM API Key</div>
          <input
            type="password"
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            placeholder="Paste your new API key..."
            className="theme-input mb-2 w-full px-3 py-2 text-xs"
          />
          <p className="text-[10px] text-brand-gray-medium mb-2">
            This will redeploy your task runner with the new key. Downtime: ~2 minutes.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleUpdateKey}
              disabled={updatingKey}
              className="comic-btn text-xs py-1.5 px-3 disabled:opacity-50"
            >
              {updatingKey ? 'REDEPLOYING...' : 'UPDATE & REDEPLOY'}
            </button>
            <button
              onClick={() => { setShowKeyForm(false); setNewKey('') }}
              className="comic-btn-outline text-xs py-1.5 px-3"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto flex flex-col gap-2 border-t border-white/10 px-5 py-3">
        <div className="flex flex-wrap gap-2">
          {['pending_payment', 'failed'].includes(instance.status) && (
            <button
              onClick={handleRetryLaunch}
              disabled={retryingLaunch}
              className="comic-btn text-xs py-1.5 px-3 disabled:opacity-50"
            >
              {retryingLaunch ? 'STARTING...' : 'START NOW'}
            </button>
          )}
          {instance.public_ip && instance.status === 'running' && (
            <a
              href={`http://${instance.public_ip}:8080?token=${instance.gateway_token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="comic-btn text-xs py-1.5 px-3"
            >
              OPEN RUNNER
            </a>
          )}
          {instance.status === 'running' && (
            <button
              onClick={() => onAction(instance.id, 'stop')}
              disabled={isLoading}
              className="comic-btn-outline text-xs py-1.5 px-3 disabled:opacity-50"
            >
              {isLoading ? '...' : 'STOP'}
            </button>
          )}
          {instance.status === 'stopped' && (
            <button
              onClick={() => onAction(instance.id, 'start')}
              disabled={isLoading}
              className="comic-btn text-xs py-1.5 px-3 disabled:opacity-50"
            >
              {isLoading ? '...' : 'RESTART'}
            </button>
          )}
          {['running', 'stopped'].includes(instance.status) && !showKeyForm && (
            <button
              onClick={() => setShowKeyForm(true)}
              className="rounded-full border border-brand-yellow/40 bg-brand-yellow/12 px-3 py-1.5 text-xs font-display font-bold uppercase text-brand-yellow shadow-comic-sm transition hover:bg-brand-yellow/18"
            >
              UPDATE KEY
            </button>
          )}
        </div>
        {/* Destructive actions row */}
        <div className="flex flex-wrap gap-2">
          {['running', 'stopped', 'provisioning', 'pending_payment', 'failed'].includes(instance.status) && (
            <button
              onClick={() => {
                if (confirm(`Terminate ${name}? This will permanently delete this task runner and all its data.`)) {
                  onAction(instance.id, 'terminate')
                }
              }}
              disabled={isLoading}
              className="rounded-full border border-red-500/40 px-3 py-1.5 text-xs font-display font-bold uppercase text-red-300 shadow-comic-sm transition hover:bg-red-500/10 disabled:opacity-50"
            >
              {isLoading ? '...' : 'TERMINATE'}
            </button>
          )}
          {['running', 'stopped', 'provisioning', 'pending_payment', 'failed'].includes(instance.status) && (
            <button
              onClick={handleCancelSubscription}
              disabled={cancelingSubscription || isLoading}
              className="rounded-full border border-red-700/40 px-3 py-1.5 text-xs font-display font-bold uppercase text-red-300 shadow-comic-sm transition hover:bg-red-500/10 disabled:opacity-50"
            >
              {cancelingSubscription ? 'CANCELING...' : 'CANCEL SUBSCRIPTION'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
