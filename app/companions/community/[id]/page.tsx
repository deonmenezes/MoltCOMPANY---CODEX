'use client'

import { useAuth } from '@/components/AuthProvider'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { TaskMiniMark, TaskSheet } from '@/components/TaskVisual'
import { formatCompensation } from '@/lib/task-onboarding'

type CommunityBot = {
  id: number
  name: string
  bot_name: string
  description: string
  icon_url: string | null
  character_file: string | null
  soul_md: string | null
  author_name: string
  role?: string
  color?: string
  category?: string
  tags?: string[]
  upvotes: number
  downvotes: number
  view_count?: number
  deploy_count?: number
  fork_count?: number
  created_at: string
}

type Review = {
  id: string
  user_name: string
  user_avatar: string | null
  rating: number
  comment: string
  created_at: string
}

export default function CommunityBotDetailPage() {
  const params = useParams()
  const router = useRouter()
  const botId = Number(params.id)
  const { user, session } = useAuth()

  const [bot, setBot] = useState<CommunityBot | null>(null)
  const [loading, setLoading] = useState(true)
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null)
  const [voting, setVoting] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'character' | 'reviews'>('overview')
  const [copied, setCopied] = useState(false)
  const [forking, setForking] = useState(false)

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([])
  const [avgRating, setAvgRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [submittingReview, setSubmittingReview] = useState(false)

  // Related bots
  const [relatedBots, setRelatedBots] = useState<CommunityBot[]>([])

  useEffect(() => {
    if (!botId) return
    fetch(`/api/community?sort=newest&limit=200`)
      .then(r => r.json())
      .then(data => {
        const allBots = data.bots || []
        const found = allBots.find((b: CommunityBot) => b.id === botId)
        setBot(found || null)

        // Find related bots (same category or role)
        if (found) {
          const related = allBots
            .filter((b: CommunityBot) =>
              b.id !== botId &&
              (b.category === found.category || b.role === found.role)
            )
            .slice(0, 3)
          setRelatedBots(related)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [botId])

  // Fetch reviews
  useEffect(() => {
    if (!botId) return
    fetch(`/api/reviews?bot_id=${botId}`)
      .then(r => r.json())
      .then(data => {
        setReviews(data.reviews || [])
        setAvgRating(data.averageRating || 0)
        setTotalReviews(data.totalReviews || 0)
      })
      .catch(() => {})
  }, [botId])

  const handleVote = async (type: 'up' | 'down') => {
    if (!session?.access_token || voting) return
    setVoting(true)
    try {
      const res = await fetch('/api/community/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ bot_id: botId, vote_type: type }),
      })
      const data = await res.json()
      setUserVote(data.voted)
      const refreshRes = await fetch(`/api/community?sort=newest&limit=200`)
      const refreshData = await refreshRes.json()
      const updated = (refreshData.bots || []).find((b: CommunityBot) => b.id === botId)
      if (updated) setBot(updated)
    } catch {
      // ignore
    } finally {
      setVoting(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${bot?.name || 'AI Task'} on MoltCompany.AI`,
          text: bot?.description || 'Check out this AI-agent task pack!',
          url,
        })
        return
      } catch {
        // fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFork = async () => {
    if (!session?.access_token || forking) return
    setForking(true)
    try {
      const res = await fetch('/api/community/fork', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ bot_id: botId }),
      })
      const data = await res.json()
      if (data.forked_id) {
        router.push(`/companions/community/${data.forked_id}`)
      } else {
        alert(data.error || 'Failed to fork')
      }
    } catch {
      alert('Failed to fork task pack')
    } finally {
      setForking(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!session?.access_token || submittingReview || !reviewText.trim()) return
    setSubmittingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          bot_id: botId,
          rating: reviewRating,
          comment: reviewText.trim(),
        }),
      })
      if (res.ok) {
        setReviewText('')
        setReviewRating(5)
        const refreshRes = await fetch(`/api/reviews?bot_id=${botId}`)
        const refreshData = await refreshRes.json()
        setReviews(refreshData.reviews || [])
        setAvgRating(refreshData.averageRating || 0)
        setTotalReviews(refreshData.totalReviews || 0)
      }
    } catch {
      // ignore
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center pt-16">
        <div className="animate-spin h-8 w-8 border-3 border-brand-yellow border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!bot) {
    return (
      <div className="page-shell pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="comic-heading text-3xl mb-4 text-white">TASK PACK NOT FOUND</h1>
          <Link href="/community" className="comic-btn inline-block">BROWSE COMMUNITY</Link>
        </div>
      </div>
    )
  }

  const displayName = bot.name || bot.bot_name || 'Unnamed'
  const characterContent = bot.character_file || bot.soul_md || ''
  const botColor = bot.color || '#8B5CF6'
  const score = (bot.upvotes || 0) - (bot.downvotes || 0)

  return (
    <div className="page-shell pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <div className="text-sm text-brand-gray-medium mb-6 font-display">
          <Link href="/community" className="hover:text-white transition">Community</Link>
          <span className="mx-2">/</span>
          {bot.category && bot.category !== 'other' && (
            <>
              <Link href={`/community?category=${bot.category}`} className="hover:text-white transition capitalize">
                {bot.category}
              </Link>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-brand-gray-dark font-bold">{displayName}</span>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">

          {/* Left sidebar */}
          <div className="md:col-span-1">
            <div className="comic-card p-6 flex flex-col items-center md:sticky md:top-24">
              <div className="h-2 w-full -mt-6 -mx-6 mb-5" style={{ backgroundColor: botColor, marginLeft: 'calc(-1.5rem)', marginRight: 'calc(-1.5rem)', width: 'calc(100% + 3rem)' }} />
              <TaskMiniMark color={botColor} size="lg" className="mb-4" />
              <TaskSheet
                color={botColor}
                category={bot.category || 'community'}
                role={bot.role || 'COMMUNITY TASK'}
                summary={bot.description || 'Community-posted task pack'}
                bullets={[
                  `Published by ${bot.author_name}`,
                  characterContent ? 'Character file included' : 'No character file attached',
                  'Launchable on your own dedicated runner',
                ]}
                compact
                className="w-full"
              />

              {/* Voting */}
              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={() => handleVote('up')}
                  disabled={!user || voting}
                  className={`flex items-center gap-1.5 px-4 py-2 border-3 border-black font-display font-bold text-sm transition-all ${
                    userVote === 'up' ? 'border-emerald-400/60 bg-emerald-500/15 text-white shadow-comic-sm' : 'border-white/10 bg-white/5 text-white hover:bg-emerald-500/10'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <span className="text-green-600">&#9650;</span>
                  <span>{bot.upvotes || 0}</span>
                </button>
                <button
                  onClick={() => handleVote('down')}
                  disabled={!user || voting}
                  className={`flex items-center gap-1.5 px-4 py-2 border-3 border-black font-display font-bold text-sm transition-all ${
                    userVote === 'down' ? 'border-red-400/60 bg-red-500/15 text-white shadow-comic-sm' : 'border-white/10 bg-white/5 text-white hover:bg-red-500/10'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <span className="text-red-500">&#9660;</span>
                  <span>{bot.downvotes || 0}</span>
                </button>
              </div>
              {!user && <p className="text-xs text-brand-gray-medium mt-2">Voting stays account-based, but claiming and onboarding are now open.</p>}

              {/* Action buttons */}
              <div className="w-full mt-5 space-y-2">
                <button onClick={handleShare} className="comic-btn-outline w-full text-xs py-2 flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  {copied ? 'LINK COPIED!' : 'SHARE'}
                </button>
                {user && (
                  <button onClick={handleFork} disabled={forking} className="comic-btn-outline w-full text-xs py-2 flex items-center justify-center gap-2 disabled:opacity-50">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"/><path d="M12 12v3"/></svg>
                    {forking ? 'FORKING...' : `FORK (${bot.fork_count || 0})`}
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="grid w-full grid-cols-2 gap-3 mt-5 border-t border-white/10 pt-4">
                <div className="text-center">
                  <div className="text-lg font-display font-black text-white">{score}</div>
                  <div className="text-[10px] text-brand-gray-medium font-display font-bold uppercase">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-display font-black text-white">{bot.view_count || 0}</div>
                  <div className="text-[10px] text-brand-gray-medium font-display font-bold uppercase">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-display font-black text-white">{bot.deploy_count || 0}</div>
                  <div className="text-[10px] text-brand-gray-medium font-display font-bold uppercase">Launched</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-display font-black text-white">{bot.fork_count || 0}</div>
                  <div className="text-[10px] text-brand-gray-medium font-display font-bold uppercase">Forks</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right content */}
          <div className="md:col-span-2">
            <div className="flex items-start gap-3 mb-1">
              <h1 className="comic-heading text-3xl md:text-4xl text-white">{displayName}</h1>
              <span className="mt-1 px-2 py-0.5 text-[10px] font-display font-bold uppercase border border-black text-white" style={{ backgroundColor: botColor }}>
                Community
              </span>
            </div>
            <p className="text-sm text-brand-gray-medium font-display mb-1">by {bot.author_name}</p>
            {bot.role && (
              <span className="inline-block px-3 py-0.5 text-xs font-display font-bold uppercase border-2 border-black text-white mb-3" style={{ backgroundColor: botColor }}>
                {bot.role}
              </span>
            )}

            {/* Tags */}
            {bot.tags && bot.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {bot.tags.map(tag => (
                  <Link key={tag} href={`/community?q=${encodeURIComponent(tag)}`} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-display font-bold uppercase text-brand-gray-dark hover:bg-white/8 transition">
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Rating + date */}
            <div className="flex items-center gap-4 mb-6">
              {totalReviews > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-brand-yellow text-sm">
                    {[1, 2, 3, 4, 5].map(i => (
                      <span key={i}>{i <= Math.round(avgRating) ? '\u2605' : '\u2606'}</span>
                    ))}
                  </span>
                  <span className="text-xs text-brand-gray-medium font-display">
                    {avgRating} ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
                  </span>
                </div>
              )}
              <span className="text-xs text-brand-gray-medium">
                Published {new Date(bot.created_at).toLocaleDateString()}
              </span>
            </div>

            <p className="text-brand-gray-dark font-body text-lg mb-6">
              {bot.description || 'A community-posted task pack for OpenClaw agents.'}
            </p>

            {/* CTA */}
            <div className="comic-card p-6 mb-8" style={{ borderColor: botColor }}>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="comic-heading text-3xl">$40</span>
                <span className="text-brand-gray-medium font-medium">/month</span>
              </div>
              <p className="text-xs font-display font-black uppercase text-brand-gray-medium mb-3">
                {formatCompensation(40, 20, 'completion')}
              </p>
              <p className="text-xs text-brand-gray-medium mb-4">Claim this community task, set the handoff filters, and generate the onboarding link for the OpenAI agent.</p>
              <Link href={`/deploy?community=${bot.id}`} className="comic-btn block text-center w-full text-lg">
                CLAIM + GENERATE LINK
              </Link>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-1 border-b border-white/10">
              {(['overview', 'character', 'reviews'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 font-display font-bold text-sm uppercase transition-all ${
                    activeTab === tab
                      ? 'rounded-t-[18px] border border-brand-yellow/50 bg-brand-yellow/12 text-brand-yellow'
                      : 'rounded-t-[18px] border border-transparent bg-transparent text-brand-gray-medium hover:text-white'
                  }`}
                >
                  {tab === 'reviews' ? `REVIEWS (${totalReviews})` : tab.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="comic-card p-3">
                    <div className="text-[10px] font-display font-bold uppercase text-brand-gray-medium">Type</div>
                    <div className="text-sm font-bold" style={{ color: botColor }}>Community</div>
                  </div>
                  <div className="comic-card p-3">
                    <div className="text-[10px] font-display font-bold uppercase text-brand-gray-medium">Category</div>
                    <div className="text-sm font-bold text-white capitalize">{bot.category || 'Other'}</div>
                  </div>
                  <div className="comic-card p-3">
                    <div className="text-[10px] font-display font-bold uppercase text-brand-gray-medium">Channel</div>
                    <div className="text-sm font-bold text-white">Telegram / Teams / WhatsApp</div>
                  </div>
                  <div className="comic-card p-3">
                    <div className="text-[10px] font-display font-bold uppercase text-brand-gray-medium">Published</div>
                    <div className="text-sm font-bold text-white">{new Date(bot.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="comic-card p-3">
                    <div className="text-[10px] font-display font-bold uppercase text-brand-gray-medium">Rating</div>
                    <div className="text-sm font-bold text-white">{totalReviews > 0 ? `${avgRating}/5` : 'No ratings'}</div>
                  </div>
                  <div className="comic-card p-3">
                    <div className="text-[10px] font-display font-bold uppercase text-brand-gray-medium">Score</div>
                    <div className="text-sm font-bold text-white">{score} points</div>
                  </div>
                </div>

                {characterContent && (
                  <div>
                    <h3 className="comic-heading text-lg mb-3 text-white">CHARACTER PREVIEW</h3>
                    <div className="comic-card p-4">
                      <pre className="whitespace-pre-wrap text-sm font-body text-brand-gray-dark max-h-48 overflow-y-auto">
                        {characterContent.slice(0, 500)}{characterContent.length > 500 ? '...' : ''}
                      </pre>
                      {characterContent.length > 500 && (
                        <button onClick={() => setActiveTab('character')} className="text-xs font-display font-bold text-brand-yellow mt-2 uppercase hover:underline">
                          View full character file &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Character */}
            {activeTab === 'character' && (
              <div>
                <h3 className="comic-heading text-lg mb-3 text-white">CHARACTER FILE</h3>
                {characterContent ? (
                  <div className="comic-card p-6">
                    <pre className="whitespace-pre-wrap text-sm font-body text-brand-gray-dark max-h-[600px] overflow-y-auto">
                      {characterContent}
                    </pre>
                  </div>
                ) : (
                  <p className="text-brand-gray-medium">No character file provided.</p>
                )}
              </div>
            )}

            {/* Tab: Reviews */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {user ? (
                  <div className="comic-card p-6">
                    <h3 className="comic-heading text-lg mb-4 text-white">WRITE A REVIEW</h3>
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => setReviewRating(star)} className={`text-2xl transition ${star <= reviewRating ? 'text-brand-yellow' : 'text-gray-300'} hover:text-brand-yellow`}>
                          {star <= reviewRating ? '\u2605' : '\u2606'}
                        </button>
                      ))}
                      <span className="text-sm text-brand-gray-medium ml-2">{reviewRating}/5</span>
                    </div>
                    <textarea
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                      placeholder="Share your experience with this task pack..."
                      maxLength={500}
                      rows={3}
                      className="theme-input mb-3 w-full resize-none px-4 py-3"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-brand-gray-medium">{reviewText.length}/500</span>
                      <button onClick={handleSubmitReview} disabled={submittingReview || !reviewText.trim()} className="comic-btn text-sm py-2 px-6 disabled:opacity-30">
                        {submittingReview ? 'POSTING...' : 'POST REVIEW'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="comic-card p-6 text-center">
                    <p className="text-brand-gray-medium mb-3">Guest review posting is paused while the onboarding flow is open-access.</p>
                  </div>
                )}

                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <div key={review.id} className="comic-card p-5">
                        <div className="flex items-center gap-3 mb-2">
                          {review.user_avatar ? (
                            <img src={review.user_avatar} alt="" className="w-8 h-8 rounded-full border-2 border-black object-cover" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-white/8">
                              <span className="font-display font-black text-xs">{review.user_name.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-display font-bold text-sm text-white">{review.user_name}</p>
                            <span className="text-brand-yellow text-xs">
                              {[1, 2, 3, 4, 5].map(i => (
                                <span key={i}>{i <= review.rating ? '\u2605' : '\u2606'}</span>
                              ))}
                            </span>
                          </div>
                          <span className="text-[10px] text-brand-gray-medium">{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-brand-gray-dark font-body">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="comic-card p-8 text-center">
                    <p className="text-brand-gray-medium">No reviews yet. Be the first to review this task pack.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related task packs */}
        {relatedBots.length > 0 && (
          <section className="border-t border-white/10 pt-10">
            <h2 className="comic-heading text-2xl mb-6 text-white">SIMILAR TASK PACKS</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {relatedBots.map(rb => {
                const rbName = rb.name || rb.bot_name || 'Unnamed'
                const rbColor = rb.color || '#8B5CF6'
                return (
                  <Link key={rb.id} href={`/companions/community/${rb.id}`} className="comic-card-hover p-5 flex items-center gap-4">
                    <TaskMiniMark color={rbColor} />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-display font-bold text-sm uppercase truncate text-white">{rbName}</h4>
                      {rb.role && <p className="text-[10px] text-brand-gray-medium uppercase">{rb.role}</p>}
                      <p className="text-xs text-brand-gray-dark truncate">{rb.description}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
