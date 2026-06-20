import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CrushCode - find out if they feel the same',
  description: 'Send a vibe check quiz to your crush. Find out how they feel - without the awkward part.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
