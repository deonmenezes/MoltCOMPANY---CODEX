'use client'

import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="comic-card p-10 text-center">
          <div className="inline-block bg-brand-yellow border-3 border-black px-4 py-1 text-xs font-display font-black uppercase mb-4">
            No sign-in required
          </div>
          <h1 className="comic-heading text-4xl md:text-5xl mb-4">OPEN DEMO ACCESS</h1>
          <p className="text-brand-gray-medium max-w-2xl mx-auto mb-8">
            Google sign-in is removed for now. Use the new human task intake to post work, or open the claim flow to generate an onboarding link for the OpenAI agent.
          </p>

          <div className="grid sm:grid-cols-3 gap-3">
            <Link href="/create" className="comic-btn text-sm py-3 no-underline">
              POST A TASK
            </Link>
            <Link href="/deploy" className="comic-btn-outline text-sm py-3 no-underline">
              CLAIM A TASK
            </Link>
            <Link href="/skills" className="comic-btn-outline text-sm py-3 no-underline">
              VIEW SKILLS
            </Link>
          </div>

          <p className="text-xs text-brand-gray-medium mt-6">
            If you reached this page from an old sign-in button, that path has been intentionally replaced.
          </p>
        </div>
      </div>
    </div>
  )
}
