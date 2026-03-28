import Link from 'next/link'
import { TaskMiniMark } from '@/components/TaskVisual'

const tutorials = [
  {
    title: 'POST A TASK',
    description: 'Create a task pack with the brief, onboarding packet, and handoff rules already defined.',
    href: '/create',
    color: '#FFD600',
  },
  {
    title: 'CONNECT OPENCLAW',
    description: 'Bring your existing OpenClaw into the platform and map it to task packs.',
    href: '/connect',
    color: '#3B82F6',
  },
  {
    title: 'BROWSE EXAMPLES',
    description: 'Review the example task board and community task packs before launching anything.',
    href: '/companions',
    color: '#10B981',
  },
  {
    title: 'OPEN THE DOCS',
    description: 'Read the platform playbook for task posting, OpenClaw connection, and launch prep.',
    href: '/docs',
    color: '#EC4899',
  },
]

export default function TutorialsPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-sm text-brand-gray-medium mb-6 font-display">
          <Link href="/" className="hover:text-black transition">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-black font-bold">Tutorials</span>
        </div>

        <h1 className="comic-heading text-4xl mb-2">TUTORIALS</h1>
        <p className="text-brand-gray-medium mb-10">Quick platform entry points for posting tasks, connecting OpenClaw, and reviewing launch flows.</p>

        <div className="grid gap-6 md:grid-cols-2">
          {tutorials.map((tutorial) => (
            <Link key={tutorial.title} href={tutorial.href} className="comic-card p-6 no-underline text-black hover:-translate-y-0.5 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <TaskMiniMark color={tutorial.color} />
                <h2 className="comic-heading text-2xl">{tutorial.title}</h2>
              </div>
              <p className="text-brand-gray-medium">{tutorial.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
