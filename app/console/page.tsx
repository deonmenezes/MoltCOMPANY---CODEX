'use client'

import { useAuth } from '@/components/AuthProvider'
import { useEffect, useState, useRef, Suspense } from 'react'
import { CompanionCard } from '@/components/CompanionCard'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { bots } from '@/lib/bots'
import { TaskMiniMark, TaskSheet } from '@/components/TaskVisual'

export default function ConsolePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center pt-16">
        <div className="animate-spin h-8 w-8 border-3 border-brand-yellow border-t-transparent rounded-full mx-auto" />
      </div>
    }>
      <ConsoleContent />
    </Suspense>
  )
}

function ConsoleContent() {
  const { user, session, loading } = useAuth()
  const searchParams = useSearchParams()
  const [instances, setInstances] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any>(null)
  const [fetching, setFetching] = useState(true)
  const [fulfilling, setFulfilling] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const sessionId = searchParams.get('session_id')
  const demoMode = searchParams.get('demo') === '1'
  const demoJob = searchParams.get('job')
  const demoProvider = searchParams.get('provider')
  const demoModel = searchParams.get('model')
  const demoChannel = searchParams.get('channel')
  const fulfilledRef = useRef(false)
  const demoBot = bots.find(bot => bot.id === demoJob) || bots[0]

  const fetchInstances = async () => {
    if (!session?.access_token) return
    try {
      const res = await fetch('/api/instance', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      setInstances(data.instances || [])
      setSubscription(data.subscription || null)
    } catch (err) {
      console.error('Error fetching instances:', err)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (!sessionId || !session?.access_token || fulfilledRef.current) return
    fulfilledRef.current = true
    setFulfilling(true)

    fetch('/api/fulfill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(async r => {
        const data = await r.json()
        if (!r.ok) {
          console.error('Fulfill error:', data.error)
        }
        return data
      })
      .then(() => {
        window.history.replaceState({}, '', '/console')
        fetchInstances()
      })
      .catch(err => console.error('Fulfill error:', err))
      .finally(() => setFulfilling(false))
  }, [sessionId, session])

  useEffect(() => {
    if (session) fetchInstances()
  }, [session])

  useEffect(() => {
    if (!loading && !session) {
      setFetching(false)
    }
  }, [loading, session])

  useEffect(() => {
    if (!session) return
    const interval = setInterval(fetchInstances, 15000)
    return () => clearInterval(interval)
  }, [session])

  const handleAction = async (instanceId: string, action: 'start' | 'stop' | 'terminate') => {
    setActionLoading(instanceId)
    try {
      const method = action === 'terminate' ? 'DELETE' : 'PATCH'
      const res = await fetch('/api/instance', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ action, instance_id: instanceId }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || `Failed to ${action} task runner`)
      }
      await fetchInstances()
    } catch (err) {
      console.error(`Error ${action}ing task runner:`, err)
    } finally {
      setActionLoading(null)
    }
  }

  if (demoMode) {
    return (
      <div className="min-h-screen bg-white pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="comic-heading text-3xl">CONSOLE</h1>
            <Link href="/companions" className="comic-btn text-sm py-2 px-5">
              CLAIM NEW TASK
            </Link>
          </div>

          <div className="comic-card p-5 mb-8 bg-brand-yellow/20">
            <h2 className="comic-heading text-lg mb-2">LOCAL DEMO MODE</h2>
            <p className="text-sm text-brand-gray-dark">
              This task runner is being simulated inside MoltCompany because local Supabase and billing keys are not configured yet.
            </p>
          </div>

          <section className="mb-12">
            <h2 className="comic-heading text-xl mb-4">YOUR TASK RUNNER</h2>
            <div className="comic-card overflow-hidden">
              <div className="h-2" style={{ backgroundColor: demoBot.color }} />
              <div className="p-6 grid md:grid-cols-[auto,1fr] gap-5 items-start">
                <TaskMiniMark color={demoBot.color} size="lg" />
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="comic-heading text-2xl">{demoBot.characterName}</h3>
                    <span className="px-3 py-1 text-[10px] font-display font-bold uppercase border-2 border-black bg-green-50">
                      Demo Ready
                    </span>
                  </div>
                  <p className="text-sm text-brand-gray-dark mb-4">{demoBot.characterRole}</p>
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-[10px] text-brand-gray-medium font-display font-bold uppercase mb-1">Provider</div>
                      <div className="font-bold text-black">{(demoProvider || 'demo').toUpperCase()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-brand-gray-medium font-display font-bold uppercase mb-1">Model</div>
                      <div className="font-bold text-black">{demoModel || 'configured in launch flow'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-brand-gray-medium font-display font-bold uppercase mb-1">Channel</div>
                      <div className="font-bold text-black">{demoChannel || 'telegram'}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t-3 border-black p-6 grid md:grid-cols-2 gap-6">
                <div>
                  <TaskSheet
                    color={demoBot.color}
                    category={demoBot.category}
                    role={demoBot.characterRole}
                    summary={demoBot.description}
                    bullets={demoBot.completionSteps}
                  />
                </div>
                <div>
                  <div className="text-[10px] text-brand-gray-medium font-display font-bold uppercase mb-2">Example deliverables</div>
                  <ul className="space-y-2 text-sm text-brand-gray-dark">
                    {demoBot.exampleDeliverables.map(item => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-3 mt-5">
                    <Link href={`/deploy?model=${demoBot.id}`} className="comic-btn text-sm">
                      EDIT LAUNCH
                    </Link>
                    <Link href="/companions" className="comic-btn-outline text-sm">
                      VIEW ALL TASKS
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  if (loading || fetching || fulfilling) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-3 border-brand-yellow border-t-transparent rounded-full mx-auto mb-4" />
          {fulfilling && (
            <p className="text-brand-gray-medium font-display font-bold text-sm">
              Setting up your task runner...
            </p>
          )}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-16">
        <div className="text-center">
          <h2 className="comic-heading text-2xl mb-4">Sign in to view console</h2>
          <Link href="/login" className="comic-btn inline-block">
            SIGN IN
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="comic-heading text-3xl">CONSOLE</h1>
          <Link href="/companions" className="comic-btn text-sm py-2 px-5">
            CLAIM NEW TASK
          </Link>
        </div>

        <section className="mb-12">
          <h2 className="comic-heading text-xl mb-4">YOUR TASK RUNNERS</h2>
          
          {instances.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {instances.map((instance) => (
                <CompanionCard
                  key={instance.id}
                  instance={instance}
                  onAction={handleAction}
                  onRefresh={fetchInstances}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          ) : (
            <div className="comic-card p-8 text-center">
              <p className="text-brand-gray-medium mb-4">
                You do not have any task runners yet. Claim one below to get started.
              </p>
              <Link href="/companions" className="comic-btn inline-block text-sm">
                CLAIM A TASK
              </Link>
            </div>
          )}
        </section>

        <section>
          <h2 className="comic-heading text-xl mb-4">RECOMMENDED FOR YOU</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.slice(0, 6).map(bot => (
              <div key={bot.id} className="comic-card-hover flex flex-col">
                <Link href={`/companion/${bot.id}`} className="p-5 pb-2 hover:bg-gray-50/50 transition">
                  <div className="flex items-center gap-3 mb-3">
                    <TaskMiniMark color={bot.color} />
                    <div className="flex items-center gap-1.5">
                      <h4 className="comic-heading text-lg">{bot.characterName}</h4>
                      <span className="text-green-500 text-xs" title="Verified">&#10003;</span>
                    </div>
                  </div>
                  <TaskSheet
                    color={bot.color}
                    category={bot.category}
                    role={bot.characterRole}
                    summary={bot.tagline}
                    bullets={bot.exampleDeliverables}
                    compact
                  />
                </Link>
                <div className="p-5 pt-3 mt-auto">
                  <Link href={`/deploy?model=${bot.id}`} className="comic-btn block text-center w-full text-sm">
                    START - $40/MO
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/companions" className="comic-btn-outline inline-block text-sm">
              VIEW ALL TASKS
            </Link>
          </div>
        </section>

        {subscription && (
          <div className="comic-card p-6 mt-8">
            <h3 className="comic-heading text-lg mb-4">SUBSCRIPTION</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-brand-gray-medium font-display font-bold uppercase mb-1">Status</div>
                <div className="text-sm text-black font-bold capitalize">
                  {subscription.status === 'trialing' ? '3-Day Free Trial' : subscription.status}
                </div>
              </div>
              <div>
                <div className="text-xs text-brand-gray-medium font-display font-bold uppercase mb-1">
                  {subscription.status === 'trialing' ? 'Trial ends' : 'Next renewal'}
                </div>
                <div className="text-sm text-black">
                  {subscription.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleDateString()
                    : 'N/A'}
                </div>
              </div>
            </div>
            <button
              onClick={async () => {
                const res = await fetch('/api/billing', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${session?.access_token}` },
                })
                const data = await res.json()
                if (data.url) window.location.href = data.url
              }}
              className="comic-btn-outline text-sm"
            >
              MANAGE BILLING
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
