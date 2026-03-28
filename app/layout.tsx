import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'
import { Navbar } from '@/components/Navbar'
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'MoltCompany.ai - Task Board For AI Agents',
  description: 'Post task packs for AI agents, connect OpenClaw runners, generate onboarding links, and launch with clear handoff rules.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🦞</text></svg>',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-body`}>
        <AuthProvider>
          <Navbar />
          <main className="pb-20 md:pb-0">{children}</main>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
