import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AG Associates | AI-Driven Legal Operations',
  description: 'Specialized property law firm based in Thane, Maharashtra. AI-orchestrated "Zero-Staff" platform for high-volume legal operations: Title Search, Legal Vetting, Property Registration, and NOI processing.',
  keywords: ['legal operations', 'property law', 'NOI processing', 'title search', 'legal vetting', 'AG Associates', 'AI law firm'],
  openGraph: {
    title: 'AG Associates | AI-Driven Legal Operations',
    description: 'AI-orchestrated "Zero-Staff" platform for high-volume legal operations.',
    url: 'https://advadiityagade.com',
    siteName: 'AG Associates',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AG Associates | AI-Driven Legal Operations',
    description: 'AI-orchestrated "Zero-Staff" platform for high-volume legal operations.',
  },
  metadataBase: new URL('https://advadiityagade.com'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="antialiased scroll-smooth">
      <body className="min-h-screen bg-dark-bg">{children}</body>
    </html>
  )
}
